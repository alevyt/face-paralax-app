import * as THREE from 'three'
import type { FaceState } from '../types'
import type { ParallaxMode } from './types'

export class WebcamParallaxMode implements ParallaxMode {
  private video: HTMLVideoElement
  private videoTexture: THREE.VideoTexture | null = null
  private meshes: THREE.Mesh[] = []

  constructor(video: HTMLVideoElement) {
    this.video = video
  }

  init(scene: THREE.Scene) {
    this.videoTexture = new THREE.VideoTexture(this.video)
    this.videoTexture.colorSpace = THREE.SRGBColorSpace

    const background = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 8),
      new THREE.MeshBasicMaterial({
        map: this.videoTexture
      })
    )
    background.position.z = -3

    const overlayTexture = this.createOverlayTexture()

    const overlay = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshBasicMaterial({
        map: overlayTexture,
        transparent: true
      })
    )
    overlay.position.z = 1.5

    this.meshes = [background, overlay]

    for (const mesh of this.meshes) {
      scene.add(mesh)
    }
  }

  update(face: FaceState) {
    if (!this.meshes.length) {
      return
    }

    const background = this.meshes[0]
    const overlay = this.meshes[1]

    const amountX = face.detected ? face.x : 0
    const amountY = face.detected ? face.y : 0

    background.position.x = amountX * 0.15
    background.position.y = -amountY * 0.12

    overlay.position.x = amountX * 0.35
    overlay.position.y = -amountY * 0.22

    const scale = face.detected
      ? 1 + THREE.MathUtils.clamp((face.z - 0.18) * 0.8, -0.08, 0.12)
      : 1

    background.scale.set(scale, scale, 1)
  }

  dispose(scene: THREE.Scene) {
    for (const mesh of this.meshes) {
      scene.remove(mesh)
      mesh.geometry.dispose()

      const material = mesh.material
      if (material instanceof THREE.Material) {
        if ('map' in material && material.map) {
          material.map.dispose()
        }
        material.dispose()
      }
    }

    if (this.videoTexture) {
      this.videoTexture.dispose()
      this.videoTexture = null
    }

    this.meshes = []
  }

  private createOverlayTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to create overlay texture')
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, 'rgba(80, 120, 255, 0.08)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.28)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = 40 + Math.random() * 120

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.045)'
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }
}