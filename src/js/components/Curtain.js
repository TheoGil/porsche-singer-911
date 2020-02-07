import gsap from "gsap";

const hiddenElsClassName = ".js-hidden";
const scaleVariableName = "--curtain-scale-x";
const transformOriginVariableName = "--curtain-transform-origin";
const defaultDuration = 1;

class Curtain {
  constructor(options) {
    this.id = options.id;
    this.el = options.el;
    this.hiddenEls = this.el.querySelectorAll(hiddenElsClassName);
    this.scale = {
      y: 0
    };
    this.duration =
      options.duration ||
      this.el.getAttribute("data-curtain-duration") ||
      defaultDuration;
    this.curtainScaleInCallbacks = [];
    this.setup();
  }

  setup() {
    gsap.set(this.hiddenEls, {
      opacity: 0
    });
  }

  applyCallbacks() {
    if (this.curtainScaleInCallbacks.length > 0) {
      this.curtainScaleInCallbacks.forEach(callback => {
        callback();
      });
    }
  }

  switchTransformOrigin() {
    this.el.style.setProperty(transformOriginVariableName, "50% 0%");
  }

  displayHiddenEls() {
    gsap.set(this.hiddenEls, {
      opacity: 1
    });
  }

  reveal(delay) {
    gsap.to(this.scale, {
      keyframes: [
        {
          y: 1,
          duration: this.duration,
          onComplete: () => {
            this.applyCallbacks();
            this.switchTransformOrigin();
            this.displayHiddenEls();
          },
          delay: delay
        },
        {
          y: 0,
          duration: this.duration
        }
      ],
      delay,
      onUpdate: () => {
        this.el.style.setProperty(scaleVariableName, this.scale.y);
      }
    });
  }

  addCurtainScaleInCallback(callback) {
    this.curtainScaleInCallbacks.push(callback);
  }
}

export default Curtain;
