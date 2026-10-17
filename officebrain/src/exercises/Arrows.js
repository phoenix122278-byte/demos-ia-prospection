// Ex 4 — Inversion des flèches : bleue = même sens, rouge = sens opposé.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedbackFrame, GameHud, TimerBar, scoreTrials, tapProps, useTrials } from '../components/game';
import { colors } from '../theme';
import { pick } from '../utils';

const DIRS = {
  up: { glyph: '↑', opposite: 'down' },
  down: { glyph: '↓', opposite: 'up' },
  left: { glyph: '←', opposite: 'right' },
  right: { glyph: '→', opposite: 'left' },
};
const BLUE = '#1E88E5';
const RED = '#E53935';
const CONFIG = [
  { total: 20, limit: 2000 },
  { total: 24, limit: 1400 },
  { total: 28, limit: 950 },
];

export default function Arrows({ level, onFinish }) {
  const cfg = CONFIG[level];
  const t = useTrials({
    total: cfg.total,
    limit: cfg.limit,
    feedbackMs: 300,
    makeStimulus: () => {
      const dir = pick(Object.keys(DIRS));
      const red = Math.random() < 0.5;
      return { dir, red, expected: red ? DIRS[dir].opposite : dir };
    },
    onDone: (res) => onFinish(scoreTrials(res, { rtBest: 450, rtWorst: cfg.limit })),
  });

  if (!t.stimulus) return null;
  const Btn = ({ dir }) => (
    <Pressable {...tapProps(() => t.respond(dir))} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Text style={styles.btnText}>{DIRS[dir].glyph}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <GameHud index={t.index} total={t.total} label="Flèche" />
      <TimerBar key={t.index} duration={cfg.limit} running={!t.feedback} />
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: BLUE }]}>● Bleue = même sens</Text>
        <Text style={[styles.legendText, { color: RED }]}>● Rouge = opposé</Text>
      </View>
      <FeedbackFrame feedback={t.feedback} style={styles.stage}>
        {!t.feedback || t.feedback !== 'timeout' ? (
          <Text style={[styles.arrow, { color: t.stimulus.red ? RED : BLUE }]}>{DIRS[t.stimulus.dir].glyph}</Text>
        ) : null}
      </FeedbackFrame>
      <View style={styles.pad}>
        <Btn dir="up" />
        <View style={styles.row}>
          <Btn dir="left" />
          <View style={styles.spacer} />
          <Btn dir="right" />
        </View>
        <Btn dir="down" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  legendText: { fontWeight: '800', fontSize: 13 },
  stage: { height: 200 },
  arrow: { fontSize: 130, fontWeight: '900', lineHeight: 150 },
  pad: { alignItems: 'center', marginTop: 16, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  spacer: { width: 78 },
  btn: {
    width: 78,
    height: 70,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 36, fontWeight: '900', color: colors.text },
  pressed: { backgroundColor: colors.primarySoft, transform: [{ scale: 0.96 }] },
});
