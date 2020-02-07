import "../scss/index.scss";

import Grain from "./components/Grain";
import Slideshow from "./components/Slideshow";
import Intro from "./components/Intro";
import fragment from "../shaders/slideshow/fragment.glsl";

new Grain();

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
    "./public/slides/1.jpg",
    "./public/slides/2.jpg",
    "./public/slides/3.jpg"
  ],
  containerId: "js-slideshow-container",
  canvasId: "slideshow",
  thumbnailsClass: "js-thumbnail",
  nextClass: "js-next",
  prevClass: "js-prev",
  fragment
});

const intro = new Intro({});
intro.animateIn();
