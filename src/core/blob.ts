import type { CloudBlob } from './types';
import type { BlobBehaviorConfig } from './config';
import { defaultConfig } from './config';
import { SPAWN_MARGIN, INTERIOR_MIN, INTERIOR_MAX, WRAP_MARGIN } from './constants';

export const randomBetween = (min: number, max: number): number => 
  min + Math.random() * (max - min);

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type SpawnPoint = {
  cx: number;
  cy: number;
  baseDirection: number;
};

export const pickSpawnPoint = (columns: number, rows: number): SpawnPoint => {
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

type BehaviorSettings = Required<BlobBehaviorConfig>;
const defaultBehavior = defaultConfig.blobBehavior as BehaviorSettings;

const INTERNAL_RADIUS_MIN = 30;
const INTERNAL_RADIUS_MAX = 56;
const INTERNAL_SPEED_MIN = 0.0018;
const INTERNAL_SPEED_MAX = 0.0031;

const remapBehaviorValue = (
  value: number,
  baseMin: number,
  baseMax: number,
  targetMin: number,
  targetMax: number,
): number => {
  if (!Number.isFinite(value)) {
    return targetMin;
  }
  const baseRange = baseMax - baseMin;
  if (Math.abs(baseRange) < 1e-6) {
    return targetMin;
  }
  const t = (value - baseMin) / baseRange;
  return targetMin + t * (targetMax - targetMin);
};

type CreateBlobOptions =
  | undefined
  | {
      warmStart?: boolean;
      behavior?: BehaviorSettings;
    };

const getBehavior = (behavior?: BehaviorSettings): BehaviorSettings =>
  behavior ?? defaultBehavior;

export const createBlob = (
  columns: number,
  rows: number,
  warmStartOrOptions?: boolean | CreateBlobOptions,
  maybeOptions?: CreateBlobOptions,
): CloudBlob => {
  const options: CreateBlobOptions =
    typeof warmStartOrOptions === 'boolean'
      ? { warmStart: warmStartOrOptions, ...(maybeOptions ?? {}) }
      : warmStartOrOptions ?? maybeOptions ?? {};

  const warmStart = options?.warmStart ?? false;
  const behavior = getBehavior(options?.behavior);

  const spawn = pickSpawnPoint(columns, rows);

  const radiusSample = randomBetween(behavior.minRadius, behavior.maxRadius);
  const radius = Math.max(
    remapBehaviorValue(
      radiusSample,
      defaultBehavior.minRadius,
      defaultBehavior.maxRadius,
      INTERNAL_RADIUS_MIN,
      INTERNAL_RADIUS_MAX,
    ),
    6,
  );
  const aspect = randomBetween(0.75, 1.35);
  const radiusX = radius;
  const radiusY = radius * aspect;

  const speedSample = randomBetween(behavior.minSpeed, behavior.maxSpeed);
  const speed = Math.max(
    remapBehaviorValue(
      speedSample,
      defaultBehavior.minSpeed,
      defaultBehavior.maxSpeed,
      INTERNAL_SPEED_MIN,
      INTERNAL_SPEED_MAX,
    ),
    0.00001,
  );
  const direction = spawn.baseDirection + randomBetween(-0.35, 0.35);

  const spawnVariance = behavior.spawnInterval * 0.5;
  const lifeSpan = Math.max(
    behavior.fadeInDuration * 1.5,
    behavior.lifespan + randomBetween(-spawnVariance, spawnVariance),
  );
  const life = warmStart
    ? Math.max(0, lifeSpan - randomBetween(0, behavior.spawnInterval))
    : lifeSpan;

  const wobbleAmplitude =
    behavior.wobbleAmplitude *
    clamp(randomBetween(0.75, 1.25), 0.1, Math.max(behavior.wobbleAmplitude * 2, 0.2));
  const wobbleSpeed = behavior.wobbleSpeed * randomBetween(0.75, 1.25);
  const rotationSpeed = randomBetween(-behavior.rotationSpeed, behavior.rotationSpeed);

  return {
    cx: spawn.cx,
    cy: spawn.cy,
    baseRadiusX: radiusX,
    baseRadiusY: radiusY,
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed,
    intensity: randomBetween(0.24, 0.45),
    velocityX: Math.cos(direction) * speed,
    velocityY: Math.sin(direction) * speed,
    wobbleAmplitude,
    wobbleSpeed,
    wobblePhase: randomBetween(0, Math.PI * 2),
    life,
    maxLife: lifeSpan,
  };
};

export const resetBlob = (
  columns: number,
  rows: number,
  options?: CreateBlobOptions,
): CloudBlob =>
  createBlob(columns, rows, options);

export const updateBlob = (
  blob: CloudBlob,
  delta: number,
  columns: number,
  rows: number,
  now: number,
): CloudBlob => {
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
