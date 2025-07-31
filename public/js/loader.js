const container = document.querySelector(".container");
const loader = document.querySelector(".loader");

const loaders = ["#loader-copy-1", "#loader-copy-2", "#loader-copy-3"];

let animations = [];
let textAnimationTimeout = null;

loaders.forEach((loaderSel) => new SplitType(loaderSel, { types: "words" }));

container.style.height = "100vh";
container.style.overflow = "hidden";

gsap.to(loaders.join(", "), { opacity: 1, duration: 0.1 });

const runTextAnimations = () => {
  loaders.forEach((loaderSel, index) => {
    const animation = gsap.to(`${loaderSel} .word`, {
      opacity: 1,
      duration: 1,
      stagger: 0.15,
      delay: index === 2 ? index * 2.75 : index * 2.5,
      onComplete: () => {
        gsap.to(`${loaderSel} .word`, {
          opacity: 0,
          duration: 1,
          stagger: 0.15,
        });
      },
    });
    animations.push(animation);
  });
};

textAnimationTimeout = setTimeout(runTextAnimations, 1000);

const progressBarAnimation = gsap.to(".progress-bar", {
  width: "100%",
  duration: 8,
  delay: 0.5,
  onComplete: () => {
    gsap.to(".progress-bar", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
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
          },
        });
      },
    });
  },
});

animations.push(progressBarAnimation);

document.getElementById("skip-loader-btn").addEventListener("click", () => {
  clearTimeout(textAnimationTimeout);
  animations.forEach((anim) => {
    if (anim && anim.kill) anim.kill();
  });

  gsap.to(".progress-bar", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
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
          const skipBtn = document.getElementById("skip-loader-btn");
          if (skipBtn) skipBtn.style.display = "none";
        },
      });
    },
  });
});
