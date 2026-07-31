import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { AsciiBlobsConfig } from '../core/config';
import { mergeConfig } from '../core/config';
import { AsciiBlobsEngine } from '../core/engine';
import type { EngineStats } from '../core/engine';
import './AsciiBlobs.css';

export interface AsciiBlobsRef {
  pause: () => void;
  resume: () => void;
  reset: () => void;
  getStats: () => EngineStats;
}

const AsciiBlobs = forwardRef<AsciiBlobsRef, AsciiBlobsConfig>((userConfig, ref) => {
  const config = useMemo(() => mergeConfig(userConfig), [userConfig]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AsciiBlobsEngine | null>(null);
  const onReadyRef = useRef(config.onReady);
  onReadyRef.current = config.onReady;

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    reset: () => engineRef.current?.reset(),
    getStats: () =>
      engineRef.current?.getStats() ?? {
        fps: 0,
        isPaused: true,
        renderer: null,
        columns: 0,
        rows: 0,
      },
  }));

  // The engine is created once and reconfigured in place. Rebuilding it on
  // every config change would restart the reveal animation and reshuffle the
  // blobs, which is jarring when a caller is only tweaking a colour.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const engine = new AsciiBlobsEngine(canvas, config);
    engineRef.current = engine;
    engine.start();
    onReadyRef.current?.();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.updateConfig(config);
  }, [config]);

  const inlineStyle = useMemo(() => {
    const variables: Record<string, string> = {
      '--ascii-ink': config.colors.primary,
      '--ascii-ink-shadow': config.colors.inkShadow,
    };
    if (config.colors.background) {
      variables['--ascii-bg'] = config.colors.background;
    }
    return { ...variables, ...(config.style ?? {}) } as CSSProperties;
  }, [config]);

  return (
    <div className={`ascii-blobs ${config.className ?? ''}`} style={inlineStyle} aria-hidden="true">
      <canvas ref={canvasRef} className="ascii-blobs__canvas" />
      <div className="ascii-blobs__grain" />
    </div>
  );
});

AsciiBlobs.displayName = 'AsciiBlobs';

export default AsciiBlobs;
