// OfficeBrain — entraînement cognitif pour le travail de bureau, 100 % hors-ligne.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import ExerciseListScreen from './src/screens/ExerciseListScreen';
import ExerciseRunner from './src/screens/ExerciseRunner';
import ProgramScreen from './src/screens/ProgramScreen';
import StatsScreen from './src/screens/StatsScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="dark" />
          <Root />
        </SafeAreaView>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// Navigation minimale par pile (aucune dépendance externe).
function Root() {
  const { ready } = useStore();
  const [stack, setStack] = useState([{ name: 'home', key: 0 }]);

  const nav = useMemo(() => {
    let seq = 1;
    return {
      push: (name, params) => setStack((s) => [...s, { name, params, key: seq++ }]),
      replace: (name, params) => setStack((s) => [...s.slice(0, -1), { name, params, key: seq++ }]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      home: () => setStack((s) => [s[0]]),
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        nav.back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, nav]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const top = stack[stack.length - 1];
  switch (top.name) {
    case 'list':
      return <ExerciseListScreen key={top.key} nav={nav} />;
    case 'exercise':
      return <ExerciseRunner key={top.key} exId={top.params.exId} onExit={nav.back} />;
    case 'program':
      return <ProgramScreen key={top.key} nav={nav} />;
    case 'stats':
      return <StatsScreen key={top.key} nav={nav} />;
    default:
      return <HomeScreen key={top.key} nav={nav} />;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
