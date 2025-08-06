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
      showError(userName, "Please fill out this field.");
      isValid = false;
    }

    // Validate "Your Role"
    const userRole = form.querySelector('[name="user_role"]');
    if (userRole.value.trim() === "") {
      showError(userRole, "Please fill out this field.");
      isValid = false;
    }

    // Validate "Email"
    const userEmail = form.querySelector('[name="user_email"]');
    if (userEmail.value.trim() === "") {
      showError(userEmail, "Please fill out this field.");
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
      showError(message, "Please fill out this field.");
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault(); // Prevent form submission if validation fails
    }
  });

  function showError(inputElement, message) {
    const errorMessage = document.createElement("p");
    errorMessage.className = "error-message";
    errorMessage.style.fontSize = "0.85rem";
    errorMessage.style.fontWeight = "bold";
    errorMessage.style.marginTop = "5px";
    errorMessage.style.backgroundImage = " linear-gradient(45deg, #ff0000, #ff7f7f)";
    errorMessage.style.webkitBackgroundClip = "text";
    errorMessage.style.backgroundClip = "text";
    errorMessage.style.color = "transparent";
    errorMessage.style.textShadow = "1px 1px 2px rgba(0,0,0,0.1)";
    errorMessage.textContent = message;


    // Insert error message after the input field's parent container
    inputElement.parentNode.appendChild(errorMessage);
  }



  function isValidEmail(email) {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});
