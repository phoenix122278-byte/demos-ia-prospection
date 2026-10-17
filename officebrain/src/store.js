// Stockage 100 % local (AsyncStorage) : habiletés, historique JSON et programme du jour.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISE_IDS } from './exercises/meta';
import { applyResult } from './progression';
import { dateKey, seededRandom } from './utils';

const STORAGE_KEY = 'officebrain:data:v1';
const MAX_HISTORY = 3000;

const emptySkill = () => ({ skill: 0, unlocked: 0, plays: 0, best: 0, lastPlayed: null });

export function defaultData() {
  return {
    version: 1,
    createdAt: Date.now(),
    skills: Object.fromEntries(EXERCISE_IDS.map((id) => [id, emptySkill()])),
    history: [],
    daily: null,
  };
}

// Complète les données chargées si de nouveaux exercices ont été ajoutés.
function migrate(raw) {
  const base = defaultData();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    skills: { ...base.skills, ...(raw.skills || {}) },
    history: Array.isArray(raw.history) ? raw.history : [],
  };
}

// Programme du jour : 3 exercices, en priorité ceux pas pratiqués depuis
// longtemps et ceux où l'habileté est la plus faible. Stable sur la journée.
export function buildDailyProgram(data, today = dateKey()) {
  const rng = seededRandom(`officebrain-${today}`);
  const now = Date.now();
  const scored = EXERCISE_IDS.map((id) => {
    const s = data.skills[id];
    const days = s.lastPlayed ? Math.min(7, (now - s.lastPlayed) / 86400000) : 7;
    return { id, weight: days * 1.5 + (100 - s.skill) / 25 + rng() * 4 };
  });
  scored.sort((a, b) => b.weight - a.weight);
  return { date: today, ids: scored.slice(0, 3).map((s) => s.id), done: [] };
}

export function computeStreak(history) {
  const days = new Set(history.map((h) => h.date));
  let streak = 0;
  const d = new Date();
  if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(null);
  const dataRef = useRef(null);

  const commit = useCallback((next) => {
    dataRef.current = next;
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
      console.warn('Sauvegarde locale impossible', e)
    );
  }, []);

  useEffect(() => {
    (async () => {
      let loaded;
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        loaded = migrate(json ? JSON.parse(json) : null);
      } catch (e) {
        console.warn('Lecture locale impossible, données réinitialisées', e);
        loaded = defaultData();
      }
      if (!loaded.daily || loaded.daily.date !== dateKey()) loaded.daily = buildDailyProgram(loaded);
      commit(loaded);
    })();
  }, [commit]);

  const getDaily = useCallback(() => {
    const cur = dataRef.current;
    if (cur.daily && cur.daily.date === dateKey()) return cur.daily;
    const daily = buildDailyProgram(cur);
    commit({ ...cur, daily });
    return daily;
  }, [commit]);

  const recordResult = useCallback(
    (exId, level, score, details, fromProgram = false) => {
      const cur = dataRef.current;
      const outcome = applyResult(cur.skills[exId], score, level);
      const now = Date.now();
      const entry = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        exId,
        level,
        score,
        details,
        skillAfter: outcome.after,
        program: fromProgram,
        ts: now,
        date: dateKey(new Date(now)),
      };
      let daily = cur.daily;
      if (fromProgram && daily && daily.date === entry.date && !daily.done.includes(exId)) {
        daily = { ...daily, done: [...daily.done, exId] };
      }
      commit({
        ...cur,
        skills: { ...cur.skills, [exId]: outcome.entry },
        history: [...cur.history, entry].slice(-MAX_HISTORY),
        daily,
      });
      return outcome;
    },
    [commit]
  );

  const resetAll = useCallback(() => {
    const fresh = defaultData();
    fresh.daily = buildDailyProgram(fresh);
    commit(fresh);
  }, [commit]);

  const value = useMemo(
    () => ({ ready: !!data, data, getDaily, recordResult, resetAll }),
    [data, getDaily, recordResult, resetAll]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
