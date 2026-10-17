// Ex 2 — Suivi de cibles multiples (MOT) : retrouvez les 2 pastilles initiales.
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameHud, tapProps } from '../components/game';
import { colors } from '../theme';
import { rand, shuffle, useTimers } from '../utils';

const DOT = 46;
const TARGETS = 2;
const CONFIG = [
  { n: 5, speed: 90, moveMs: 5000, rounds: 4 },
  { n: 7, speed: 140, moveMs: 6000, rounds: 4 },
  { n: 9, speed: 195, moveMs: 7000, rounds: 4 },
];

export default function Tracking({ level, onFinish }) {
  const cfg = CONFIG[level];
  const timers = useTimers();
  const [area, setArea] = useState(null);
  const [phase, setPhase] = useState('wait'); // wait | show | move | select | feedback
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState([]);
  const [, redraw] = useReducer((x) => x + 1, 0);
  const dots = useRef([]);
  const targets = useRef([]);
  const correct = useRef(0);

  const startRound = (r) => {
    const { w, h } = area;
    const placed = [];
    for (let i = 0; i < cfg.n; i++) {
      let p;
      for (let tries = 0; tries < 60; tries++) {
        p = { x: rand(0, w - DOT), y: rand(0, h - DOT) };
        if (placed.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > DOT * 1.3)) break;
      }
      const a = rand(0, Math.PI * 2);
      placed.push({ ...p, vx: Math.cos(a) * cfg.speed, vy: Math.sin(a) * cfg.speed });
    }
    dots.current = placed;
    targets.current = shuffle([...Array(cfg.n).keys()]).slice(0, TARGETS);
    setRound(r);
    setPicked([]);
    setPhase('show');
    timers.after(2200, () => setPhase('move'));
  };

  useEffect(() => {
    if (area && phase === 'wait') startRound(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  // Boucle d'animation : rebonds sur les bords et légers changements de cap.
  useEffect(() => {
    if (phase !== 'move') return undefined;
    let raf;
    let last = Date.now();
    const end = last + cfg.moveMs;
    const step = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { w, h } = area;
      for (const d of dots.current) {
        if (Math.random() < 0.02) {
          const a = Math.atan2(d.vy, d.vx) + rand(-0.8, 0.8);
          d.vx = Math.cos(a) * cfg.speed;
          d.vy = Math.sin(a) * cfg.speed;
        }
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.x < 0) (d.x = 0), (d.vx = Math.abs(d.vx));
        if (d.x > w - DOT) (d.x = w - DOT), (d.vx = -Math.abs(d.vx));
        if (d.y < 0) (d.y = 0), (d.vy = Math.abs(d.vy));
        if (d.y > h - DOT) (d.y = h - DOT), (d.vy = -Math.abs(d.vy));
      }
      redraw();
      if (now >= end) {
        setPhase('select');
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, area, cfg]);

  const onPick = (i) => {
    if (phase !== 'select' || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === TARGETS) {
      correct.current += next.filter((p) => targets.current.includes(p)).length;
      setPhase('feedback');
      timers.after(1500, () => {
        if (round + 1 >= cfg.rounds) {
          const total = cfg.rounds * TARGETS;
          onFinish({
            score: Math.round((correct.current / total) * 100),
            details: `${correct.current}/${total} cibles retrouvées`,
          });
        } else startRound(round + 1);
      });
    }
  };

  const dotColor = (i) => {
    const isTarget = targets.current.includes(i);
    if (phase === 'show') return isTarget ? colors.warning : colors.primary;
    if (phase === 'feedback') {
      if (picked.includes(i)) return isTarget ? colors.success : colors.danger;
      if (isTarget) return colors.warning;
    }
    if (phase === 'select' && picked.includes(i)) return colors.primaryDark;
    return colors.primary;
  };

  const msg = {
    wait: '',
    show: '👀 Mémorisez les 2 pastilles jaunes',
    move: 'Suivez-les des yeux…',
    select: `Touchez les 2 pastilles initiales (${picked.length}/${TARGETS})`,
    feedback: 'Vert = trouvé · Jaune = cible manquée',
  }[phase];

  return (
    <View style={{ flex: 1 }}>
      <GameHud index={round} total={cfg.rounds} label="Manche" />
      <Text style={styles.msg}>{msg}</Text>
      <View
        style={styles.arena}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (!area) setArea({ w: width - 8, h: height - 8 });
        }}
      >
        {area &&
          dots.current.map((d, i) => (
            <Pressable
              key={i}
              {...tapProps(() => onPick(i))}
              hitSlop={6}
              style={[
                styles.dot,
                { left: d.x, top: d.y, backgroundColor: dotColor(i) },
                phase === 'show' && targets.current.includes(i) && styles.flash,
                phase === 'select' && picked.includes(i) && styles.picked,
              ]}
            />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  msg: { textAlign: 'center', fontWeight: '700', color: colors.text, marginBottom: 10, minHeight: 20 },
  arena: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    overflow: 'hidden',
  },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, marginLeft: 4, marginTop: 4 },
  flash: { borderWidth: 4, borderColor: '#FDE68A' },
  picked: { borderWidth: 4, borderColor: '#A5B4FC' },
});
