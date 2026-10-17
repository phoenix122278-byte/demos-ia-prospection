// Ex 9 — Catégorisation flash : swipe droite = Important, gauche = Poubelle/Archive.
import React, { useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameHud, TimerBar, scoreTrials, tapProps, useTrials } from '../components/game';
import { colors } from '../theme';
import { shuffle } from '../utils';

const IMPORTANT = [
  ['🧾', 'Facture client'],
  ['📊', 'Rapport trimestriel'],
  ['📝', 'Contrat à signer'],
  ['📅', 'Réunion 10h'],
  ['💶', 'Devis à valider'],
  ['📦', 'Bon de commande'],
  ['🏦', 'Déclaration TVA'],
  ['👔', 'Mail du directeur'],
  ['🗓️', 'Planning projet'],
  ['🚨', 'Ticket support urgent'],
  ['💳', 'Note de frais'],
  ['🔐', 'Audit sécurité'],
  ['📈', 'Budget 2027'],
  ['🤝', 'Relance fournisseur'],
  ['🧑‍💼', 'Entretien annuel'],
];
const TRASH = [
  ['🐱', 'Meme chat'],
  ['📰', 'Pub newsletter'],
  ['🎰', 'Spam loterie'],
  ['🔗', 'Chaîne de mail'],
  ['🎬', 'Vidéo drôle'],
  ['🍕', 'Promo pizza'],
  ['🔮', 'Horoscope du jour'],
  ['❓', 'Quiz « Quel fruit êtes-vous ? »'],
  ['🦄', 'GIF licorne'],
  ['😂', 'Blague du jour'],
  ['🛍️', 'Code promo shopping'],
  ['🖼️', "Fond d'écran gratuit"],
  ['📣', 'Webinaire déjà passé'],
];
// Pièges (niveau Avancé) : ça ressemble à du travail, mais c'est à jeter.
const TRAPS = [
  ['⚠️', 'Facture inconnue.exe'],
  ['🎣', 'Confirmez votre mot de passe !'],
  ['💰', 'Virement urgent (expéditeur inconnu)'],
  ['📎', 'Rapport_2019_v1 (doublon)'],
  ['🏆', 'Vous avez gagné un iPhone'],
];

const CONFIG = [
  { total: 16, limit: 2200, traps: 0 },
  { total: 20, limit: 1500, traps: 0 },
  { total: 24, limit: 1100, traps: 5 },
];
const native = Platform.OS !== 'web';
const SWIPE = 80;

function buildDeck(cfg) {
  const imp = shuffle(IMPORTANT).map(([icon, label]) => ({ icon, label, expected: 'right' }));
  const tr = shuffle(TRASH).map(([icon, label]) => ({ icon, label, expected: 'left' }));
  const traps = shuffle(TRAPS)
    .slice(0, cfg.traps)
    .map(([icon, label]) => ({ icon, label, expected: 'left', trap: true }));
  const half = Math.ceil((cfg.total - traps.length) / 2);
  return shuffle([...imp.slice(0, half), ...tr.slice(0, cfg.total - traps.length - half), ...traps]);
}

export default function Swipe({ level, onFinish }) {
  const cfg = CONFIG[level];
  const deck = useRef(buildDeck(cfg)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const t = useTrials({
    total: deck.length,
    limit: cfg.limit,
    feedbackMs: 260,
    makeStimulus: (i) => {
      pan.setValue({ x: 0, y: 0 });
      return deck[i];
    },
    onDone: (res) => onFinish(scoreTrials(res, { rtBest: 500, rtWorst: cfg.limit })),
  });
  const respondRef = useRef(t.respond);
  respondRef.current = t.respond;

  const fling = (dir) => {
    respondRef.current(dir);
    Animated.timing(pan, {
      toValue: { x: dir === 'right' ? 500 : -500, y: 0 },
      duration: 180,
      useNativeDriver: native,
    }).start();
  };
  const flingRef = useRef(fling);
  flingRef.current = fling;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE || g.vx > 0.8) flingRef.current('right');
        else if (g.dx < -SWIPE || g.vx < -0.8) flingRef.current('left');
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: native }).start();
      },
    })
  ).current;

  if (!t.stimulus) return null;
  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-15deg', '0deg', '15deg'] });
  const rightOpacity = pan.x.interpolate({ inputRange: [0, SWIPE], outputRange: [0, 1], extrapolate: 'clamp' });
  const leftOpacity = pan.x.interpolate({ inputRange: [-SWIPE, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const fbColor = t.feedback === 'ok' ? colors.success : t.feedback ? colors.danger : colors.border;

  return (
    <View style={{ flex: 1 }}>
      <GameHud index={t.index} total={t.total} label="Carte" />
      <TimerBar key={t.index} duration={cfg.limit} running={!t.feedback} />
      <View style={styles.labels}>
        <Text style={[styles.side, { color: colors.danger }]}>◀ 🗑️ Poubelle / Archive</Text>
        <Text style={[styles.side, { color: colors.success }]}>Important ✅ ▶</Text>
      </View>
      <View style={styles.stage}>
        <Animated.View
          key={t.index}
          {...responder.panHandlers}
          style={[
            styles.card,
            { borderColor: fbColor, transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
          ]}
        >
          <Animated.Text style={[styles.stamp, styles.stampRight, { opacity: rightOpacity }]}>IMPORTANT</Animated.Text>
          <Animated.Text style={[styles.stamp, styles.stampLeft, { opacity: leftOpacity }]}>POUBELLE</Animated.Text>
          <Text style={styles.icon}>{t.stimulus.icon}</Text>
          <Text style={styles.label}>{t.stimulus.label}</Text>
          {t.feedback === 'timeout' ? <Text style={styles.timeout}>⏱ Trop lent</Text> : null}
        </Animated.View>
      </View>
      <View style={styles.buttons}>
        <Pressable {...tapProps(() => fling('left'))} style={[styles.btn, { borderColor: '#FECACA' }]}>
          <Text style={styles.btnText}>🗑️</Text>
        </Pressable>
        <Pressable {...tapProps(() => fling('right'))} style={[styles.btn, { borderColor: '#A7F3D0' }]}>
          <Text style={styles.btnText}>✅</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  side: { fontWeight: '800', fontSize: 13 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  card: {
    width: '86%',
    maxWidth: 340,
    height: 260,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  icon: { fontSize: 70 },
  label: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 12 },
  stamp: {
    position: 'absolute',
    top: 18,
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 3,
    borderRadius: 6,
  },
  stampRight: { left: 18, color: colors.success, borderColor: colors.success },
  stampLeft: { right: 18, color: colors.danger, borderColor: colors.danger },
  timeout: { position: 'absolute', bottom: 14, color: colors.danger, fontWeight: '800' },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 10 },
  btn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 32 },
});
