import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { QuizStore } from '../../core/store/quiz.store';
import { ProgressStorageService } from '../../core/services/progress-storage.service';

@Component({
  selector: 'app-quiz',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizComponent implements OnInit {
  private readonly router = inject(Router);
  readonly quizStore = inject(QuizStore);
  private readonly progressStorage = inject(ProgressStorageService);
  readonly isAnswered = signal(false);
  readonly selectedAnswer = signal('');

  constructor() {
    effect(() => {
      if (this.quizStore.status() === 'done' && this.quizStore.quizWords().length > 0) {
        this.router.navigateByUrl('/result');
      }
    });
  }

  ngOnInit(): void {
    void this.quizStore.initQuiz();
  }

  submit(answer: string): void {
    this.quizStore.submitAnswer(answer);
    this.isAnswered.set(true);
    this.selectedAnswer.set(answer);
  }

  next(): void {
    this.quizStore.next();
    this.isAnswered.set(false);
    this.selectedAnswer.set('');
  }

  resetProgress(): void {
    const shouldReset = window.confirm('Reset all progress? This will clear completion totals.');
    if (!shouldReset) {
      return;
    }
    void this.progressStorage.reset().then(() => this.quizStore.initQuiz()).then(() => {
      this.isAnswered.set(false);
      this.selectedAnswer.set('');
    });
  }
}
