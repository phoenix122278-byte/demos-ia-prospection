// Algorithme de progression douce.
//
// Chaque exercice a un « Score d'Habileté » de 0 à 100.
//   0–34  → Débutant   | 35–69 → Intermédiaire | 70–100 → Avancé
// - Score ≥ 80 % : l'habileté monte franchement (bonus au-delà de 95 %).
// - 60–79 %      : petite hausse.
// - 40–59 %      : quasi stable (on consolide).
// - < 40 %       : légère baisse, plafonnée, et jamais plus de 10 points
//                  sous le seuil du niveau le plus haut débloqué.
// Les gains diminuent à l'approche de 100 et sont réduits si l'on joue
// sous son niveau recommandé (et augmentés si l'on joue au-dessus).
// Un niveau débloqué le reste ; c'est le niveau *recommandé* qui peut
// redescendre légèrement en cas de difficultés répétées.

export const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];
export const LEVEL_COLORS = ['#10B981', '#F59E0B', '#EF4444'];
export const THRESHOLDS = [0, 35, 70];

export const SUCCESS_SCORE = 80;
export const FAIL_SCORE = 40;

export function levelForSkill(skill) {
  if (skill >= THRESHOLDS[2]) return 2;
  if (skill >= THRESHOLDS[1]) return 1;
  return 0;
}

export function recommendedLevel(entry) {
  return Math.min(levelForSkill(entry.skill), entry.unlocked);
}

export function skillDelta(score, playedLevel, entry) {
  const rec = recommendedLevel(entry);
  let delta;
  if (score >= 95) delta = 14;
  else if (score >= SUCCESS_SCORE) delta = 10;
  else if (score >= 60) delta = 4;
  else if (score >= FAIL_SCORE) delta = 1;
  else delta = -5;

  if (delta > 0) {
    if (playedLevel < rec) delta *= 0.4;
    else if (playedLevel > rec) delta *= 1.3;
    delta *= 1 - entry.skill / 160; // rendements décroissants
  } else if (playedLevel > rec) {
    delta *= 0.5; // tenter un niveau supérieur ne doit pas trop pénaliser
  }
  return delta;
}

export function applyResult(entry, score, playedLevel, now = Date.now()) {
  const before = entry.skill;
  const floor = Math.max(0, THRESHOLDS[entry.unlocked] - 10);
  let skill = before + skillDelta(score, playedLevel, entry);
  skill = Math.round(Math.max(Math.min(skill, 100), Math.min(floor, before)) * 10) / 10;

  const reached = levelForSkill(skill);
  const unlocked = Math.max(entry.unlocked, reached);
  const newEntry = {
    ...entry,
    skill,
    unlocked,
    plays: entry.plays + 1,
    best: Math.max(entry.best, score),
    lastPlayed: now,
  };
  return {
    entry: newEntry,
    before,
    after: skill,
    levelUp: unlocked > entry.unlocked ? unlocked : null,
    recommendedBefore: recommendedLevel(entry),
    recommendedAfter: recommendedLevel(newEntry),
  };
}

export function feedbackMessage(score) {
  if (score >= 95) return 'Exceptionnel ! 🚀';
  if (score >= SUCCESS_SCORE) return 'Excellent travail ! 🎯';
  if (score >= 60) return 'Bien joué, continuez ! 👍';
  if (score >= FAIL_SCORE) return 'Correct, on consolide. 💪';
  return 'Pas de souci, on ajuste la difficulté. 🌱';
}
