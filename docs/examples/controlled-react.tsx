import { useRef } from 'react';
import { AsciiScreensaver, AsciiScreensaverRef } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

export default function ControlledExample() {
  const ref = useRef<AsciiScreensaverRef>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <AsciiScreensaver ref={ref} />
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        display: 'flex',
        gap: 10,
      }}>
        <button onClick={() => ref.current?.pause()}>
          Pause
        </button>
        <button onClick={() => ref.current?.resume()}>
          Resume
        </button>
        <button onClick={() => ref.current?.reset()}>
          Reset
        </button>
        <button onClick={() => {
          const stats = ref.current?.getStats();
          console.log(stats);
        }}>
          Log Stats
        </button>
      </div>
    </div>
  );
}
