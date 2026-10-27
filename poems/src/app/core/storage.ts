import { WritableSignal, effect, signal } from '@angular/core';

const PREFIX = 'pm.';

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the app keeps working in memory */
  }
}

/** A signal that is hydrated from and persisted to localStorage. Call inside an injection context. */
export function storedSignal<T>(key: string, fallback: T): WritableSignal<T> {
  const s = signal<T>(readStore(key, fallback));
  effect(() => writeStore(key, s()));
  return s;
}
