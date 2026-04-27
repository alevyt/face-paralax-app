import "./style.css";
import { setupCamera } from "./camera";
import { createTracker, trackFace } from "./tracker";
import { ParallaxScene } from "./scene";
import { createFallbackTextures, loadImageTextures } from "./textures";
import { ImageParallaxMode } from "./modes/image-parallax-mode";
import { WebcamParallaxMode } from "./modes/webcam-parallax-mode";

type ModeName = "image" | "webcam";

async function bootstrap() {
  const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement

  const canvasContainer = document.createElement("div");
  canvasContainer.className = "canvas-container";

  const ui = document.createElement("div");
  ui.className = "ui-layer";

  const controls = document.createElement("div");
  controls.className = "controls";

  const status = document.createElement("p");
  status.className = "debug-only";
  status.textContent = "Initializing...";

  const modeButton = document.createElement("button");
  modeButton.textContent = "Switch mode";

  const debugButton = document.createElement("button");
  debugButton.textContent = "Debug: off";

  const modeLabel = document.createElement("p");
  modeLabel.className = "debug-only";
  modeLabel.textContent = "Mode: image";

  const debug = document.createElement("pre");
  debug.className = "debug-only";
  debug.textContent = "Waiting for tracker...";

  controls.append(modeButton, debugButton);
  ui.append(controls, status, modeLabel, debug);
  app.append(canvasContainer, ui);

  try {
    const video = await setupCamera();
    video.className = "camera-preview debug-only";
    ui.append(video);

    status.textContent = "Initializing face tracker...";
    await createTracker();

    status.textContent = "Loading textures...";
    let textures = createFallbackTextures();

    try {
      textures = await loadImageTextures();
      status.textContent = "Using PNG layers";
    } catch (error) {
      console.warn(
        "Failed to load PNG textures, using fallback textures",
        error,
      );
      status.textContent = "PNG layers not found, using fallback textures";
    }

    const scene = new ParallaxScene(canvasContainer);

    let currentMode: ModeName = "image";

    let debugEnabled = false;

    function updateDebugVisibility() {
      app.classList.toggle("debug-enabled", debugEnabled);
      debugButton.textContent = debugEnabled ? "Debug: on" : "Debug: off";
    }

    debugButton.addEventListener("click", () => {
      debugEnabled = !debugEnabled;
      updateDebugVisibility();
    });

    updateDebugVisibility();

    const imageMode = new ImageParallaxMode(textures, scene["camera"]);
    const webcamMode = new WebcamParallaxMode(video);

    function applyMode(mode: ModeName) {
      currentMode = mode;
      modeLabel.textContent = `Mode: ${mode}`;

      if (mode === "image") {
        scene.setMode(imageMode);
      } else {
        scene.setMode(webcamMode);
      }
    }

    modeButton.addEventListener("click", () => {
      applyMode(currentMode === "image" ? "webcam" : "image");
    });

    applyMode(currentMode);

    function loop() {
      const face = trackFace(video, performance.now());

      scene.update(face);
      scene.render();

      debug.textContent = JSON.stringify(
        {
          mode: currentMode,
          detected: face.detected,
          x: Number(face.x.toFixed(2)),
          y: Number(face.y.toFixed(2)),
          z: Number(face.z.toFixed(3)),
        },
        null,
        2,
      );

      requestAnimationFrame(loop);
    }

    status.textContent = "Running";
    loop();
  } catch (error) {
    status.textContent = "Failed to initialize";
    console.error(error);
  }
}

bootstrap();
