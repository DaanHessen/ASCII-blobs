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
}

export const defaultConfig: Required<Omit<AsciiBlobsConfig, 'className' | 'style' | 'onReady' | 'onBlobSpawn'>> = {
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
  },
};

export function mergeConfig(userConfig?: AsciiBlobsConfig): Required<Omit<AsciiBlobsConfig, 'className' | 'style' | 'onReady' | 'onBlobSpawn'>> & Pick<AsciiBlobsConfig, 'className' | 'style' | 'onReady' | 'onBlobSpawn'> {
  return {
    colors: { ...defaultConfig.colors, ...userConfig?.colors },
    characters: userConfig?.characters ?? defaultConfig.characters,
    blobBehavior: { ...defaultConfig.blobBehavior, ...userConfig?.blobBehavior },
    animation: { ...defaultConfig.animation, ...userConfig?.animation },
    performance: { ...defaultConfig.performance, ...userConfig?.performance },
    className: userConfig?.className,
    style: userConfig?.style,
    onReady: userConfig?.onReady,
    onBlobSpawn: userConfig?.onBlobSpawn,
  };
}
