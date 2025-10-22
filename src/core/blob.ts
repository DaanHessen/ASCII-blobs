import type { CloudBlob } from './types';
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

export const createBlob = (columns: number, rows: number, warmStart = false): CloudBlob => {
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

export const resetBlob = (columns: number, rows: number): CloudBlob => 
  createBlob(columns, rows);

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
