export type ConsentMode = 'gdpr' | 'privacy';

export type ConsentPreferences = {
  functional: boolean;
  analytics: boolean;
  updatedAt: string;
  version: 1;
};

export const CONSENT_STORAGE_KEY = 'consent_preferences_v1';
export const CONSENT_MODE_KEY = 'consent_mode_v1';

export function loadConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (typeof parsed.functional !== 'boolean' || typeof parsed.analytics !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(prefs: ConsentPreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
}

export function clearConsent() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
}

export function getConsentModeFromUrl(): ConsentMode | null {
  if (typeof window === 'undefined') return null;
  const mode = new URLSearchParams(window.location.search).get('consent');
  if (mode === 'privacy' || mode === 'gdpr') return mode;
  return null;
}

export function getStoredConsentMode(): ConsentMode | null {
  if (typeof window === 'undefined') return null;
  const mode = window.localStorage.getItem(CONSENT_MODE_KEY);
  if (mode === 'privacy' || mode === 'gdpr') return mode;
  return null;
}

export function setStoredConsentMode(mode: ConsentMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_MODE_KEY, mode);
}

export function emitConsentEvent(type: string, detail: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function hasAnalyticsConsent(): boolean {
  const consent = loadConsent();
  return consent?.analytics === true;
}

export function hasFunctionalConsent(): boolean {
  const consent = loadConsent();
  return consent?.functional === true;
}
