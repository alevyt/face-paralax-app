import * as THREE from 'three'
import type { FaceState } from './types'

export class ParallaxScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  private targetX = 0
  private targetY = 0
  private targetZ = 5

  private currentX = 0
  private currentY = 0
  private currentZ = 5

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    container.appendChild(this.renderer.domElement)

    this.createLights()
    this.createLayers()

    window.addEventListener('resize', this.onResize)
  }

  private createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 1)
    this.scene.add(ambient)
  }

  private createLayers() {
    const backgroundTexture = this.createBackgroundTexture()
    const middleTexture = this.createMiddleTexture()
    const foregroundTexture = this.createForegroundTexture()

    const background = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 8),
      new THREE.MeshBasicMaterial({
        map: backgroundTexture
      })
    )
    background.position.z = -4

    const middle = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshBasicMaterial({
        map: middleTexture,
        transparent: true
      })
    )
    middle.position.z = -1

    const foreground = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5),
      new THREE.MeshBasicMaterial({
        map: foregroundTexture,
        transparent: true
      })
    )
    foreground.position.z = 2

    this.scene.add(background, middle, foreground)
  }

  update(face: FaceState) {
    if (face.detected) {
      this.targetX = face.x * 1.1
      this.targetY = face.y * 0.7

      const normalizedDepth = THREE.MathUtils.clamp((face.z - 0.18) * 8, -0.6, 0.6)
      this.targetZ = 5 - normalizedDepth
    } else {
      this.targetX = 0
      this.targetY = 0
      this.targetZ = 5
    }

    this.currentX += (this.targetX - this.currentX) * 0.08
    this.currentY += (this.targetY - this.currentY) * 0.08
    this.currentZ += (this.targetZ - this.currentZ) * 0.08

    this.camera.position.x = this.currentX
    this.camera.position.y = -this.currentY
    this.camera.position.z = this.currentZ
    this.camera.lookAt(0, 0, 0)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  private createBackgroundTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to create background texture')
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#08111f')
    gradient.addColorStop(0.5, '#13233f')
    gradient.addColorStop(1, '#1c355e')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 160; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = Math.random() * 2 + 1

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  private createMiddleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to create middle texture')
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 9; i++) {
      const baseX = 80 + i * 110
      const width = 80 + Math.random() * 60
      const height = 220 + Math.random() * 240
      const y = canvas.height - height - 80

      ctx.fillStyle = `rgba(20, 30, 50, ${0.65 + Math.random() * 0.25})`
      ctx.fillRect(baseX, y, width, height)

      ctx.fillStyle = 'rgba(255, 220, 120, 0.18)'
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillRect(baseX + 10 + col * 20, y + 15 + row * 28, 10, 14)
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  private createForegroundTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to create foreground texture')
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(18, 18, 28, 0.95)'
    ctx.fillRect(0, 760, canvas.width, 264)

    for (let i = 0; i < 7; i++) {
      const x = 70 + i * 140
      const trunkWidth = 18 + Math.random() * 10
      const trunkHeight = 180 + Math.random() * 100

      ctx.fillStyle = 'rgba(35, 24, 18, 0.95)'
      ctx.fillRect(x, 760 - trunkHeight, trunkWidth, trunkHeight)

      ctx.beginPath()
      ctx.arc(x + trunkWidth / 2, 760 - trunkHeight, 55 + Math.random() * 18, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(25, 45, 30, 0.95)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x + trunkWidth / 2 - 25, 760 - trunkHeight + 15, 42 + Math.random() * 16, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x + trunkWidth / 2 + 28, 760 - trunkHeight + 18, 38 + Math.random() * 14, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}