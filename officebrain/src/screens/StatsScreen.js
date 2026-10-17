// Tableau de bord / Suivi : progression sur 7 jours, habiletés, historique JSON local.
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import BarChart from '../components/BarChart';
import { Button, Card, Header, LevelBadge, ProgressBar, SectionTitle } from '../components/ui';
import { EXERCISES, getExercise } from '../exercises';
import { LEVELS, recommendedLevel } from '../progression';
import { computeStreak, useStore } from '../store';
import { colors } from '../theme';
import { lastNDays, mean } from '../utils';

export default function StatsScreen({ nav }) {
  const { data, resetAll } = useStore();
  const [expanded, setExpanded] = useState(null);
  const days = useMemo(() => lastNDays(7), []);
  const dayKeys = new Set(days.map((d) => d.key));
  const week = data.history.filter((h) => dayKeys.has(h.date));

  const perDay = (entries) =>
    days.map((d) => {
      const list = entries.filter((h) => h.date === d.key);
      return { key: d.key, label: d.label, value: list.length ? mean(list.map((h) => h.score)) : null, count: list.length };
    });

  const globalDays = perDay(week);
  const sessionsDays = globalDays.map((d) => ({ ...d, value: d.count || null }));
  const maxSessions = Math.max(4, ...globalDays.map((d) => d.count));
  const avgWeek = week.length ? Math.round(mean(week.map((h) => h.score))) : null;
  const avgSkill = Math.round(mean(Object.values(data.skills).map((s) => s.skill)));

  const exportJson = async () => {
    const json = JSON.stringify(data, null, 2);
    try {
      await Share.share({ message: json, title: 'OfficeBrain — historique' });
    } catch (e) {
      Alert.alert('Export impossible', String(e));
    }
  };

  const confirmReset = () => {
    const msg = 'Toutes les données locales (scores, historique, niveaux) seront effacées. Continuer ?';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(msg)) resetAll();
      return;
    }
    Alert.alert('Réinitialiser', msg, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Tableau de bord" subtitle="Suivi de vos performances" onBack={nav.back} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.kpis}>
          <Kpi value={week.length} label="séances (7 j)" />
          <Kpi value={avgWeek !== null ? `${avgWeek}%` : '—'} label="score moyen (7 j)" />
          <Kpi value={`${computeStreak(data.history)} 🔥`} label="série" />
          <Kpi value={avgSkill} label="habileté moy." />
        </View>

        <SectionTitle>Score moyen par jour</SectionTitle>
        <Card>
          <BarChart data={globalDays} format={(v) => `${Math.round(v)}`} />
        </Card>

        <SectionTitle>Séances par jour</SectionTitle>
        <Card>
          <BarChart data={sessionsDays} color={colors.success} max={maxSessions} height={60} />
        </Card>

        <SectionTitle>Progression par exercice (7 derniers jours)</SectionTitle>
        {EXERCISES.map((ex) => {
          const s = data.skills[ex.id];
          const entries = week.filter((h) => h.exId === ex.id);
          const open = expanded === ex.id;
          const series = perDay(entries);
          const trend = trendOf(entries);
          return (
            <Card key={ex.id} style={styles.exCard} onPress={() => setExpanded(open ? null : ex.id)}>
              <View style={styles.exHead}>
                <Text style={{ fontSize: 22 }}>{ex.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.exTitleRow}>
                    <Text style={styles.exName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <LevelBadge small level={recommendedLevel(s)} />
                  </View>
                  <View style={styles.skillRow}>
                    <ProgressBar value={s.skill} color={ex.color} height={7} style={{ flex: 1 }} />
                    <Text style={styles.skillNum}>{Math.round(s.skill)}</Text>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <BarChart data={series} color={ex.color} height={open ? 80 : 38} showValues={open} />
              </View>
              {open ? (
                <View style={styles.exDetails}>
                  <Text style={styles.detail}>
                    Parties : {s.plays} · Meilleur : {s.best}% · Débloqué : {LEVELS[s.unlocked]}
                  </Text>
                  <Text style={styles.detail}>
                    Tendance 7 j : {trend === null ? 'pas assez de données' : `${trend >= 0 ? '↗ +' : '↘ '}${trend} pts`}
                  </Text>
                  {entries
                    .slice(-3)
                    .reverse()
                    .map((h) => (
                      <Text key={h.id} style={styles.detailSmall}>
                        • {new Date(h.ts).toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} —{' '}
                        {h.score}% ({LEVELS[h.level]})
                      </Text>
                    ))}
                </View>
              ) : null}
            </Card>
          );
        })}

        <SectionTitle>Historique récent</SectionTitle>
        <Card>
          {data.history.length === 0 ? (
            <Text style={styles.empty}>Aucune séance pour l'instant. Lancez votre programme du jour !</Text>
          ) : (
            data.history
              .slice(-12)
              .reverse()
              .map((h) => {
                const ex = getExercise(h.exId);
                return (
                  <View key={h.id} style={styles.histRow}>
                    <Text style={{ fontSize: 18 }}>{ex ? ex.icon : '•'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.histName}>
                        {ex ? ex.name : h.exId} {h.program ? '· programme' : ''}
                      </Text>
                      <Text style={styles.histDate}>
                        {new Date(h.ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {LEVELS[h.level]}
                      </Text>
                    </View>
                    <Text style={[styles.histScore, { color: h.score >= 80 ? colors.success : h.score >= 40 ? colors.warning : colors.danger }]}>
                      {h.score}%
                    </Text>
                  </View>
                );
              })
          )}
        </Card>

        <SectionTitle>Données locales</SectionTitle>
        <Card>
          <Text style={styles.detail}>
            {data.history.length} entrées stockées sur l'appareil (JSON, {Math.round(JSON.stringify(data).length / 1024)} Ko). Aucune
            donnée n'est envoyée sur Internet.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Button title="Exporter JSON" variant="secondary" onPress={exportJson} style={{ flex: 1 }} />
            <Button title="Réinitialiser" variant="danger" onPress={confirmReset} style={{ flex: 1 }} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

// Écart entre la 2e moitié et la 1re moitié des scores de la semaine.
function trendOf(entries) {
  if (entries.length < 2) return null;
  const half = Math.floor(entries.length / 2);
  const a = mean(entries.slice(0, half).map((h) => h.score));
  const b = mean(entries.slice(half).map((h) => h.score));
  return Math.round(b - a);
}

function Kpi({ value, label }) {
  return (
    <Card style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '47%', flexGrow: 1, padding: 12 },
  kpiValue: { fontSize: 24, fontWeight: '900', color: colors.text },
  kpiLabel: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  exCard: { marginBottom: 10, padding: 14 },
  exHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  exName: { fontSize: 15, fontWeight: '800', color: colors.text, flexShrink: 1 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  skillNum: { fontSize: 12, fontWeight: '800', color: colors.textSoft, width: 24, textAlign: 'right' },
  exDetails: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 },
  detail: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  detailSmall: { fontSize: 12, color: colors.textFaint },
  empty: { color: colors.textSoft, textAlign: 'center', paddingVertical: 10 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  histName: { fontWeight: '700', color: colors.text, fontSize: 14 },
  histDate: { fontSize: 12, color: colors.textSoft },
  histScore: { fontWeight: '900', fontSize: 16 },
});
