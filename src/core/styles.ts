const GLOBAL_FLAG = '__ASCII_BLOBS_STYLES__';

const getGlobalScope = (): Record<string, unknown> | null => {
  if (typeof globalThis !== 'undefined') {
    return globalThis as unknown as Record<string, unknown>;
  }
  if (typeof window !== 'undefined') {
    return window as unknown as Record<string, unknown>;
  }
  return null;
};

export const ensureAsciiBlobsStyles = (css: string | undefined): void => {
  if (!css || typeof document === 'undefined') {
    return;
  }

  const globalScope = getGlobalScope();
  if (globalScope) {
    if (globalScope[GLOBAL_FLAG]) {
      return;
    }
    globalScope[GLOBAL_FLAG] = true;
  }

  const existing = document.querySelector('style[data-ascii-blobs-styles]');
  if (existing) {
    return;
  }

  const style = document.createElement('style');
  style.setAttribute('data-ascii-blobs-styles', 'true');
  style.textContent = css;
  document.head.appendChild(style);
};
