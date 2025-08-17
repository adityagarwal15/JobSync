class FormValidator {
  constructor(formId, fieldsToValidate) {
    this.form = document.getElementById(formId);
    if (!this.form) {
      return;
    }
    this.fieldsToValidate = fieldsToValidate;
    this.init();
  }

  // Private helper for email validation
  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Private helper for URL validation
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Validation logic for each field
  _getErrorMessage(name, value) {
    switch (name) {
      case 'user_name':
        if (!value.trim()) return "Please fill out your name.";
        break;
      case 'user_role':
        if (!value.trim()) return "Please fill out your role.";
        break;
      case 'user_email':
        if (!value.trim()) return "Please fill out your email.";
        if (!this._isValidEmail(value)) return "Please enter a valid email address.";
        break;
      case 'message':
        if (!value.trim()) return "Please fill out a message.";
        break;
      case 'portfolio_link':
        if (value.trim() && !this._isValidUrl(value)) {
          return "Please enter a valid URL.";
        }
        break;
      default:
        return null;
    }
    return null; // No error
  }

  _showError(inputElement, message) {
    inputElement.classList.remove("success-field");
    inputElement.classList.add("error-field");
    const errorContainer = inputElement.parentElement.querySelector('.error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `<p class="error-message" role="alert" aria-live="polite">
        <span aria-hidden="true"><i class="fas fa-exclamation-circle"></i></span>
        <span>${message}</span>
      </p>`;
    } else {
      console.warn(`Error container not found for field: ${inputElement.name}`);
    }
  }

  _showSuccess(inputElement) {
    inputElement.classList.remove("error-field");
    inputElement.classList.add("success-field");
    const errorContainer = inputElement.parentElement.querySelector('.error-container');
    if (errorContainer) {
      errorContainer.innerHTML = "";
    }
  }

  _clearError(inputElement) {
    inputElement.classList.remove("error-field");
    inputElement.classList.remove("success-field");
    const errorContainer = inputElement.parentElement.querySelector('.error-container');
    if (errorContainer) {
      errorContainer.innerHTML = "";
    }
  }

  _validateField(inputElement) {
    const errorMessage = this._getErrorMessage(inputElement.name, inputElement.value);
    if (errorMessage) {
      this._showError(inputElement, errorMessage);
      return false;
    }
    this._showSuccess(inputElement);
    return true;
  }

  init() {
    // Attach event listeners for real-time validation
    this.fieldsToValidate.forEach(fieldName => {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        let debounceTimer;
        field.addEventListener('input', () => {
          this._clearError(field);
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => this._validateField(field), 500);
        });
      }
    });

    this.form.addEventListener("submit", (event) => {
      let isFormValid = true;
      let firstInvalidField = null;

      this.fieldsToValidate.forEach(fieldName => {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (field) {
          if (!this._validateField(field)) {
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
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const fieldsToValidate = [
    'user_name',
    'user_role',
    'user_email',
    'message',
    'portfolio_link'
  ];
  new FormValidator("contact-form", fieldsToValidate);
});
