# Usage Guide

## Installation

```bash
npm install ascii-blobs
```

## Quick Start

### React

```tsx
import { AsciiScreensaver } from 'ascii-blobs';
import 'ascii-blobs/dist/ascii-blobs.css';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <AsciiScreensaver />
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/ascii-blobs/dist/ascii-blobs.css">
</head>
<body>
  <div id="container" style="width: 100vw; height: 100vh;"></div>
  
  <script type="module">
    import { AsciiBlobs } from './node_modules/ascii-blobs/dist/vanilla.mjs';
    const blobs = new AsciiBlobs('#container');
  </script>
</body>
</html>
```

### Via CDN (Coming Soon)

```html
<link rel="stylesheet" href="https://unpkg.com/ascii-blobs/dist/ascii-blobs.css">
<script type="module">
  import { AsciiBlobs } from 'https://unpkg.com/ascii-blobs/dist/vanilla.mjs';
  const blobs = new AsciiBlobs('#container');
</script>
```

## Common Use Cases

### Full Screen Background

```tsx
import { AsciiScreensaver } from 'ascii-blobs';
import 'ascii-blobs/dist/ascii-blobs.css';

function App() {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <AsciiScreensaver />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1>Your Content</h1>
      </div>
    </>
  );
}
```

### Hero Section

```tsx
function Hero() {
  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      position: 'relative',
      overflow: 'hidden' 
    }}>
      <AsciiScreensaver />
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1>Welcome</h1>
      </div>
    </div>
  );
}
```

### With Theme

```tsx
import { AsciiScreensaver, getThemeClassName } from 'ascii-blobs';

function App() {
  return (
    <AsciiScreensaver 
      className={getThemeClassName('dracula')} 
    />
  );
}
```

### Custom Configuration

```tsx
function App() {
  return (
    <AsciiScreensaver
      characters=" ░▒▓█"
      blobBehavior={{
        count: 6,
        minSpeed: 8,
        maxSpeed: 14,
      }}
      animation={{
        frameInterval: 33,
      }}
    />
  );
}
```

### With Controls

```tsx
import { useRef } from 'react';
import { AsciiScreensaver, AsciiScreensaverRef } from 'ascii-blobs';

function App() {
  const ref = useRef<AsciiScreensaverRef>(null);

  return (
    <>
      <AsciiScreensaver ref={ref} />
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
        <button onClick={() => ref.current?.pause()}>Pause</button>
        <button onClick={() => ref.current?.resume()}>Resume</button>
        <button onClick={() => ref.current?.reset()}>Reset</button>
      </div>
    </>
  );
}
```

## Framework Integration

### Next.js

```tsx
'use client';

import { AsciiScreensaver } from 'ascii-blobs';
import 'ascii-blobs/dist/ascii-blobs.css';

export default function Page() {
  return <AsciiScreensaver />;
}
```

### Vite + React

```tsx
import { AsciiScreensaver } from 'ascii-blobs';
import 'ascii-blobs/dist/ascii-blobs.css';

function App() {
  return <AsciiScreensaver />;
}
```

### Plain HTML + ESM

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/node_modules/ascii-blobs/dist/ascii-blobs.css">
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { AsciiBlobs } from '/node_modules/ascii-blobs/dist/vanilla.mjs';
    new AsciiBlobs('#app');
  </script>
</body>
</html>
```

## TypeScript

Full TypeScript support included:

```tsx
import type { 
  AsciiBlobsConfig, 
  AsciiScreensaverRef,
  CloudBlob 
} from 'ascii-blobs';

const config: AsciiBlobsConfig = {
  blobBehavior: { count: 6 },
  onBlobSpawn: (blob: CloudBlob) => {
    console.log(blob);
  },
};

const ref = useRef<AsciiScreensaverRef>(null);
```

## Bundle Size

- Full package: ~40KB (gzipped)
- React bundle: ~8KB + 5KB CSS
- Vanilla bundle: ~9KB + 5KB CSS
- Zero runtime dependencies (React is peer dependency)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported

## Performance Tips

1. **Mobile devices**: Reduce blob count to 3-4
2. **Low-end devices**: Increase cellSize to 18-20
3. **High refresh rate**: Set frameInterval to 16 for 60 FPS
4. **Background usage**: Lower frameInterval to 50-100

## Troubleshooting

### Styles not loading

Make sure to import the CSS:
```tsx
import 'ascii-blobs/dist/ascii-blobs.css';
```

### Canvas not showing

Ensure parent has dimensions:
```tsx
<div style={{ width: '100%', height: '100vh', position: 'relative' }}>
  <AsciiScreensaver />
</div>
```

### TypeScript errors

Make sure types are installed:
```bash
npm install --save-dev @types/react
```

## More Examples

See the `/examples` directory in the repository for more usage examples.

For detailed customization options, see [CUSTOMIZATION.md](./CUSTOMIZATION.md).

For API reference, see [API.md](./API.md).
