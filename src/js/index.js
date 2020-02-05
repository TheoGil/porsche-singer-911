import "../scss/index.scss";
import Slideshow from "./Slideshow";
import Header from "./Header";
import fragment from "../shaders/fragment.glsl";
import gsap from "gsap";

const staggerEl = document.querySelectorAll(".js-stagger");

// TEMP
gsap.set(
  [document.getElementById("slideshow"), document.querySelector(".footer")],
  {
    opacity: 0
  }
);

document.querySelectorAll(".js-thumbnail").forEach(el => {
  gsap.set(el.querySelectorAll(".curtain"), {
    scaleX: 0
  });
  gsap.set(el.querySelectorAll(".img"), {
    opacity: 0
  });
  gsap.set(el.querySelector(".thumbnail-progress-container"), {
    opacity: 0
  });
  gsap.set(el.querySelector(".thumbnail-progress-container"), {
    opacity: 0
  });
});
// TEMP

window.setTimeout(() => {
  gsap.set(staggerEl, {
    opacity: 0,
    y: 20
  });

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
  const TL = gsap.timeline();
  header.animateIn().then(() => {
    TL.to(staggerEl, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: 0.1
    });

    function animateInCurtain(thumbnailEl, duration, stagger) {
      return new Promise(resolve => {
        const curtainEl = thumbnailEl.querySelector(".js-curtain");
        const offset = `-=${duration - stagger}`;
        TL.to(
          curtainEl,
          {
            duration,
            scaleX: 1,
            onCompleteParams: [thumbnailEl],
            onComplete: resolve
          },
          offset
        );
      });
    }

    function animateOutCurtain(thumbnailEl, duration, stagger) {
      const curtainEl = thumbnailEl.querySelector(".js-curtain");
      const offset = `-=${duration - stagger}`;

      gsap.set(curtainEl, {
        transformOrigin: "100% 100%"
      });

      TL.to(
        curtainEl,
        {
          scaleX: 0,
          duration: 0.3
        },
        offset
      );
    }

    function animateInDropShadow(thumbnailEl, duration) {
      const opacity = {
        value: 0
      };

      gsap.to(opacity, {
        value: 1,
        duration: duration,
        onUpdate: () => {
          thumbnailEl.style.setProperty("--shadow-opacity", opacity.value);
        }
      });

      const thumbnailBtn = thumbnailEl.querySelector(".thumbnail-button");
      if (thumbnailBtn.classList.contains("active")) {
        const activeOpacity = {
          value: 0
        };

        gsap.to(activeOpacity, {
          value: 1,
          duration: duration,
          onUpdate: () => {
            thumbnailBtn.style.setProperty(
              "--shadow-opacity",
              activeOpacity.value
            );
          },
          onComplete: () => {
            thumbnailBtn.setAttribute("style", null);
          }
        });
      }
    }

    document.querySelectorAll(".thumbnail").forEach(el => {
      const duration = 0.3;
      const stagger = 0.1;
      animateInCurtain(el, duration, stagger).then(thumbnailEl => {
        animateInDropShadow(thumbnailEl, 1);

        gsap.set(
          [
            thumbnailEl.querySelector(".js-img"),
            thumbnailEl.querySelector(".js-thumbnail-progress-container")
          ],
          {
            opacity: 1
          }
        );

        animateOutCurtain(thumbnailEl, duration, stagger);
      });
    });
  });
}, 100);
