document.addEventListener('DOMContentLoaded', () => {
  // GSAP animation for form load
  gsap.from('.footer-form', { opacity: 0, y: 40, duration: 1 });

  const form = document.getElementById('contactForm');
  const spinner = document.getElementById('formSpinner');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');
  const messageField = document.getElementById('message');

  // Form validation
  function validateForm(data) {
    if (!data.fullName.trim()) return 'Full Name is required.';
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email.trim())) return 'Enter a valid email.';
    return null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.textContent = '';
    feedback.className = 'form-feedback';
    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const data = {
      fullName: form.fullName.value,
      role: form.role.value,
      email: form.email.value,
      portfolio: form.portfolio.value,
      message: form.message.value
    };
    const error = validateForm(data);
    if (error) {
      feedback.textContent = error;
      feedback.classList.add('error');
      submitBtn.disabled = false;
      spinner.style.display = 'none';
      gsap.fromTo(feedback, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        feedback.textContent = 'Thank you! Your message has been sent.';
        feedback.classList.add('success');
        gsap.fromTo(feedback, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7 });
        form.reset();
      } else {
        feedback.textContent = result.message || 'Something went wrong. Please try again.';
        feedback.classList.add('error');
        gsap.fromTo(feedback, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 });
      }
    } catch (err) {
      feedback.textContent = 'Network error. Please try again. (' + err + ')';
      feedback.classList.add('error');
      gsap.fromTo(feedback, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 });
    }
    submitBtn.disabled = false;
    spinner.style.display = 'none';
  });
}); 