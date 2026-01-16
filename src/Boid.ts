import * as THREE from 'three';

export abstract class Boid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;

  constructor(position: THREE.Vector3 = new THREE.Vector3()) {
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
  }
}
