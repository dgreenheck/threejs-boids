import * as THREE from "three";
import { Prey } from "./Prey";
import { Predator } from "./Predator";

export interface SwarmParams {
  preyRows: number;
  preyCols: number;
  preySpacing: number;
  preyAcceleration: number;
  preyMaxSpeed: number;
  preySize: number;
  predCount: number;
  predAcceleration: number;
  predMaxSpeed: number;
  predSize: number;
  attractForce: number;
  repelForce: number;
  fearForce: number;
  fearRadius: number;
  killRadius: number;
  boundarySize: number;
  boundaryForce: number;
}

const PREDATOR_COLOR = 0xff4444;

export class Swarm {
  params: SwarmParams;
  preyGrid: Prey[][] = [];
  predators: Predator[] = [];

  private preyMesh: THREE.InstancedMesh | null = null;
  private predatorMesh: THREE.InstancedMesh | null = null;
  private scene: THREE.Scene;
  private tempMatrix = new THREE.Matrix4();
  private tempColor = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Default parameters matching original XNA values
    this.params = {
      preyRows: 100,
      preyCols: 100,
      preySpacing: 8,
      preyAcceleration: 0.75,
      preyMaxSpeed: 70,
      preySize: 1.5,
      predCount: 2,
      predAcceleration: 3,
      predMaxSpeed: 300,
      predSize: 3,
      attractForce: 60,
      repelForce: -80,
      fearForce: -500000,
      fearRadius: 80,
      killRadius: 10,
      boundarySize: 1000,
      boundaryForce: 100,
    };

