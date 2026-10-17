import Stroop from './Stroop';
import Tracking from './Tracking';
import Simon from './Simon';
import Arrows from './Arrows';
import Anticipation from './Anticipation';
import Countdown from './Countdown';
import Asymmetric from './Asymmetric';
import Rhythm from './Rhythm';
import Swipe from './Swipe';
import GridMemory from './GridMemory';

export { EXERCISES, EXERCISE_IDS, getExercise } from './meta';

// Chaque composant reçoit { level, onFinish({ score: 0–100, details }) }.
export const EXERCISE_COMPONENTS = {
  stroop: Stroop,
  tracking: Tracking,
  simon: Simon,
  arrows: Arrows,
  anticipation: Anticipation,
  countdown: Countdown,
  asymmetric: Asymmetric,
  rhythm: Rhythm,
  swipe: Swipe,
  grid: GridMemory,
};
