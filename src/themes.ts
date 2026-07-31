/**
 * Themes are two colours and a background. The renderer derives everything
 * else — lit faces, shadowed faces, ramp density — from the lighting model, so
 * a theme that names more than three colours is a theme that is fighting it.
 */
export type ThemeName = 'slate' | 'paper' | 'terminal' | 'oxide';

export const themes = {
  slate: 'ascii-blobs--theme-slate',
  paper: 'ascii-blobs--theme-paper',
  terminal: 'ascii-blobs--theme-terminal',
  oxide: 'ascii-blobs--theme-oxide',
} as const satisfies Record<ThemeName, string>;

export function getThemeClassName(theme: ThemeName = 'slate'): string {
  return themes[theme];
}
