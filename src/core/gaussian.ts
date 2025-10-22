import { GAUSSIAN_LUT_SIZE, GAUSSIAN_LUT_MAX, GAUSSIAN_SCALE } from './constants';

export const gaussianLUT = (() => {
  const lut = new Float32Array(GAUSSIAN_LUT_SIZE);
  for (let index = 0; index < GAUSSIAN_LUT_SIZE; index += 1) {
    const distanceSq = index / GAUSSIAN_SCALE;
    lut[index] = Math.exp(-distanceSq * 1.05);
  }
  return lut;
})();

export const gaussianFalloff = (distanceSq: number): number => {
  if (distanceSq >= GAUSSIAN_LUT_MAX) {
    return 0;
  }
  const lutIndex = Math.min(GAUSSIAN_LUT_SIZE - 1, Math.floor(distanceSq * GAUSSIAN_SCALE));
  return gaussianLUT[lutIndex] ?? 0;
};

export type GaussianSampler = {
  lut: Float32Array;
  falloff: (distanceSq: number) => number;
};

export const createGaussianSampler = (
  lutSize: number,
  maxDistance: number = GAUSSIAN_LUT_MAX,
  falloffStrength = 1.05,
): GaussianSampler => {
  const size = Math.max(8, Math.floor(lutSize));
  const lut = new Float32Array(size);
  const scale = (size - 1) / maxDistance;

  for (let index = 0; index < size; index += 1) {
    const distanceSq = index / scale;
    lut[index] = Math.exp(-distanceSq * falloffStrength);
  }

  const falloff = (distanceSq: number): number => {
    if (distanceSq >= maxDistance) {
      return 0;
    }
    const lutIndex = Math.min(size - 1, Math.floor(distanceSq * scale));
    return lut[lutIndex] ?? 0;
  };

  return { lut, falloff };
};
