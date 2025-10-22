import { AsciiScreensaver, getThemeClassName } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

export default function ThemedExample() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <AsciiScreensaver className={getThemeClassName('catppuccin-mocha')} />
    </div>
  );
}
