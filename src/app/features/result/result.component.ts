import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProgressStorageService } from '../../core/services/progress-storage.service';
import { VocabRepositoryService } from '../../core/services/vocab-repository.service';

@Component({
  selector: 'app-result',
  imports: [RouterLink],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultComponent {
  private readonly progressStorage = inject(ProgressStorageService);
  private readonly vocabRepository = inject(VocabRepositoryService);

  readonly progress = signal(this.progressStorage.load());
  readonly latestAttempt = computed(() => this.progress().attempts[0] ?? null);
  readonly answers = computed(() => {
    const attempt = this.latestAttempt();
    if (!attempt) {
      return [];
    }

    const words = this.vocabRepository.words();
    const wordMap = new Map(words.map((word) => [word.id, word]));

    return attempt.items.map((item) => {
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

  resetProgress(): void {
    const shouldReset = window.confirm('Reset all progress? This will clear mastered words.');
    if (!shouldReset) {
      return;
    }
    this.progressStorage.reset();
    this.progress.set(this.progressStorage.load());
  }
}
