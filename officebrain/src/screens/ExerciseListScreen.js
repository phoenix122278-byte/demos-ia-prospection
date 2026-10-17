// Liste des 10 épreuves en accès libre.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, LevelBadge, ProgressBar } from '../components/ui';
import { EXERCISES } from '../exercises';
import { recommendedLevel } from '../progression';
import { useStore } from '../store';
import { colors } from '../theme';

export default function ExerciseListScreen({ nav }) {
  const { data } = useStore();
  return (
    <View style={{ flex: 1 }}>
      <Header title="Choisir une épreuve" subtitle="Accès libre aux 10 exercices" onBack={nav.back} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {EXERCISES.map((ex) => {
          const s = data.skills[ex.id];
          return (
            <Card key={ex.id} style={styles.card} onPress={() => nav.push('exercise', { exId: ex.id })}>
              <View style={[styles.icon, { backgroundColor: ex.color + '1F' }]}>
                <Text style={{ fontSize: 26 }}>{ex.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {ex.num}. {ex.name}
                  </Text>
                  <LevelBadge small level={recommendedLevel(s)} />
                </View>
                <Text style={styles.short} numberOfLines={2}>
                  {ex.short}
                </Text>
                <View style={styles.skillRow}>
                  <ProgressBar value={s.skill} color={ex.color} height={6} style={{ flex: 1 }} />
                  <Text style={styles.skill}>{Math.round(s.skill)}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 40, gap: 10 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, flexShrink: 1 },
  short: { fontSize: 13, color: colors.textSoft, marginTop: 3 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  skill: { fontSize: 12, fontWeight: '800', color: colors.textSoft, width: 24, textAlign: 'right' },
});
