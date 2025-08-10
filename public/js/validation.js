document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  if (!form) {
    return; // Exit if form is not found
  }

  const fieldsToValidate = [
    'user_name',
    'user_role',
    'user_email',
    'message',
    'portfolio_link'
  ];

  // Helper for email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validation logic for each field
  const getErrorMessage = (name, value) => {
    switch (name) {
      case 'user_name':
        if (!value.trim()) return "Please fill out your name.";
        break;
      case 'user_role':
        if (!value.trim()) return "Please fill out your role.";
        break;
      case 'user_email':
        if (!value.trim()) return "Please fill out your email.";
        if (!isValidEmail(value)) return "Please enter a valid email address.";
        break;
      case 'message':
        if (!value.trim()) return "Please fill out a message.";
        break;
      // Portfolio link is optional, so no validation needed unless specified otherwise
      default:
        return null;
    }
    return null; // No error
  };

  const showError = (inputElement, message) => {
    inputElement.classList.add("error-field");
    const errorContainer = inputElement.parentElement.querySelector('.error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `<p class="error-message" role="alert" aria-live="polite"><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
    }
  };

  const clearError = (inputElement) => {
    inputElement.classList.remove("error-field");
    const errorContainer = inputElement.parentElement.querySelector('.error-container');
    if (errorContainer) {
      errorContainer.innerHTML = "";
    }
  };

  const validateField = (inputElement) => {
    const errorMessage = getErrorMessage(inputElement.name, inputElement.value);
    if (errorMessage) {
      showError(inputElement, errorMessage);
      return false;
    }
    clearError(inputElement);
    return true;
  };

  // Attach event listeners for real-time validation
  fieldsToValidate.forEach(fieldName => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.addEventListener('blur', () => validateField(field));
      // Clear error on input for better UX
      field.addEventListener('input', () => clearError(field));
    }
  });

  form.addEventListener("submit", function (event) {
    let isFormValid = true;
    let firstInvalidField = null;

    fieldsToValidate.forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        if (!validateField(field)) {
          isFormValid = false;
          if (!firstInvalidField) {
            firstInvalidField = field;
          }
        }
      }
    });

    if (!isFormValid) {
      event.preventDefault(); // Prevent form submission
      if (firstInvalidField) {
        firstInvalidField.focus(); // Focus on the first invalid field
      }
    }
  });
});
