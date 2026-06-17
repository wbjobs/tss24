import type { Point3D, Wall, Room, RoomDimensions } from './types';
import { DEFAULT_MATERIAL } from './materials';

export const vec3 = {
  add: (a: Point3D, b: Point3D): Point3D => ({
    x: a.x + b.x, y: a.y + b.y, z: a.z + b.z,
  }),
  sub: (a: Point3D, b: Point3D): Point3D => ({
    x: a.x - b.x, y: a.y - b.y, z: a.z - b.z,
  }),
  mul: (v: Point3D, s: number): Point3D => ({
    x: v.x * s, y: v.y * s, z: v.z * s,
  }),
  dot: (a: Point3D, b: Point3D): number => a.x * b.x + a.y * b.y + a.z * b.z,
  cross: (a: Point3D, b: Point3D): Point3D => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }),
  length: (v: Point3D): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  normalize: (v: Point3D): Point3D => {
    const len = vec3.length(v);
    return len > 0 ? vec3.mul(v, 1 / len) : { x: 0, y: 0, z: 0 };
  },
  distance: (a: Point3D, b: Point3D): number => vec3.length(vec3.sub(a, b)),
  negate: (v: Point3D): Point3D => ({ x: -v.x, y: -v.y, z: -v.z }),
};

export const createWall = (
  id: string,
  v0: Point3D,
  v1: Point3D,
  v2: Point3D,
  v3: Point3D
): Wall => {
  const edge1 = vec3.sub(v1, v0);
  const edge2 = vec3.sub(v2, v0);
  const normal = vec3.normalize(vec3.cross(edge1, edge2));

  return {
    id,
    vertices: [v0, v1, v2, v3],
    normal,
    material: { ...DEFAULT_MATERIAL },
  };
};

export const generateBoxRoom = (dimensions: RoomDimensions): Wall[] => {
  const { width, height, depth } = dimensions;
  const hx = width / 2;
  const hy = height / 2;
  const hz = depth / 2;

  const walls: Wall[] = [];

  walls.push(createWall('floor',
    { x: -hx, y: -hy, z: -hz },
    { x: hx, y: -hy, z: -hz },
    { x: hx, y: -hy, z: hz },
    { x: -hx, y: -hy, z: hz }
  ));

  walls.push(createWall('ceiling',
    { x: -hx, y: hy, z: hz },
    { x: hx, y: hy, z: hz },
    { x: hx, y: hy, z: -hz },
    { x: -hx, y: hy, z: -hz }
  ));

  walls.push(createWall('back',
    { x: -hx, y: -hy, z: -hz },
    { x: -hx, y: hy, z: -hz },
    { x: hx, y: hy, z: -hz },
    { x: hx, y: -hy, z: -hz }
  ));

  walls.push(createWall('front',
    { x: hx, y: -hy, z: hz },
    { x: hx, y: hy, z: hz },
    { x: -hx, y: hy, z: hz },
    { x: -hx, y: -hy, z: hz }
  ));

  walls.push(createWall('left',
    { x: -hx, y: -hy, z: hz },
    { x: -hx, y: hy, z: hz },
    { x: -hx, y: hy, z: -hz },
    { x: -hx, y: -hy, z: -hz }
  ));

  walls.push(createWall('right',
    { x: hx, y: -hy, z: -hz },
    { x: hx, y: hy, z: -hz },
    { x: hx, y: hy, z: hz },
    { x: hx, y: -hy, z: hz }
  ));

  return walls;
};

