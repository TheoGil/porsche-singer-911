import gsap from "gsap";
import Curtain from "./Curtain";
import Header from "./Header";
import smallViewport from "../utility/smallViewport";
import tweenCSSVar from "../utility/tweenCSSVar";

function cancelTween(target) {
  gsap.killTweensOf(target, "opacity,y");
  target.setAttribute("style", null);
}

class Intro {
  constructor() {
    this.staggerEls = document.querySelectorAll(".js-stagger");
    this.curtainEls = document.querySelectorAll(".js-curtain");
    this.footerEl = document.querySelector(".js-footer");

    this.curtainsAnimationOffset = 0.5;
    this.TL = gsap.timeline();
    this.header = new Header();

    this.setupCurtains();
    this.hideStuff();
  }

  setupCurtains() {
    this.curtainEls.forEach((el, i) => {
      el._curtain = new Curtain({ el, id: i, duration: 0.5 });
    });
  }

  // Hide everything that we intend to animate in
  hideStuff() {
    gsap.set(this.staggerEls, {
      opacity: 0,
      y: 20
    });
    gsap.set(this.footerEl, {
      scaleX: 0
    });
  }

  animateStaggers() {
    this.TL.to(this.staggerEls, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: {
        amount: 1
      }
    });
  }

  animateCurtains() {
    this.TL.to(
      this.curtainEls,
      {
        stagger: {
          y: 0,
          amount: 1,
          onStart: this.onStartCurtainTween
        }
      },
      `-=${this.curtainsAnimationOffset}`
    );
  }

  onStartCurtainTween() {
    const target = this._targets[0];
    cancelTween(target, "opacity,y");

    // Animate in default thumbnail drop-shadow
    if (target.classList.contains("js-shadow")) {
      const parent = target.closest("li");
      target._curtain.addCurtainScaleInCallback(() => {
        tweenCSSVar("--shadow-opacity", parent, 0.5, 0, 1);
      });
    }

    // Animate in ACTIVE thumbnail drop-shadow
    if (target.classList.contains("active")) {
      target.setAttribute("style", "--shadow-opacity: 0;");
      target._curtain.addCurtainScaleInCallback(() => {
        tweenCSSVar("--shadow-opacity", target, 0.5, 0, 1);
      });
    }

    target._curtain.reveal();
  }

  animateIn() {
    this.header.animateIn().then(() => {
      // Based on the width of the viewport, we rearrange the order in wich elements are animating in
      // Large VP: animate content, then curtains, then footer
      // Small VP: animate header content, then curtain, then content, then footer
      if (smallViewport()) {
        this.animateInSmallScreen();
      } else {
        this.animateInLargeScreen();
      }
    });
  }

  animateInLargeScreen() {
    // Animate in "basic stuff"
    this.animateStaggers();

    // Animate slideshow and thumbnails
    this.animateCurtains();

    // Animate footer
    this.TL.to(
      this.footerEl,
      {
        duration: 0.5,
        scaleX: 1,
        onComplete: () => {
          tweenCSSVar("--gradient-opacity", this.footerEl, 0.5, 0, 0.08);
        }
      },
      `-=${this.curtainsAnimationOffset}`
    );
  }

  animateInSmallScreen() {}
}

export default Intro;
