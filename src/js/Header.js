import gsap from "gsap";

class Header {
  constructor() {
    this.logo = document.querySelector(".js-logo");
    this.porscheEl = document.querySelector(".js-porsche");
    this.singerEl = document.querySelector(".js-singer");
    this.singerMaskEl = document.querySelector(".js-singer-mask");
    this.headerButtonsCollection = document.querySelectorAll(
      ".js-header-button"
    );
    this.TL = gsap.timeline();

    // START TEMP
    gsap.set(this.singerMaskEl, {
      strokeDashoffset: 0
    });
    gsap.set(this.headerButtonsCollection, {
      opacity: 1
    });
    // END TEMP

    // this.setPorscheStartPosition();
    // this.setSingerStartPosition();
  }

  // WE NEED TO MAKE SURE THAT THAT CSS HAVE BEEN TAKEN INTO ACCOUNT WHEN RUNNING THIS CODE
  // OTHERWISE, GETBOUNDINGCLIENTRECT.WIDTH WILL RETURN THE WIDTH OF THE WINDOW, AS SVG TAKE UP
  // ALL THE SPACE AVAILABLE
  setPorscheStartPosition() {
    const boundingClientRect = this.porscheEl.getBoundingClientRect();

    const widthWV = 30;
    const widthMaxPX = 500;
    const widthMinPX = boundingClientRect.width;
    const newWidth = Math.max(
      Math.min((widthWV / 100) * window.innerWidth, widthMaxPX),
      widthMinPX
    );
    const scale = newWidth / boundingClientRect.width;
    const newX = (innerWidth - boundingClientRect.width * scale) / 2;
    const newY = innerHeight / 2 - (boundingClientRect.height * scale) / 2;

    console.log(
      innerWidth,
      boundingClientRect.width * scale,
      boundingClientRect.x
    );

    gsap.set(this.porscheEl, {
      scale,
      x: newX - boundingClientRect.x,
      y: newY - boundingClientRect.y
    });
  }

  setSingerStartPosition() {
    const boundingClientRect = this.singerEl.getBoundingClientRect();
    const widthWV = 30;
    const widthMaxPX = 500;
    const widthMinPX = boundingClientRect.width;
    const newWidth = Math.max(
      Math.min((widthWV / 100) * window.innerWidth, widthMaxPX),
      widthMinPX
    );
    const scale = newWidth / boundingClientRect.width;
    const newX = innerWidth / 2 - (boundingClientRect.width * scale) / 2;
    const newY = innerHeight / 2 - (boundingClientRect.height * scale) / 2;

    const newPorscheBoundingRect = this.porscheEl.getBoundingClientRect();
    const xOff = -(newPorscheBoundingRect.width / 15);
    const yOff = newPorscheBoundingRect.height * 1.5;
    gsap.set(this.singerEl, {
      scale,
      x: newX - boundingClientRect.x + xOff,
      y: newY - boundingClientRect.y + yOff
    });
  }

  animateIn() {
    return new Promise(resolve => {
      this.TL.to(this.singerMaskEl, 2.5, {
        strokeDashoffset: 0
      });
      this.TL.to([this.singerEl, this.porscheEl], 0.5, {
        scale: 1,
        x: 0,
        y: 0
      });
      this.TL.to(this.headerButtonsCollection, 0.5, {
        opacity: 1,
        stagger: 0.1,
        onComplete: resolve
      });
    });
  }
}

export default Header;
