# Development Notes & Analysis

## 📋 Component Structure Analysis

### Main Component: `AsciiScreensaver`
- **Type**: React functional component using hooks
- **Core Tech**: Canvas 2D rendering with dual-layer approach
- **State Management**: useRef for performance-critical data
- **Animation**: requestAnimationFrame loop

### Key Data Structures

#### CloudBlob Type
```typescript
{
  cx, cy: number          // Center position
  baseRadiusX/Y: number   // Ellipse dimensions
  rotation: number        // Current rotation angle
  rotationSpeed: number   // Angular velocity
  intensity: number       // Brightness/opacity
  velocityX/Y: number     // Movement speed
  wobbleAmplitude: number // Size variation range
  wobbleSpeed: number     // Frequency of pulsing
  wobblePhase: number     // Phase offset
  life: number           // Remaining lifetime
  maxLife: number        // Total lifespan
}
```

#### State Type
- Grid configuration (columns, rows, offsets)
- Cell arrays (centers, positions, brightness)
- Noise data (jitter, palette bias)
- Pre-rendered glyph atlas
- Active blob instances

### Performance Optimizations

1. **Gaussian LUT**: Pre-computed falloff values
   - Size: 1024 entries
   - Range: 0-8 distance units
   - Formula: `exp(-distanceSq * 1.05)`

2. **Blob Temp Buffers**: Reused arrays to avoid GC
   - centersX/Y, cos/sin, invRadiusX/Y, intensity
   - Resized per frame based on blob count

3. **Character Atlas**: Pre-rendered with effects
   - Uses OffscreenCanvas when available
   - Includes glow and shadow baked in
   - Scaled for devicePixelRatio

4. **Render Throttling**:
   - Frame interval: 1000/22 ms (~45ms)
   - Delta clamping to prevent time jumps
   - Skip rendering if not needed

### Constants & Tuning

```javascript
CELL_SIZE = 14              // Grid cell size in px
FRAME_INTERVAL = 1000/22    // Target ~22 FPS
WRAP_MARGIN = 8             // Soft boundary
SPAWN_MARGIN = 18           // Hard boundary
REVEAL_DURATION = 100       // Initial reveal time
REVEAL_FADE = 520           // Fade-in duration
INTERIOR_MIN/MAX = 0.18/0.82 // Target spawn area
ASCII_PALETTE = 12 chars    // From ' ' to '@'
```

### Blob Lifecycle

1. **Spawn**: Edge of screen, aimed at interior target
2. **Move**: Drift with sinusoidal modulation
3. **Fade In**: 18% of lifespan (fadeIn factor)
4. **Active**: Full intensity period
5. **Fade Out**: Last 25% of lifespan (fadeOut factor)
6. **Respawn**: When life <= 0 or out of bounds

### Rendering Pipeline

1. **Update Phase** (per blob):
   - Calculate drift modulation
   - Update position based on velocity
   - Update rotation
   - Decrease life
   - Check boundaries (soft/hard)

2. **Pre-compute Phase** (per blob):
   - Calculate cos/sin for rotation
   - Apply wobble/pulse to radius
   - Compute fade envelope (fadeIn * fadeOut)
   - Store in temp buffers

3. **Render Phase** (per cell):
   - Check reveal progress
   - Initialize with base brightness
   - For each blob:
     - Transform to local blob coordinates
     - Calculate distance (elliptical)
     - Apply gaussian falloff
     - Accumulate intensity
   - Pick character from palette
   - Draw glyph with alpha

## 🎯 Library Conversion Strategy

### 1. API Design Priorities

**Must Have**:
- Simple drop-in component for React
- Color customization
- Blob count control
- Character set override

**Nice to Have**:
- Animation speed multiplier
- Custom spawn logic
- Size/intensity ranges
- Physics parameter tweaking
- Event callbacks (onBlobSpawn, etc.)

**Advanced**:
- Custom rendering pipeline
- WebGL renderer option
- Multiple blob types/behaviors

### 2. Breaking Down Dependencies

**Current Dependencies**:
- React 18.3+
- CSS imports
- No external libraries! ✨

**For Library**:
- Keep React as peer dependency
- Bundle CSS or provide separate import
- Consider vanilla JS version
- Add Vue wrapper (optional)

### 3. Configuration Schema

```typescript
interface AsciiBlobsConfig {
  // Appearance
  colors?: {
    primary?: string;      // Main glow color
    secondary?: string;    // Accent color
    background?: string;   // Base background
  };
  characters?: string[];   // Custom ASCII palette
  
  // Behavior
  blobCount?: number | 'auto'; // Number of blobs
  animationSpeed?: number;     // Speed multiplier
  fadeInDuration?: number;     // Reveal animation
  
  // Physics (advanced)
  movement?: {
    speedRange?: [number, number];
    radiusRange?: [number, number];
    wobbleRange?: [number, number];
  };
  
  // Performance
  targetFPS?: number;
  cellSize?: number;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

### 4. Build System Requirements

- **Bundler**: Rollup or Vite
- **Formats**: ESM, CJS, UMD
- **TypeScript**: Full type definitions
- **CSS**: Separate file or inline
- **Size Target**: < 50KB minified

### 5. Testing Strategy

- Unit tests for utility functions (gaussian, spawn, etc.)
- Integration tests for blob lifecycle
- Visual regression tests (optional)
- Performance benchmarks

## 🏗️ File Structure (Proposed)

```
ascii-blobs/
├── src/
│   ├── core/
│   │   ├── blob.ts          # Blob creation & update logic
│   │   ├── gaussian.ts      # LUT and falloff functions
│   │   ├── grid.ts          # Grid setup and cell management
│   │   ├── renderer.ts      # Canvas rendering logic
│   │   └── types.ts         # TypeScript definitions
│   ├── components/
│   │   ├── AsciiBlobs.tsx   # Main React component
│   │   └── AsciiBlobs.css   # Component styles
│   ├── vanilla/
│   │   └── index.ts         # Vanilla JS API
│   └── index.ts             # Main entry point
├── dist/                    # Build output
├── examples/
│   ├── react/
│   ├── vue/
│   └── vanilla/
├── package.json
├── tsconfig.json
├── rollup.config.js
└── README.md
```

## 🎨 Customization Points

### Easy Wins:
1. Color themes (map to CSS variables)
2. Character sets (pass array)
3. Blob count (1-10 range)
4. Speed multiplier (0.5x - 2x)

### Medium Effort:
1. Custom spawn strategies
2. Boundary behaviors
3. Lifecycle callbacks
4. Canvas size/scaling

### Complex:
1. Custom physics models
2. Multiple blob types
3. Interactive modes (mouse tracking)
4. WebGL renderer

## 📝 Documentation Outline

1. **Getting Started**
   - Installation
   - Basic usage (React)
   - Basic usage (Vanilla JS)

2. **API Reference**
   - Props/Options
   - Methods (if any)
   - Events/Callbacks

3. **Examples**
   - Different color themes
   - Custom characters
   - Performance tuning
   - Integration examples

4. **Advanced**
   - Architecture overview
   - Custom renderers
   - Performance tips
   - Troubleshooting

5. **Contributing**
   - Development setup
   - Testing
   - Building
   - Submitting PRs

---

**Next Session TODO**:
- [ ] Set up package.json with proper dependencies
- [ ] Create TypeScript configuration
- [ ] Set up build system (Rollup/Vite)
- [ ] Split component into modular files
- [ ] Create configuration interface
- [ ] Add color customization support
- [ ] Write examples
- [ ] Generate documentation
