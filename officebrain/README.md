# OfficeBrain 🧠

Application mobile **React Native (Expo)** d'entraînement cognitif pour le travail de bureau.
**100 % hors-ligne** : aucune base de données externe, aucun appel réseau. Toutes les données
(scores, niveaux, historique JSON) sont stockées sur le téléphone via **AsyncStorage**.

## Fonctionnalités

- **Accueil** : bouton « Lancer mon programme du jour » (3 exercices choisis selon votre niveau et
  ce que vous n'avez pas travaillé récemment), accès libre aux 10 épreuves, accès au suivi.
- **10 exercices**, chacun en 3 niveaux (Débutant / Intermédiaire / Avancé) :

| # | Exercice | Principe | Ce qui change avec le niveau |
|---|----------|----------|------------------------------|
| 1 | Stroop | Toucher la couleur de l'encre, pas le mot | 3 → 6 couleurs, temps limité |
| 2 | Suivi de cibles | Retrouver 2 pastilles après qu'elles ont bougé | 5 → 9 pastilles, vitesse |
| 3 | Simon | Répéter une séquence lumineuse | Séquences plus longues et rapides |
| 4 | Inversion des flèches | Bleue = même sens, rouge = opposé | 2 s → 0,95 s par flèche |
| 5 | Anticipation visuelle | Écran noir 1 s, taper quand l'objet invisible atteint la ligne | Trajet masqué plus long, tolérance serrée |
| 6 | Calcul à rebours | −3 depuis 100, etc., sous chrono | −7, puis alternance −13/+4 |
| 7 | Réaction asymétrique | Carré → gauche, cercle → droite | Triangles pièges, formes orange inversées |
| 8 | Rythme cognitif | Tapoter en rythme, le tempo change sur signal | Plus de changements, métronome masqué |
| 9 | Catégorisation flash | Swipe droite = Important, gauche = Poubelle | 2,2 s → 1,1 s, pièges type phishing |
| 10 | Mémoire des lieux | Replacer les objets sur la grille après 5 s | 3×3 / 3 objets → 4×5 / 7 objets |

- **Tableau de bord** : KPI (séances, score moyen, série de jours, habileté moyenne), graphiques en
  barres sur les 7 derniers jours (global et par exercice), historique récent, export JSON
  (partage natif) et réinitialisation.

## Algorithme de progression douce (`src/progression.js`)

Chaque exercice a un **Score d'Habileté** de 0 à 100 :

- `0–34` Débutant · `35–69` Intermédiaire · `70–100` Avancé
- Score ≥ 80 % → +10 (+14 si ≥ 95 %) ; 60–79 % → +4 ; 40–59 % → +1 ; < 40 % → −5
- Gains réduits si l'on joue sous son niveau, augmentés au-dessus, et décroissants vers 100.
- Franchir un palier **débloque** le niveau suivant, qui est ensuite **proposé automatiquement**.
- En cas d'échecs, l'habileté baisse légèrement mais jamais à plus de 10 points sous le seuil du
  niveau débloqué : le niveau recommandé peut redescendre d'un cran, les niveaux débloqués restent
  accessibles.

## Lancer l'application

Prérequis : Node.js 20+.

```bash
cd officebrain
npm install
npx expo start
```

- **Sur téléphone** : installez **Expo Go** (Android / iOS) et scannez le QR code affiché.
- **Émulateur** : touche `a` (Android) ou `i` (iOS, macOS uniquement).
- **Navigateur** (aperçu rapide) : `npx expo start --web`.

### Générer un APK / IPA installable

```bash
npm install -g eas-cli
eas build -p android --profile preview   # APK Android
eas build -p ios                         # iOS (compte Apple Developer requis)
```

Ou en local avec Android Studio : `npx expo run:android`.

## Structure

```
officebrain/
├── App.js                      # Navigation (pile simple) + fournisseur de données
├── src/
│   ├── store.js                # Persistance AsyncStorage, historique, programme du jour
│   ├── progression.js          # Score d'habileté et déblocage des niveaux
│   ├── utils.js                # Aléatoire, dates, timers auto-nettoyés
│   ├── theme.js
│   ├── components/
│   │   ├── ui.js               # Boutons, cartes, barres de progression, badges
│   │   ├── BarChart.js         # Graphique 7 jours sans dépendance
│   │   └── game.js             # Moteur d'essais, chrono, score précision + vitesse
│   ├── exercises/              # Les 10 exercices + métadonnées (meta.js)
│   └── screens/                # Accueil, liste, déroulé d'exercice, programme, suivi
```

### Format des données locales

Clé AsyncStorage `officebrain:data:v1` :

```json
{
  "version": 1,
  "skills": { "stroop": { "skill": 42.5, "unlocked": 1, "plays": 7, "best": 91, "lastPlayed": 1760000000000 } },
  "history": [
    { "exId": "stroop", "level": 1, "score": 86, "details": "14/16 bonnes réponses · 812 ms en moyenne",
      "skillAfter": 42.5, "program": true, "ts": 1760000000000, "date": "2026-10-17" }
  ],
  "daily": { "date": "2026-10-17", "ids": ["swipe", "arrows", "simon"], "done": ["swipe"] }
}
```

## Ajouter un exercice

1. Créer `src/exercises/MonExercice.js` : composant recevant `{ level, onFinish }` et appelant
   `onFinish({ score /* 0–100 */, details })` à la fin.
2. Déclarer ses métadonnées dans `src/exercises/meta.js` et le composant dans `src/exercises/index.js`.
