# ascii-blobs

Beautiful, animated ASCII blob backgrounds using gaussian metaball rendering.

[![npm version](https://img.shields.io/npm/v/ascii-blobs.svg)](https://www.npmjs.com/package/ascii-blobs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Animations** - Gaussian-based blob physics with wobble, rotation, and drift
- **High performance** - Pre-computed LUTs, Float32Arrays, and optimized rendering
- **Themes** - Themes, baby
- **Fully configurable** - Control colors, characters, blob behavior, and animation
- **Framework agnostic** - React components and vanilla JavaScript API
- **TypeScript** - Full type definitions included
- **Zero dependencies** - React is optional peer dependency

## Installation

```bash
npm install ascii-blobs
```

## Quick Start

### React

```tsx
import { AsciiScreensaver } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

function App() {
  return <AsciiScreensaver />;
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
import { AsciiScreensaver, getThemeClassName } from 'ascii-blobs';

<AsciiScreensaver className={getThemeClassName('catppuccin-mocha')} />
```

Available themes: `default`, `catppuccin-mocha`, `catppuccin-latte`, `dracula`, `nord`, `gruvbox`, `tokyo-night`

## Configuration

```tsx
<AsciiScreensaver
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

## Advanced Usage

### Control Methods

```tsx
import { useRef } from 'react';
import { AsciiScreensaver, AsciiScreensaverRef } from 'ascii-blobs';

function App() {
  const ref = useRef<AsciiScreensaverRef>(null);

  return (
    <>
      <AsciiScreensaver ref={ref} />
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

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT © Daan Hessen