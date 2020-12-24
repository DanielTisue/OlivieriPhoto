
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const topper = document.getElementById('rotate-top');
const bottom = document.getElementById('rotate-bottom');
const middle = document.getElementById('remove-center');
const messageAlert = document.querySelector('.alert');

hamburger.addEventListener('click', () => {
console.log('clicked');
navMenu.classList.toggle('active');
topper.classList.toggle('rotate-top');
bottom.classList.toggle('rotate-bottom');
middle.classList.toggle('remove-center');
});

function closeAlert() {
messageAlert.classList.add("close");
}


function hideMenu() {  
 if (navMenu.classList.contains("active")) {
   navMenu.classList.remove("active");
   topper.classList.remove("rotate-top");
   bottom.classList.remove("rotate-bottom");
   middle.classList.remove("remove-center");
 }
}

const elements = document.querySelectorAll('.anim');

observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {

  if(entry.intersectionRatio > 0) {
      entry.target.style.animation = `slideInFromRight 2s ${entry.target.dataset.delay} forwards ease-out`;
      observer.unobserve(entry.target);
    } else {
      entry.target.style.animation = 'none';
    }

  });
});


 
elements.forEach(element => {
observer.observe(element);
});