import * as THREE from "three";
import GUI from "lil-gui";
import { Swarm } from "./Swarm";
import { FPSCamera } from "./FPSCamera";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.getElementById("app")!.appendChild(renderer.domElement);

// Camera
const fpsCamera = new FPSCamera(window.innerWidth / window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(100, 200, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;
directionalLight.shadow.camera.left = -500;
directionalLight.shadow.camera.right = 500;
directionalLight.shadow.camera.top = 500;
directionalLight.shadow.camera.bottom = -500;
scene.add(directionalLight);

// Swarm
const swarm = new Swarm(scene);

// GUI
const gui = new GUI({ title: "Swarm Controls" });

// Stats display
const stats = {
  preyCount: swarm.getPreyCount(),
  fps: 0,
};

const statsFolder = gui.addFolder("Stats");
statsFolder.add(stats, "preyCount").name("Prey Count").listen().disable();
statsFolder.add(stats, "fps").name("FPS").listen().disable();

// Prey settings
const preyFolder = gui.addFolder("Prey");

const preyGridControls = {
  addRow: () => swarm.addPreyRow(),
  removeRow: () => swarm.removePreyRow(),
  addColumn: () => swarm.addPreyColumn(),
  removeColumn: () => swarm.removePreyColumn(),
};

preyFolder.add(preyGridControls, "addRow").name("Add Row");
preyFolder.add(preyGridControls, "removeRow").name("Remove Row");
preyFolder.add(preyGridControls, "addColumn").name("Add Column");
preyFolder.add(preyGridControls, "removeColumn").name("Remove Column");
preyFolder.add(swarm.params, "preySize", 0.1, 5, 0.01).name("Size");
preyFolder.add(swarm.params, "preySpacing", 1, 20, 0.05).name("Spacing");
preyFolder
  .add(swarm.params, "preyAcceleration", 0.01, 2, 0.01)
  .name("Acceleration");
preyFolder.add(swarm.params, "preyMaxSpeed", 10, 200, 0.5).name("Max Speed");

// Swarm behavior
const behaviorFolder = gui.addFolder("Swarm Behavior");
behaviorFolder
  .add(swarm.params, "attractForce", 0, 200, 0.1)
  .name("Attract Force");
behaviorFolder
  .add(swarm.params, "repelForce", -200, 0, 0.1)
  .name("Repel Force");
behaviorFolder
  .add(swarm.params, "fearForce", -1000000, 0, 100)
  .name("Fear Force");
behaviorFolder
  .add(swarm.params, "fearRadius", 10, 200, 0.5)
  .name("Fear Radius");
behaviorFolder.add(swarm.params, "killRadius", 1, 50, 0.1).name("Kill Radius");

// Predator settings
const predatorFolder = gui.addFolder("Predators");

const predatorControls = {
  addPredator: () => swarm.addPredator(),
  removePredator: () => swarm.removePredator(),
};

predatorFolder.add(predatorControls, "addPredator").name("Add Predator");
predatorFolder.add(predatorControls, "removePredator").name("Remove Predator");
predatorFolder.add(swarm.params, "predSize", 0.1, 10, 0.01).name("Size");
predatorFolder
  .add(swarm.params, "predAcceleration", 0.01, 10, 0.01)
  .name("Acceleration");
predatorFolder
  .add(swarm.params, "predMaxSpeed", 50, 500, 0.5)
  .name("Max Speed");

// Animation
const clock = new THREE.Clock();
let frameCount = 0;
let lastFPSUpdate = 0;

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // FPS calculation
  frameCount++;
  if (elapsedTime - lastFPSUpdate > 0.5) {
    stats.fps = Math.round(frameCount / (elapsedTime - lastFPSUpdate));
    frameCount = 0;
    lastFPSUpdate = elapsedTime;
  }

  // Update stats
  stats.preyCount = swarm.getPreyCount();

  // Update camera
  fpsCamera.update();

  // Update swarm
  swarm.update(deltaTime);

  // Render
  renderer.render(scene, fpsCamera.camera);
}

// Handle resize
window.addEventListener("resize", () => {
  fpsCamera.setAspect(window.innerWidth / window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
