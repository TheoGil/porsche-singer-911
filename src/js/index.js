import "../scss/index.scss";
import Sketch from "./Sketch";
import fragment from "../shaders/fragment.glsl";

window.setTimeout(() => {
  console.log(
    "https://tympanus.net/Development/webGLImageTransitions/index5.html"
  );
  console.log("Optimisation: optimise images");
  new Sketch({
    debug: true,
    uniforms: {},
    intensity: 0.1,
    duration: 0.5,
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
