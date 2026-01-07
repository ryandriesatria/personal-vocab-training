import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';

import { VocabRepositoryService } from '../services/vocab-repository.service';
import { ProgressStorageService } from '../services/progress-storage.service';
import { ProgressState, QuizAnswer, QuizAttempt, VocabLevel, VocabWord } from '../models';
import { normalizeAnswer, shuffle } from '../utils/quiz-helpers';

type QuizStatus = 'idle' | 'loading' | 'inQuiz' | 'done';
type QuizFeedback = 'none' | 'correct' | 'incorrect';

const LEVELS: VocabLevel[] = ['A', 'B', 'C', 'D', 'MISC'];
const EMPTY_PROGRESS: ProgressState = {
  completedIds: [],
  completionByLevel: LEVELS.reduce<Record<VocabLevel, number>>((acc, level) => {
    acc[level] = 0;
    return acc;
  }, {} as Record<VocabLevel, number>),
  attempts: []
};

@Injectable({
  providedIn: 'root'
})
export class QuizStore {
  private readonly vocabRepository = inject(VocabRepositoryService);
  private readonly progressStorage = inject(ProgressStorageService);

  readonly words = signal<VocabWord[]>([]);
  readonly remainingPool = signal<VocabWord[]>([]);
  readonly quizWords = signal<VocabWord[]>([]);
  readonly index = signal(0);
  readonly answers = signal<QuizAnswer[]>([]);
  readonly status = signal<QuizStatus>('idle');
  readonly feedback = signal<QuizFeedback>('none');
  readonly progress = signal<ProgressState>(EMPTY_PROGRESS);
  readonly selectedLevel = signal<VocabLevel>('A');

  readonly currentWord = computed(() => this.quizWords()[this.index()] ?? null);
  readonly currentOptions = computed(() => {
    const word = this.currentWord();
    if (!word) {
      return [];
    }

    const correct = word.en[0] ?? '';
    const distractors = this.remainingPool()
      .filter((item) => item.id !== word.id && item.en.length > 0)
      .map((item) => item.en[0])
      .filter((value) => value && value !== correct);

    return shuffle([correct, ...shuffle(distractors).slice(0, 3)]).filter(Boolean);
  });
  readonly progressText = computed(() => {
    const total = this.quizWords().length;
    if (total === 0) {
      return '0/0';
    }
    return `${Math.min(this.index() + 1, total)}/${total}`;
  });
  readonly scoreSoFar = computed(
    () => this.answers().filter((answer) => answer.isCorrect).length
  );

  async initQuiz(): Promise<void> {
    this.status.set('loading');
    this.feedback.set('none');

    try {
      const words = await firstValueFrom(this.vocabRepository.getAllWords().pipe(take(1)));
      const progress = await this.progressStorage.load();
      const level = this.selectedLevel();
      const pool = words.filter((word) => word.level === level);
      const selected = shuffle(pool).slice(0, 10);

      this.words.set(words);
      this.progress.set(progress);
      this.remainingPool.set(pool);
      this.quizWords.set(selected);
      this.index.set(0);
      this.answers.set([]);
      this.status.set(selected.length > 0 ? 'inQuiz' : 'done');
    } catch {
      this.status.set('idle');
    }
  }

  setLevel(level: VocabLevel): void {
    this.selectedLevel.set(level);
  }

  submitAnswer(answer: string): void {
    if (this.status() !== 'inQuiz') {
      return;
    }

    const currentIndex = this.index();
    const currentWord = this.quizWords()[currentIndex];
    if (!currentWord) {
      return;
    }

    if (this.answers().length > currentIndex) {
      return;
    }

    const normalized = normalizeAnswer(answer);
    const correctAnswers = currentWord.en.map((entry) => normalizeAnswer(entry));
    const isCorrect = correctAnswers.includes(normalized);

    this.answers.set([
      ...this.answers(),
      {
        wordId: currentWord.id,
        userAnswer: answer,
        isCorrect
      }
    ]);

    this.feedback.set(isCorrect ? 'correct' : 'incorrect');
  }

  next(): void {
    if (this.status() !== 'inQuiz') {
      return;
    }

    const nextIndex = this.index() + 1;
    if (nextIndex >= this.quizWords().length) {
      void this.finish();
      return;
    }

    this.index.set(nextIndex);
    this.feedback.set('none');
  }

  async finish(): Promise<void> {
    const answers = this.answers();
    const score = answers.filter((answer) => answer.isCorrect).length;
    const correctIds = answers.filter((answer) => answer.isCorrect).map((answer) => answer.wordId);
    const progress = this.progress();
    const wordMap = new Map(this.words().map((word) => [word.id, word]));
    const completedIds = new Set(progress.completedIds);
    const completionByLevel = { ...progress.completionByLevel };

    for (const wordId of correctIds) {
      if (completedIds.has(wordId)) {
        continue;
      }
      const word = wordMap.get(wordId);
      if (!word) {
        continue;
      }
      completedIds.add(wordId);
      completionByLevel[word.level] = (completionByLevel[word.level] ?? 0) + 1;
    }

    const attempt: QuizAttempt = {
      dateIso: new Date().toISOString(),
      score,
      items: answers
    };

    const nextProgress: ProgressState = {
      completedIds: Array.from(completedIds),
      completionByLevel,
      attempts: [attempt, ...progress.attempts]
    };

    await this.progressStorage.save(nextProgress);
    this.progress.set(nextProgress);
    this.status.set('done');
  }
}
