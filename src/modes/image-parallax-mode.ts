import * as THREE from 'three'
import type { FaceState } from '../types'
import type { ParallaxMode } from './types'

export class ImageParallaxMode implements ParallaxMode {
  private textures: THREE.Texture[]
  private meshes: THREE.Mesh[] = []

  constructor(textures: THREE.Texture[]) {
    this.textures = textures
  }

  init(scene: THREE.Scene) {
    const [backgroundTexture, middleTexture, foregroundTexture] = this.textures

    const layers = [
      {
        texture: backgroundTexture,
        width: 14,
        height: 8,
        z: -4,
        transparent: false
      },
      {
        texture: middleTexture,
        width: 10,
        height: 6,
        z: -1,
        transparent: true
      },
      {
        texture: foregroundTexture,
        width: 8,
        height: 5,
        z: 2,
        transparent: true
      }
    ]

    this.meshes = layers.map((layer) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(layer.width, layer.height),
        new THREE.MeshBasicMaterial({
          map: layer.texture,
          transparent: layer.transparent
        })
      )

      mesh.position.z = layer.z
      scene.add(mesh)
      return mesh
    })
  }

  update(face: FaceState) {
    if (!this.meshes.length) {
      return
    }

    const driftX = face.detected ? face.x * 0.08 : 0
    const driftY = face.detected ? face.y * 0.05 : 0

    this.meshes[0].position.x = driftX * 0.3
    this.meshes[0].position.y = -driftY * 0.3

    this.meshes[1].position.x = driftX * 0.6
    this.meshes[1].position.y = -driftY * 0.6

    this.meshes[2].position.x = driftX
    this.meshes[2].position.y = -driftY
  }

  dispose(scene: THREE.Scene) {
    for (const mesh of this.meshes) {
      scene.remove(mesh)
      mesh.geometry.dispose()

      const material = mesh.material
      if (material instanceof THREE.Material) {
        material.dispose()
      }
    }

    this.meshes = []
  }
}