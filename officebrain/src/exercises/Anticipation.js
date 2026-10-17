// Ex 5 — Anticipation visuelle (simulation stroboscope) :
// l'objet avance, l'écran devient noir 1 s puis l'objet reste invisible ;
// touchez au moment exact où il aurait atteint la ligne cible.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameHud, tapProps } from '../components/game';
import { colors } from '../theme';
import { mean, rand, useTimers } from '../utils';

const OBJ = 30;
const BLACKOUT_MS = 1000;
const CONFIG = [
  { trials: 6, hidden: [1.3, 1.8], speed: [150, 210], tol: 550 },
  { trials: 6, hidden: [1.6, 2.4], speed: [140, 300], tol: 450 },
  { trials: 7, hidden: [2.0, 3.0], speed: [120, 360], tol: 380 },
];
const native = Platform.OS !== 'web';

export default function Anticipation({ level, onFinish }) {
  const cfg = CONFIG[level];
  const timers = useTimers();
  const [width, setWidth] = useState(null);
  const [trial, setTrial] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | moving | blackout | hidden | feedback
  const [result, setResult] = useState(null);
  const x = useRef(new Animated.Value(0)).current;
  const st = useRef({ expected: 0, missId: null, scores: [], errors: [] });

  const targetX = width ? width * 0.86 - OBJ / 2 : 0;

  const start = (i) => {
    setTrial(i);
    setResult(null);
    setPhase('ready');
    x.setValue(0);
    timers.after(900, () => {
      const hiddenT = rand(...cfg.hidden);
      let v = rand(...cfg.speed);
      // Le trajet visible doit rester d'au moins 30 % de la distance.
      if (v * hiddenT > targetX * 0.7) v = (targetX * 0.7) / hiddenT;
      const visibleDist = targetX - v * hiddenT;
      const visibleMs = (visibleDist / v) * 1000;
      const t0 = Date.now();
      st.current.expected = t0 + visibleMs + hiddenT * 1000;
      setPhase('moving');
      Animated.timing(x, {
        toValue: visibleDist,
        duration: visibleMs,
        easing: Easing.linear,
        useNativeDriver: native,
      }).start(({ finished }) => {
        if (!finished) return;
        setPhase('blackout');
        timers.after(BLACKOUT_MS, () => setPhase((p) => (p === 'blackout' ? 'hidden' : p)));
      });
      st.current.missId = timers.after(visibleMs + hiddenT * 1000 + cfg.tol * 2.5, () => resolve(null));
    });
  };

  useEffect(() => {
    if (width) start(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const resolve = (tapTime) => {
    const s = st.current;
    if (s.missId) timers.clear(s.missId);
    s.missId = null;
    let err = null;
    let trialScore = 0;
    if (tapTime !== null) {
      err = tapTime - s.expected;
      trialScore = Math.max(0, 1 - Math.abs(err) / cfg.tol);
      s.errors.push(Math.abs(err));
    }
    s.scores.push(trialScore);
    x.setValue(targetX);
    setResult({ err, trialScore });
    setPhase('feedback');
    timers.after(1600, () => {
      if (s.scores.length >= cfg.trials) {
        const avgErr = s.errors.length ? Math.round(mean(s.errors)) : null;
        onFinish({
          score: Math.round(mean(s.scores) * 100),
          details: avgErr !== null ? `Écart moyen ${avgErr} ms · ${s.errors.length}/${cfg.trials} tops` : 'Aucun top enregistré',
        });
      } else start(s.scores.length);
    });
  };

  const onTap = () => {
    if (phase === 'blackout' || phase === 'hidden') resolve(Date.now());
  };

  const feedbackText = () => {
    if (!result) return '';
    if (result.err === null) return '⏱ Pas de top… trop tard !';
    const ms = Math.round(result.err);
    if (Math.abs(ms) < 60) return `🎯 Parfait ! (${ms > 0 ? '+' : ''}${ms} ms)`;
    return ms > 0 ? `🐢 ${ms} ms trop tard` : `🐇 ${-ms} ms trop tôt`;
  };

  const msg = {
    ready: 'Préparez-vous…',
    moving: "Observez la vitesse de l'objet",
    blackout: '',
    hidden: "TOP quand il atteint la ligne !",
    feedback: feedbackText(),
  }[phase];

  const showObject = phase === 'moving' || phase === 'ready' || phase === 'feedback';

  return (
    <Pressable style={{ flex: 1 }} {...tapProps(onTap)}>
      <GameHud index={trial} total={cfg.trials} label="Essai" />
      <Text style={[styles.msg, phase === 'feedback' && result && { color: result.trialScore > 0.6 ? colors.success : colors.danger }]}>
        {msg}
      </Text>
      <View style={styles.track} onLayout={(e) => !width && setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.rail} />
        {width ? <View style={[styles.target, { left: width * 0.86 - 2 }]} /> : null}
        {width && showObject ? (
          <Animated.View
            style={[styles.obj, phase === 'feedback' && styles.objGhost, { transform: [{ translateX: x }] }]}
          />
        ) : null}
      </View>
      <View style={styles.tapZone}>
        <Text style={styles.tapText}>{phase === 'blackout' || phase === 'hidden' ? 'TOUCHEZ POUR « TOP »' : ' '}</Text>
      </View>
      {phase === 'blackout' ? <View style={styles.blackout} pointerEvents="none" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  msg: { textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text, minHeight: 26, marginVertical: 12 },
  track: {
    height: 160,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rail: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.track, top: 79 },
  target: { position: 'absolute', top: 20, bottom: 20, width: 4, backgroundColor: colors.danger, borderRadius: 2 },
  obj: {
    position: 'absolute',
    left: 0,
    top: 80 - OBJ / 2,
    width: OBJ,
    height: OBJ,
    borderRadius: OBJ / 2,
    backgroundColor: '#F4511E',
  },
  objGhost: { opacity: 0.35 },
  tapZone: {
    flex: 1,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  blackout: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', borderRadius: 12 },
});
