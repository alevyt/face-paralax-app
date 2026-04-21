import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { FaceState } from './types'

let faceLandmarker: FaceLandmarker | null = null

export async function createTracker(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
    },
    runningMode: 'VIDEO',
    numFaces: 1
  })
}

export function trackFace(video: HTMLVideoElement, now: number): FaceState {
  if (!faceLandmarker) {
    return {
      x: 0,
      y: 0,
      z: 0,
      detected: false
    }
  }

  const result = faceLandmarker.detectForVideo(video, now)
  const landmarks = result.faceLandmarks[0]

  if (!landmarks || landmarks.length === 0) {
    return {
      x: 0,
      y: 0,
      z: 0,
      detected: false
    }
  }

  let minX = 1
  let maxX = 0
  let minY = 1
  let maxY = 0

  for (const point of landmarks) {
    if (point.x < minX) minX = point.x
    if (point.x > maxX) maxX = point.x
    if (point.y < minY) minY = point.y
    if (point.y > maxY) maxY = point.y
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const faceWidth = maxX - minX

  return {
    x: (centerX - 0.5) * 2,
    y: (centerY - 0.5) * 2,
    z: faceWidth,
    detected: true
  }
}