// Programme du jour : enchaîne 3 exercices au niveau recommandé.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components/ui';
import { getExercise } from '../exercises';
import { buildDailyProgram, useStore } from '../store';
import { colors } from '../theme';
import { dateKey } from '../utils';
import ExerciseRunner from './ExerciseRunner';

export default function ProgramScreen({ nav }) {
  const { data } = useStore();
  const [daily] = useState(() => (data.daily && data.daily.date === dateKey() ? data.daily : buildDailyProgram(data)));
  // On reprend au premier exercice non fait (ou depuis le début si tout est fait).
  const [index, setIndex] = useState(() => {
    const i = daily.ids.findIndex((id) => !daily.done.includes(id));
    return i < 0 ? 0 : i;
  });
  const [startedAt] = useState(Date.now());
  const finished = index >= daily.ids.length;

  if (!finished) {
    return (
      <ExerciseRunner
        key={daily.ids[index]}
        exId={daily.ids[index]}
        program={{ index, total: daily.ids.length }}
        onExit={nav.back}
        onNext={() => setIndex((i) => i + 1)}
      />
    );
  }

  const results = data.history.filter((h) => h.program && h.ts >= startedAt && h.date === dateKey());
  return (
    <View style={{ flex: 1 }}>
      <Header title="Programme terminé" subtitle="Bravo pour votre régularité !" onBack={nav.back} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 56 }}>🏆</Text>
          <Text style={styles.title}>Séance du jour validée</Text>
          <Text style={styles.sub}>Votre cerveau de bureau vous remercie.</Text>
        </Card>
        <View style={{ gap: 8, marginTop: 14 }}>
          {results.map((r) => {
            const ex = getExercise(r.exId);
            return (
              <Card key={r.id} style={styles.row}>
                <Text style={{ fontSize: 24 }}>{ex.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{ex.name}</Text>
                  <Text style={styles.details}>{r.details}</Text>
                </View>
                <Text style={styles.score}>{r.score}%</Text>
              </Card>
            );
          })}
        </View>
        <Button big title="Voir ma progression" icon="📊" onPress={() => nav.replace('stats')} style={{ marginTop: 18 }} />
        <Button title="Retour à l'accueil" variant="secondary" onPress={nav.back} style={{ marginTop: 10 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 6 },
  sub: { color: colors.textSoft, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  name: { fontWeight: '800', color: colors.text },
  details: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  score: { fontSize: 20, fontWeight: '900', color: colors.primary },
});
