import * as THREE from 'three';

export class FPSCamera {
  camera: THREE.PerspectiveCamera;

  private elevation = -0.3;
  private direction = 0;
  private position: THREE.Vector3;

  private keys: Record<string, boolean> = {};
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  private xSensitivity = 0.005;
  private ySensitivity = 0.005;
  private speed = 5;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);
    this.position = new THREE.Vector3(500, 700, 1200);
    this.camera.position.copy(this.position);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !(e.target as HTMLElement).closest('.lil-gui')) {
        this.isDragging = true;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isDragging = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const xDif = this.prevMouseX - e.clientX;
        const yDif = this.prevMouseY - e.clientY;

        this.elevation += this.ySensitivity * yDif;

        // Clamp elevation to prevent camera flip
        const maxElev = Math.PI / 2 - 0.05;
        this.elevation = Math.max(-maxElev, Math.min(maxElev, this.elevation));

        this.direction += this.xSensitivity * xDif;

        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });
  }

  update(): void {
    // Create rotation matrix
    const rotateMatrix = new THREE.Matrix4();
    rotateMatrix.makeRotationX(this.elevation);
    rotateMatrix.premultiply(new THREE.Matrix4().makeRotationY(this.direction));

    // Handle keyboard movement
    const forward = new THREE.Vector3(0, 0, -1).applyMatrix4(rotateMatrix);
    const right = new THREE.Vector3(1, 0, 0).applyMatrix4(rotateMatrix);

    if (this.keys['w']) {
      this.position.addScaledVector(forward, this.speed);
    }
    if (this.keys['s']) {
      this.position.addScaledVector(forward, -this.speed);
    }
    if (this.keys['a']) {
      this.position.addScaledVector(right, -this.speed);
    }
    if (this.keys['d']) {
      this.position.addScaledVector(right, this.speed);
    }

    // Update camera position
    this.camera.position.copy(this.position);

    // Update camera target
    const target = this.position.clone().add(forward);
    this.camera.lookAt(target);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
