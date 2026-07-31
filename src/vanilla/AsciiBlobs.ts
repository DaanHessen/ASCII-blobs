import type { AsciiBlobsConfig } from '../core/config';
import { mergeConfig } from '../core/config';
import { AsciiBlobsEngine } from '../core/engine';
import type { EngineStats } from '../core/engine';

/**
 * Framework-free mount. Both this and the React component are shells around
 * the same engine — the previous release carried two copies of the render loop
 * that had already drifted apart.
 */
export class AsciiBlobs {
  private readonly root: HTMLElement;
  private readonly engine: AsciiBlobsEngine;

  constructor(target: HTMLElement | string, userConfig: AsciiBlobsConfig = {}) {
    const container =
      typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!container) {
      throw new Error(`ascii-blobs: no element matched ${String(target)}`);
    }

    const config = mergeConfig(userConfig);

    this.root = document.createElement('div');
    this.root.className = `ascii-blobs ${config.className ?? ''}`.trim();
    this.root.setAttribute('aria-hidden', 'true');
    this.root.style.setProperty('--ascii-ink', config.colors.primary);
    this.root.style.setProperty('--ascii-ink-shadow', config.colors.inkShadow);
    if (config.colors.background) {
      this.root.style.setProperty('--ascii-bg', config.colors.background);
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'ascii-blobs__canvas';
    this.root.appendChild(canvas);

    const grain = document.createElement('div');
    grain.className = 'ascii-blobs__grain';
    this.root.appendChild(grain);

    container.appendChild(this.root);

    this.engine = new AsciiBlobsEngine(canvas, config);
    this.engine.start();
    config.onReady?.();
  }

  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  reset(): void {
    this.engine.reset();
  }

  getStats(): EngineStats {
    return this.engine.getStats();
  }

  updateConfig(config: AsciiBlobsConfig): void {
    this.engine.updateConfig(mergeConfig(config));
  }

  destroy(): void {
    this.engine.destroy();
    this.root.remove();
  }
}

export default AsciiBlobs;
