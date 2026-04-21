import './style.css'
import { setupCamera } from './camera'
import { createTracker, trackFace } from './tracker'
import { ParallaxScene } from './scene'

async function bootstrap() {
  const app = document.querySelector<HTMLDivElement>('#app')

  if (!app) {
    throw new Error('App root not found')
  }

  const canvasContainer = document.createElement('div')
  canvasContainer.className = 'canvas-container'

  const ui = document.createElement('div')
  ui.className = 'ui-layer'

  const status = document.createElement('p')
  status.textContent = 'Initializing...'

  const debug = document.createElement('pre')
  debug.textContent = 'Waiting for tracker...'

  app.append(canvasContainer, ui)
  ui.append(status, debug)

  try {
    const video = await setupCamera()
    video.className = 'camera-preview'
    ui.append(video)

    await createTracker()

    const scene = new ParallaxScene(canvasContainer)

    function loop() {
      const face = trackFace(video, performance.now())

      scene.update(face)
      scene.render()

      debug.textContent = JSON.stringify(
        {
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