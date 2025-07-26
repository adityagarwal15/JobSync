// hoverEffects.js
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".hover-wrapper");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        scale: 1.07,
        boxShadow: "0px 10px 30px rgba(4, 0, 0, 0.3)",
        duration: 0.3,
        ease: "power2.out",
        
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        scale: 1,
        boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
        duration: 0.3,
        ease: "power2.inOut",
        
      });
    });
  });
});