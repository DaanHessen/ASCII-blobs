import { useEffect, useRef } from "react";
import "./AsciiScreensaver.css";

type CloudBlob = {
  cx: number;
  cy: number;
  baseRadiusX: number;
  baseRadiusY: number;
  rotation: number;
  rotationSpeed: number;
  intensity: number;
  velocityX: number;
  velocityY: number;
  wobbleAmplitude: number;
  wobbleSpeed: number;
  wobblePhase: number;
  life: number;
  maxLife: number;
};

type State = {
  columns: number;
  rows: number;
  gridOffsetX: number;
  gridOffsetY: number;
  cellCount: number;
  cellCentersX: Float32Array;
  cellCentersY: Float32Array;
  cellColumns: Float32Array;
  cellRows: Float32Array;
  baseBrightness: Float32Array;
  noiseJitter: Float32Array;
  noisePaletteBias: Float32Array;
  revealDelays: Float32Array;
  glyphs: (CanvasImageSource | null)[];
  blobs: CloudBlob[];
};

const CELL_SIZE = 14;
const FRAME_INTERVAL = 1000 / 22;
const WRAP_MARGIN = 8;
const REVEAL_DURATION = 100;
const REVEAL_FADE = 520;

const SPAWN_MARGIN = 18;
const INTERIOR_MIN = 0.18;
const INTERIOR_MAX = 0.82;
const HALF_CELL = CELL_SIZE / 2;

const ASCII_PALETTE = [" ", "`", ".", ":", ";", "~", "+", "=", "*", "#", "%", "@"] as const;
const CANVAS_FONT = `${CELL_SIZE * 0.86}px "JetBrains Mono", "Fira Code", "Menlo", monospace`;
const OVERLAY_RGB = "rgb(186, 194, 209)";
const ALPHA_EPSILON = 0.012;

const GAUSSIAN_LUT_SIZE = 1024;
const GAUSSIAN_LUT_MAX = 8;
const GAUSSIAN_SCALE = (GAUSSIAN_LUT_SIZE - 1) / GAUSSIAN_LUT_MAX;

const gaussianLUT = (() => {
  const lut = new Float32Array(GAUSSIAN_LUT_SIZE);
  for (let index = 0; index < GAUSSIAN_LUT_SIZE; index += 1) {
    const distanceSq = index / GAUSSIAN_SCALE;
    lut[index] = Math.exp(-distanceSq * 1.05);
  }
  return lut;
})();

const gaussianFalloff = (distanceSq: number) => {
  if (distanceSq >= GAUSSIAN_LUT_MAX) {
    return 0;
  }
  const lutIndex = Math.min(GAUSSIAN_LUT_SIZE - 1, Math.floor(distanceSq * GAUSSIAN_SCALE));
  return gaussianLUT[lutIndex];
};

type BlobTempBuffers = {
  centersX: number[];
  centersY: number[];
  cos: number[];
  sin: number[];
  invRadiusX: number[];
  invRadiusY: number[];
  intensity: number[];
};

const blobTemp: BlobTempBuffers = {
  centersX: [],
  centersY: [],
  cos: [],
  sin: [],
  invRadiusX: [],
  invRadiusY: [],
  intensity: [],
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pickShadeIndex = (
  intensity: number,
  jitter: number,
  paletteBias: number,
  paletteSize: number,
) => {
  const adjusted = clamp(intensity + jitter, 0, 1);
  const scaled = adjusted * (paletteSize - 1);
  const biased = scaled + paletteBias * 0.6;
  const index = Math.max(0, Math.min(paletteSize - 1, Math.round(biased)));
  return index;
};

const createGlyphAtlas = (
  scale: number,
  characters: readonly string[],
): (CanvasImageSource | null)[] => {
  const atlas: (CanvasImageSource | null)[] = new Array(characters.length).fill(null);
  const pixelSize = Math.max(1, Math.ceil(CELL_SIZE * scale));

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!character.trim()) {
      atlas[index] = null;
      continue;
    }

    const needsOffscreen = typeof OffscreenCanvas !== "undefined";
    if (needsOffscreen) {
      const canvas = new OffscreenCanvas(pixelSize, pixelSize);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        atlas[index] = null;
        continue;
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = "rgba(96, 165, 250, 0.35)";
      ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = CANVAS_FONT;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 2;
      ctx.fillStyle = OVERLAY_RGB;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      atlas[index] = canvas.transferToImageBitmap();
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        atlas[index] = null;
        continue;
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = "rgba(96, 165, 250, 0.35)";
      ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = CANVAS_FONT;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 2;
      ctx.fillStyle = OVERLAY_RGB;
      ctx.fillText(character, HALF_CELL, HALF_CELL);
      atlas[index] = canvas;
    }
  }

  return atlas;
};

