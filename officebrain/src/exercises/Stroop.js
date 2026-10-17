// Ex 1 — Stroop : touchez la couleur de l'encre, pas le mot écrit.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedbackFrame, GameHud, TimerBar, scoreTrials, tapProps, useTrials } from '../components/game';
import { pick } from '../utils';

const COLORS = [
  { key: 'rouge', label: 'ROUGE', hex: '#E53935' },
  { key: 'bleu', label: 'BLEU', hex: '#1E88E5' },
  { key: 'vert', label: 'VERT', hex: '#43A047' },
  { key: 'jaune', label: 'JAUNE', hex: '#F9A825' },
  { key: 'violet', label: 'VIOLET', hex: '#8E24AA' },
  { key: 'orange', label: 'ORANGE', hex: '#EF6C00' },
];

const CONFIG = [
  { n: 3, total: 12, limit: null },
  { n: 4, total: 16, limit: 3000 },
  { n: 6, total: 20, limit: 1700 },
];

export default function Stroop({ level, onFinish }) {
  const cfg = CONFIG[level];
  const palette = COLORS.slice(0, cfg.n);
  const t = useTrials({
    total: cfg.total,
    limit: cfg.limit,
    makeStimulus: () => {
      const word = pick(palette);
      // 25 % de stimuli congruents, le reste en conflit mot / encre.
      const ink = Math.random() < 0.25 ? word : pick(palette.filter((c) => c !== word));
      return { word, ink, expected: ink.key };
    },
    onDone: (res) => onFinish(scoreTrials(res, { rtBest: 600, rtWorst: 2200 })),
  });

  if (!t.stimulus) return null;
  return (
    <View style={styles.wrap}>
      <GameHud index={t.index} total={t.total} label="Mot" />
      {cfg.limit ? <TimerBar key={t.index} duration={cfg.limit} running={!t.feedback} /> : null}
      <FeedbackFrame feedback={t.feedback} style={styles.stage}>
        <Text style={[styles.word, { color: t.stimulus.ink.hex }]}>{t.stimulus.word.label}</Text>
      </FeedbackFrame>
      <Text style={styles.hint}>Quelle est la couleur de l'encre ?</Text>
      <View style={styles.grid}>
        {palette.map((c) => (
          <Pressable
            key={c.key}
            {...tapProps(() => t.respond(c.key))}
            style={({ pressed }) => [styles.btn, { backgroundColor: c.hex }, pressed && styles.pressed]}
          >
            <Text style={styles.btnText}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  stage: { flex: 1, maxHeight: 260 },
  word: { fontSize: 52, fontWeight: '900', letterSpacing: 2 },
  hint: { textAlign: 'center', color: '#6B7280', marginVertical: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  btn: { width: '47%', paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
