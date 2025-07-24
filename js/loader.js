// Split text into words for animation
const loaders = ["#loader-copy-1", "#loader-copy-2", "#loader-copy-3"];
loaders.forEach((loader) => new SplitType(loader, { types: "words" }));

// Cache main container and loader
const container = document.querySelector(".container");
const loaderElement = document.querySelector(".loader");

// Set initial styles for container
container.style.opacity = "0";
container.style.transform = "scale(0.96)";
container.style.transition = "all 0.8s ease";
container.style.height = "100vh";
container.style.overflow = "hidden";

// Set visibility for all loader text elements
gsap.set(loaders.join(", "), { opacity: 1 });

// Animate loader text
setTimeout(() => {
  loaders.forEach((loader, index) => {
    gsap.fromTo(
      `${loader} .word`,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: index * 1.5,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(`${loader} .word`, {
            opacity: 0,
            y: -20,
            duration: 0.5,
            stagger: 0.1,
            ease: "power1.inOut",
          });
        },
      }
    );
  });
}, 300);

// Animate progress bar and exit loader
gsap.to(".progress-bar", {
  width: "100%",
  duration: 4.2,
  ease: "power1.out",
  delay: 0.5,
  onComplete: () => {
    gsap.to(loaderElement, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        loaderElement.style.display = "none";

        // Reveal the main site content with "boom-in"
        container.style.height = "100%";
        container.style.overflow = "auto";
        container.style.opacity = "1";
        container.style.transform = "scale(1)";
      },
    });
  },
});
