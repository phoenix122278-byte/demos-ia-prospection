// Mini graphique en barres sur 7 jours, sans bibliothèque externe.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// data : [{ key, label, value (0–100 ou null) }]
export default function BarChart({ data, color = colors.primary, height = 90, showValues = true, max = 100, format }) {
  return (
    <View style={styles.row}>
      {data.map((d, i) => {
        const has = d.value !== null && d.value !== undefined;
        const h = has ? Math.max(4, (Math.min(d.value, max) / max) * height) : 3;
        const isToday = i === data.length - 1;
        return (
          <View key={d.key} style={styles.col}>
            <Text style={styles.value}>{showValues && has ? (format ? format(d.value) : Math.round(d.value)) : ''}</Text>
            <View style={[styles.slot, { height }]}>
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: has ? color : colors.track, opacity: has ? (isToday ? 1 : 0.75) : 1 },
                ]}
              />
            </View>
            <Text style={[styles.label, isToday && styles.today]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center' },
  slot: { width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', maxWidth: 28, borderRadius: 6 },
  value: { fontSize: 10, color: colors.textSoft, marginBottom: 3, height: 13 },
  label: { fontSize: 11, color: colors.textFaint, marginTop: 5, fontWeight: '600' },
  today: { color: colors.primary },
});
