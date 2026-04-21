import './style.css'
import { setupCamera } from './camera'
import { createTracker, trackFace } from './tracker'
import { ParallaxScene } from './scene'
import { createFallbackTextures } from './textures'
import { ImageParallaxMode } from './modes/image-parallax-mode'
import { WebcamParallaxMode } from './modes/webcam-parallax-mode'

type ModeName = 'image' | 'webcam'

async function bootstrap() {
  const app = document.querySelector<HTMLDivElement>('#app')

  if (!app) {
    throw new Error('App root not found')
  }

  const canvasContainer = document.createElement('div')
  canvasContainer.className = 'canvas-container'

  const ui = document.createElement('div')
  ui.className = 'ui-layer'

  const controls = document.createElement('div')
  controls.className = 'controls'

  const status = document.createElement('p')
  status.textContent = 'Initializing...'

  const modeButton = document.createElement('button')
  modeButton.textContent = 'Switch mode'

  const modeLabel = document.createElement('p')
  modeLabel.textContent = 'Mode: image'

  const debug = document.createElement('pre')
  debug.textContent = 'Waiting for tracker...'

  controls.append(modeButton)
  ui.append(status, controls, modeLabel, debug)
  app.append(canvasContainer, ui)

  try {
    const video = await setupCamera()
    video.className = 'camera-preview'
    ui.append(video)

    await createTracker()

    const scene = new ParallaxScene(canvasContainer)
    const textures = createFallbackTextures()

    let currentMode: ModeName = 'image'

    const imageMode = new ImageParallaxMode(textures)
    const webcamMode = new WebcamParallaxMode(video)

    function applyMode(mode: ModeName) {
      currentMode = mode
      modeLabel.textContent = `Mode: ${mode}`

      if (mode === 'image') {
        scene.setMode(imageMode)
      } else {
        scene.setMode(webcamMode)
      }
    }

    modeButton.addEventListener('click', () => {
      applyMode(currentMode === 'image' ? 'webcam' : 'image')
    })

    applyMode(currentMode)

    function loop() {
      const face = trackFace(video, performance.now())

      scene.update(face)
      scene.render()

      debug.textContent = JSON.stringify(
        {
          mode: currentMode,
          detected: face.detected,
          x: Number(face.x.toFixed(2)),
          y: Number(face.y.toFixed(2)),
          z: Number(face.z.toFixed(3))
        },
        null,
        2
      )

      requestAnimationFrame(loop)
    }

    status.textContent = 'Running'
    loop()
  } catch (error) {
    status.textContent = 'Failed to initialize'
    console.error(error)
  }
}

bootstrap()