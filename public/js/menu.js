document.addEventListener("DOMContentLoaded", function () {
  const currentTime = document.querySelector("#currentTime");
  const menuToggleBtn = document.querySelector(".menu");
  const menuItemsContainer = document.querySelector(".menu-container");
  const menuItems = document.querySelectorAll(".menu-item");
  let isMenuOpen = false;

  // GSAP initial setup
  gsap.set(menuItemsContainer, { y: 50, opacity: 0 });
  gsap.set(menuItems, { y: 50, opacity: 0, pointerEvents: "none" });

  // --- Clock update ---
  function time() {
    const d = new Date();
    const s = d.getSeconds();
    const m = d.getMinutes();
    const h = d.getHours();
    currentTime.textContent =
      ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
  }
  setInterval(time, 1000);

  // --- Toggle menu function ---
  function toggleMenu(open) {
    if (open === undefined) open = !isMenuOpen;

    if (open) {
      menuToggleBtn.classList.add("active");

      gsap.to(menuItemsContainer, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.to(menuItems, { pointerEvents: "all", y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" });

      isMenuOpen = true;
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
        },
      });

      isMenuOpen = false;
    }
  }

  // --- Menu toggle button click ---
  menuToggleBtn.addEventListener("click", function (e) {
    e.stopPropagation(); // prevent document click from immediately closing
    toggleMenu();
  });

  // --- Menu item click ---
  menuItems.forEach(item => {
    item.addEventListener("click", function () {
      toggleMenu(false); // close menu on item click
    });
  });

  // --- Anywhere click closes the menu ---
  document.addEventListener("click", function (e) {
    if (isMenuOpen && !menuToggleBtn.contains(e.target)) {
      toggleMenu(false); // clicking anywhere else closes the menu
    }
  });
});
