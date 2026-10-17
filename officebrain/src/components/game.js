// Briques communes aux exercices : moteur d'essais, chrono, retour visuel, score.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { clamp, mean, useTimers } from '../utils';

// Réponse au toucher : onPressIn en natif (réaction immédiate au contact),
// onPress sur le web (les clics souris très brefs ne déclenchent pas toujours onPressIn).
export const tapProps = (fn) => (Platform.OS === 'web' ? { onPress: fn } : { onPressIn: fn });

/**
 * Moteur générique pour les exercices « stimulus → réponse ».
 * - makeStimulus(i, prev) doit renvoyer un objet avec `expected` (null = ne rien faire).
 * - limit : temps max (ms) par essai, ou fonction (stim) => ms, ou null.
 * - onDone(results) est appelé à la fin avec [{ ok, rt, timedOut, value, expected }].
 */
export function useTrials(opts) {
  const timers = useTimers();
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [view, setView] = useState({ index: 0, stimulus: null, feedback: null });
  const engine = useRef(null);

  if (!engine.current) {
    const st = { results: [], stimulus: null, start: 0, locked: true, limitId: null, index: 0 };
    const respond = (value, timedOut = false) => {
      if (st.locked) return;
      st.locked = true;
      if (st.limitId) timers.clear(st.limitId);
      st.limitId = null;
      const rt = Date.now() - st.start;
      const ok = value === st.stimulus.expected;
      st.results.push({ ok, rt, timedOut, value, expected: st.stimulus.expected });
      setView((v) => ({ ...v, feedback: ok ? 'ok' : timedOut ? 'timeout' : 'ko' }));
      timers.after(optsRef.current.feedbackMs ?? 350, () => show(st.index + 1));
    };
    const show = (i) => {
      const o = optsRef.current;
      if (i >= o.total) {
        o.onDone(st.results);
        return;
      }
      const stim = o.makeStimulus(i, st.stimulus);
      Object.assign(st, { index: i, stimulus: stim, start: Date.now(), locked: false });
      setView({ index: i, stimulus: stim, feedback: null });
      const lim = typeof o.limit === 'function' ? o.limit(stim, i) : o.limit;
      if (lim) st.limitId = timers.after(lim, () => respond(null, true));
    };
    engine.current = { show, respond };
  }

  useEffect(() => {
    engine.current.show(0);
  }, []);

  return { ...view, respond: engine.current.respond, total: opts.total };
}

/**
 * Score 0–100 combinant précision et vitesse (la vitesse ne compte
 * qu'au prorata de la précision, pour ne pas récompenser le hasard).
 */
export function scoreTrials(results, { rtBest = 500, rtWorst = 2000, accWeight = 0.75 } = {}) {
  const n = results.length || 1;
  const correct = results.filter((r) => r.ok).length;
  const acc = correct / n;
  const rts = results.filter((r) => r.ok && r.value !== null).map((r) => r.rt);
  const avg = rts.length ? mean(rts) : rtWorst;
  const speed = clamp((rtWorst - avg) / (rtWorst - rtBest), 0, 1);
  const score = Math.round(100 * (acc * accWeight + speed * (1 - accWeight) * acc));
  const details = `${correct}/${n} bonnes réponses${rts.length ? ` · ${Math.round(avg)} ms en moyenne` : ''}`;
  return { score, details };
}

export function GameHud({ index, total, label = 'Essai', extra }) {
  return (
    <View style={styles.hud}>
      <Text style={styles.hudText}>
        {label} {Math.min(index + 1, total)}/{total}
      </Text>
      {extra ? <Text style={styles.hudText}>{extra}</Text> : null}
    </View>
  );
}

// Barre de temps qui se vide. Changez la `key` pour la relancer.
export function TimerBar({ duration, running = true, color = colors.primary }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!running) {
      v.stopAnimation();
      return undefined;
    }
    const anim = Animated.timing(v, { toValue: 0, duration, easing: Easing.linear, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [duration, running, v]);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.timerTrack}>
      <Animated.View style={[styles.timerFill, { width, backgroundColor: color }]} />
    </View>
  );
}

// Cadre qui s'illumine en vert / rouge selon la réponse.
export function FeedbackFrame({ feedback, children, style }) {
  const border = feedback === 'ok' ? colors.success : feedback ? colors.danger : 'transparent';
  return (
    <View style={[styles.frame, { borderColor: border }, style]}>
      {children}
      {feedback === 'timeout' ? <Text style={styles.timeout}>⏱ Trop lent</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  hudText: { fontSize: 14, fontWeight: '700', color: colors.textSoft },
  timerTrack: { height: 6, backgroundColor: colors.track, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  timerFill: { height: 6, borderRadius: 3 },
  frame: {
    borderWidth: 4,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  timeout: { position: 'absolute', bottom: 10, color: colors.danger, fontWeight: '700' },
});
