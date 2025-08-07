document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", function (event) {
    let isValid = true;

    // Clear previous error messages
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((msg) => msg.remove());

    // Validate "Your Name"
    const userName = form.querySelector('[name="user_name"]');
    if (userName.value.trim() === "") {
      showError(userName, "Please fill out Your Name.");
      isValid = false;
    }

    // Validate "Your Role"
    const userRole = form.querySelector('[name="user_role"]');
    if (userRole.value.trim() === "") {
      showError(userRole, "Please fill out Your Role.");
      isValid = false;
    }

    // Validate "Email"
    const userEmail = form.querySelector('[name="user_email"]');
    if (userEmail.value.trim() === "") {
      showError(userEmail, "Please fill out Your Email.");
      isValid = false;
    } else if (!isValidEmail(userEmail.value)) {
      if (userEmail.value.indexOf('@') === -1) {
        showError(userEmail, "Please include an '@' in the email address.");
      } else {
        showError(userEmail, "Please enter a valid email address.");
      }
      isValid = false;
    }


    // Validate "Message"
    const message = form.querySelector('[name="message"]');
    if (message.value.trim() === "") {
      showError(message, "Please fill out Your Message.");
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault(); // Prevent form submission if validation fails
    }
  });

  function showError(inputElement, message) {
    const errorMessage = document.createElement("p");
    errorMessage.className = "error-message";

    // Create icon element
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle';
    icon.style.marginRight = '10px';
    icon.style.fontSize = '1em';

    // Apply styles
    errorMessage.style.background = 'linear-gradient(135deg, #fc002d, #ff6b00)';
    errorMessage.style.color = 'white';
    errorMessage.style.padding = '8px 15px';
    errorMessage.style.borderRadius = '6px';
    errorMessage.style.marginTop = '6px';
    errorMessage.style.fontSize = '0.85rem';

    errorMessage.style.display = 'flex';
    errorMessage.style.alignItems = 'center';
    errorMessage.style.fontFamily = "'Manrope', sans-serif";
    errorMessage.style.fontWeight = '500';
    errorMessage.style.boxShadow = '0 4px 12px rgba(252, 0, 45, 0.3)';
    errorMessage.style.textShadow = '1px 1px 2px rgba(0,0,0,0.2)';
    errorMessage.style.transition = 'all 0.3s ease';

    // Add icon and text message
    errorMessage.appendChild(icon);
    errorMessage.appendChild(document.createTextNode(message));

    // Insert error message after the input field's parent container
    inputElement.parentNode.appendChild(errorMessage);
  }





  function isValidEmail(email) {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});
