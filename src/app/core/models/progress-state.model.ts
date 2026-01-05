import { QuizAttempt } from './quiz-attempt.model';

export interface ProgressState {
  masteredIds: string[];
  attempts: QuizAttempt[];
}
