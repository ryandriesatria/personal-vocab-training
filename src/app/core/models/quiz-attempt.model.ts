import { QuizAnswer } from './quiz-answer.model';

export interface QuizAttempt {
  dateIso: string;
  score: number;
  items: QuizAnswer[];
}
