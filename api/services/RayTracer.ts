import type {
  Point3D,
  Wall,
  Source,
  Receiver,
  RayPath,
  ReflectionType,
  SimulationParams,
} from '../../shared/types';
import {
  vec3,
  rayWallIntersect,
  raySphereIntersect,
  generateSphericalDirections,
  generateId,
} from '../../shared/geometry';

interface TraceResult {
  rays: RayPath[];
  totalDistance: number;
  reflectionCount: number;
}

export class RayTracer {
  private walls: Wall[];
  private sources: Source[];
  private receivers: Receiver[];
  private params: SimulationParams;

  constructor(
    walls: Wall[],
    sources: Source[],
    receivers: Receiver[],
    params: SimulationParams
  ) {
    this.walls = walls;
    this.sources = sources;
    this.receivers = receivers;
    this.params = params;
  }

  public trace(): RayPath[] {
    const allRays: RayPath[] = [];
    const directions = generateSphericalDirections(this.params.rayCount);

    for (const source of this.sources) {
      for (const direction of directions) {
        const result = this.traceSingleRay(
          source.position,
          direction,
          source.id,
          source.power
        );
        if (result) {
          allRays.push(...result.rays);
        }
      }
    }

    return allRays;
  }

  private traceSingleRay(
    origin: Point3D,
    direction: Point3D,
    sourceId: string,
    initialPower: number
  ): { rays: RayPath[] } | null {
    const effectiveRays: RayPath[] = [];
    const EPSILON_ORIGIN = 1e-3;
    let currentOrigin = { ...origin };
    let currentDir = vec3.normalize({ ...direction });
    let currentEnergy = this.powerToEnergy(initialPower);
    let totalDistance = 0;
    const pathPoints: Point3D[] = [{ ...origin }];
    const reflectionTypes: ReflectionType[] = [];
    const hitMaterials: { reflection: number }[] = [];
    let lastHitWallId: string | null = null;

    for (let reflection = 0; reflection <= this.params.maxReflections; reflection++) {
      const receiverHit = this.checkReceiverIntersection(currentOrigin, currentDir, totalDistance);

      if (receiverHit) {
        const hitPoint = vec3.add(
          currentOrigin,
          vec3.mul(currentDir, receiverHit.t)
        );
        pathPoints.push(hitPoint);

        const totalPathDistance = totalDistance + receiverHit.t;
        const timeDelay = (totalPathDistance / this.params.soundSpeed) * 1000;

        const finalEnergy = this.calculateEnergy(
          currentEnergy,
          totalPathDistance,
          hitMaterials
        );

        if (finalEnergy > 1e-12) {
          effectiveRays.push({
            id: generateId(),
            sourceId,
            receiverId: receiverHit.receiverId,
            points: [...pathPoints],
            reflectionCount: reflection,
            timeDelay,
            energy: finalEnergy,
            reflectionTypes: [...reflectionTypes],
          });
        }
      }

      if (reflection >= this.params.maxReflections) {
        break;
      }

      const wallHit = this.findNearestWall(currentOrigin, currentDir, lastHitWallId);
      if (!wallHit) {
        break;
      }

      pathPoints.push(wallHit.point);
      totalDistance += wallHit.t;
      hitMaterials.push(wallHit.wall.material);
      lastHitWallId = wallHit.wall.id;

      const reflectionType: ReflectionType =
        Math.random() < wallHit.wall.material.diffusion ? 'diffuse' : 'specular';
      reflectionTypes.push(reflectionType);

      currentDir = this.calculateReflectionDirection(
        currentDir,
        wallHit.wall.normal,
        reflectionType
      );

      currentOrigin = vec3.add(
        wallHit.point,
        vec3.mul(currentDir, EPSILON_ORIGIN)
      );

      currentEnergy *= wallHit.wall.material.reflection;

      if (currentEnergy < 1e-15) {
        break;
      }
    }

    return effectiveRays.length > 0 ? { rays: effectiveRays } : null;
  }

  private checkReceiverIntersection(
    origin: Point3D,
    dir: Point3D,
    currentDistance: number
  ): { t: number; receiverId: string } | null {
    let nearestHit: { t: number; receiverId: string } | null = null;
    let minT = Infinity;

    for (const receiver of this.receivers) {
      const t = raySphereIntersect(origin, dir, receiver.position, receiver.radius);
      if (t !== null && t > 1e-4 && t < minT) {
        const wallT = this.findNearestWallDistance(origin, dir);
        if (wallT === null || t < wallT) {
          minT = t;
          nearestHit = { t, receiverId: receiver.id };
        }
      }
    }

    return nearestHit;
  }

  private findNearestWall(
    origin: Point3D,
    dir: Point3D,
    excludeWallId: string | null = null
  ): { t: number; point: Point3D; wall: Wall } | null {
    let nearest: { t: number; point: Point3D; wall: Wall } | null = null;
    let minT = Infinity;
    const SELF_INTERSECT_EPSILON = 1e-2;
    const MIN_HIT_DISTANCE = 1e-3;

    for (const wall of this.walls) {
      if (excludeWallId && wall.id === excludeWallId) {
        continue;
      }

      const v0 = wall.vertices[0];
      const distToPlane = Math.abs(
        (origin.x - v0.x) * wall.normal.x +
        (origin.y - v0.y) * wall.normal.y +
        (origin.z - v0.z) * wall.normal.z
      );
      if (distToPlane < SELF_INTERSECT_EPSILON) {
        continue;
      }

      const hit = rayWallIntersect(origin, dir, wall);
      if (hit && hit.t > MIN_HIT_DISTANCE && hit.t < minT) {
        minT = hit.t;
        nearest = { t: hit.t, point: hit.point, wall };
      }
    }

    return nearest;
  }

  private findNearestWallDistance(origin: Point3D, dir: Point3D): number | null {
    const hit = this.findNearestWall(origin, dir);
    return hit ? hit.t : null;
  }

  private calculateReflectionDirection(
    incoming: Point3D,
    normal: Point3D,
    type: ReflectionType
  ): Point3D {
    if (type === 'specular') {
      return this.specularReflect(incoming, normal);
    } else {
      return this.diffuseReflect(normal);
    }
  }

  private specularReflect(incoming: Point3D, normal: Point3D): Point3D {
    const dot = vec3.dot(incoming, normal);
    return vec3.normalize({
      x: incoming.x - 2 * dot * normal.x,
      y: incoming.y - 2 * dot * normal.y,
      z: incoming.z - 2 * dot * normal.z,
    });
  }

  private diffuseReflect(normal: Point3D): Point3D {
    let direction: Point3D;
    do {
      direction = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
      };
    } while (vec3.length(direction) > 1);

    direction = vec3.normalize(direction);

    if (vec3.dot(direction, normal) < 0) {
      direction = vec3.negate(direction);
    }

    const mixFactor = 0.7;
    return vec3.normalize({
      x: direction.x * mixFactor + normal.x * (1 - mixFactor),
      y: direction.y * mixFactor + normal.y * (1 - mixFactor),
      z: direction.z * mixFactor + normal.z * (1 - mixFactor),
    });
  }

  private powerToEnergy(powerDb: number): number {
    return Math.pow(10, powerDb / 10);
  }

  private calculateEnergy(
    initialEnergy: number,
    totalDistance: number,
    materials: { reflection: number }[]
  ): number {
    const distanceAttenuation = 1 / Math.max(totalDistance * totalDistance, 1);
    let reflectionAttenuation = 1;
    for (const mat of materials) {
      reflectionAttenuation *= mat.reflection;
    }
    return initialEnergy * distanceAttenuation * reflectionAttenuation;
  }
}
