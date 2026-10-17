// Ex 10 — Mémoire des lieux : replacez les objets du bureau sur la grille.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { GameHud } from '../components/game';
import { colors } from '../theme';
import { shuffle, useTimers } from '../utils';

const OBJECTS = ['📎', '☕', '🖨️', '📁', '💻', '📞', '🪴', '✏️', '🔑', '📅', '🗑️', '🖱️'];
const SHOW_MS = 5000;
const ROUNDS = 3;
const CONFIG = [
  { rows: 3, cols: 3, items: 3 },
  { rows: 4, cols: 4, items: 5 },
  { rows: 5, cols: 4, items: 7 },
];

export default function GridMemory({ level, onFinish }) {
  const cfg = CONFIG[level];
  const cells = cfg.rows * cfg.cols;
  const timers = useTimers();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState('memorize'); // memorize | place | feedback
  const [layout, setLayout] = useState({}); // cellule -> objet (solution)
  const [placed, setPlaced] = useState({}); // cellule -> objet (réponse)
  const [selected, setSelected] = useState(null);
  const [left, setLeft] = useState(SHOW_MS / 1000);
  const total = useRef({ correct: 0, items: 0 });

  const start = (r) => {
    const objs = shuffle(OBJECTS).slice(0, cfg.items);
    const pos = shuffle([...Array(cells).keys()]).slice(0, cfg.items);
    const lay = {};
    pos.forEach((c, i) => (lay[c] = objs[i]));
    setLayout(lay);
    setPlaced({});
    setSelected(null);
    setRound(r);
    setPhase('memorize');
    setLeft(SHOW_MS / 1000);
    for (let s = 1; s <= SHOW_MS / 1000; s++) timers.after(s * 1000, () => setLeft(SHOW_MS / 1000 - s));
    timers.after(SHOW_MS, () => setPhase('place'));
  };

  useEffect(() => {
    start(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tray = Object.values(layout).filter((o) => !Object.values(placed).includes(o));

  const onCell = (c) => {
    if (phase !== 'place') return;
    if (placed[c]) {
      // Retirer un objet déjà posé (il revient dans le plateau).
      const next = { ...placed };
      delete next[c];
      setPlaced(next);
      return;
    }
    if (!selected) return;
    setPlaced({ ...placed, [c]: selected });
    const remaining = tray.filter((o) => o !== selected);
    setSelected(remaining.length === 1 ? remaining[0] : null);
  };

  const validate = () => {
    const correct = Object.entries(placed).filter(([c, o]) => layout[c] === o).length;
    total.current.correct += correct;
    total.current.items += cfg.items;
    setPhase('feedback');
    timers.after(2200, () => {
      if (round + 1 >= ROUNDS) {
        const { correct: c, items } = total.current;
        onFinish({ score: Math.round((c / items) * 100), details: `${c}/${items} objets bien replacés` });
      } else start(round + 1);
    });
  };

  const cellContent = (c) => {
    if (phase === 'memorize') return layout[c] || '';
    if (phase === 'place') return placed[c] || '';
    return placed[c] || (layout[c] ? layout[c] : '');
  };
  const cellStyle = (c) => {
    if (phase !== 'feedback') return placed[c] ? styles.cellFilled : null;
    if (placed[c]) return layout[c] === placed[c] ? styles.cellOk : styles.cellKo;
    if (layout[c]) return styles.cellMissed;
    return null;
  };

  const msg = {
    memorize: `👀 Mémorisez l'emplacement des objets… ${left}s`,
    place: selected ? `Touchez la case pour poser ${selected}` : 'Choisissez un objet ci-dessous',
    feedback: 'Vert = bien placé · Rouge = erreur · Pâle = position attendue',
  }[phase];

  return (
    <View style={{ flex: 1 }}>
      <GameHud index={round} total={ROUNDS} label="Manche" />
      <Text style={styles.msg}>{msg}</Text>
      <View style={[styles.grid, { aspectRatio: cfg.cols / cfg.rows }]}>
        {[...Array(cfg.rows).keys()].map((r) => (
          <View key={r} style={styles.row}>
            {[...Array(cfg.cols).keys()].map((col) => {
              const c = r * cfg.cols + col;
              const isHint = phase === 'feedback' && !placed[c] && layout[c];
              return (
                <Pressable key={c} onPress={() => onCell(c)} style={[styles.cell, cellStyle(c)]}>
                  <Text style={[styles.cellText, isHint && { opacity: 0.35 }]}>{cellContent(c)}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {phase === 'place' ? (
        <>
          <View style={styles.tray}>
            {tray.map((o) => (
              <Pressable key={o} onPress={() => setSelected(o)} style={[styles.trayItem, selected === o && styles.traySelected]}>
                <Text style={styles.cellText}>{o}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Valider" onPress={validate} disabled={tray.length > 0} style={{ marginTop: 12 }} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  msg: { textAlign: 'center', fontWeight: '700', color: colors.text, marginBottom: 12, minHeight: 20 },
  grid: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 420,
    alignSelf: 'center',
    backgroundColor: '#D7CCC8',
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  row: { flex: 1, flexDirection: 'row', gap: 6 },
  cell: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellFilled: { borderColor: colors.primary },
  cellOk: { backgroundColor: '#D1FAE5', borderColor: colors.success },
  cellKo: { backgroundColor: '#FEE2E2', borderColor: colors.danger },
  cellMissed: { borderColor: colors.warning, borderStyle: 'dashed' },
  cellText: { fontSize: 30 },
  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16, minHeight: 60 },
  trayItem: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traySelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft, transform: [{ scale: 1.08 }] },
});
