import "../scss/index.scss";
import Slideshow from "./Slideshow";
import fragment from "../shaders/fragment.glsl";

window.setTimeout(() => {
  console.log(
    "https://tympanus.net/Development/webGLImageTransitions/index5.html"
  );
  console.log("Optimisation: optimise images");
  new Slideshow({
    debug: true,
    uniforms: {},
    intensity: 0.1,
    transitionDuration: 0.5,
    autoplayDuration: 8,
    ease: "power2.out",
    // NOTE: Currently only works if all images have the same aspect ratio.
    // Refer to the resize function within the Sketch class
    images: [
      "/public/slides/1.jpg",
      "/public/slides/2.jpg",
      "/public/slides/3.jpg"
    ],
    containerId: "slideshow",
    thumbnailsClass: "js-thumbnail",
    nextClass: "js-next",
    prevClass: "js-prev",
    fragment
  });
}, 500);
