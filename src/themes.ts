export type ThemeName = 'default' | 'catppuccin-mocha' | 'catppuccin-latte' | 'dracula' | 'nord' | 'gruvbox' | 'tokyo-night';

export const themes = {
  default: 'ascii-screensaver',
  'catppuccin-mocha': 'ascii-screensaver ascii-screensaver--theme-catppuccin-mocha',
  'catppuccin-latte': 'ascii-screensaver ascii-screensaver--theme-catppuccin-latte',
  dracula: 'ascii-screensaver ascii-screensaver--theme-dracula',
  nord: 'ascii-screensaver ascii-screensaver--theme-nord',
  gruvbox: 'ascii-screensaver ascii-screensaver--theme-gruvbox',
  'tokyo-night': 'ascii-screensaver ascii-screensaver--theme-tokyo-night',
} as const;

export function getThemeClassName(theme: ThemeName = 'default'): string {
  return themes[theme];
}
