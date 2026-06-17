import type { Material } from './types';

export const MATERIALS: Material[] = [
  { name: '混凝土', absorption: 0.02, reflection: 0.98, diffusion: 0.1 },
  { name: '砖墙', absorption: 0.05, reflection: 0.95, diffusion: 0.15 },
  { name: '石膏板', absorption: 0.1, reflection: 0.9, diffusion: 0.2 },
  { name: '木板', absorption: 0.15, reflection: 0.85, diffusion: 0.25 },
  { name: '地毯', absorption: 0.4, reflection: 0.6, diffusion: 0.8 },
  { name: '玻璃', absorption: 0.03, reflection: 0.97, diffusion: 0.05 },
  { name: '吸声棉', absorption: 0.8, reflection: 0.2, diffusion: 0.9 },
  { name: '窗帘', absorption: 0.5, reflection: 0.5, diffusion: 0.7 },
];

export const DEFAULT_MATERIAL: Material = MATERIALS[0];

export const getMaterialByName = (name: string): Material => {
  return MATERIALS.find(m => m.name === name) || DEFAULT_MATERIAL;
};
