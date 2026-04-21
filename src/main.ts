import './style.css'
import { setupCamera } from './camera'
import { createTracker, trackFace } from './tracker'

async function bootstrap() {
  const app = document.querySelector<HTMLDivElement>('#app')

  if (!app) {
    throw new Error('App root not found')
  }

  const title = document.createElement('h1')
  title.textContent = 'Face Parallax App'

  const status = document.createElement('p')
  status.textContent = 'Requesting camera access...'

  const debug = document.createElement('pre')
  debug.textContent = 'Initializing...'

  app.append(title, status, debug)

  try {
    const video = await setupCamera()
    video.style.width = '100%'
    video.style.maxWidth = '480px'
    video.style.borderRadius = '12px'

    status.textContent = 'Camera is active'
    app.append(video)

    status.textContent = 'Initializing face tracker...'
    await createTracker()
    status.textContent = 'Face tracker is active'

    function loop() {
      const face = trackFace(video, performance.now())

      debug.textContent = JSON.stringify(
        {
          detected: face.detected,
          x: Number(face.x.toFixed(3)),
          y: Number(face.y.toFixed(3)),
          z: Number(face.z.toFixed(3))
        },
        null,
        2
      )

      requestAnimationFrame(loop)
    }

    loop()
  } catch (error) {
    status.textContent = 'Failed to initialize app'
    console.error(error)
  }
}

bootstrap()