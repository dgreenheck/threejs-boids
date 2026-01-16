import * as THREE from 'three';
import { Boid } from './Boid';
import type { Prey } from './Prey';
import type { SwarmParams } from './Swarm';

export class Predator extends Boid {
  target: Prey | null = null;
  private attackVector = new THREE.Vector3();

  constructor(position: THREE.Vector3) {
    super(position);
  }

  update(
    params: SwarmParams,
    preyGrid: Prey[][],
    elapsedTime: number
  ): void {
    const velocityUpdate = new THREE.Vector3();

    const rows = preyGrid.length;
    const cols = preyGrid[0]?.length ?? 0;

    // If we have no target or killed the current one, acquire a new one
    if (
      this.target === null ||
      this.attackVector.lengthSq() < params.killRadius * params.killRadius
    ) {
      if (rows > 0 && cols > 0) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        this.target = preyGrid[row][col];
      }
    }

    if (this.target !== null) {
      this.attackVector.subVectors(this.target.position, this.position);
      velocityUpdate.add(this.attackVector);
    }

    // Boundary forces - push back when approaching edges
    const margin = 50;
    const bounds = params.boundarySize;

    if (this.position.x < margin) {
      velocityUpdate.x += params.boundaryForce * (margin - this.position.x);
    } else if (this.position.x > bounds - margin) {
      velocityUpdate.x -= params.boundaryForce * (this.position.x - (bounds - margin));
    }

    if (this.position.y < margin) {
      velocityUpdate.y += params.boundaryForce * (margin - this.position.y);
    } else if (this.position.y > bounds - margin) {
      velocityUpdate.y -= params.boundaryForce * (this.position.y - (bounds - margin));
    }

    if (this.position.z < margin) {
      velocityUpdate.z += params.boundaryForce * (margin - this.position.z);
    } else if (this.position.z > bounds - margin) {
      velocityUpdate.z -= params.boundaryForce * (this.position.z - (bounds - margin));
    }

    // Update velocity with acceleration
    velocityUpdate.multiplyScalar(
      params.predAcceleration * params.preyAcceleration * elapsedTime
    );
    this.velocity.add(velocityUpdate);

    // Clamp to max speed
    if (this.velocity.length() > params.predMaxSpeed) {
      this.velocity.normalize().multiplyScalar(params.predMaxSpeed);
    }

    // Update position
    this.position.addScaledVector(this.velocity, elapsedTime);
  }
}
