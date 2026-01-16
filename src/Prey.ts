import * as THREE from 'three';
import { Boid } from './Boid';
import type { Predator } from './Predator';
import type { SwarmParams } from './Swarm';

export class Prey extends Boid {
  neighbors: Prey[] = [];
  fearMagnitude: number = 0;

  constructor(position: THREE.Vector3) {
    super(position);
  }

  update(params: SwarmParams, predators: Predator[], elapsedTime: number): void {
    const velocityUpdate = new THREE.Vector3();
    const tempVec = new THREE.Vector3();

    // Calculate attraction and avoidance for neighbors
    for (const neighbor of this.neighbors) {
      tempVec.subVectors(neighbor.position, this.position);
      const distSq = tempVec.lengthSq();

      if (distSq >= params.preySpacing * params.preySpacing) {
        // Too far away - attract
        velocityUpdate.addScaledVector(tempVec, params.attractForce);
      } else {
        // Too close - repel
        velocityUpdate.addScaledVector(tempVec, params.repelForce);
      }
    }

    // Avoid predators
    let totalFearForce = 0;
    for (const predator of predators) {
      tempVec.subVectors(predator.position, this.position);
      const distSq = tempVec.lengthSq();

      if (distSq < params.fearRadius * params.fearRadius && distSq > 0.001) {
        // Normalize and apply fear force (inversely proportional to distance)
        tempVec.normalize();
        velocityUpdate.addScaledVector(tempVec, params.fearForce);
        totalFearForce += Math.abs(params.fearForce) / Math.sqrt(distSq);
      }
    }
    this.fearMagnitude = totalFearForce;

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

    // Update velocity
    this.velocity.addScaledVector(velocityUpdate, params.preyAcceleration * elapsedTime);

    // Clamp to max speed
    const speedSq = this.velocity.lengthSq();
    if (speedSq > params.preyMaxSpeed * params.preyMaxSpeed) {
      this.velocity.normalize().multiplyScalar(params.preyMaxSpeed);
    }

    // Update position
    this.position.addScaledVector(this.velocity, elapsedTime);
  }
}
