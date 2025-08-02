const loaders = ["#loader-copy-1", "#loader-copy-2", "#loader-copy-3"];
loaders.forEach((loader) => new SplitType(loader, { types: "words" }));

const container = document.querySelector(".container");
const loader = document.querySelector(".loader");
const skipBtn = document.getElementById("skip-loader-btn");

container.style.height = "100vh";
container.style.overflow = "hidden";

gsap.to(loaders.join(", "), { opacity: 1, duration: 0.1 });

let textAnimationTimeout = setTimeout(() => {
  loaders.forEach((loader, index) => {
    gsap.to(`${loader} .word`, {
      opacity: 1,
      duration: 1,
      stagger: 0.15,
      delay: index == 2 ? index * 2.75 : index * 2.5,
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

const closeLoader = () => {
  gsap.to(".progress-bar, .loader", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    duration: 1,
    ease: "power2.inOut",
    onStart: () => {
      container.style.height = "100%";
      container.style.overflow = "scroll";
    },
    onComplete: () => {
      if (loader) loader.style.display = "none";
      if (skipBtn) skipBtn.style.display = "none";
    },
  });
};

const progressAnim = gsap.to(".progress-bar", {
  width: "100%",
  duration: 8,
  delay: 0.5,
  onComplete: () => {
    gsap.to(".progress-bar", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "power2.inOut",
      onComplete: closeLoader,
    });
  },
});

if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    clearTimeout(textAnimationTimeout);
    progressAnim.kill(); 
    gsap.to(".progress-bar", {
      width: "100%",
      duration: 0.5,
      onComplete: () => {
        gsap.to(".progress-bar", {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 1,
          ease: "power2.inOut",
          onComplete: closeLoader,
        });
      },
    });
  });
}
