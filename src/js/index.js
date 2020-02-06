import "../scss/index.scss";

import gsap from "gsap";

import Curtain from "./Curtain";
import Slideshow from "./Slideshow";
import Header from "./Header";
import fragment from "../shaders/fragment.glsl";

const TL = gsap.timeline();
const staggerEls = document.querySelectorAll(".js-stagger");
const curtainEls = document.querySelectorAll(".js-curtain");
const curtains = {};
curtainEls.forEach((el, i) => {
  curtains[i] = new Curtain({ el, timeline: TL, id: i, duration: 0.3 });
  el.dataset.curtainId = i;
});

// HIDE EVERYTHING
gsap.set(staggerEls, {
  opacity: 0,
  y: 20
});

window.setTimeout(() => {
  const slideshow = new Slideshow({
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
    containerId: "js-slideshow-container",
    canvasId: "slideshow",
    thumbnailsClass: "js-thumbnail",
    nextClass: "js-next",
    prevClass: "js-prev",
    fragment
  });
  const header = new Header();
  header.animateIn().then(() => {
    TL.to([...staggerEls, ...curtainEls], {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: {
        amount: 1,
        onStart: function() {
          const tween = this;
          const target = tween._targets[0];
          if (target.classList.contains("js-curtain")) {
            gsap.set(staggerEls, {
              opacity: 1,
              y: 0
            });
            curtains[target.dataset.curtainId].reveal();
            /*
            if (curtain.el.classList.contains("js-shadow")) {
              const parent = curtain.el.closest("li");
              if (parent.classList.contains("thumbnail-list-item")) {
                curtain.addCurtainScaleInCallback(() => {
                  animateInDropShadow(parent, 1);
                });
              }
            }

            if (curtain.el.classList.contains("active")) {
              curtain.addCurtainScaleInCallback(() => {
                animateInDropShadow(curtain.el, 1);
              });
            }
            */
          }
        }
      }
    });

    function animateInDropShadow(el, duration) {
      const opacity = {
        value: 0
      };

      gsap.to(opacity, {
        value: 1,
        duration: duration,
        onUpdate: () => {
          el.style.setProperty("--shadow-opacity", opacity.value);
        }
      });
    }

    function animateInFooter() {
      TL.to(document.querySelector(".footer"), {
        duration: 0.5,
        scaleX: 1
      });
    }
  });
}, 100);
