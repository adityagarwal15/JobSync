gsap.registerPlugin(ScrollTrigger);

// About Section Animation
const splitAbout = new SplitType(".about-col h2", {
  types: "words, chars",
});

const tlAbout = gsap.timeline({
  scrollTrigger: {
    trigger: ".about",
    start: "top 50%",
    end: "+=125%",
    scrub: 0.5,
  },
});

tlAbout.set(
  splitAbout.chars,
  {
    duration: 0.3,
    color: "#fff",
    stagger: 0.1,
  },
  0.1
);

// Prices Section Animation
const splitPrice = new SplitType(".prices-col h2", {
  types: "words, chars",
});

const tlPrice = gsap.timeline({
  scrollTrigger: {
    trigger: ".prices",
    start: "top 50%",
    end: "+=125%",
    scrub: 0.5,
  },
});

tlPrice.set(
  splitPrice.chars,
  {
    duration: 0.3,
    color: "#fff",
    stagger: 0.1,
  },
  0.1
);
