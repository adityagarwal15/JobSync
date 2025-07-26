// Animate services on hover
document.querySelectorAll(".service-item").forEach((item) => {
  item.addEventListener("mouseenter", () => {
    gsap.to(item, {
      y: -10,
      scale: 1.05,
      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(item.querySelector(".service-icon"), {
      scale: 1.2,
      rotate: 5,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  item.addEventListener("mouseleave", () => {
    gsap.to(item, {
      y: 0,
      scale: 1,
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      duration: 0.3,
      ease: "power2.inOut",
    });
    gsap.to(item.querySelector(".service-icon"), {
      scale: 1,
      rotate: 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  });
});