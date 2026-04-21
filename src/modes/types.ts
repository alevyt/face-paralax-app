import * as THREE from 'three'
import type { FaceState } from '../types'

export interface ParallaxMode {
  init(scene: THREE.Scene): void
  update(face: FaceState): void
  dispose(scene: THREE.Scene): void
}