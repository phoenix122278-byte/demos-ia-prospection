// Métadonnées des 10 exercices (sans les composants, pour éviter les imports circulaires).
export const EXERCISES = [
  {
    id: 'stroop',
    num: 1,
    name: 'Stroop',
    icon: '🎨',
    color: '#E53935',
    skill: 'Inhibition',
    short: "Touchez la couleur de l'encre, pas le mot.",
    rules:
      "Un nom de couleur s'affiche, écrit dans une encre d'une autre couleur. Touchez le plus vite possible le bouton correspondant à la couleur de l'ENCRE, sans vous laisser piéger par le mot.",
    levels: ['3 couleurs, sans limite de temps', '4 couleurs, 3 s par mot', '6 couleurs, 1,7 s par mot'],
  },
  {
    id: 'tracking',
    num: 2,
    name: 'Suivi de cibles',
    icon: '🎯',
    color: '#1E88E5',
    skill: 'Attention divisée',
    short: 'Suivez 2 pastilles parmi toutes celles qui bougent.',
    rules:
      "2 pastilles clignotent au début : mémorisez-les. Puis toutes les pastilles deviennent identiques et se déplacent. Quand elles s'arrêtent, touchez les 2 pastilles initiales.",
    levels: ['5 pastilles, lentes', '7 pastilles, vitesse moyenne', '9 pastilles, rapides'],
  },
  {
    id: 'simon',
    num: 3,
    name: 'Simon',
    icon: '🔁',
    color: '#8E24AA',
    skill: 'Mémoire de travail',
    short: 'Répétez la séquence de boutons allumés.',
    rules:
      "Les boutons s'allument dans un ordre précis. Observez, puis reproduisez la séquence dans le même ordre. La séquence s'allonge à chaque manche.",
    levels: ['Séquences de 3 à 7', 'Séquences de 4 à 8, plus rapides', 'Séquences de 5 à 9, très rapides'],
  },
  {
    id: 'arrows',
    num: 4,
    name: 'Inversion des flèches',
    icon: '🔀',
    color: '#3949AB',
    skill: 'Flexibilité cognitive',
    short: 'Bleue : même sens. Rouge : sens opposé.',
    rules:
      "Une flèche apparaît. Si elle est BLEUE, touchez sa direction. Si elle est ROUGE, touchez la direction OPPOSÉE. Répondez avant qu'elle ne disparaisse.",
    levels: ['2 s par flèche', '1,4 s par flèche', '0,95 s par flèche'],
  },
  {
    id: 'anticipation',
    num: 5,
    name: 'Anticipation visuelle',
    icon: '⚡',
    color: '#F4511E',
    skill: 'Anticipation',
    short: "Tapez quand l'objet invisible atteint la ligne.",
    rules:
      "Un objet avance en ligne droite vers la ligne cible. L'écran devient noir 1 seconde, puis l'objet reste invisible. Touchez l'écran pile au moment où il aurait dû atteindre la ligne.",
    levels: ['Trajet masqué court, tolérance large', 'Trajet masqué moyen, vitesses variées', 'Trajet masqué long, tolérance serrée'],
  },
  {
    id: 'countdown',
    num: 6,
    name: 'Calcul à rebours',
    icon: '🧮',
    color: '#00897B',
    skill: 'Calcul mental',
    short: 'Enchaînez le calcul sous la pression du chrono.',
    rules:
      'Une règle de calcul est donnée (ex. : soustraire 3 en partant de 100). Tapez le nombre suivant, encore et encore, le plus vite possible avant la fin du chrono.',
    levels: ['−3 depuis 100, 45 s', '−7 depuis ~180, 45 s', 'Alterner −13 / +4 depuis ~350, 40 s'],
  },
  {
    id: 'asymmetric',
    num: 7,
    name: 'Réaction asymétrique',
    icon: '⬛',
    color: '#5E35B1',
    skill: 'Discrimination',
    short: 'Carré → gauche, cercle → droite.',
    rules:
      "Une forme apparaît. Carré : touchez la zone GAUCHE. Cercle : touchez la zone DROITE. Au niveau Intermédiaire, le triangle est un piège : ne touchez rien. Au niveau Avancé, une forme ORANGE inverse la règle.",
    levels: ['Carrés et cercles', '+ triangles pièges (ne rien toucher)', '+ formes orange inversées, plus rapide'],
  },
  {
    id: 'rhythm',
    num: 8,
    name: 'Rythme cognitif',
    icon: '🥁',
    color: '#D81B60',
    skill: 'Synchronisation',
    short: 'Tapotez en rythme, adaptez-vous au changement.',
    rules:
      "Un métronome visuel bat la mesure. Tapotez l'écran exactement sur chaque battement. Au signal « CHANGEMENT », le tempo change : adaptez-vous immédiatement.",
    levels: ['1 changement de tempo', '2 changements de tempo', '3 changements, métronome partiellement masqué'],
  },
  {
    id: 'swipe',
    num: 9,
    name: 'Catégorisation flash',
    icon: '📥',
    color: '#039BE5',
    skill: 'Tri & décision',
    short: 'Swipez : droite = Important, gauche = Poubelle.',
    rules:
      "Des éléments de bureau apparaissent. Swipez à DROITE (ou bouton ✅) ce qui est important / à traiter, à GAUCHE (ou bouton 🗑️) ce qui part à la poubelle ou aux archives. Vite : le temps est compté !",
    levels: ['2,2 s par carte', '1,5 s par carte', '1,1 s par carte, pièges (phishing…)'],
  },
  {
    id: 'grid',
    num: 10,
    name: 'Mémoire des lieux',
    icon: '🗂️',
    color: '#6D4C41',
    skill: 'Mémoire spatiale',
    short: 'Replacez les objets du bureau au bon endroit.',
    rules:
      "Une grille de bureau s'affiche avec des objets pendant 5 secondes. Elle se vide ensuite : sélectionnez chaque objet puis touchez la case où il se trouvait.",
    levels: ['Grille 3×3, 3 objets', 'Grille 4×4, 5 objets', 'Grille 4×5, 7 objets'],
  },
];

export const EXERCISE_IDS = EXERCISES.map((e) => e.id);
export const getExercise = (id) => EXERCISES.find((e) => e.id === id);
