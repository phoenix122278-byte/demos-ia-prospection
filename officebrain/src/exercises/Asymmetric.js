// Ex 7 — Réaction asymétrique : carré → gauche, cercle → droite (+ pièges).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedbackFrame, GameHud, TimerBar, scoreTrials, tapProps, useTrials } from '../components/game';
import { colors } from '../theme';
import { pick } from '../utils';

const NORMAL = '#5E35B1';
const TRAP = '#FB8C00';
const CONFIG = [
  { total: 20, limit: 1600, shapes: ['square', 'circle'], trapRate: 0 },
  { total: 24, limit: 1300, shapes: ['square', 'circle', 'square', 'circle', 'triangle'], trapRate: 0 },
  { total: 28, limit: 1000, shapes: ['square', 'circle', 'square', 'circle', 'triangle'], trapRate: 0.3 },
];

function Shape({ kind, color }) {
  if (kind === 'square') return <View style={[styles.square, { backgroundColor: color }]} />;
  if (kind === 'circle') return <View style={[styles.circle, { backgroundColor: color }]} />;
  return <View style={[styles.triangle, { borderBottomColor: color }]} />;
}

export default function Asymmetric({ level, onFinish }) {
  const cfg = CONFIG[level];
  const t = useTrials({
    total: cfg.total,
    limit: cfg.limit,
    makeStimulus: () => {
      const kind = pick(cfg.shapes);
      const trap = kind !== 'triangle' && Math.random() < cfg.trapRate;
      let expected = null; // triangle : ne rien toucher
      if (kind === 'square') expected = trap ? 'right' : 'left';
      if (kind === 'circle') expected = trap ? 'left' : 'right';
      return { kind, trap, expected };
    },
    onDone: (res) => onFinish(scoreTrials(res, { rtBest: 400, rtWorst: cfg.limit, accWeight: 0.8 })),
  });

  if (!t.stimulus) return null;
  const Zone = ({ side, label }) => (
    <Pressable
      {...tapProps(() => t.respond(side))}
      style={({ pressed }) => [styles.zone, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <Text style={styles.zoneTitle}>{side === 'left' ? '◀ GAUCHE' : 'DROITE ▶'}</Text>
      <Text style={styles.zoneLabel}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <GameHud index={t.index} total={t.total} label="Forme" />
      <TimerBar key={t.index} duration={cfg.limit} running={!t.feedback} />
      <FeedbackFrame feedback={t.feedback === 'timeout' && t.stimulus.expected === null ? 'ok' : t.feedback} style={styles.stage}>
        <Shape kind={t.stimulus.kind} color={t.stimulus.trap ? TRAP : NORMAL} />
      </FeedbackFrame>
      <Text style={styles.reminder}>
        {level >= 1 ? '▲ Triangle = ne rien toucher' : ' '}
        {level >= 2 ? '   ·   🟧 Orange = règle inversée' : ''}
      </Text>
      <View style={styles.zones}>
        <Zone side="left" label="■ Carré" />
        <Zone side="right" label="● Cercle" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 220 },
  square: { width: 110, height: 110, borderRadius: 8 },
  circle: { width: 116, height: 116, borderRadius: 58 },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 64,
    borderRightWidth: 64,
    borderBottomWidth: 110,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  reminder: { textAlign: 'center', color: colors.textSoft, fontWeight: '700', marginVertical: 12, fontSize: 13 },
  zones: { flex: 1, flexDirection: 'row', gap: 10, minHeight: 160 },
  zone: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  zoneLabel: { marginTop: 6, color: colors.textSoft, fontWeight: '600' },
});
