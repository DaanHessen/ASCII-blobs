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
  return {
    colors: { ...defaultConfig.colors, ...userConfig?.colors } as Required<ColorConfig>,
    characters: userConfig?.characters ?? defaultConfig.characters,
    blobBehavior: { ...defaultConfig.blobBehavior, ...userConfig?.blobBehavior } as Required<BlobBehaviorConfig>,
    animation: { ...defaultConfig.animation, ...userConfig?.animation } as Required<AnimationConfig>,
    performance: { ...defaultConfig.performance, ...userConfig?.performance } as Required<PerformanceConfig>,
    className: userConfig?.className,
    style: userConfig?.style,
    onReady: userConfig?.onReady,
    onBlobSpawn: userConfig?.onBlobSpawn,
  };
}
