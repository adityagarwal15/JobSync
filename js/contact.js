document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = form.name.value.trim();
      const role = form.role.value.trim();
      const email = form.email.value.trim();
      const portfolio = form.portfolio.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        alert("Please fill in your name, email, and message.");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, role, email, portfolio, message }),
        });

        const result = await response.json();

        if (result.success) {
          alert("✅ Message sent successfully!");
          form.reset();
        } else {
          alert("❌ Failed to send message: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("⚠️ Error sending message. Please try again.");
      }
    });
  });