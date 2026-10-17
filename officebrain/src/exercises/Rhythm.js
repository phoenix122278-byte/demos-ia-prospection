// Ex 8 — Rythme cognitif : tapotez en rythme, le tempo change sur signal visuel.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tapProps } from '../components/game';
import { colors } from '../theme';
import { mean, shuffle, useTimers } from '../utils';

const SEG_COLORS = ['#D81B60', '#1E88E5', '#43A047', '#F4511E'];
const CONFIG = [
  { tempos: [[60, 70], [95, 105]], beats: 8, hideLast: 0 },
  { tempos: [[65, 75], [105, 115], [80, 90]], beats: 8, hideLast: 0 },
  { tempos: [[75, 85], [115, 125], [65, 75], [130, 140]], beats: 7, hideLast: 3 },
];

function buildBeats(cfg) {
  const segments = cfg.tempos.map(([a, b]) => Math.round(a + Math.random() * (b - a)));
  // Variation : l'ordre des tempos après le premier est mélangé.
  const ordered = [segments[0], ...shuffle(segments.slice(1))];
  const beats = [];
  let t = 800;
  ordered.forEach((bpm, seg) => {
    const period = 60000 / bpm;
    for (let i = 0; i < cfg.beats; i++) {
      beats.push({
        t,
        seg,
        bpm,
        period,
        first: i === 0 && seg > 0,
        visible: i < cfg.beats - cfg.hideLast,
        // Les 2 premiers temps (et le 1er après un changement) servent à se caler.
        scored: seg === 0 ? i >= 2 : i >= 1,
      });
      t += period;
    }
  });
  return { beats, end: t };
}

export default function Rhythm({ level, onFinish }) {
  const cfg = CONFIG[level];
  const timers = useTimers();
  const [beat, setBeat] = useState(null);
  const [flash, setFlash] = useState(false);
  const [tapFx, setTapFx] = useState(0);
  const st = useRef(null);
  if (!st.current) st.current = { ...buildBeats(cfg), taps: [], t0: 0 };

  useEffect(() => {
    const s = st.current;
    s.t0 = Date.now();
    s.beats.forEach((b, i) => {
      timers.after(b.t, () => {
        setBeat(i);
        if (b.visible) {
          setFlash(true);
          timers.after(130, () => setFlash(false));
        }
      });
    });
    timers.after(s.end + 200, () => {
      const used = new Set();
      const errs = [];
      const per = s.beats
        .filter((b) => b.scored)
        .map((b) => {
          const at = s.t0 + b.t;
          let best = -1;
          let bestErr = Infinity;
          s.taps.forEach((tap, j) => {
            const e = Math.abs(tap - at);
            if (!used.has(j) && e < bestErr && e < b.period / 2) {
              best = j;
              bestErr = e;
            }
          });
          if (best < 0) return 0;
          used.add(best);
          errs.push(bestErr);
          return Math.max(0, 1 - bestErr / (b.period * 0.35));
        });
      const extra = s.taps.length - used.size;
      const penalty = Math.min(0.2, Math.max(0, extra - 2) * 0.02);
      const score = Math.round(Math.max(0, mean(per) - penalty) * 100);
      onFinish({
        score,
        details: `${errs.length}/${per.length} temps captés${errs.length ? ` · écart moyen ${Math.round(mean(errs))} ms` : ''}`,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = st.current;
  const b = beat !== null ? s.beats[beat] : null;
  const seg = b ? b.seg : 0;
  const segColor = SEG_COLORS[seg % SEG_COLORS.length];
  const showChange = b && b.seg > 0 && beat - s.beats.findIndex((x) => x.seg === b.seg) < 2;

  return (
    <Pressable
      style={[styles.wrap, { backgroundColor: segColor + '14' }]}
      {...tapProps(() => {
        st.current.taps.push(Date.now());
        setTapFx((n) => n + 1);
      })}
    >
      <Text style={styles.info}>
        Segment {seg + 1}/{cfg.tempos.length} · {b ? `${b.bpm} BPM` : 'Préparez-vous'}
      </Text>
      <View style={styles.center}>
        {showChange ? <Text style={[styles.change, { color: segColor }]}>⚡ CHANGEMENT DE RYTHME</Text> : <Text style={styles.change}> </Text>}
        <View
          style={[
            styles.circle,
            { borderColor: segColor },
            flash && { backgroundColor: segColor, transform: [{ scale: 1.12 }] },
          ]}
        >
          <Text style={[styles.circleText, flash && { color: '#FFF' }]}>{b && !b.visible ? '…' : '♩'}</Text>
        </View>
        <Text style={styles.hint}>
          {b && !b.visible ? 'Métronome masqué : gardez le rythme !' : 'Tapotez n’importe où, pile sur le battement'}
        </Text>
        <Text style={styles.taps} key={tapFx}>
          👆 {s.taps.length}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 24, padding: 16 },
  info: { textAlign: 'center', fontWeight: '800', color: colors.textSoft },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  change: { fontSize: 20, fontWeight: '900', marginBottom: 24, color: colors.text },
  circle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  circleText: { fontSize: 64, color: colors.text },
  hint: { marginTop: 28, color: colors.textSoft, fontWeight: '600', textAlign: 'center' },
  taps: { marginTop: 10, color: colors.textFaint, fontWeight: '700' },
});
