document.addEventListener("DOMContentLoaded", function () {
  const tl = gsap.timeline({ paused: true });
  const currentTime = document.querySelector("#currentTime");
  const menuToggleBtn = document.querySelector(".menu");
  const menuItemsContainer = document.querySelector(".menu-container");
  const menuItems = document.querySelectorAll(".menu-item");
  let isMenuOpen = false;

  // Initial state
  gsap.set(menuItemsContainer, { y: 50, opacity: 0 });
  gsap.set(menuItems, { y: 50, opacity: 0 });

  // Update clock
  function time() {
    const d = new Date();
    const s = d.getSeconds();
    const m = d.getMinutes();
    const h = d.getHours();
    currentTime.textContent =
      ("0" + h).substr(-2) +
      ":" +
      ("0" + m).substr(-2) +
      ":" +
      ("0" + s).substr(-2);
  }
  setInterval(time, 1000);

  // Toggle Menu (open/close)
  function toggleMenu() {
    if (!isMenuOpen) {
      menuToggleBtn.classList.add("active");

      gsap.to(menuItemsContainer, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      });

      gsap.to(menuItems, {
        pointerEvents: "all",
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out",
        onComplete: () => {
          isMenuOpen = true;
        },
      });
    } else {
      menuToggleBtn.classList.remove("active");

      gsap.to(menuItemsContainer, {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(menuItemsContainer, { y: 50, opacity: 0 });
          gsap.set(menuItems, { y: 50, opacity: 0, pointerEvents: "none" });
          isMenuOpen = false;
        },
      });
    }
  }

  // --- Prevent instant close when clicking the menu toggle itself ---
  menuToggleBtn.addEventListener("click", function (e) {
    e.stopPropagation(); // prevent triggering outside-click handler
    toggleMenu();
  });

  // --- Close menu when clicking a menu item ---
  menuItems.forEach((menuItem) => {
    menuItem.addEventListener("click", toggleMenu);
  });

  // --- Close menu when clicking anywhere outside ---
  document.addEventListener("click", function (e) {
    if (isMenuOpen) {
      if (
        !menuItemsContainer.contains(e.target) &&
        !menuToggleBtn.contains(e.target)
      ) {
        toggleMenu(); // close menu
      }
    }
  });
});
