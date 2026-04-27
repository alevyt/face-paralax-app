import * as THREE from "three";
import type { FaceState } from "./types";
import type { ParallaxMode } from "./modes/types";

export class ParallaxScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private activeMode: ParallaxMode | null = null;

  private targetX = 0;
  private targetY = 0;
  private targetZ = 5;

  private currentX = 0;
  private currentY = 0;
  private currentZ = 5;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambient);

    window.addEventListener("resize", this.onResize);
  }

  setMode(mode: ParallaxMode) {
    if (this.activeMode) {
      this.activeMode.dispose(this.scene);
    }

    this.activeMode = mode;
    this.activeMode.init(this.scene);
  }

  update(face: FaceState) {
    if (face.detected) {
      const rawX = face.x;
      const rawY = face.y;

      // dead zone (remove jitter near center)
      const deadZone = 0.03;
      const x = Math.abs(rawX) < deadZone ? 0 : rawX;
      const y = Math.abs(rawY) < deadZone ? 0 : rawY;

      // clamp movement range
      const clampedX = THREE.MathUtils.clamp(x, -0.6, 0.6);
      const clampedY = THREE.MathUtils.clamp(y, -0.4, 0.4);

      // apply sensitivity
      this.targetX = clampedX * 1.2;
      this.targetY = clampedY * 0.8;

      const normalizedDepth = THREE.MathUtils.clamp(
        (face.z - 0.18) * 8,
        -0.6,
        0.6,
      );
      this.targetZ = 5 - normalizedDepth;
    } else {
      this.targetX = 0;
      this.targetY = 0;
      this.targetZ = 5;
    }

    this.currentX += (this.targetX - this.currentX) * 0.08;
    this.currentY += (this.targetY - this.currentY) * 0.08;
    this.currentZ += (this.targetZ - this.currentZ) * 0.08;

    this.camera.position.x = this.currentX;
    this.camera.position.y = -this.currentY;
    this.camera.position.z = this.currentZ;
    this.camera.rotation.y = this.currentX * 0.08
    this.camera.rotation.x = this.currentY * 0.05
    this.camera.lookAt(0, 0, 0);

    this.activeMode?.update(face);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  getCamera() {
    return this.camera;
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.activeMode?.init(this.scene);
  };
}
