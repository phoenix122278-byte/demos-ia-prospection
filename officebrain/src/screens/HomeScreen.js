// Accueil : programme du jour, accès libre aux épreuves, suivi.
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, LevelBadge, SectionTitle } from '../components/ui';
import { getExercise } from '../exercises';
import { recommendedLevel } from '../progression';
import { buildDailyProgram, computeStreak, useStore } from '../store';
import { colors } from '../theme';
import { dateKey, mean } from '../utils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function HomeScreen({ nav }) {
  const { data, getDaily } = useStore();
  const fresh = data.daily && data.daily.date === dateKey();
  const daily = fresh ? data.daily : buildDailyProgram(data);
  // Nouveau jour : on enregistre le nouveau programme.
  useEffect(() => {
    if (!fresh) getDaily();
  }, [fresh, getDaily]);
  const today = data.history.filter((h) => h.date === dateKey());
  const streak = computeStreak(data.history);
  const avgSkill = Math.round(mean(Object.values(data.skills).map((s) => s.skill)));
  const doneCount = daily.ids.filter((id) => daily.done.includes(id)).length;
  const allDone = doneCount === daily.ids.length;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.hello}>{greeting()} 👋</Text>
      <Text style={styles.brand}>
        Office<Text style={{ color: colors.primary }}>Brain</Text>
      </Text>
      <Text style={styles.tagline}>10 exercices cognitifs pensés pour le travail de bureau.</Text>

      <View style={styles.stats}>
        <Stat value={`${streak} 🔥`} label={streak > 1 ? 'jours de suite' : 'jour de suite'} />
        <Stat value={today.length} label="séances aujourd'hui" />
        <Stat value={avgSkill} label="habileté moyenne" />
      </View>

      <Card style={styles.program}>
        <Text style={styles.programTitle}>🧠 Mon programme du jour</Text>
        <Text style={styles.programSub}>
          {allDone ? 'Bravo, programme terminé ! Revenez demain.' : `3 exercices adaptés à votre niveau · ${doneCount}/3 faits`}
        </Text>
        <View style={{ gap: 8, marginTop: 12 }}>
          {daily.ids.map((id) => {
            const ex = getExercise(id);
            const done = daily.done.includes(id);
            return (
              <View key={id} style={styles.progItem}>
                <Text style={styles.progIcon}>{done ? '✅' : ex.icon}</Text>
                <Text style={[styles.progName, done && styles.progDone]}>{ex.name}</Text>
                <LevelBadge small level={recommendedLevel(data.skills[id])} />
              </View>
            );
          })}
        </View>
        <Button
          big
          title={allDone ? 'Refaire le programme' : doneCount ? 'Reprendre mon programme' : 'Lancer mon programme du jour'}
          icon="🚀"
          onPress={() => nav.push('program')}
          style={{ marginTop: 16, backgroundColor: '#FFF', borderColor: '#FFF' }}
          variant="secondary"
        />
      </Card>

      <SectionTitle>Entraînement libre</SectionTitle>
      <Button title="Choisir une épreuve" icon="🎯" variant="secondary" onPress={() => nav.push('list')} />
      <Button
        title="Tableau de bord / Suivi"
        icon="📊"
        variant="secondary"
        onPress={() => nav.push('stats')}
        style={{ marginTop: 10 }}
      />

      <Text style={styles.offline}>🔒 100 % hors-ligne · vos données restent sur ce téléphone</Text>
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  hello: { fontSize: 16, color: colors.textSoft, fontWeight: '600' },
  brand: { fontSize: 36, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: colors.textSoft, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: { flex: 1, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSoft, textAlign: 'center', marginTop: 2 },
  program: { marginTop: 16, backgroundColor: colors.primary, borderColor: colors.primary },
  programTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  programSub: { fontSize: 14, color: '#E0E7FF', marginTop: 4 },
  progItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: 12,
  },
  progIcon: { fontSize: 22 },
  progName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  progDone: { color: colors.textFaint, textDecorationLine: 'line-through' },
  offline: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: 28 },
});
