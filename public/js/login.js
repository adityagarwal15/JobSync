const container = document.getElementById('container');
const signInBtn = document.getElementById('signin');
const signUpBtn = document.getElementById('signup');

signInBtn.addEventListener('click', () => {
    container.classList.add("active");
    window.location.href = "/signin";  // navigates to /signin route
});

signUpBtn.addEventListener('click', () => {
    container.classList.remove("active");
    window.location.href = "/signup";   // navigates to /signup route
});