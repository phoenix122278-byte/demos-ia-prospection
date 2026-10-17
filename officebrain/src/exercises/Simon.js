// Ex 3 — Simon : reproduisez la séquence de boutons allumés.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameHud, tapProps } from '../components/game';
import { colors } from '../theme';
import { randInt, useTimers } from '../utils';

const PADS = [
  { off: '#7F1D1D', on: '#F87171', emoji: '📞' },
  { off: '#1E3A8A', on: '#60A5FA', emoji: '📧' },
  { off: '#14532D', on: '#4ADE80', emoji: '📅' },
  { off: '#78350F', on: '#FBBF24', emoji: '📎' },
];
const ROUNDS = 5;
const CONFIG = [
  { start: 3, onMs: 600, gapMs: 250 },
  { start: 4, onMs: 450, gapMs: 200 },
  { start: 5, onMs: 340, gapMs: 150 },
];

export default function Simon({ level, onFinish }) {
  const cfg = CONFIG[level];
  const timers = useTimers();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState('watch'); // watch | input | success | fail
  const [lit, setLit] = useState(null);
  const [progress, setProgress] = useState(0);
  const seq = useRef([]);
  const progressRef = useRef(0);
  const scores = useRef([]);

  const play = (r) => {
    const len = cfg.start + r;
    // Nouvelle séquence à chaque manche, sans répéter 3 fois le même bouton.
    const s = [];
    while (s.length < len) {
      const v = randInt(0, 3);
      if (s.length >= 2 && s[s.length - 1] === v && s[s.length - 2] === v) continue;
      s.push(v);
    }
    seq.current = s;
    setRound(r);
    progressRef.current = 0;
    setProgress(0);
    setPhase('watch');
    const step = cfg.onMs + cfg.gapMs;
    s.forEach((pad, i) => {
      timers.after(700 + i * step, () => setLit(pad));
      timers.after(700 + i * step + cfg.onMs, () => setLit(null));
    });
    timers.after(700 + len * step, () => setPhase('input'));
  };

  useEffect(() => {
    play(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endRound = (value) => {
    scores.current.push(value);
    timers.after(900, () => {
      setLit(null);
      if (round + 1 >= ROUNDS) {
        const score = Math.round((scores.current.reduce((a, b) => a + b, 0) / ROUNDS) * 100);
        const ok = scores.current.filter((v) => v === 1).length;
        onFinish({ score, details: `${ok}/${ROUNDS} séquences parfaites · longueur max ${cfg.start + ROUNDS - 1}` });
      } else play(round + 1);
    });
  };

  const onPad = (i) => {
    if (phase !== 'input') return;
    setLit(i);
    timers.after(160, () => setLit((cur) => (cur === i ? null : cur)));
    const done = progressRef.current;
    if (seq.current[done] !== i) {
      setPhase('fail');
      endRound((done / seq.current.length) * 0.5);
      return;
    }
    const p = done + 1;
    progressRef.current = p;
    setProgress(p);
    if (p === seq.current.length) {
      setPhase('success');
      endRound(1);
    }
  };

  const msg = {
    watch: '👀 Observez la séquence…',
    input: `À vous ! ${progress}/${seq.current.length}`,
    success: '✅ Parfait !',
    fail: '❌ Raté — manche suivante',
  }[phase];

  return (
    <View style={{ flex: 1 }}>
      <GameHud index={round} total={ROUNDS} label="Manche" extra={`Longueur ${cfg.start + round}`} />
      <Text style={[styles.msg, phase === 'fail' && { color: colors.danger }, phase === 'success' && { color: colors.success }]}>
        {msg}
      </Text>
      <View style={styles.board}>
        {PADS.map((p, i) => (
          <Pressable
            key={i}
            {...tapProps(() => onPad(i))}
            style={[styles.pad, { backgroundColor: lit === i ? p.on : p.off }, lit === i && styles.padLit]}
          >
            <Text style={[styles.emoji, { opacity: lit === i ? 1 : 0.5 }]}>{p.emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  msg: { textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text, marginVertical: 12 },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1,
  },
  pad: { width: '46%', height: '46%', borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  padLit: { transform: [{ scale: 1.04 }], shadowColor: '#FFF', shadowOpacity: 0.8, shadowRadius: 16, elevation: 8 },
  emoji: { fontSize: 42 },
});
