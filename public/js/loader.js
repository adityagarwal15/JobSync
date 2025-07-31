const loaders = ['#loader-copy-1', '#loader-copy-2', '#loader-copy-3'];
loaders.forEach((loader) => new SplitType(loader, { types: 'words' }));

document.querySelector('.container').style.height = '100vh';
document.querySelector('.container').style.overflow = 'hidden';

gsap.to(loaders.join(', '), { opacity: 1, duration: 0.1 });

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

gsap.to('.progress-bar', {
  width: '100%',
  duration: 8,
  delay: 0.5,
  onComplete: () => {
    gsap.to('.progress-bar', {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.to('.progress-bar, .loader', {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          duration: 1,
          ease: 'power2.inOut',
          onStart: () => {
            document.querySelector('.container').style.height = '100%';
            document.querySelector('.container').style.overflow = 'scroll';
          },
        });
      },
    });
  },
});
document.querySelector('.skip').addEventListener('click', function (e) {
  e.preventDefault();

  const loader = document.querySelector('.loader');

  // Allow scrolling immediately
  const container = document.querySelector('.container');
  container.style.height = '100%';
  container.style.overflow = 'scroll';

  // Scroll to hero right away
  document.querySelector('#hero').scrollIntoView({ behavior: 'smooth' });

  // Fade out loader
  loader.style.transition = 'opacity 0.5s ease';
  loader.style.opacity = 0;

  setTimeout(() => {
    loader.style.display = 'none';
  }, 500);
});
