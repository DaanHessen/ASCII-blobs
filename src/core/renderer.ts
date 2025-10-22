import type { State, BlobTempBuffers } from './types';
import { ALPHA_EPSILON } from './constants';
import { clamp } from './blob';

export type GaussianFalloffFn = (distanceSq: number) => number;

export type DrawFrameOptions = {
  cellSize: number;
  revealFade: number;
  fadeInDuration: number;
  gaussianFalloff: GaussianFalloffFn;
};

export const pickShadeIndex = (
  intensity: number,
  jitter: number,
  paletteBias: number,
  paletteSize: number,
): number => {
  const adjusted = clamp(intensity + jitter, 0, 1);
  const scaled = adjusted * (paletteSize - 1);
  const biased = scaled + paletteBias * 0.6;
  const index = Math.max(0, Math.min(paletteSize - 1, Math.round(biased)));
  return index;
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D,
  state: State,
  now: number,
  characterLUT: string[],
  revealElapsed: number,
  blobTemp: BlobTempBuffers,
  options: DrawFrameOptions,
): void => {
  const { cellSize, revealFade, fadeInDuration, gaussianFalloff } = options;
  const halfCell = cellSize / 2;

  const {
    blobs,
    cellCount,
    cellColumns,
    cellRows,
    cellCentersX,
    cellCentersY,
    baseBrightness,
    noiseJitter,
    noisePaletteBias,
    revealDelays,
    glyphs,
  } = state;

  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = true;

  const blobCount = blobs.length;
  const { centersX, centersY, cos, sin, invRadiusX, invRadiusY, intensity } = blobTemp;

  centersX.length = blobCount;
  centersY.length = blobCount;
  cos.length = blobCount;
  sin.length = blobCount;
  invRadiusX.length = blobCount;
  invRadiusY.length = blobCount;
  intensity.length = blobCount;

  for (let b = 0; b < blobCount; b += 1) {
    const blob = blobs[b]!;
    const cosVal = Math.cos(blob.rotation);
    const sinVal = Math.sin(blob.rotation);
    const pulse =
      1 + Math.sin(now * blob.wobbleSpeed + blob.wobblePhase) * blob.wobbleAmplitude;
    const radiusX = Math.max(blob.baseRadiusX * pulse, 12);
    const radiusY = Math.max(blob.baseRadiusY * pulse, 12);
    const lifeProgress = 1 - blob.life / blob.maxLife;
    const timeAlive = lifeProgress * blob.maxLife;
    const fadeIn = clamp(fadeInDuration > 0 ? timeAlive / fadeInDuration : 1, 0, 1);
    const fadeOut = clamp(blob.life / (blob.maxLife * 0.25), 0, 1);
    const envelope = fadeIn * fadeOut;

    centersX[b] = blob.cx;
    centersY[b] = blob.cy;
    cos[b] = cosVal;
    sin[b] = sinVal;
    invRadiusX[b] = 1 / radiusX;
    invRadiusY[b] = 1 / radiusY;
    intensity[b] = blob.intensity * envelope;
  }

  for (let idx = 0; idx < cellCount; idx += 1) {
    const revealDelay = revealDelays[idx]!;
    const revealProgressRaw = (revealElapsed - revealDelay) / revealFade;
    const revealProgress = clamp(revealProgressRaw, 0, 1);
    if (revealProgress <= 0) {
      continue;
    }

    const easedReveal = revealProgress * revealProgress * (3 - 2 * revealProgress);
    let brightness = baseBrightness[idx]!;

    const col = cellColumns[idx]!;
    const row = cellRows[idx]!;

    for (let b = 0; b < blobCount; b += 1) {
      const blobIntensity = intensity[b]!;
      if (blobIntensity <= 0) {
        continue;
      }

      const dx = col - centersX[b]!;
      const dy = row - centersY[b]!;

      const localX = (dx * cos[b]! - dy * sin[b]!) * invRadiusX[b]!;
      const localY = (dx * sin[b]! + dy * cos[b]!) * invRadiusY[b]!;
      const distanceSq = localX * localX + localY * localY;
      const influence = gaussianFalloff(distanceSq);

      if (influence <= 0) {
        continue;
      }

      brightness += influence * blobIntensity;
    }

    brightness = clamp(brightness * easedReveal, 0, 1);

    const shadeIndex = pickShadeIndex(
      brightness,
      noiseJitter[idx]!,
      noisePaletteBias[idx]!,
      characterLUT.length,
    );

    if (shadeIndex === 0) {
      continue;
    }

    const glyph = glyphs[shadeIndex];
    if (!glyph) {
      continue;
    }

    const alpha = (0.1 + brightness * 0.56) * easedReveal;

    if (alpha <= ALPHA_EPSILON) {
      continue;
    }

    ctx.globalAlpha = alpha;
    ctx.drawImage(
      glyph,
      cellCentersX[idx]! - halfCell,
      cellCentersY[idx]! - halfCell,
      cellSize,
      cellSize,
    );
  }

  ctx.globalAlpha = 1;
};