type SpawnPoint = {
  cx: number;
  cy: number;
  baseDirection: number;
};

const pickSpawnPoint = (columns: number, rows: number): SpawnPoint => {
  const targetX = randomBetween(columns * INTERIOR_MIN, columns * INTERIOR_MAX);
  const targetY = randomBetween(rows * INTERIOR_MIN, rows * INTERIOR_MAX);

  const edge = Math.floor(Math.random() * 4);
  let cx = 0;
  let cy = 0;

  switch (edge) {
    case 0: {
      // left
      cx = -SPAWN_MARGIN;
      cy = randomBetween(-SPAWN_MARGIN, rows + SPAWN_MARGIN);
      break;
    }
    case 1: {
      // right
      cx = columns + SPAWN_MARGIN;
      cy = randomBetween(-SPAWN_MARGIN, rows + SPAWN_MARGIN);
      break;
    }
    case 2: {
      // top
      cx = randomBetween(-SPAWN_MARGIN, columns + SPAWN_MARGIN);
      cy = -SPAWN_MARGIN;
      break;
    }
    default: {
      // bottom
      cx = randomBetween(-SPAWN_MARGIN, columns + SPAWN_MARGIN);
      cy = rows + SPAWN_MARGIN;
      break;
    }
  }

  const baseDirection = Math.atan2(targetY - cy, targetX - cx);
  return { cx, cy, baseDirection };
};

const createBlob = (columns: number, rows: number, warmStart = false): CloudBlob => {
  const spawn = pickSpawnPoint(columns, rows);
  const radius = randomBetween(30, 56);
  const aspect = randomBetween(0.75, 1.35);
  const radiusX = radius;
  const radiusY = radius * aspect;
  const speed = randomBetween(0.0018, 0.0031);
  const direction = spawn.baseDirection + randomBetween(-0.35, 0.35);

  const lifeSpan = randomBetween(65000, 110000);
  const life = warmStart ? lifeSpan - randomBetween(0, lifeSpan * 0.5) : lifeSpan;

  return {
    cx: spawn.cx,
    cy: spawn.cy,
    baseRadiusX: radiusX,
    baseRadiusY: radiusY,
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.00005, 0.00005),
    intensity: randomBetween(0.24, 0.45),
    velocityX: Math.cos(direction) * speed,
    velocityY: Math.sin(direction) * speed,
    wobbleAmplitude: randomBetween(0.08, 0.18),
    wobbleSpeed: randomBetween(0.00025, 0.0006),
    wobblePhase: randomBetween(0, Math.PI * 2),
    life,
    maxLife: lifeSpan,
  };
};

const resetBlob = (columns: number, rows: number): CloudBlob => createBlob(columns, rows);

