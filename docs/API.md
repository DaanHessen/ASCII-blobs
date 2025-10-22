# API Reference

## React Component

### `<AsciiScreensaver />`

Main React component for rendering animated ASCII blobs.

```tsx
import { AsciiScreensaver } from 'ascii-blobs';
```

#### Props

All props are optional. The component accepts `AsciiBlobsConfig` as props.

##### `colors?: ColorConfig`

Customize the color scheme.

```tsx
colors={{
  primary: 'rgb(100, 180, 255)',
  background: '#000000',
  glow: 'rgba(100, 180, 255, 0.8)',
  shadow: 'rgba(100, 180, 255, 0.4)',
}}
```

##### `characters?: string`

ASCII characters to use for rendering, from lightest to darkest.

```tsx
characters=" .,:;!~+=xoX#"
```

Default: `" .,:;!~+=xoX#"`

##### `blobBehavior?: BlobBehaviorConfig`

Control blob physics and lifecycle.

```tsx
blobBehavior={{
  count: 8,
  minSpeed: 6,
  maxSpeed: 12,
  minRadius: 60,
  maxRadius: 140,
  spawnInterval: 3000,
  lifespan: 30000,
  fadeInDuration: 2000,
}}
```

##### `animation?: AnimationConfig`

Control animation timing.

```tsx
animation={{
  frameInterval: 42,
  revealDuration: 1200,
  revealFade: 400,
}}
```

##### `performance?: PerformanceConfig`

Performance tuning options.

```tsx
performance={{
  cellSize: 14,
  gaussianLutSize: 1024,
  targetFPS: 60,
  useOffscreenCanvas: true,
}}
```

##### `className?: string`

Additional CSS class names.

##### `style?: React.CSSProperties`

Inline styles.

##### `onReady?: () => void`

Called when the component is initialized.

##### `onBlobSpawn?: (blob: CloudBlob) => void`

Called whenever a new blob is spawned.

#### Ref Methods

Use `ref` with `AsciiScreensaverRef` to control the animation.

```tsx
const ref = useRef<AsciiScreensaverRef>(null);

ref.current?.pause();
ref.current?.resume();
ref.current?.reset();
const stats = ref.current?.getStats();
```

##### `pause(): void`

Pause the animation.

##### `resume(): void`

Resume the animation.

##### `reset(): void`

Reset all blobs with new random properties.

##### `getStats(): { blobCount: number; fps: number; isPaused: boolean }`

Get current animation statistics.

## Vanilla JavaScript API

### `AsciiBlobs`

Class-based API for framework-agnostic usage.

```js
import { AsciiBlobs } from 'ascii-blobs/vanilla';
```

#### Constructor

```js
new AsciiBlobs(container, config?)
```

- `container`: HTMLElement or selector string
- `config`: Optional `AsciiBlobsConfig` object

#### Methods

##### `pause(): void`

Pause the animation.

##### `resume(): void`

Resume the animation.

##### `reset(): void`

Reset all blobs.

##### `getStats(): { blobCount: number; fps: number; isPaused: boolean }`

Get animation statistics.

##### `destroy(): void`

Clean up and remove all elements and listeners.

## Type Definitions

### `AsciiBlobsConfig`

```typescript
interface AsciiBlobsConfig {
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
```

### `ColorConfig`

```typescript
interface ColorConfig {
  primary?: string;
  background?: string;
  glow?: string;
  shadow?: string;
}
```

### `BlobBehaviorConfig`

```typescript
interface BlobBehaviorConfig {
  count?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minRadius?: number;
  maxRadius?: number;
  spawnInterval?: number;
  lifespan?: number;
  fadeInDuration?: number;
}
```

### `AnimationConfig`

```typescript
interface AnimationConfig {
  frameInterval?: number;
  revealDuration?: number;
  revealFade?: number;
}
```

### `PerformanceConfig`

```typescript
interface PerformanceConfig {
  cellSize?: number;
  gaussianLutSize?: number;
  targetFPS?: number;
  useOffscreenCanvas?: boolean;
}
```

## Themes

### `getThemeClassName(theme: ThemeName): string`

Get the className for a theme.

```tsx
import { getThemeClassName } from 'ascii-blobs';

<AsciiScreensaver className={getThemeClassName('dracula')} />
```

### `ThemeName`

Available theme names:

- `'default'` - Default blue theme
- `'catppuccin-mocha'` - Catppuccin Mocha
- `'catppuccin-latte'` - Catppuccin Latte (light theme)
- `'dracula'` - Dracula
- `'nord'` - Nord
- `'gruvbox'` - Gruvbox
- `'tokyo-night'` - Tokyo Night

### `themes`

Object containing all theme class name mappings.

```js
import { themes } from 'ascii-blobs';
console.log(themes['catppuccin-mocha']);
```

## Advanced Exports

For advanced use cases, the library also exports lower-level utilities:

- Core types: `CloudBlob`, `State`, `BlobTempBuffers`
- Constants: `CELL_SIZE`, `ASCII_PALETTE`, `GAUSSIAN_LUT_SIZE`, etc.
- Functions: `createBlob`, `updateBlob`, `gaussianFalloff`, `setupGrid`, etc.

See the TypeScript definitions for full details.
