// Ex 6 — Calcul / comptage à rebours sous chrono.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TimerBar, tapProps } from '../components/game';
import { colors } from '../theme';
import { randInt, useTimers } from '../utils';

const CONFIG = [
  { start: () => 100, ops: [-3], seconds: 45, target: 12 },
  { start: () => randInt(170, 199), ops: [-7], seconds: 45, target: 12 },
  { start: () => randInt(320, 399), ops: [-13, +4], seconds: 40, target: 12 },
];
const fmtOp = (op) => (op < 0 ? `− ${-op}` : `+ ${op}`);

export default function Countdown({ level, onFinish }) {
  const cfg = CONFIG[level];
  const timers = useTimers();
  const st = useRef(null);
  if (!st.current) st.current = { startValue: cfg.start(), correct: 0, errors: 0, done: false };
  const [current, setCurrent] = useState(st.current.startValue);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState(null);
  const [left, setLeft] = useState(cfg.seconds);

  const op = cfg.ops[step % cfg.ops.length];
  const expected = current + op;

  const finish = () => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    const score = Math.round(Math.max(0, Math.min(1, (s.correct - s.errors * 0.5) / cfg.target)) * 100);
    onFinish({ score, details: `${s.correct} bonnes réponses · ${s.errors} erreur${s.errors > 1 ? 's' : ''}` });
  };

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    timers.after(cfg.seconds * 1000, finish);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = (k) => {
    if (st.current.done) return;
    if (k === '⌫') return setInput((v) => v.slice(0, -1));
    if (k === '−') return setInput((v) => (v.startsWith('-') ? v.slice(1) : '-' + v));
    if (k === 'OK') {
      if (!input || input === '-') return;
      if (Number(input) === expected) {
        st.current.correct++;
        setCurrent(expected);
        setStep((s) => s + 1);
        setFlash('ok');
      } else {
        st.current.errors++;
        setFlash('ko');
      }
      setInput('');
      timers.after(250, () => setFlash(null));
      return;
    }
    setInput((v) => (v.replace('-', '').length < 4 ? v + k : v));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.top}>
        <Text style={styles.rule}>
          Règle : {cfg.ops.length > 1 ? `alterner ${cfg.ops.map(fmtOp).join(' puis ')}` : fmtOp(op)}
        </Text>
        <Text style={[styles.time, left <= 10 && { color: colors.danger }]}>⏱ {Math.max(0, left)} s</Text>
      </View>
      <TimerBar duration={cfg.seconds * 1000} color={left <= 10 ? colors.danger : colors.primary} />
      <View
        style={[
          styles.display,
          flash === 'ok' && { borderColor: colors.success },
          flash === 'ko' && { borderColor: colors.danger },
        ]}
      >
        <Text style={styles.calc}>
          {current} {fmtOp(op)} =
        </Text>
        <Text style={styles.input}>{input || '?'}</Text>
        <Text style={styles.count}>
          ✅ {st.current.correct} · ❌ {st.current.errors}
        </Text>
      </View>
      <View style={styles.keypad}>
        {keys.map((k) => (
          <Pressable key={k} {...tapProps(() => press(k))} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
        <Pressable {...tapProps(() => press('OK'))} style={({ pressed }) => [styles.ok, pressed && { opacity: 0.8 }]}>
          <Text style={styles.okText}>Valider ✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rule: { fontWeight: '800', color: colors.text, fontSize: 15 },
  time: { fontWeight: '800', color: colors.textSoft, fontSize: 15 },
  display: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 14,
  },
  calc: { fontSize: 30, fontWeight: '800', color: colors.textSoft },
  input: { fontSize: 50, fontWeight: '900', color: colors.text, marginTop: 4 },
  count: { color: colors.textSoft, marginTop: 6, fontWeight: '600' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  key: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  keyPressed: { backgroundColor: colors.primarySoft },
  keyText: { fontSize: 24, fontWeight: '700', color: colors.text },
  ok: { width: '97%', paddingVertical: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' },
  okText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
