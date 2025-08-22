gsap.registerPlugin(ScrollTrigger);

const split = new SplitType(".about-col h2", {
  types: "words, chars",
});

gsap.set(split.chars, { color: "rgba(255,255,255,0.125)" });

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".about",
    start: "top 50%",
    end: "+=115%",
    scrub: 0.5,
  },
});

tl.to(split.chars, {
  duration: 0.3,
  color: "#fff",
  stagger: 0.1,
  ease: "power1.out",
});
