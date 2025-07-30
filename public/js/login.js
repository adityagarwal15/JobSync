document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('container');
  const signInBtn = document.getElementById('signin');
  const signUpBtn = document.getElementById('signup');

  if (signInBtn && signUpBtn && container) {
    signInBtn.addEventListener('click', () => {
      container.classList.add("active");
      window.location.href = "/signin";
    });

    signUpBtn.addEventListener('click', () => {
      container.classList.remove("active");
      window.location.href = "/signup";
    });
  }
});
