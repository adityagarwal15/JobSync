document.addEventListener('DOMContentLoaded', function () {
  const tl = gsap.timeline({ paused: true });
  const currentTime = document.querySelector('#currentTime');
  const menuToggleBtn = document.querySelector('.menu');
  const menuItemsContainer = document.querySelector('.menu-container');
  const menuItems = document.querySelectorAll('.menu-item');
  let isMenuOpen = false;

  gsap.set(menuItemsContainer, { y: 50, opacity: 0 });
  gsap.set(menuItems, { y: 50, opacity: 0 });

  function time() {
    const d = new Date();
    const s = d.getSeconds();
    const m = d.getMinutes();
    const h = d.getHours();

    const formattedTime =
      ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);

    currentTime.textContent = `🟢 Live • ${formattedTime}`;
  }

  setInterval(time, 1000);

  function toggleMenu() {
    if (!isMenuOpen) {
      menuToggleBtn.classList.add('active');

      gsap.to(menuItemsContainer, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      });

      gsap.to(
        menuItems,
        {
          pointerEvents: 'all',
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power2.out',
          onComplete: () => {
            isMenuOpen = true;
          },
        },
        '<'
      );
    } else {
      if (isMenuOpen) {
        menuToggleBtn.classList.remove('active');

        gsap.to(menuItemsContainer, {
          y: -50,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(menuItemsContainer, { y: 50, opacity: 0 });
            gsap.set(menuItems, { y: 50, opacity: 0, pointerEvents: 'none' });
            isMenuOpen = false;
          },
        });
      }
    }
  }

  menuItems.forEach((menuItem) => {
    menuItem.addEventListener('click', toggleMenu);
  });

  menuToggleBtn.addEventListener('click', toggleMenu);
});
