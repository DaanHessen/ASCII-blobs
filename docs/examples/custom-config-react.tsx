import { AsciiBlobs } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

export default function CustomConfigExample() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <AsciiBlobs
        characters=" ░▒▓█"
        blobBehavior={{
          count: 5,
          minSpeed: 4,
          maxSpeed: 8,
        }}
        animation={{
          frameInterval: 33,
          revealDuration: 2000,
        }}
      />
    </div>
  );
}
