export type ThemeName = 'default' | 'ocean' | 'purple' | 'green' | 'amber' | 'monochrome';

export const themes = {
  default: 'ascii-screensaver',
  ocean: 'ascii-screensaver ascii-screensaver--theme-ocean',
  purple: 'ascii-screensaver ascii-screensaver--theme-purple',
  green: 'ascii-screensaver ascii-screensaver--theme-green',
  amber: 'ascii-screensaver ascii-screensaver--theme-amber',
  monochrome: 'ascii-screensaver ascii-screensaver--theme-monochrome',
} as const;

export function getThemeClassName(theme: ThemeName = 'default'): string {
  return themes[theme];
}