    this.initialize();
  }

  initialize(): void {
    this.initializePrey();
    this.initializePredators();
    this.createMeshes();
  }

  private initializePrey(): void {
    this.preyGrid = [];

    const noiseAmount = this.params.preySpacing * 0.5;
    const centerOffset = (this.params.boundarySize - this.params.preyRows * this.params.preySpacing) / 2;

    for (let i = 0; i < this.params.preyRows; i++) {
      const row: Prey[] = [];
      for (let j = 0; j < this.params.preyCols; j++) {
        const prey = new Prey(
          new THREE.Vector3(
            centerOffset + i * this.params.preySpacing + (Math.random() - 0.5) * noiseAmount,
            this.params.boundarySize / 2 + (Math.random() - 0.5) * noiseAmount,
            centerOffset + j * this.params.preySpacing + (Math.random() - 0.5) * noiseAmount
          )
        );
        // Add random initial velocity
        prey.velocity.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        row.push(prey);
      }
      this.preyGrid.push(row);
    }

    // Set up neighbor connections
    for (let row = 0; row < this.params.preyRows; row++) {
      for (let col = 0; col < this.params.preyCols; col++) {
        this.setupNeighbors(row, col);
      }
    }
  }

  private setupNeighbors(row: number, col: number): void {
    const prey = this.preyGrid[row][col];
    prey.neighbors = [];

    const rows = this.preyGrid.length;
    const cols = this.preyGrid[0]?.length ?? 0;

    // North
    if (row < rows - 1) {
      prey.neighbors.push(this.preyGrid[row + 1][col]);
    }
    // South
    if (row > 0) {
      prey.neighbors.push(this.preyGrid[row - 1][col]);
    }
    // West
    if (col > 0) {
      prey.neighbors.push(this.preyGrid[row][col - 1]);
      // Southwest
      if (row > 0) {
        prey.neighbors.push(this.preyGrid[row - 1][col - 1]);
      }
      // Northwest
      if (row < rows - 1) {
        prey.neighbors.push(this.preyGrid[row + 1][col - 1]);
      }
    }
    // East
    if (col < cols - 1) {
      prey.neighbors.push(this.preyGrid[row][col + 1]);
      // Southeast
      if (row > 0) {
        prey.neighbors.push(this.preyGrid[row - 1][col + 1]);
      }
      // Northeast
      if (row < rows - 1) {
        prey.neighbors.push(this.preyGrid[row + 1][col + 1]);
      }
    }
  }

  private initializePredators(): void {
    this.predators = [];
    const bounds = this.params.boundarySize;
    for (let i = 0; i < this.params.predCount; i++) {
      this.predators.push(
        new Predator(
          new THREE.Vector3(
            Math.random() * bounds,
            Math.random() * bounds,
            Math.random() * bounds
          )
        )
      );
    }
  }

  private createMeshes(): void {
    // Remove old meshes
    if (this.preyMesh) {
      this.scene.remove(this.preyMesh);
      this.preyMesh.geometry.dispose();
      (this.preyMesh.material as THREE.Material).dispose();
    }
    if (this.predatorMesh) {
      this.scene.remove(this.predatorMesh);
      this.predatorMesh.geometry.dispose();
      (this.predatorMesh.material as THREE.Material).dispose();
    }

    const sphereGeom = new THREE.SphereGeometry(1, 8, 6);

    // Prey mesh
    const preyCount = this.params.preyRows * this.params.preyCols;
    const preyMaterial = new THREE.MeshStandardMaterial();
    this.preyMesh = new THREE.InstancedMesh(
      sphereGeom,
      preyMaterial,
      preyCount
    );
    this.preyMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(preyCount * 3),
      3
    );
    this.preyMesh.castShadow = true;
    this.preyMesh.receiveShadow = true;
    this.preyMesh.frustumCulled = false;
    this.scene.add(this.preyMesh);

    // Predator mesh
    const predMaterial = new THREE.MeshStandardMaterial({
      color: PREDATOR_COLOR,
    });
    this.predatorMesh = new THREE.InstancedMesh(
      sphereGeom.clone(),
      predMaterial,
      Math.max(this.params.predCount, 1)
    );
    this.predatorMesh.castShadow = true;
    this.predatorMesh.receiveShadow = true;
    this.predatorMesh.frustumCulled = false;
    this.scene.add(this.predatorMesh);
  }

  update(deltaTime: number): void {
    // Update prey
    for (const row of this.preyGrid) {
      for (const prey of row) {
        prey.update(this.params, this.predators, deltaTime);
      }
    }

    // Update predators
    for (const predator of this.predators) {
      predator.update(this.params, this.preyGrid, deltaTime);
    }

    // Update instance matrices and colors for prey
    if (this.preyMesh) {
      let index = 0;
      for (const row of this.preyGrid) {
        for (const prey of row) {
          this.tempMatrix.makeScale(
            this.params.preySize,
            this.params.preySize,
            this.params.preySize
          );
          this.tempMatrix.setPosition(prey.position);
          this.preyMesh.setMatrixAt(index, this.tempMatrix);

          // Color based on velocity: X=green, Y=blue, Z=red
          const speed = prey.velocity.length();
          if (speed > 0.001) {
            const r = Math.abs(prey.velocity.z) / speed;
            const g = Math.abs(prey.velocity.x) / speed;
            const b = Math.abs(prey.velocity.y) / speed;
            // Normalize to max component to keep colors bright
            const maxComponent = Math.max(r, g, b, 0.001);
            this.tempColor.setRGB(r / maxComponent, g / maxComponent, b / maxComponent);
          } else {
            this.tempColor.setRGB(0.5, 0.5, 0.5);
          }
          this.preyMesh.setColorAt(index, this.tempColor);

          index++;
        }
      }
      this.preyMesh.instanceMatrix.needsUpdate = true;
      if (this.preyMesh.instanceColor) {
        this.preyMesh.instanceColor.needsUpdate = true;
      }
    }

    // Update instance matrices for predators
    if (this.predatorMesh) {
      for (let i = 0; i < this.predators.length; i++) {
        this.tempMatrix.makeScale(
          this.params.predSize,
          this.params.predSize,
          this.params.predSize
        );
        this.tempMatrix.setPosition(this.predators[i].position);
        this.predatorMesh.setMatrixAt(i, this.tempMatrix);
      }
      this.predatorMesh.instanceMatrix.needsUpdate = true;
    }
  }

  // Methods to modify prey grid
  addPreyRow(): void {
    const newRow: Prey[] = [];
    const cols = this.preyGrid[0]?.length ?? this.params.preyCols;

    for (let j = 0; j < cols; j++) {
      newRow.push(new Prey(new THREE.Vector3()));
    }
    this.preyGrid.push(newRow);
    this.params.preyRows = this.preyGrid.length;

    // Setup neighbors for new row and previous row
    const lastRowIdx = this.preyGrid.length - 1;
    for (let j = 0; j < cols; j++) {
      this.setupNeighbors(lastRowIdx, j);
      if (lastRowIdx > 0) {
        this.setupNeighbors(lastRowIdx - 1, j);
      }
    }

    this.createMeshes();
  }

  removePreyRow(): void {
    if (this.preyGrid.length > 1) {
      this.preyGrid.pop();
      this.params.preyRows = this.preyGrid.length;

      // Reinitialize neighbors for the new last row
      const lastRowIdx = this.preyGrid.length - 1;
      const cols = this.preyGrid[0]?.length ?? 0;
      for (let j = 0; j < cols; j++) {
        this.setupNeighbors(lastRowIdx, j);
      }

      this.createMeshes();
    }
  }

  addPreyColumn(): void {
    for (let i = 0; i < this.preyGrid.length; i++) {
      this.preyGrid[i].push(new Prey(new THREE.Vector3()));
    }
    this.params.preyCols = this.preyGrid[0]?.length ?? 0;

    // Setup neighbors for new column and previous column
    const lastColIdx = this.params.preyCols - 1;
    for (let i = 0; i < this.preyGrid.length; i++) {
      this.setupNeighbors(i, lastColIdx);
      if (lastColIdx > 0) {
        this.setupNeighbors(i, lastColIdx - 1);
      }
    }

    this.createMeshes();
  }

  removePreyColumn(): void {
    const cols = this.preyGrid[0]?.length ?? 0;
    if (cols > 1) {
      for (const row of this.preyGrid) {
        row.pop();
      }
      this.params.preyCols = this.preyGrid[0]?.length ?? 0;

      // Reinitialize neighbors for the new last column
      const lastColIdx = this.params.preyCols - 1;
      for (let i = 0; i < this.preyGrid.length; i++) {
        this.setupNeighbors(i, lastColIdx);
      }

      this.createMeshes();
    }
  }

  addPredator(): void {
    const bounds = this.params.boundarySize;
    this.predators.push(
      new Predator(
        new THREE.Vector3(
          Math.random() * bounds,
          Math.random() * bounds,
          Math.random() * bounds
        )
      )
    );
    this.params.predCount = this.predators.length;
    this.createMeshes();
  }

  removePredator(): void {
    if (this.predators.length > 0) {
      this.predators.pop();
      this.params.predCount = this.predators.length;
      this.createMeshes();
    }
  }

  getPreyCount(): number {
    return this.params.preyRows * this.params.preyCols;
  }
}
