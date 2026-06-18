import type {
  Wall,
  Source,
  Room,
  SimulationParams,
  SoundFieldHeatmap,
  SoundFieldGridPoint,
  Point3D,
} from '../../shared/types';
import { RayTracer } from './RayTracer';
import { vec3 } from '../../shared/geometry';

export class SoundFieldCalculator {
  private walls: Wall[];
  private sources: Source[];
  private params: SimulationParams;
  private gridResolution: number;

  constructor(
    walls: Wall[],
    sources: Source[],
    params: SimulationParams,
    gridResolution = 10
  ) {
    this.walls = walls;
    this.sources = sources;
    this.params = params;
    this.gridResolution = gridResolution;
  }

  public calculate(targetSurfaces: ('floor' | 'ceiling' | 'walls')[] = ['floor']): SoundFieldHeatmap[] {
    const heatmaps: SoundFieldHeatmap[] = [];
    const targetWalls = this.filterWalls(targetSurfaces);

    for (const wall of targetWalls) {
      const gridPoints = this.generateWallGrid(wall);
      const energies = this.calculateGridEnergies(gridPoints.map(p => p.position));

      let minEnergy = Infinity;
      let maxEnergy = -Infinity;

      const points: SoundFieldGridPoint[] = gridPoints.map((gp, i) => {
        const energy = energies[i];
        const db = energy > 0 ? 10 * Math.log10(energy) : -120;
        if (energy < minEnergy) minEnergy = energy;
        if (energy > maxEnergy) maxEnergy = energy;
        return {
          position: gp.position,
          energy,
          db,
          wallId: wall.id,
        };
      });

      const minDb = minEnergy > 0 ? 10 * Math.log10(minEnergy) : -120;
      const maxDb = maxEnergy > 0 ? 10 * Math.log10(maxEnergy) : -120;

      heatmaps.push({
        wallId: wall.id,
        gridSize: { u: this.gridResolution, v: this.gridResolution },
        points,
        minEnergy,
        maxEnergy,
        minDb,
        maxDb,
      });
    }

    return heatmaps;
  }

  private filterWalls(targetSurfaces: ('floor' | 'ceiling' | 'walls')[]): Wall[] {
    const result: Wall[] = [];

    for (const wall of this.walls) {
      const isFloor = wall.id.toLowerCase().includes('floor');
      const isCeiling = wall.id.toLowerCase().includes('ceiling');
      const isWall = !isFloor && !isCeiling;

      if (targetSurfaces.includes('floor') && isFloor) {
        result.push(wall);
      }
      if (targetSurfaces.includes('ceiling') && isCeiling) {
        result.push(wall);
      }
      if (targetSurfaces.includes('walls') && isWall) {
        result.push(wall);
      }
    }

    return result;
  }

  private generateWallGrid(wall: Wall): { position: Point3D; u: number; v: number }[] {
    const [v0, v1, v2, v3] = wall.vertices;
    const edgeU = vec3.sub(v1, v0);
    const edgeV = vec3.sub(v3, v0);
    const lenU = vec3.length(edgeU);
    const lenV = vec3.length(edgeV);
    const dirU = vec3.normalize(edgeU);
    const dirV = vec3.normalize(edgeV);

    const points: { position: Point3D; u: number; v: number }[] = [];
    const stepU = lenU / (this.gridResolution - 1);
    const stepV = lenV / (this.gridResolution - 1);
    const normalOffset = vec3.mul(wall.normal, 0.01);

    for (let i = 0; i < this.gridResolution; i++) {
      for (let j = 0; j < this.gridResolution; j++) {
        const u = i * stepU;
        const v = j * stepV;
        const basePos = vec3.add(
          v0,
          vec3.add(vec3.mul(dirU, u), vec3.mul(dirV, v))
        );
        points.push({
          position: vec3.add(basePos, normalOffset),
          u: i,
          v: j,
        });
      }
    }

    return points;
  }

  private calculateGridEnergies(points: Point3D[]): number[] {
    const energies: number[] = new Array(points.length).fill(0);
    const receiverRadius = 0.2;
    const receivers = points.map((p, i) => ({
      id: `grid-${i}`,
      position: p,
      radius: receiverRadius,
    }));

    const rayTracer = new RayTracer(
      this.walls,
      this.sources,
      receivers,
      {
        ...this.params,
        rayCount: Math.min(this.params.rayCount, 2000),
      }
    );

    const allRays = rayTracer.trace();

    for (const ray of allRays) {
      const match = ray.receiverId.match(/grid-(\d+)/);
      if (match) {
        const idx = parseInt(match[1]);
        if (idx >= 0 && idx < energies.length) {
          energies[idx] += ray.energy;
        }
      }
    }

    return energies;
  }
}

export function calculateRoomVolume(room: Room): number {
  const { width, height, depth } = room.dimensions;
  if (room.type === 'box') {
    return width * height * depth;
  } else {
    const lExtension = room.dimensions.lExtension || 4;
    const lWidth = room.dimensions.lWidth || 4;
    return width * height * depth + lExtension * height * lWidth;
  }
}
