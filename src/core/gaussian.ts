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
