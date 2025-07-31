const loaders = ["#loader-copy-1", "#loader-copy-2", "#loader-copy-3"];
const container = document.querySelector(".container");
const loader = document.querySelector(".loader");
const skipBtn = document.getElementById("skip-loader-btn");

let animations = [];
let textAnimationTimeout = null;

loaders.forEach(loader => new SplitType(loader, { types: "words" }));

container.style.height = "100vh";
container.style.overflow = "hidden";

gsap.to(loaders.join(", "), { opacity: 1, duration: 0.1 });

const runTextAnimations = () => {
  loaders.forEach((loader, index) => {
    const anim = gsap.to(`${loader} .word`, {
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
    animations.push(anim);
  });
};
textAnimationTimeout = setTimeout(runTextAnimations, 1000);

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
    }
  });
};

const progressBarAnimation = gsap.to(".progress-bar", {
  width: "100%",
  duration: 8,
  delay: 0.5,
  onComplete: () => {
    gsap.to(".progress-bar", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "power2.inOut",
      onComplete: closeLoader
    });
  }
});
animations.push(progressBarAnimation);

if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    clearTimeout(textAnimationTimeout); 
    animations.forEach(anim => {
      if (anim && anim.kill) anim.kill();
    });
    gsap.to(".progress-bar", {
      width: "100%",
      duration: 0.5,
      onComplete: () => {
        gsap.to(".progress-bar", {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 1,
          ease: "power2.inOut",
          onComplete: closeLoader
        });
      }
    });
  });
}
