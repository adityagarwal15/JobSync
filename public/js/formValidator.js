// Simple form validation utility
const formValidator = (function () {
  const form = document.getElementById("contact-form");

  function validateForm() {
    if (!form) return true; // no form found

    const name = form.querySelector("input[name='name']");
    const email = form.querySelector("input[name='email']");
    const message = form.querySelector("textarea[name='message']");

    if (!name.value.trim()) {
      showNotification("Name is required", "error");
      name.focus();
      return false;
    }

    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showNotification("Please enter a valid email", "error");
      email.focus();
      return false;
    }

    if (!message.value.trim() || message.value.trim().length < 10) {
      showNotification("Message must be at least 10 characters long", "error");
      message.focus();
      return false;
    }

    return true;
  }

  function clearForm() {
    if (form) form.reset();
  }

  return {
    validateForm,
    clearForm,
  };
})();
