// Petites fonctions utilitaires partagées (aléatoire, dates, statistiques).
import { useEffect, useMemo, useRef } from 'react';

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Générateur pseudo-aléatoire déterministe (même programme du jour toute la journée).
export function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Date locale au format AAAA-MM-JJ.
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Les n derniers jours (du plus ancien à aujourd'hui).
export function lastNDays(n = 7) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({ key: dateKey(d), label: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()], date: d });
  }
  return out;
}

// Timers nettoyés automatiquement au démontage du composant.
export function useTimers() {
  const ids = useRef(new Set());
  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);
  return useMemo(
    () => ({
      after(ms, fn) {
        const id = setTimeout(() => {
          ids.current.delete(id);
          fn();
        }, ms);
        ids.current.add(id);
        return id;
      },
      clear(id) {
        clearTimeout(id);
        ids.current.delete(id);
      },
      clearAll() {
        ids.current.forEach(clearTimeout);
        ids.current.clear();
      },
    }),
    []
  );
}
