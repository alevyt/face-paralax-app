import * as THREE from 'three'

function hasImageSize(
  image: unknown
): image is CanvasImageSource & { width: number; height: number } {
  return (
    typeof image === 'object' &&
    image !== null &&
    'width' in image &&
    'height' in image
  )
}

export function createBlurredTexture(
  texture: THREE.Texture,
  blurPx: number
): THREE.Texture {
  const image = texture.image

  if (!hasImageSize(image) || blurPx <= 0) {
    return texture
  }

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return texture
  }

  ctx.filter = `blur(${blurPx}px)`
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blurredTexture = new THREE.CanvasTexture(canvas)
  blurredTexture.colorSpace = THREE.SRGBColorSpace
  blurredTexture.needsUpdate = true

  return blurredTexture
}