// Contact form handler using Nodemailer backend
document
  .getElementById("contact-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const form = this;
    const submitBtn = form.querySelector(".submit-btn button");
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.classList.add("loading");
    submitBtn.innerHTML = "<h3>Sending</h3>";
    submitBtn.disabled = true;

    try {
      // Get form data
      const formData = new FormData(form);
      const formObject = {};

      // Convert FormData to object
      for (let [key, value] of formData.entries()) {
        formObject[key] = value;
      }

      // Send data to server
      const response = await fetch("http://localhost:8080/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(formObject),
});


      // Check if response is ok (status 200-299)
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        // Success message
        submitBtn.classList.remove("loading");
        submitBtn.classList.add("success");
        submitBtn.innerHTML = "<h3>Sent</h3>";
        
        showNotification(
          "Message sent successfully! We'll get back to you soon.",
          "success"
        );
        form.reset();
        
        // Reset to normal state after 3 seconds
        setTimeout(() => {
          submitBtn.classList.remove("success");
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 3000);
        
        return;
      } else {
        // Handle rate limiting specifically
        if (result.error === "RATE_LIMIT_EXCEEDED") {
          showNotification(
            "You've sent too many messages recently. Please wait 15 minutes before trying again.",
            "error"
          );
        } else if (result.error === "GENERAL_RATE_LIMIT_EXCEEDED") {
          showNotification(
            "Too many requests. Please wait a moment before trying again.",
            "error"
          );
        } else {
          // Other error messages
          showNotification(
            result.message || "Failed to send message. Please try again.",
            "error"
          );
        }
      }
    } catch (error) {
      // console.error("Error:", error);
      showNotification(
        "Too many email requests. Please try again in 15 minutes.",
        "error"
      );
    } finally {
      // Reset button state (only if not successful)
      if (!submitBtn.classList.contains("success")) {
        submitBtn.classList.remove("loading");
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  });

// Notification function
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".custom-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `custom-notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        max-width: 400px;
        font-family: 'Poppins', sans-serif;
        animation: slideIn 0.3s ease;
        background: ${
          type === "success"
            ? "linear-gradient(135deg, #28a745, #20c997)"
            : "linear-gradient(135deg, #dc3545, #fd7e14)"
        };
        color: white;
    `;

  const content = notification.querySelector(".notification-content");
  content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    `;

  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    `;

  closeBtn.onmouseover = function () {
    this.style.background = "rgba(255, 255, 255, 0.2)";
  };

  closeBtn.onmouseout = function () {
    this.style.background = "none";
  };

  // animation key frames
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
    document.head.appendChild(style);
  }

  // Add to page
  document.body.appendChild(notification);

  // remove after 5 secs
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}
