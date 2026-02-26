export type ThemeMode = 'Light' | 'Dark' | 'Blackout';

export const APPEARANCE_STORAGE_KEY = 'appearance-mode';

export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'Light';
  const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (stored === 'Dark' || stored === 'Blackout' || stored === 'Light') {
    return stored;
  }
  return 'Light';
}

export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (mode === 'Dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (mode === 'Blackout') {
    root.setAttribute('data-theme', 'blackout');
  } else {
    root.removeAttribute('data-theme');
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
  }
}
