import * as THREE from 'three'

function hasImageSize(
  image: unknown
): image is { width: number; height: number } {
  return (
    typeof image === 'object' &&
    image !== null &&
    'width' in image &&
    'height' in image &&
    typeof (image as { width: unknown }).width === 'number' &&
    typeof (image as { height: unknown }).height === 'number'
  )
}

export function fitPlaneToView(
  mesh: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  distance: number,
  texture: THREE.Texture
) {
  const vFov = (camera.fov * Math.PI) / 180
  const viewHeight = 2 * Math.tan(vFov / 2) * distance
  const viewWidth = viewHeight * camera.aspect

  const image = texture.image

  if (!hasImageSize(image)) {
    mesh.scale.set(viewWidth, viewHeight, 1)
    return
  }

  const imageAspect = image.width / image.height
  const viewAspect = viewWidth / viewHeight

  let width: number
  let height: number

  if (imageAspect > viewAspect) {
    height = viewHeight
    width = height * imageAspect
  } else {
    width = viewWidth
    height = width / imageAspect
  }

  mesh.scale.set(width, height, 1)
}