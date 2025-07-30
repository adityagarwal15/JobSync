const loaders = ["#loader-copy-1", "#loader-copy-2", "#loader-copy-3"];
loaders.forEach((loader) => new SplitType(loader, { types: "words" }));

// Initially lock scroll and fix container height for the loader screen
document.querySelector(".container").style.height = "100vh";
document.querySelector(".container").style.overflow = "hidden";

// Fade in loader text wrappers
gsap.to(loaders.join(", "), { opacity: 1, duration: 0.1 });

setTimeout(() => {
  loaders.forEach((loader, index) => {
    gsap.to(`${loader} .word`, {
      opacity: 1,
      duration: 1,
      stagger: 0.15,
      delay: index === 2 ? index * 2.75 : index * 2.5,
      onComplete: () => {
        gsap.to(`${loader} .word`, {
          opacity: 0,
          duration: 1,
          stagger: 0.15,
        });
      },
    });
  });
}, 1000);

// Animate the progress bar filling and the loader fade out after completion
gsap.to(".progress-bar", {
  width: "100%",
  duration: 8,
  delay: 0.5,
  onComplete: () => {
    gsap.to(".progress-bar", {
      clipPath: "polygon(0% 0, 100% 0, 100% 100%, 0 100%)",
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(".progress-bar, .loader", {
          clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
          duration: 1,
          ease: "power2.inOut",
          onStart: () => {
            document.querySelector(".container").style.height = "auto";
            document.querySelector(".container").style.overflow = "auto";
          },
        });
      },
    });
  },
});

// ----------- Skip button logic ---------------
document.addEventListener("DOMContentLoaded", function () {
  const skipBtn = document.getElementById("skip-loader-btn"); // <-- Correct ID here
  const preloader = document.getElementById("preloader") || document.querySelector(".loader");
  const container = document.querySelector(".container");

  function skipLoadingAnimation() {
    gsap.killTweensOf([
      ...loaders.flatMap(id => Array.from(document.querySelectorAll(`${id} .word`))),
      document.querySelector(".progress-bar"),
      document.querySelector(".loader"),
    ]);

    gsap.to(".progress-bar, .loader", {
      clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
      duration: 0.6,
      ease: "power2.inOut",
      onStart: () => {
        if (container) {
          container.style.height = "auto";
          container.style.overflow = "auto";
        }
      },
      onComplete: () => {
        if (preloader) {
          preloader.style.display = "none";
        }
      },
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", skipLoadingAnimation);
  }
});
