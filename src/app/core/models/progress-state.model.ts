import { QuizAttempt } from './quiz-attempt.model';
import { VocabLevel } from './vocab-word.model';

export interface ProgressState {
  completedIds: string[];
  completionByLevel: Record<VocabLevel, number>;
  attempts: QuizAttempt[];
}
