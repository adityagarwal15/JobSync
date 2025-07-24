gsap.registerPlugin(ScrollTrigger);

const split = new SplitType(".about-col h2", {
  types: "words, chars",
});

const tl = gsap
  .timeline({
    scrollTrigger: {
      trigger: ".about",
      start: "top 50%",
      end: "+=125%",
      scrub: 0.5,
    },
  })
  .set(
    split.chars,
    {
      duration: 0.3,
      color: "#fff",
      stagger: 0.1,
    },
    0.1
  );
