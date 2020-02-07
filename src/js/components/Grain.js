import { Renderer, Geometry, Program, Mesh } from "ogl";
import grainVertex from "../../shaders/grain/vertex.glsl";
import grainFragment from "../../shaders/grain/fragment.glsl";

class Grain {
  constructor() {
    this.time = 0;
    this.setupRenderer();
    this.setupGeometry();
    this.setupProgram();
    this.setupMesh();

    window.addEventListener("resize", this.onResize.bind(this), false);
    this.onResize();

    requestAnimationFrame(this.animate.bind(this));
  }

  setupRenderer() {
    this.renderer = new Renderer({
      alpha: true
    });
    this.gl = this.renderer.gl;
    this.gl.canvas.classList.add("grain");
    document.body.appendChild(this.gl.canvas);
  }

  setupGeometry() {
    // For details, refer to
    // https://github.com/oframe/ogl/blob/master/examples/triangle-screen-shader.html
    this.geometry = new Geometry(this.gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
    });
  }

  setupProgram() {
    this.vertex = grainVertex;
    this.fragment = grainFragment;

    this.program = new Program(this.gl, {
      vertex: this.vertex,
      fragment: this.fragment,
      uniforms: {
        uTime: { value: 0 }
      }
    });
  }

  setupMesh() {
    this.mesh = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.update();
    this.render();
  }

  update() {
    this.time++;
    // Hack to mimics a slower framerate
    if (this.time % 5 === 0) {
      this.program.uniforms.uTime.value += 1;
    }
  }

  render() {
    this.renderer.render({ scene: this.mesh });
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

export default Grain;
