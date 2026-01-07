import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProgressStorageService } from '../../core/services/progress-storage.service';
import { VocabRepositoryService } from '../../core/services/vocab-repository.service';
import { ProgressState, QuizAnswer } from '../../core/models';

@Component({
  selector: 'app-result',
  imports: [RouterLink],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultComponent implements OnInit {
  private readonly progressStorage = inject(ProgressStorageService);
  private readonly vocabRepository = inject(VocabRepositoryService);

  readonly progress = signal<ProgressState>({
    completedIds: [],
    completionByLevel: { A: 0, B: 0, C: 0, D: 0, MISC: 0 },
    attempts: []
  });
  readonly latestAttempt = computed(() => this.progress().attempts[0] ?? null);
  readonly answers = computed(() => {
    const attempt = this.latestAttempt();
    if (!attempt) {
      return [];
    }

    const words = this.vocabRepository.words();
    const wordMap = new Map(words.map((word) => [word.id, word]));

    return attempt.items.map((item: QuizAnswer) => {
      const word = wordMap.get(item.wordId);
      return {
        wordId: item.wordId,
        kr: word?.kr ?? 'Unknown',
        correctEn: word?.en.join(', ') ?? 'Unknown',
        userAnswer: item.userAnswer,
        isCorrect: item.isCorrect
      };
    });
  });

  async ngOnInit(): Promise<void> {
    const loaded = await this.progressStorage.load();
    this.progress.set(loaded);
  }

  async resetProgress(): Promise<void> {
    const shouldReset = window.confirm('Reset all progress? This will clear completion totals.');
    if (!shouldReset) {
      return;
    }
    await this.progressStorage.reset();
    const loaded = await this.progressStorage.load();
    this.progress.set(loaded);
  }
}
