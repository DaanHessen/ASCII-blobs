import { AsciiBlobs, getThemeClassName } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

export default function ThemedExample() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <AsciiBlobs className={getThemeClassName('catppuccin-mocha')} />
    </div>
  );
}
