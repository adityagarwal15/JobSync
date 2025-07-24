gsap.registerPlugin(ScrollTrigger);

const splitPrice = new SplitType(".prices-col h2", {
  types: "words, chars",
});

const tl2 = gsap
  .timeline({
    scrollTrigger: {
      trigger: ".prices",
      start: "top 50%",
      end: "+=125%",
      scrub: 0.5,
    },
  })
  .set(
    splitPrice.chars,
    {
      duration: 0.3,
      color: "#fff",
      stagger: 0.1,
    },
    0.1
  );
