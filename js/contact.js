window.addEventListener("DOMContentLoaded", () => {
  gsap.from(".footer-form", { opacity: 0, y: 50, duration: 1 });
});

function showToast(message, success = true) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.backgroundColor = success ? "#4caf50" : "#f44336";
  toast.style.color = "#fff";
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.fontFamily = "'Poppins', sans-serif";
  toast.style.fontSize = "0.95rem";
  toast.style.zIndex = "9999";
  toast.style.opacity = 0;

  document.body.appendChild(toast);

  gsap.to(toast, { opacity: 1, duration: 0.5 });
  setTimeout(() => {
    gsap.to(toast, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => toast.remove(),
    });
  }, 3000);
}

function highlightError(input) {
  input.style.border = "2px solid red";
  input.focus();
}

function resetInputBorders() {
  document.querySelectorAll("#contactForm input, #contactForm textarea").forEach((el) => {
    el.style.border = "1px solid #ccc";
  });
}

async function submitForm() {
  const name = document.getElementById("name");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");
  const message = document.getElementById("message");

  resetInputBorders();

  if (!name.value.trim()) {
    showToast("Name is required", false);
    highlightError(name);
    return;
  }

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phone.value.trim()) {
    showToast("Phone number is required", false);
    highlightError(phone);
    return;
  } else if (!phoneRegex.test(phone.value.trim())) {
    showToast("Enter a valid phone number", false);
    highlightError(phone);
    return;
  }

  const emailVal = email.value.trim();
  if (emailVal && !/^\S+@\S+\.\S+$/.test(emailVal)) {
    showToast("Enter a valid email", false);
    highlightError(email);
    return;
  }


  if (!message.value.trim()) {
    showToast("Message cannot be empty", false);
    highlightError(message);
    return;
  }

  // Simulate form submission later
  gsap.to(".footer-form", { opacity: 0.5, duration: 0.3, yoyo: true, repeat: 1 });
  try {
    const res = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(), // can be empty
        message: message.value.trim()
      })
    });

    const data = await res.json();

    if (res.ok) {
      showToast(data.msg || "Message sent successfully");
      document.getElementById("contactForm").reset();
      resetInputBorders();
    } else {
      showToast(data.msg || "Failed to send message", false);
    }
  } catch (error) {
    console.error(error);
    showToast("Server error. Try again later.", false);
  }

  document.getElementById("contactForm").reset();
  resetInputBorders();
}
