# 🦍 ascii-blobs 🦍

Beautiful, animated ASCII blob backgrounds using gaussian metaball rendering.

[![npm version](https://img.shields.io/npm/v/ascii-blobs.svg)](https://www.npmjs.com/package/ascii-blobs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## [Demo](https://daanhessen.github.io/ASCII-blobs/)

Check out all configuration options in real-time!

## Features

- **Animations** - Gaussian-based blob physics with wobble, rotation, and drift
- **High performance** - Pre-computed LUTs, Float32Arrays, and optimized rendering
- **Themes** - Themes, baby
- **Fully configurable** - Control colors, characters, blob behavior, and animation
- **Framework agnostic** - React components and vanilla JavaScript API
- **TypeScript** - Full type definitions included

## Installation
1
```bash
npm install ascii-blobs
```

## Quick Start

### React

```tsx
import { AsciiBlobs } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

function App() {
  return <AsciiBlobs />;
}
```

### Vanilla JavaScript

```js
import { AsciiBlobs } from 'ascii-blobs/vanilla';
import 'ascii-blobs/dist/style.css';

const blobs = new AsciiBlobs('#container');
```

## Themes

```tsx
import { AsciiBlobs, getThemeClassName } from 'ascii-blobs';

<AsciiBlobs className={getThemeClassName('catppuccin-mocha')} />
```

Available themes: `default`, `catppuccin-mocha`, `catppuccin-latte`, `dracula`, `nord`, `gruvbox`, `tokyo-night`

## Configuration

```tsx
<AsciiBlobs
  colors={{
    primary: 'rgb(100, 180, 255)',
    background: '#000000',
  }}
  characters=" .,:;!~+=xoX#"
  blobBehavior={{
    count: 8,
    minSpeed: 6,
    maxSpeed: 12,
  }}
  animation={{
    frameInterval: 42,
    revealDuration: 1200,
  }}
/>
```

## Configuration

Every option on `AsciiBlobs` (React) or the vanilla constructor is optional. Anything left out falls back to the defaults from `mergeConfig`.

### Top-Level Options

- `characters` – ordered string of glyphs from darkest to brightest. You can also pass an array (`[' ', '.', ':']`) and call `.join('')` before handing it to the component.
- `className` – append extra classes next to the built-in `ascii-blobs` wrapper. Pair this with `getThemeClassName` or your own utility classes.
- `style` – inline styles merged onto the wrapper. Any CSS custom properties you provide here override the generated variables. The component defaults to `z-index: -1`, so it automatically renders behind siblings; set your own `zIndex` if you need a different stacking order.
- `onReady` – called once after canvases are mounted and the first render is scheduled.
- `onBlobSpawn` – called with each newly spawned blob so you can create analytics or sync other visuals.
- `interactive` – reserved flag for upcoming pointer controls (currently unused, safe to omit).

### `colors`

- `primary` – main glyph color.
- `background` – backdrop gradient base (also sets `--ascii-bg-*` variables).
- `glow` – outer glow tint drawn behind the glyphs.
- `shadow` – inner shadow tint that adds depth to the characters.

### `blobBehavior`

- `count` – number of simultaneous blobs.
- `minSpeed` / `maxSpeed` – speed range in grid cells per second.
- `minRadius` / `maxRadius` – blob radii in grid cells (higher = softer, larger blobs).
- `spawnInterval` – time between new blobs (ms).
- `lifespan` – maximum blob lifetime (ms). Automatically clamped to stay above `fadeInDuration`.
- `fadeInDuration` – ramp-up time (ms) before a blob becomes fully visible.
- `wobbleAmplitude` – scale of the organic wobble to keep blobs from feeling static.
- `wobbleSpeed` – rate of the wobble animation.
- `rotationSpeed` – base angular velocity for the metaball rotation pass.

### `animation`

- `frameInterval` – minimum time between draws (ms). Leave undefined to derive from `performance.targetFPS`.
- `revealDuration` – duration (ms) of the initial reveal animation across the grid.
- `revealFade` – how long each cell waits before it starts revealing (ms).

### `performance`

- `cellSize` – pixel size of each grid cell. Lower values increase fidelity at the cost of work.
- `gaussianLutSize` – precision of the Gaussian lookup table used for blending.
- `targetFPS` – desired frame rate, used when `frameInterval` is not explicitly set.
- `useOffscreenCanvas` – render glyph atlases via `OffscreenCanvas` when supported.
- `enableBlur` – toggle the glow/shadow blur passes for lower-power devices.

### Runtime Controls

`AsciiBlobs` exposes an imperative handle (`AsciiBlobsRef`) and the vanilla instance exposes equivalent methods:

- `pause()` / `resume()` – stop or resume the animation loop without destroying state.
- `reset()` – respawn every blob and restart the reveal animation.
- `getStats()` – returns `{ blobCount, fps, isPaused }` for heads-up displays or tuning UI.
- `destroy()` *(vanilla only)* – tear everything down and unregister listeners.

## Advanced Usage

### Control Methods

```tsx
import { useRef } from 'react';
import { AsciiBlobs, AsciiBlobsRef } from 'ascii-blobs';

function App() {
  const ref = useRef<AsciiBlobsRef>(null);

  return (
    <>
      <AsciiBlobs ref={ref} />
      <button onClick={() => ref.current?.pause()}>Pause</button>
      <button onClick={() => ref.current?.resume()}>Resume</button>
      <button onClick={() => ref.current?.reset()}>Reset</button>
    </>
  );
}
```

### Vanilla JavaScript

```js
const blobs = new AsciiBlobs('#container', {
  blobBehavior: { count: 5 },
  characters: ' ░▒▓█',
});

blobs.pause();
blobs.resume();
blobs.reset();
console.log(blobs.getStats());
blobs.destroy();
```

## License

MIT © Daan Hessen
