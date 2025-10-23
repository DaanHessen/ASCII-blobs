export type ThemeName = 'default' | 'catppuccin-mocha' | 'catppuccin-latte' | 'dracula' | 'nord' | 'gruvbox' | 'tokyo-night';

export const themes = {
  default: 'ascii-blobs',
  'catppuccin-mocha': 'ascii-blobs ascii-blobs--theme-catppuccin-mocha',
  'catppuccin-latte': 'ascii-blobs ascii-blobs--theme-catppuccin-latte',
  dracula: 'ascii-blobs ascii-blobs--theme-dracula',
  nord: 'ascii-blobs ascii-blobs--theme-nord',
  gruvbox: 'ascii-blobs ascii-blobs--theme-gruvbox',
  'tokyo-night': 'ascii-blobs ascii-blobs--theme-tokyo-night',
} as const;

export function getThemeClassName(theme: ThemeName = 'default'): string {
  return themes[theme];
}
