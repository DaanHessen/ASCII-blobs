import type { CloudBlob } from './types';

export interface ColorConfig {
  primary?: string;
  background?: string;
  glow?: string;
  shadow?: string;
}

export interface BlobBehaviorConfig {
  count?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minRadius?: number;
  maxRadius?: number;
  spawnInterval?: number;
  lifespan?: number;
  fadeInDuration?: number;
  wobbleAmplitude?: number;
  wobbleSpeed?: number;
  rotationSpeed?: number;
}

export interface AnimationConfig {
  frameInterval?: number;
  revealDuration?: number;
  revealFade?: number;
}

export interface PerformanceConfig {
  cellSize?: number;
  gaussianLutSize?: number;
  targetFPS?: number;
  useOffscreenCanvas?: boolean;
  enableBlur?: boolean;
}

export interface AsciiBlobsConfig {
  colors?: ColorConfig;
  characters?: string;
  blobBehavior?: BlobBehaviorConfig;
  animation?: AnimationConfig;
  performance?: PerformanceConfig;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
  onBlobSpawn?: (blob: CloudBlob) => void;
  interactive?: boolean;
}

export const defaultConfig: Required<Omit<AsciiBlobsConfig, 'className' | 'style' | 'onReady' | 'onBlobSpawn' | 'interactive'>> = {
  colors: {
    primary: 'rgb(100, 180, 255)',
    background: '#000000',
    glow: 'rgba(100, 180, 255, 0.8)',
    shadow: 'rgba(100, 180, 255, 0.4)',
  },
  characters: ' .,:;!~+=xoX#',
  blobBehavior: {
    count: 8,
    minSpeed: 6,
    maxSpeed: 12,
    minRadius: 60,
    maxRadius: 140,
    spawnInterval: 3000,
    lifespan: 30000,
    fadeInDuration: 2000,
    wobbleAmplitude: 0.15,
    wobbleSpeed: 0.0004,
    rotationSpeed: 0.00003,
  },
  animation: {
    frameInterval: 42,
    revealDuration: 1200,
    revealFade: 400,
  },
  performance: {
    cellSize: 14,
    gaussianLutSize: 1024,
    targetFPS: 60,
    useOffscreenCanvas: true,
    enableBlur: true,
  },
};

export type MergedConfig = {
  colors: Required<ColorConfig>;
  characters: string;
  blobBehavior: Required<BlobBehaviorConfig>;
  animation: Required<AnimationConfig>;
  performance: Required<PerformanceConfig>;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
  onBlobSpawn?: (blob: CloudBlob) => void;
};

export function mergeConfig(userConfig?: AsciiBlobsConfig): MergedConfig {
  const colors = {
    ...defaultConfig.colors,
    ...userConfig?.colors,
  } as Required<ColorConfig>;

  const performance = {
    ...defaultConfig.performance,
    ...userConfig?.performance,
  } as Required<PerformanceConfig>;
  performance.cellSize = Math.max(6, Math.floor(performance.cellSize));
  performance.gaussianLutSize = Math.max(32, Math.floor(performance.gaussianLutSize));
  performance.targetFPS = Math.max(1, Math.min(240, performance.targetFPS));

  const blobBehavior = {
    ...defaultConfig.blobBehavior,
    ...userConfig?.blobBehavior,
  } as Required<BlobBehaviorConfig>;
  blobBehavior.count = Math.max(1, Math.floor(blobBehavior.count));
  blobBehavior.minSpeed = Math.max(0, blobBehavior.minSpeed);
  blobBehavior.maxSpeed = Math.max(blobBehavior.minSpeed, blobBehavior.maxSpeed);
  blobBehavior.minRadius = Math.max(4, blobBehavior.minRadius);
  blobBehavior.maxRadius = Math.max(blobBehavior.minRadius, blobBehavior.maxRadius);
  blobBehavior.spawnInterval = Math.max(0, blobBehavior.spawnInterval);
  blobBehavior.fadeInDuration = Math.max(0, blobBehavior.fadeInDuration);
  blobBehavior.lifespan = Math.max(blobBehavior.fadeInDuration + 500, blobBehavior.lifespan);
  blobBehavior.wobbleAmplitude = Math.max(0, blobBehavior.wobbleAmplitude);
  blobBehavior.wobbleSpeed = Math.max(0, blobBehavior.wobbleSpeed);
  blobBehavior.rotationSpeed = Math.max(0, blobBehavior.rotationSpeed);

  const animation = {
    ...defaultConfig.animation,
    ...userConfig?.animation,
  } as Required<AnimationConfig>;

  if (!userConfig?.animation?.frameInterval && userConfig?.performance?.targetFPS) {
    animation.frameInterval = Math.max(5, Math.round(1000 / performance.targetFPS));
  }
  animation.frameInterval = Math.max(5, animation.frameInterval);
  animation.revealDuration = Math.max(0, animation.revealDuration);
  animation.revealFade = Math.max(1, animation.revealFade);

  return {
    colors,
    characters: userConfig?.characters ?? defaultConfig.characters,
    blobBehavior,
    animation,
    performance,
    className: userConfig?.className,
    style: userConfig?.style,
    onReady: userConfig?.onReady,
    onBlobSpawn: userConfig?.onBlobSpawn,
  };
}
