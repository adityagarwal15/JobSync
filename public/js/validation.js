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
      showError(userName, "Please fill out your name.");
      isValid = false;
    }

    // Validate "Your Role"
    const userRole = form.querySelector('[name="user_role"]');
    if (userRole.value.trim() === "") {
      showError(userRole, "Please fill out your role.");
      isValid = false;
    }

    // Validate "Email"
    const userEmail = form.querySelector('[name="user_email"]');
    if (userEmail.value.trim() === "") {
      showError(userEmail, "Please fill out your email.");
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
      showError(message, "Please fill out a message.");
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
    icon.style.marginRight = '5px';
    icon.style.color = '#fc002d';

    // Apply gradient text color matching the send button
    errorMessage.style.background = 'linear-gradient(90deg, #e60000fd, #ff6804ff)';
    errorMessage.style.webkitBackgroundClip = 'text';
    errorMessage.style.webkitTextFillColor = 'transparent';
    errorMessage.style.backgroundClip = 'text';
    errorMessage.style.textFillColor = 'transparent';

    errorMessage.style.marginTop = '5px';
    errorMessage.style.padding = '0';
    errorMessage.style.fontSize = '0.85rem';
    errorMessage.style.display = 'flex';
    errorMessage.style.alignItems = 'center';
    errorMessage.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    errorMessage.style.fontWeight = '400';

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