const updateBlob = (
  blob: CloudBlob,
  delta: number,
  columns: number,
  rows: number,
  now: number,
) => {
  const driftMod =
    1 + Math.sin(now * 0.00002 + blob.wobblePhase * 0.5) * 0.2 + Math.cos(now * 0.000015) * 0.1;
  const cx = blob.cx + blob.velocityX * delta * driftMod;
  const cy = blob.cy + blob.velocityY * delta * driftMod;

  blob.cx = cx;
  blob.cy = cy;
  blob.rotation += blob.rotationSpeed * delta;
  blob.life -= delta;

  const outsideSoft =
    cx < -WRAP_MARGIN ||
    cx > columns + WRAP_MARGIN ||
    cy < -WRAP_MARGIN ||
    cy > rows + WRAP_MARGIN;
  if (outsideSoft) {
    blob.life -= delta * 1.45;
  }

  const outsideHard =
    cx < -SPAWN_MARGIN ||
    cx > columns + SPAWN_MARGIN ||
    cy < -SPAWN_MARGIN ||
    cy > rows + SPAWN_MARGIN;
  if (outsideHard) {
    blob.life -= delta * 3.5;
  }

  return blob;
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  state: State,
  now: number,
  characterLUT: string[],
  revealElapsed: number,
) => {
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
    const blob = blobs[b];
    const cosVal = Math.cos(blob.rotation);
    const sinVal = Math.sin(blob.rotation);
    const pulse =
      1 + Math.sin(now * blob.wobbleSpeed + blob.wobblePhase) * blob.wobbleAmplitude;
    const radiusX = Math.max(blob.baseRadiusX * pulse, 12);
    const radiusY = Math.max(blob.baseRadiusY * pulse, 12);
    const lifeProgress = 1 - blob.life / blob.maxLife;
    const fadeIn = clamp(lifeProgress / 0.18, 0, 1);
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
    const revealDelay = revealDelays[idx];
    const revealProgressRaw = (revealElapsed - revealDelay) / REVEAL_FADE;
    const revealProgress = clamp(revealProgressRaw, 0, 1);
    if (revealProgress <= 0) {
      continue;
    }

    const easedReveal = revealProgress * revealProgress * (3 - 2 * revealProgress);
    let brightness = baseBrightness[idx];

    const col = cellColumns[idx];
    const row = cellRows[idx];

    for (let b = 0; b < blobCount; b += 1) {
      const blobIntensity = intensity[b];
      if (blobIntensity <= 0) {
        continue;
      }

      const dx = col - centersX[b];
      const dy = row - centersY[b];

      const localX = (dx * cos[b] - dy * sin[b]) * invRadiusX[b];
      const localY = (dx * sin[b] + dy * cos[b]) * invRadiusY[b];
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
      noiseJitter[idx],
      noisePaletteBias[idx],
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
      cellCentersX[idx] - HALF_CELL,
      cellCentersY[idx] - HALF_CELL,
      CELL_SIZE,
      CELL_SIZE,
    );
  }

  ctx.globalAlpha = 1;
};

