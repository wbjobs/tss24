import type { RayPath, AcousticParams, ReceiverResult, Point3D } from '../../shared/types';

export function calculateReceiverResults(rays: RayPath[]): ReceiverResult[] {
  const receiverMap = new Map<string, RayPath[]>();

  for (const ray of rays) {
    if (!receiverMap.has(ray.receiverId)) {
      receiverMap.set(ray.receiverId, []);
    }
    receiverMap.get(ray.receiverId)!.push(ray);
  }

  const results: ReceiverResult[] = [];
  for (const [receiverId, receiverRays] of receiverMap) {
    const totalEnergy = receiverRays.reduce((sum, r) => sum + r.energy, 0);
    const earlyEnergy = receiverRays
      .filter((r) => r.timeDelay <= 50)
      .reduce((sum, r) => sum + r.energy, 0);
    const lateEnergy = receiverRays
      .filter((r) => r.timeDelay > 50)
      .reduce((sum, r) => sum + r.energy, 0);

    results.push({
      receiverId,
      rays: receiverRays.sort((a, b) => a.timeDelay - b.timeDelay),
      totalEnergy,
      earlyEnergy,
      lateEnergy,
    });
  }

  return results;
}

export function calculateAcousticParams(allRays: RayPath[]): AcousticParams {
  if (allRays.length === 0) {
    return {
      rt60: 0,
      rt30: 0,
      c50: 0,
      d50: 0,
      t20: 0,
    };
  }

  const sortedRays = [...allRays].sort((a, b) => a.timeDelay - b.timeDelay);
  const energyDecayCurve = buildEnergyDecayCurve(sortedRays);

  const rt60 = calculateRT(energyDecayCurve, 60);
  const rt30 = calculateRT(energyDecayCurve, 30);
  const t20 = calculateRT(energyDecayCurve, 20);
  const c50 = calculateC50(sortedRays);
  const d50 = calculateD50(sortedRays);

  return {
    rt60,
    rt30,
    c50,
    d50,
    t20,
  };
}

function buildEnergyDecayCurve(rays: RayPath[]): { time: number; energy: number; db: number }[] {
  if (rays.length === 0) return [];

  const totalEnergy = rays.reduce((sum, r) => sum + r.energy, 0);
  const maxTime = Math.max(...rays.map((r) => r.timeDelay));
  const binSize = Math.max(1, maxTime / 100);

  const bins: Map<number, number> = new Map();
  for (const ray of rays) {
    const binTime = Math.floor(ray.timeDelay / binSize) * binSize;
    bins.set(binTime, (bins.get(binTime) || 0) + ray.energy);
  }

  const sortedBins = Array.from(bins.entries()).sort((a, b) => a[0] - b[0]);

  let cumulativeEnergy = 0;
  const decayCurve: { time: number; energy: number; db: number }[] = [];
  const maxEnergy = Math.max(...sortedBins.map(([_, e]) => e));

  for (const [time, energy] of sortedBins) {
    cumulativeEnergy += energy;
    const remainingEnergy = totalEnergy - cumulativeEnergy + energy;
    const db = 10 * Math.log10(Math.max(remainingEnergy / maxEnergy, 1e-10));
    decayCurve.push({ time, energy: remainingEnergy, db });
  }

  return decayCurve;
}

function calculateRT(
  decayCurve: { time: number; energy: number; db: number }[],
  dB: number
): number {
  if (decayCurve.length < 2) return 0;

  const startDb = -5;
  const endDb = -5 - dB;

  let startTime: number | null = null;
  let endTime: number | null = null;

  for (let i = 0; i < decayCurve.length; i++) {
    if (startTime === null && decayCurve[i].db <= startDb) {
      startTime = decayCurve[i].time;
    }
    if (endTime === null && decayCurve[i].db <= endDb) {
      endTime = decayCurve[i].time;
      break;
    }
  }

  if (startTime === null || endTime === null) {
    if (decayCurve.length >= 2) {
      const first = decayCurve[0];
      const last = decayCurve[decayCurve.length - 1];
      const dbDrop = first.db - last.db;
      if (dbDrop > 0) {
        return ((last.time - first.time) / 1000) * (dB / dbDrop);
      }
    }
    return 0;
  }

  return ((endTime - startTime) / 1000) * (dB / (endDb - startDb));
}

function calculateC50(rays: RayPath[]): number {
  const earlyEnergy = rays
    .filter((r) => r.timeDelay <= 50)
    .reduce((sum, r) => sum + r.energy, 0);
  const lateEnergy = rays
    .filter((r) => r.timeDelay > 50)
    .reduce((sum, r) => sum + r.energy, 0);

  if (lateEnergy === 0) return earlyEnergy > 0 ? 30 : 0;
  return 10 * Math.log10(earlyEnergy / lateEnergy);
}

function calculateD50(rays: RayPath[]): number {
  const earlyEnergy = rays
    .filter((r) => r.timeDelay <= 50)
    .reduce((sum, r) => sum + r.energy, 0);
  const totalEnergy = rays.reduce((sum, r) => sum + r.energy, 0);

  if (totalEnergy === 0) return 0;
  return (earlyEnergy / totalEnergy) * 100;
}

export function calculateSabineRT60(
  roomVolume: number,
  wallSurfaces: { area: number; absorption: number }[]
): number {
  const totalAbsorption = wallSurfaces.reduce(
    (sum, s) => sum + s.area * s.absorption,
    0
  );
  if (totalAbsorption === 0) return 10;

  return (0.161 * roomVolume) / totalAbsorption;
}

export function calculateRoomVolume(
  roomType: 'box' | 'l-shape',
  dimensions: { width: number; height: number; depth: number; lExtension?: number; lWidth?: number }
): number {
  if (roomType === 'box') {
    return dimensions.width * dimensions.height * dimensions.depth;
  } else {
    const mainVolume = dimensions.width * dimensions.height * dimensions.depth;
    const extensionVolume =
      (dimensions.lExtension || 4) * dimensions.height * (dimensions.lWidth || 4);
    return mainVolume + extensionVolume;
  }
}

export function calculateWallArea(wall: {
  vertices: Point3D[];
}): number {
  const [v0, v1, v2] = wall.vertices;
  const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
  const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
  const cross = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x,
  };
  return Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
}
