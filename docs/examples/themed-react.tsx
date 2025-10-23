import { AsciiBlobs, getThemeClassName } from 'ascii-blobs';
import 'ascii-blobs/dist/style.css';

export default function ThemedExample() {
  return (
    <div>
      <AsciiBlobs className={getThemeClassName('catppuccin-mocha')} />
      <main>
        <h1>Catppuccin Mocha Theme</h1>
      </main>
    </div>
  );
}
