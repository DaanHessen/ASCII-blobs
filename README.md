# ASCII Blobs Background Library

A unique TypeScript/React library for creating organic, animated ASCII character backgrounds using gaussian blob/metaball rendering techniques.

## 🎨 What Makes This Unique

This library uses a sophisticated **gaussian-based blob/metaball system** to create organic, cloud-like ASCII animations. Unlike other ASCII libraries that focus on:
- Perlin noise patterns (like ASCIIGround)
- Matrix-style rain effects
- Static ASCII art playback

**ASCII Blobs** offers:
- ✨ Autonomous organic blob movement with realistic physics
- 🌊 Elliptical rotation, pulsing, and wobbling animations
- 🎯 Gaussian falloff calculations with LUT optimization
- 💫 Lifecycle management (fade in/out, spawn/respawn)
- 🎨 Pre-rendered glyphs with glow and shadow effects
- 🖼️ Dual-layer canvas with sophisticated blend modes
- ⚡ High-performance rendering (22 FPS target)

## 📦 Files in This Directory

- `AsciiScreensaver.tsx` - Main React component with all the blob rendering logic
- `AsciiScreensaver.css` - Styling with layered backgrounds and visual effects

## 🚀 Next Steps

We'll transform this into a full library with:
1. ✅ Package setup (package.json, tsconfig, etc.)
2. ✅ Library build configuration
3. ✅ API design for easy customization
4. ✅ Documentation
5. ✅ Examples
6. ✅ TypeScript definitions
7. ✅ Multi-framework support (React, Vue, vanilla JS)

## 🎯 Target API (Draft)

```tsx
import { AsciiBlobs } from 'ascii-blobs';

<AsciiBlobs
  blobCount={4}
  colors={{
    primary: '#60a5fa',
    secondary: '#3b82f6'
  }}
  characters={[' ', '.', ':', ';', '+', '*', '#', '@']}
  animationSpeed={1.0}
/>
```

## 📊 Current Features (from source)

- Gaussian lookup table (LUT) for performance optimization
- Cloud blob system with:
  - Position, rotation, radius (X/Y)
  - Velocity and wobble physics
  - Lifecycle management
- Grid-based cell rendering
- Character palette with intensity mapping
- Reveal animation system
- Responsive canvas handling
- Device pixel ratio support

## 🎨 Visual Features

- Radial gradient backgrounds
- Blur effects on backdrop
- Blend modes (screen, soft-light)
- Vignette overlays
- Animated texture patterns
- Glow effects on characters

---

**Original Author**: Daan Hessen
**Source**: Personal portfolio project (daanhessen.nl)
**License**: TBD (MIT suggested)
