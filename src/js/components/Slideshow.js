import {
  WebGLRenderer,
  TextureLoader,
  ShaderMaterial,
  Scene,
  PerspectiveCamera,
  LoadingManager,
  DoubleSide,
  PlaneGeometry,
  Mesh,
  Vector4,
  Math as ThreeMath
} from "three";
import gsap from "gsap";
import tweenCSSVar from "../utility/tweenCSSVar";

class Slideshow {
  constructor(options) {
    this.containerId = options.containerId;
    this.canvasId = options.canvasId;
    this.container = document.getElementById(this.containerId);
    this.thumbnails = document.querySelectorAll(`.${options.thumbnailsClass}`);
    this.prevBtn = document.querySelector(`.${options.prevClass}`);
    this.nextBtn = document.querySelector(`.${options.nextClass}`);
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetWidth;
    this.images = options.images;
    this.tl = gsap.timeline();
    this.ease = options.ease;

    // ThreeJS stuff
    this.textures = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.vertex = `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`;
    this.fragment = options.fragment;
    this.uniforms = options.uniforms;
    this.intensity = options.intensity;
    this.width = this.container.offsetWidth;
    this.height = this.container.scrollHeight;
    this.duration = options.transitionDuration;
    this.autoplayDuration = options.autoplayDuration;
    this.easing = options.easing;
    this.current = null;

    this.loadTextures().then(() => {
      this.setupRenderer();
      this.setupCamera();
      this.setupScene();
      this.setupPlane();
      this.setupResize();
      this.resize();
      this.render();
      this.addEventListeners();
      this.goTo(0);
    });
  }

  setupRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: document.getElementById(this.canvasId)
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x00ff00, 1);
  }

  setupCamera() {
    this.camera = new PerspectiveCamera(
      70,
      this.width / this.height,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
  }

  setupScene() {
    this.scene = new Scene();
  }

  setupPlane() {
    this.material = new ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: DoubleSide,
      uniforms: {
        progress: { type: "f", value: 0 },
        intensity: { type: "f", value: this.intensity },
        texture1: { type: "f", value: null },
        texture2: { type: "f", value: this.textures[1] },
        displacement: {
          type: "f",
          value: new TextureLoader().load("public/displacement/02.png")
        },
        resolution: { type: "v4", value: new Vector4() }
      },
      vertexShader: this.vertex,
      fragmentShader: this.fragment
    });

    this.plane = new Mesh(new PlaneGeometry(1, 1, 10, 10), this.material);
    this.scene.add(this.plane);
  }

  loadTextures() {
    const loadManager = new LoadingManager();
    const loader = new TextureLoader(loadManager);

    this.images.forEach(url => {
      this.textures.push(loader.load(url));
    });

    return new Promise(function(resolve) {
      loadManager.onLoad = resolve;
    });
  }

  clickEvent() {
    this.container.addEventListener("click", () => {
      this.next();
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.getBoundingClientRect().width;
    this.height = this.container.getBoundingClientRect().height;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    const vFOV = ThreeMath.degToRad(this.camera.fov); // convert vertical fov to radians
    var height = 2 * Math.tan(vFOV / 2) * this.camera.position.z; // visible height
    var width = height * this.camera.aspect;
    this.plane.scale.x = width;
    this.plane.scale.y = height;

    // image cover
    this.imageAspect =
      this.textures[0].image.height / this.textures[0].image.width;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    const dist = this.camera.position.z;
    const heighta = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(heighta / (2 * dist));

    this.plane.scale.x = this.camera.aspect;
    this.plane.scale.y = 1;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.geometry = new PlaneGeometry(1, 1, 2, 2);

    this.plane = new Mesh(this.geometry, this.material);
  }

  addEventListeners() {
    console.log("Optimisation: use event delegationfor thumbnails.");

    this.thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener("click", this.onThumbnailClick.bind(this));
    });

    this.prevBtn.addEventListener("click", this.prev.bind(this));
    this.nextBtn.addEventListener("click", this.next.bind(this));
  }

  prev() {
    let nextTexture =
      this.current - 1 > -1 ? this.current - 1 : this.textures.length - 1;
    this.goTo(nextTexture);
  }

  next() {
    let nextTexture =
      this.current + 1 < this.textures.length ? this.current + 1 : 0;
    this.goTo(nextTexture);
  }

  onThumbnailClick(e) {
    const nextSlideIndex = e.currentTarget.getAttribute("data-thumb-index");
    this.goTo(nextSlideIndex);
  }

  goTo(index) {
    index = parseInt(index);

    if (index != this.current) {
      this.updateTimeline(index);

      this.thumbnails.forEach(thumbnail => {
        if (thumbnail.classList.contains("active")) {
          thumbnail.classList.remove("active");
        }
      });
      this.thumbnails[index].classList.add("active");

      gsap.to(this.material.uniforms.progress, this.duration, {
        value: 1,
        onStart: () => {
          this.material.uniforms.texture2.value = this.textures[index];
        },
        ease: this.ease,
        onComplete: () => {
          this.current = index;
          this.material.uniforms.texture1.value = this.textures[index];
          this.material.uniforms.progress.value = 0;
        }
      });
    }
  }

  updateTimeline(nextIndex) {
    if (this.current != undefined) {
      const currentProgressEl = this.thumbnails[this.current].querySelector(
        ".progress"
      );
      /*
      gsap.set(currentProgressEl, {
        scaleX: 0
      });
      */
      gsap.killTweensOf(currentProgressEl);
    }

    const progress = { value: 0 };
    gsap.fromTo(
      progress,
      this.autoplayDuration,
      {
        value: 0
      },
      {
        value: 1,
        ease: "linear",
        onUpdate: () => {
          this.thumbnails[nextIndex]
            .querySelector(".progress")
            .style.setProperty("--progress", progress.value);
        },
        onComplete: () => {
          this.next();
        }
      }
    );
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

export default Slideshow;
