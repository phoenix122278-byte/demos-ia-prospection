// Déroulé d'un exercice : présentation + choix du niveau → décompte → jeu → résultat.
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, LevelBadge, ProgressBar } from '../components/ui';
import { EXERCISE_COMPONENTS, getExercise } from '../exercises';
import { LEVELS, LEVEL_COLORS, THRESHOLDS, feedbackMessage, recommendedLevel } from '../progression';
import { useStore } from '../store';
import { colors } from '../theme';

export default function ExerciseRunner({ exId, onExit, program, onNext }) {
  const ex = getExercise(exId);
  const Game = EXERCISE_COMPONENTS[exId];
  const { data, recordResult } = useStore();
  const entry = data.skills[exId];
  const [level, setLevel] = useState(recommendedLevel(entry));
  const [phase, setPhase] = useState('intro'); // intro | countdown | play | result
  const [count, setCount] = useState(3);
  const [outcome, setOutcome] = useState(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (count === 0) {
      setPhase('play');
      return undefined;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(id);
  }, [phase, count]);

  const begin = () => {
    setCount(3);
    setOutcome(null);
    setRunKey((k) => k + 1);
    setPhase('countdown');
  };

  const onFinish = ({ score, details }) => {
    const res = recordResult(exId, level, score, details, !!program);
    setOutcome({ ...res, score, details, level });
    setPhase('result');
  };

  const subtitle = program ? `Programme du jour · ${program.index + 1}/${program.total}` : `Exercice ${ex.num} · ${ex.skill}`;

  if (phase === 'play' || phase === 'countdown') {
    return (
      <View style={{ flex: 1 }}>
        <Header title={ex.name} subtitle={`${LEVELS[level]} · ${subtitle}`} onBack={() => setPhase('intro')} />
        <View style={styles.game}>
          {phase === 'countdown' ? (
            <View style={styles.countWrap}>
              <Text style={styles.countText}>{count || 'Go !'}</Text>
              <Text style={styles.countHint}>{ex.short}</Text>
            </View>
          ) : (
            <Game key={runKey} level={level} onFinish={onFinish} />
          )}
        </View>
      </View>
    );
  }

  if (phase === 'result' && outcome) {
    const nextRec = outcome.recommendedAfter;
    const deltaSkill = Math.round((outcome.after - outcome.before) * 10) / 10;
    return (
      <View style={{ flex: 1 }}>
        <Header title={ex.name} subtitle={subtitle} onBack={onExit} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card style={{ alignItems: 'center' }}>
            <Text style={styles.resultIcon}>{ex.icon}</Text>
            <Text style={[styles.score, { color: scoreColor(outcome.score) }]}>{outcome.score}%</Text>
            <Text style={styles.feedback}>{feedbackMessage(outcome.score)}</Text>
            <Text style={styles.details}>{outcome.details}</Text>
            <View style={{ marginTop: 10 }}>
              <LevelBadge level={outcome.level} />
            </View>
          </Card>

          {outcome.levelUp !== null ? (
            <Card style={[styles.banner, { borderColor: LEVEL_COLORS[outcome.levelUp] }]}>
              <Text style={styles.bannerTitle}>🎉 Niveau {LEVELS[outcome.levelUp]} débloqué !</Text>
              <Text style={styles.bannerText}>Il vous sera proposé automatiquement la prochaine fois.</Text>
            </Card>
          ) : null}
          {nextRec < outcome.recommendedBefore ? (
            <Card style={[styles.banner, { borderColor: colors.warning }]}>
              <Text style={styles.bannerTitle}>🌱 On adoucit un peu</Text>
              <Text style={styles.bannerText}>
                Niveau recommandé : {LEVELS[nextRec]}. Les niveaux débloqués restent accessibles.
              </Text>
            </Card>
          ) : null}

          <Card style={{ marginTop: 12 }}>
            <View style={styles.skillRow}>
              <Text style={styles.skillLabel}>Score d'habileté</Text>
              <Text style={styles.skillValue}>
                {Math.round(outcome.after)}/100{' '}
                <Text style={{ color: deltaSkill >= 0 ? colors.success : colors.danger }}>
                  ({deltaSkill >= 0 ? '+' : ''}
                  {deltaSkill})
                </Text>
              </Text>
            </View>
            <ProgressBar value={outcome.after} color={ex.color} height={10} />
            <SkillScale />
          </Card>

          <View style={styles.actions}>
            {program ? (
              <Button
                big
                title={program.index + 1 < program.total ? 'Exercice suivant' : 'Terminer le programme'}
                icon="➡️"
                onPress={onNext}
              />
            ) : (
              <>
                <Button
                  big
                  title="Rejouer"
                  icon="🔁"
                  onPress={() => {
                    setLevel(nextRec);
                    setPhase('intro');
                  }}
                />
                <Button title="Retour aux épreuves" variant="secondary" onPress={onExit} />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Présentation
  const rec = recommendedLevel(entry);
  return (
    <View style={{ flex: 1 }}>
      <Header title={ex.name} subtitle={subtitle} onBack={onExit} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.introTop}>
            <View style={[styles.iconBubble, { backgroundColor: ex.color + '1F' }]}>
              <Text style={{ fontSize: 34 }}>{ex.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.skillTag}>{ex.skill}</Text>
              <Text style={styles.introShort}>{ex.short}</Text>
            </View>
          </View>
          <Text style={styles.rules}>{ex.rules}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Niveau</Text>
        {LEVELS.map((name, i) => {
          const locked = i > entry.unlocked;
          const active = level === i;
          return (
            <Pressable
              key={name}
              disabled={locked}
              onPress={() => setLevel(i)}
              style={[styles.level, active && { borderColor: LEVEL_COLORS[i], backgroundColor: LEVEL_COLORS[i] + '12' }, locked && { opacity: 0.5 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.levelName}>
                  {locked ? '🔒 ' : active ? '● ' : '○ '}
                  {name}
                  {i === rec ? '  ⭐ recommandé' : ''}
                </Text>
                <Text style={styles.levelDesc}>
                  {locked ? `Se débloque à ${THRESHOLDS[i]} points d'habileté` : ex.levels[i]}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <Card style={{ marginTop: 12 }}>
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Score d'habileté</Text>
            <Text style={styles.skillValue}>{Math.round(entry.skill)}/100</Text>
          </View>
          <ProgressBar value={entry.skill} color={ex.color} height={10} />
          <SkillScale />
          <Text style={styles.meta}>
            {entry.plays} partie{entry.plays > 1 ? 's' : ''} · meilleur score {entry.best}%
          </Text>
        </Card>

        <Button big title="Commencer" icon="▶️" onPress={begin} style={{ marginTop: 18 }} />
      </ScrollView>
    </View>
  );
}

function SkillScale() {
  return (
    <View style={styles.scale}>
      {LEVELS.map((l, i) => (
        <Text key={l} style={[styles.scaleText, { color: LEVEL_COLORS[i] }]}>
          {THRESHOLDS[i]} · {l}
        </Text>
      ))}
    </View>
  );
}

const scoreColor = (s) => (s >= 80 ? colors.success : s >= 40 ? colors.warning : colors.danger);

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  game: { flex: 1, padding: 16, paddingTop: 4 },
  countWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 96, fontWeight: '900', color: colors.primary },
  countHint: { fontSize: 16, color: colors.textSoft, marginTop: 12, textAlign: 'center', fontWeight: '600' },
  introTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  iconBubble: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  skillTag: { fontSize: 12, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  introShort: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  rules: { fontSize: 15, lineHeight: 22, color: colors.textSoft },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textSoft, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
  level: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  levelName: { fontSize: 16, fontWeight: '800', color: colors.text },
  levelDesc: { fontSize: 13, color: colors.textSoft, marginTop: 3 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  skillLabel: { fontWeight: '700', color: colors.text },
  skillValue: { fontWeight: '800', color: colors.text },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleText: { fontSize: 11, fontWeight: '700' },
  meta: { marginTop: 10, color: colors.textSoft, fontSize: 13 },
  resultIcon: { fontSize: 44 },
  score: { fontSize: 64, fontWeight: '900', marginTop: 4 },
  feedback: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 },
  details: { fontSize: 14, color: colors.textSoft, marginTop: 6, textAlign: 'center' },
  banner: { marginTop: 12, borderWidth: 2 },
  bannerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  bannerText: { fontSize: 14, color: colors.textSoft, marginTop: 4 },
  actions: { marginTop: 18, gap: 10 },
});
