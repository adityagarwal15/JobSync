const loaders = ["#loader-copy-1", "#loader-copy-2", "#loader-copy-3"];
loaders.forEach((loader) => new SplitType(loader, { types: "words" }));

document.querySelector(".container").style.height = "100vh";
document.querySelector(".container").style.overflow = "hidden";

gsap.to(loaders.join(", "), { opacity: 1, duration: 0.1 });

setTimeout(() => {
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

gsap.to(".progress-bar", {
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
            document.querySelector(".container").style.height = "100%";
            document.querySelector(".container").style.overflow = "scroll";
          },
        });
      },
    });
  },
});

// ----------- Skip button logic ---------------

document.addEventListener('DOMContentLoaded', function () {
  const skipBtn = document.getElementById('skip-loader-btn');
  const preloader = document.getElementById('preloader');
  const container = document.querySelector('.container');

  function skipLoadingAnimation() {
    // Kill all GSAP tweens related to loader texts, progress bar, and loader container
    gsap.killTweensOf([
      ...loaders.map(id => Array.from(document.querySelectorAll(`${id} .word`))).flat(),
      document.querySelector('.progress-bar'),
      document.querySelector('.loader'),
    ]);

    // Animate hiding loader and reveal main content immediately
    gsap.to('.progress-bar, .loader', {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
      duration: 0.6,
      ease: 'power2.inOut',
      onStart: () => {
        container.style.height = '100%';
        container.style.overflow = 'scroll';
      },
      onComplete: () => {
        if (preloader) preloader.style.display = 'none';
      },
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', skipLoadingAnimation);
  }
});
