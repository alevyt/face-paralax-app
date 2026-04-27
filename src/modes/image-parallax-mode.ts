import * as THREE from "three";
import type { FaceState } from "../types";
import type { ParallaxMode } from "./types";
import { fitPlaneToView } from "../utils/fit-plane";
import { createBlurredTexture } from "../utils/blur-texture";

type LayerMesh = {
  mesh: THREE.Mesh;
  baseY: number;
};

export class ImageParallaxMode implements ParallaxMode {
  private textures: THREE.Texture[];
  private camera: THREE.PerspectiveCamera;
  private layers: LayerMesh[] = [];

  constructor(textures: THREE.Texture[], camera: THREE.PerspectiveCamera) {
    this.textures = textures;
    this.camera = camera;
  }

  init(scene: THREE.Scene) {
    this.dispose(scene);

    const [backgroundTexture, middleTexture, foregroundTexture] = this.textures;

    const configs = [
      {
        texture: createBlurredTexture(backgroundTexture, 3),
        z: -4,
        transparent: false,
        scale: 1,
        baseY: 0,
      },
      {
        texture: createBlurredTexture(middleTexture, 1),
        z: -1,
        transparent: true,
        scale: 0.9,
        baseY: -0.2,
      },
      {
        texture: foregroundTexture,
        z: 2,
        transparent: true,
        scale: 0.6,
        baseY: -1.6,
      },
    ];

    this.layers = configs.map((layer) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: layer.texture,
          transparent: layer.transparent,
        }),
      );

      mesh.position.z = layer.z;

      const distance = Math.abs(this.camera.position.z - mesh.position.z);
      fitPlaneToView(mesh, this.camera, distance, layer.texture);
      mesh.scale.multiplyScalar(layer.scale);
      mesh.position.y = layer.baseY;

      scene.add(mesh);

      return {
        mesh,
        baseY: layer.baseY,
      };
    });
  }

  update(face: FaceState) {
    if (!this.layers.length) {
      return;
    }

    const driftX = face.detected ? face.x * 0.08 : 0;
    const driftY = face.detected ? face.y * 0.05 : 0;

    const background = this.layers[0];
    const middle = this.layers[1];
    const foreground = this.layers[2];

    background.mesh.position.x = driftX * 0.3;
    background.mesh.position.y = background.baseY - driftY * 0.3;

    middle.mesh.position.x = driftX * 0.6;
    middle.mesh.position.y = middle.baseY - driftY * 0.4;

    foreground.mesh.position.x = driftX;
    foreground.mesh.position.y = foreground.baseY;
  }

  dispose(scene: THREE.Scene) {
    for (const layer of this.layers) {
      scene.remove(layer.mesh);
      layer.mesh.geometry.dispose();

      const material = layer.mesh.material;
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    }

    this.layers = [];
  }
}