const AsciiScreensaver = () => {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const stateRef = useRef<State | null>(null);
  const lastTimestampRef = useRef<number>(performance.now());
  const lastDrawRef = useRef<number>(performance.now());
  const revealStartRef = useRef<number>(performance.now());

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!baseCanvas || !overlayCanvas) {
      return;
    }

    const baseCtx = baseCanvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!baseCtx || !overlayCtx) {
      return;
    }

    const characterLUT = Array.from({ length: ASCII_PALETTE.length }, (_, index) => {
      const baseIndex = index;
      const bias = randomBetween(-0.2, 0.2);
      const adjusted = clamp(baseIndex + bias, 0, ASCII_PALETTE.length - 1);
      return ASCII_PALETTE[Math.round(adjusted)];
    });

    const setupState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = window.devicePixelRatio || 1;
      const columns = Math.ceil(width / CELL_SIZE) + 6;
      const rows = Math.ceil(height / CELL_SIZE) + 6;
      const gridOffsetX = -CELL_SIZE * 3;
      const gridOffsetY = -CELL_SIZE * 3;

      baseCanvas.style.width = `${width}px`;
      baseCanvas.style.height = `${height}px`;
      baseCanvas.width = Math.floor(width * scale);
      baseCanvas.height = Math.floor(height * scale);
      baseCtx.setTransform(scale, 0, 0, scale, 0, 0);
      baseCtx.font = CANVAS_FONT;

      const glyphs = createGlyphAtlas(scale, characterLUT);

      overlayCanvas.style.width = `${width}px`;
      overlayCanvas.style.height = `${height}px`;
      overlayCanvas.width = Math.floor(width * scale);
      overlayCanvas.height = Math.floor(height * scale);
      overlayCtx.setTransform(scale, 0, 0, scale, 0, 0);
      overlayCtx.font = CANVAS_FONT;
      overlayCtx.textAlign = "center";
      overlayCtx.textBaseline = "middle";

      baseCtx.clearRect(0, 0, width, height);

      const cellCount = columns * rows;
      const cellCentersX = new Float32Array(cellCount);
      const cellCentersY = new Float32Array(cellCount);
      const cellColumns = new Float32Array(cellCount);
      const cellRows = new Float32Array(cellCount);
      const baseBrightness = new Float32Array(cellCount);
      const noiseJitter = new Float32Array(cellCount);
      const noisePaletteBias = new Float32Array(cellCount);
      const revealDelays = new Float32Array(cellCount);

      let index = 0;
      for (let row = 0; row < rows; row += 1) {
        const verticalGradient = 0.14 + (1 - row / rows) * 0.06;
        const centerY = gridOffsetY + row * CELL_SIZE + CELL_SIZE / 2;
        for (let col = 0; col < columns; col += 1) {
          const jitter = randomBetween(-0.05, 0.05);
          const bias = Math.random() - 0.5;
          const centerX = gridOffsetX + col * CELL_SIZE + CELL_SIZE / 2;

          cellCentersX[index] = centerX;
          cellCentersY[index] = centerY;
          cellColumns[index] = col;
          cellRows[index] = row;
          baseBrightness[index] = verticalGradient + jitter * 0.12;
          noiseJitter[index] = jitter;
          noisePaletteBias[index] = bias;
          index += 1;
        }
      }

      for (let idx = 0; idx < cellCount; idx += 1) {
        revealDelays[idx] = Math.max(0, randomBetween(-REVEAL_FADE * 0.65, REVEAL_DURATION));
      }

      const blobCount = width < 640 ? 2 : width < 1024 ? 3 : width < 1600 ? 4 : 5;
      const blobs = Array.from({ length: blobCount }, () => createBlob(columns, rows, true));

      stateRef.current = {
        columns,
        rows,
        cellCount,
        gridOffsetX,
        gridOffsetY,
        cellCentersX,
        cellCentersY,
        cellColumns,
        cellRows,
        baseBrightness,
        noiseJitter,
        noisePaletteBias,
        revealDelays,
        glyphs,
        blobs,
      };

      revealStartRef.current = performance.now();
      lastTimestampRef.current = performance.now();
      lastDrawRef.current = performance.now();
    };

    setupState();

    let resizeTimeout: number | undefined;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        setupState();
      }, 180);
    };

    const tick = (timestamp: number) => {
      const now = timestamp || performance.now();
      const state = stateRef.current;
      if (!state) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(now - lastTimestampRef.current, 120);
      lastTimestampRef.current = now;

      const revealElapsed = Math.max(0, now - revealStartRef.current);
      const movementFactor = clamp(revealElapsed / REVEAL_DURATION, 0, 1);
      const effectiveDelta = delta * movementFactor;

      const { blobs, columns, rows } = state;
      for (let index = 0; index < blobs.length; index += 1) {
        let blob = blobs[index];
        if (blob.life <= 0) {
          blob = createBlob(columns, rows);
        }
        const updated = updateBlob(blob, effectiveDelta, columns, rows, now);
        blobs[index] = updated.life <= 0 ? resetBlob(columns, rows) : updated;
      }

      if (now - lastDrawRef.current >= FRAME_INTERVAL) {
        drawFrame(overlayCtx, state, now, characterLUT, revealElapsed);
        lastDrawRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
    };
  }, []);

  return (
    <div className="ascii-screensaver" aria-hidden="true">
      <div className="ascii-screensaver__backdrop"></div>
      <canvas
        ref={baseCanvasRef}
        className="ascii-screensaver__canvas ascii-screensaver__canvas--base"
      />
      <canvas
        ref={overlayCanvasRef}
        className="ascii-screensaver__canvas ascii-screensaver__canvas--overlay"
      />
      <div className="ascii-screensaver__texture"></div>
      <div className="ascii-screensaver__vignette"></div>
    </div>
  );
};

export default AsciiScreensaver;
