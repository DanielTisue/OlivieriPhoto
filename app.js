require('dotenv').config();
const express = require('express'),
      app = express();


const bodyParser = require('body-parser'),
      mongoose = require('mongoose'),
      flash = require('connect-flash'),
      passport = require('passport'),
      LocalStrategy = require('passport-local'),
      methodOverride = require('method-override'),
      nodemailer = require('nodemailer');
const User = require('./models/users'),
      Image = require('./models/image');
      
mongoose.connect(process.env.DATABASEURLTWO, {
  useNewUrlParser: true,  
  useUnifiedTopology: true
});
//mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('express-session')({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: false
}));


app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());

//PASSPORT AUTH
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
//*************************************************//
const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: process.env.CLOUDNAME,
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const cloudinaryStorage = require('multer-storage-cloudinary');
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: process.env.CLOUDFOLDER,
  allowedFormats: ['jpeg', 'jpg', 'png'],

//   added below transformation config for image rendering optimzation
  transformation: [{ height: 300, crop: 'scale' }],
  
  filename: function (req, file, cb) {
  	let buf = crypto.randomBytes(16);
  	buf = buf.toString('hex');
  	let uniqFileName = file.originalname.replace(/\.jpeg|\.jpg|\.png/ig, '');
  	uniqFileName += buf;
    cb(undefined, uniqFileName );
  }
});
const upload = multer({ storage });
//*************************************************//

//====================================================
//INDEX ROUTE
app.get('/', (req, res) => {
    res.render("landing");
});
  
app.post('/send', (req, res) => {
  const output = `
  <h3> You have a new contact request</h3>
  <p style="font-weight: bold">Contact details</p>
  <ul>
  <li>Name: ${req.body.name}</li>
  <li>Email: ${req.body.email}</li>
  </ul>
  <p style="font-weight: bold"> Message </p>
   <p>${req.body.message}
  `;

  // console.log(req.body);

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.GMAILPW
    },
  });

  let mailOptions = {
    from: 'OlivieriPhoto',
    to: process.env.EMAIL,
    subject: 'You have a contact request from OlivieriPhoto.com',
    text: 'It works',
    html: output
  };

  transporter.sendMail(mailOptions, function(err, data) {
    if (err) {
      console.log(err);
       req.flash('error', 'Message not sent! Please send your email to federicoolivieriphoto@gmail.com. Click on this alert to close.');
       res.redirect('/');
    } else {
       req.flash("success", "Your message has been sent! Click on this alert to close.");
        res.redirect('/');
    }
  });
  
});

//GALLERY ROUTES **************************************
app.get('/gallery', (req, res) => {
    Image.find({}, (err, images) => {
        if(err) {
            req.flash('error', 'Images not found! Click on this alert to close.');
        } else {
            res.render('gallery', { images });
        }
    });
});

// GALLERY NEW ROUTE
app.get('/gallery/new', isLoggedIn, (req, res) => {
    res.render('gallerynew');
});

//GALLERY CREATE ROUTE
app.post('/gallery', isLoggedIn, upload.single('image'), (req, res) => {
    req.body.image = {
        url: req.file.secure_url,
        public_id: req.file.public_id
    };
    Image.create(req.body.image, err => {
      if (err){
         req.flash('error', 'UH OH...Something went wrong! Click on this alert to close.');
         res.redirect('/gallery');
      } else{
        req.flash('success', 'Image successfully uploaded! Click on this alert to close.');
        res.redirect('/gallery'); 
      } 
    });
  });

//EDIT/UPDATE ROUTES
app.get('/gallery/:id/edit', isLoggedIn, (req, res) => {
    //find the image with provided ID
    Image.findById(req.params.id, (err, image) => {
        if(err){
            req.flash('error', 'Image not found. Click on this alert to close.');
            //console.log(err);
        } else {
            res.render('galleryedit', { image });
        }
    });
});


app.put('/gallery/:id', isLoggedIn, upload.single('image'), (req, res) => {
  Image.findByIdAndUpdate(req.params.id, req.body.image, async (err, image) => {
      if(err){
          req.flash('error', 'UH OH...Something went wrong! Click on this alert to close.');
          res.redirect('/gallery');
      } else {
        if (req.file) {
          try {
              await cloudinary.v2.uploader.destroy(image.public_id);
              image.public_id = req.file.public_id;
              image.url = req.file.secure_url;
              await image.save();
          } catch(err) {
              console.log(err);
              return res.redirect('back');
          }
        }
        req.flash('success', 'Image successfully updated! Click on this alert to close.');
        res.redirect('/gallery');
      }
  }); 
});

//DESTROY ROUTE
app.delete('/gallery/:id', isLoggedIn, (req, res) => {
    Image.findById(req.params.id, async (err, image) => {
      if(err) {
          req.flash('error', 'UH OH...Something went wrong! Click on this alert to close.');
          res.redirect('/gallery');
      } else {
          await cloudinary.v2.uploader.destroy(image.public_id);
          await image.remove();
          req.flash('success', 'Image successfully deleted. Click on this alert to close.');
          res.redirect('/gallery');
      }
    });
});



//LOGIN OWNER UPDATE OPTIONS ROUTE
//only used to register owner of site- does not support users.

// app.get('/register', (req, res) => {
//     res.render('register');
// });

// app.post('/register', (req, res) => {
//     req.body.username;
//     req.body.password;
//     User.register(new User({username: req.body.username}), req.body.password, (err, User) => {
//      if(err){
//          console.log(err);
//          return res.render('register');
//      }   
//     passport.authenticate('local')(req, res, function(){
//         res.redirect('/secretlogin');
//     });
//   });
// });

app.get('/secretlogin', (req, res) => {
    res.render('secretlogin');
});

app.post('/secretlogin', passport.authenticate('local', {
    successRedirect: '/gallery',
    failureRedirect: '/secretlogin'
}));

app.get('/logout', isLoggedIn, (req, res) =>  {
    req.logout();
    req.flash('success', 'You have been successfully logged out! Click on this alert to close.');
    res.redirect('/gallery');
});

//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error', 'Additional Permissions Needed! Click on this alert to close.');
    res.redirect('/');
}

// app.listen(3000, () => {
//     console.log("Server Started!");
// })
app.listen(process.env.PORT || 3000, process.env.IP, () => {
    console.log('Server Started!');
});