export const generateLShapeRoom = (dimensions: RoomDimensions): Wall[] => {
  const { width, height, depth, lExtension = 4, lWidth = 4 } = dimensions;
  const hy = height / 2;

  const walls: Wall[] = [];

  walls.push(createWall('floor-main',
    { x: -width / 2, y: -hy, z: -depth / 2 },
    { x: width / 2, y: -hy, z: -depth / 2 },
    { x: width / 2, y: -hy, z: depth / 2 },
    { x: -width / 2, y: -hy, z: depth / 2 }
  ));

  walls.push(createWall('floor-extension',
    { x: width / 2, y: -hy, z: -lExtension },
    { x: width / 2 + lWidth, y: -hy, z: -lExtension },
    { x: width / 2 + lWidth, y: -hy, z: depth / 2 },
    { x: width / 2, y: -hy, z: depth / 2 }
  ));

  walls.push(createWall('ceiling-main',
    { x: -width / 2, y: hy, z: depth / 2 },
    { x: width / 2, y: hy, z: depth / 2 },
    { x: width / 2, y: hy, z: -depth / 2 },
    { x: -width / 2, y: hy, z: -depth / 2 }
  ));

  walls.push(createWall('ceiling-extension',
    { x: width / 2, y: hy, z: depth / 2 },
    { x: width / 2 + lWidth, y: hy, z: depth / 2 },
    { x: width / 2 + lWidth, y: hy, z: -lExtension },
    { x: width / 2, y: hy, z: -lExtension }
  ));

  walls.push(createWall('back',
    { x: -width / 2, y: -hy, z: -depth / 2 },
    { x: -width / 2, y: hy, z: -depth / 2 },
    { x: width / 2, y: hy, z: -depth / 2 },
    { x: width / 2, y: -hy, z: -depth / 2 }
  ));

  walls.push(createWall('front-left',
    { x: -width / 2, y: -hy, z: depth / 2 },
    { x: -width / 2, y: hy, z: depth / 2 },
    { x: width / 2, y: hy, z: depth / 2 },
    { x: width / 2, y: -hy, z: depth / 2 }
  ));

  walls.push(createWall('front-right',
    { x: width / 2, y: -hy, z: depth / 2 },
    { x: width / 2, y: hy, z: depth / 2 },
    { x: width / 2 + lWidth, y: hy, z: depth / 2 },
    { x: width / 2 + lWidth, y: -hy, z: depth / 2 }
  ));

  walls.push(createWall('left',
    { x: -width / 2, y: -hy, z: depth / 2 },
    { x: -width / 2, y: hy, z: depth / 2 },
    { x: -width / 2, y: hy, z: -depth / 2 },
    { x: -width / 2, y: -hy, z: -depth / 2 }
  ));

  walls.push(createWall('right-outer',
    { x: width / 2 + lWidth, y: -hy, z: depth / 2 },
    { x: width / 2 + lWidth, y: hy, z: depth / 2 },
    { x: width / 2 + lWidth, y: hy, z: -lExtension },
    { x: width / 2 + lWidth, y: -hy, z: -lExtension }
  ));

  walls.push(createWall('right-inner',
    { x: width / 2, y: -hy, z: -lExtension },
    { x: width / 2, y: hy, z: -lExtension },
    { x: width / 2, y: hy, z: -depth / 2 },
    { x: width / 2, y: -hy, z: -depth / 2 }
  ));

  walls.push(createWall('extension-back',
    { x: width / 2, y: -hy, z: -lExtension },
    { x: width / 2, y: hy, z: -lExtension },
    { x: width / 2 + lWidth, y: hy, z: -lExtension },
    { x: width / 2 + lWidth, y: -hy, z: -lExtension }
  ));

  return walls;
};

export const generateRoom = (type: 'box' | 'l-shape', dimensions: RoomDimensions): Room => {
  const walls = type === 'box' ? generateBoxRoom(dimensions) : generateLShapeRoom(dimensions);
  return { type, dimensions, walls };
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const generateSphericalDirections = (count: number): Point3D[] => {
  const directions: Point3D[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;

    directions.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }

  return directions;
};

export const rayTriangleIntersect = (
  origin: Point3D,
  dir: Point3D,
  v0: Point3D,
  v1: Point3D,
  v2: Point3D,
  epsilon = 1e-6
): { t: number; u: number; v: number } | null => {
  const edge1 = vec3.sub(v1, v0);
  const edge2 = vec3.sub(v2, v0);
  const h = vec3.cross(dir, edge2);
  const a = vec3.dot(edge1, h);

  if (Math.abs(a) < epsilon) return null;

  const f = 1 / a;
  const s = vec3.sub(origin, v0);
  const u = f * vec3.dot(s, h);

  if (u < 0 || u > 1) return null;

  const q = vec3.cross(s, edge1);
  const v = f * vec3.dot(dir, q);

  if (v < 0 || u + v > 1) return null;

  const t = f * vec3.dot(edge2, q);

  if (t > epsilon) {
    return { t, u, v };
  }

  return null;
};

export const rayWallIntersect = (
  origin: Point3D,
  dir: Point3D,
  wall: Wall
): { t: number; point: Point3D } | null => {
  const [v0, v1, v2] = wall.vertices;
  const result1 = rayTriangleIntersect(origin, dir, v0, v1, v2);
  if (result1) {
    return {
      t: result1.t,
      point: vec3.add(origin, vec3.mul(dir, result1.t)),
    };
  }

  const v3 = wall.vertices[3];
  const result2 = rayTriangleIntersect(origin, dir, v0, v2, v3);
  if (result2) {
    return {
      t: result2.t,
      point: vec3.add(origin, vec3.mul(dir, result2.t)),
    };
  }

  return null;
};

export const raySphereIntersect = (
  origin: Point3D,
  dir: Point3D,
  center: Point3D,
  radius: number
): number | null => {
  const oc = vec3.sub(origin, center);
  const a = vec3.dot(dir, dir);
  const b = 2 * vec3.dot(oc, dir);
  const c = vec3.dot(oc, oc) - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  if (t1 > 1e-6) return t1;
  if (t2 > 1e-6) return t2;

  return null;
};
