import "../scss/index.scss";

import gsap from "gsap";

import Curtain from "./Curtain";
import Slideshow from "./Slideshow";
import Header from "./Header";
import fragment from "../shaders/fragment.glsl";

function cancelTween(target) {
  gsap.killTweensOf(target, "opacity,y");
  target.setAttribute("style", null);
}

function curtainAnimation(target) {
  // Animate in default thumbnail drop-shadow
  if (target.classList.contains("js-shadow")) {
    const parent = target.closest("li");
    curtains[target.dataset.curtainId].addCurtainScaleInCallback(() => {
      tweenCSSVar("--shadow-opacity", parent, 0.5, 0, 1);
    });
  }

  // Animate in ACTIVE thumbnail drop-shadow
  if (target.classList.contains("active")) {
    target.setAttribute("style", "--shadow-opacity: 0;");
    curtains[target.dataset.curtainId].addCurtainScaleInCallback(() => {
      tweenCSSVar("--shadow-opacity", target, 0.5, 0, 1);
    });
  }

  curtains[target.dataset.curtainId].reveal();
}

function tweenCSSVar(varName, el, duration, from, to) {
  const variable = {
    value: from
  };

  gsap.to(variable, {
    value: to,
    duration: duration,
    onUpdate: () => {
      el.style.setProperty(varName, variable.value);
    }
  });
}

const TL = gsap.timeline();
const staggerEls = document.querySelectorAll(".js-stagger");
const curtainEls = document.querySelectorAll(".js-curtain");
const footerEl = document.querySelector(".js-footer");
const curtains = {};
curtainEls.forEach((el, i) => {
  curtains[i] = new Curtain({ el, id: i, duration: 0.5 });
  el.dataset.curtainId = i;
});

// HIDE EVERYTHING SO WE CAN ANIMATE THEM IN
gsap.set(staggerEls, {
  opacity: 0,
  y: 20
});
gsap.set(footerEl, {
  scaleX: 0
});

// WRAP OUR INIT WITHIN STO BECAUSE FOUC MESS UP OUR CALCULATIONS
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
    // Animate in "basic stuff"
    TL.to(staggerEls, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: {
        amount: 1
      }
    });

    // Animate slideshow and thumbnails
    const curtainsAnimationOffset = 0.5;
    TL.to(
      curtainEls,
      {
        stagger: {
          y: 0,
          amount: 1,
          onStart: function() {
            const target = this._targets[0];
            cancelTween(target, "opacity,y");
            curtainAnimation(target);
          }
        }
      },
      `-=${curtainsAnimationOffset}`
    );

    // Animate footer
    TL.to(
      footerEl,
      {
        duration: 0.5,
        scaleX: 1,
        onComplete: () => {
          tweenCSSVar("--gradient-opacity", footerEl, 0.5, 0, 0.08);
        }
      },
      `-=${curtainsAnimationOffset}`
    );
  });
}, 100);
