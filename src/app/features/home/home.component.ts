import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ProgressStorageService } from '../../core/services/progress-storage.service';
import { ProgressState, VocabLevel } from '../../core/models';
import { QuizStore } from '../../core/store/quiz.store';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private readonly progressStorage = inject(ProgressStorageService);
  private readonly quizStore = inject(QuizStore);
  private readonly router = inject(Router);

  readonly progress = signal<ProgressState>({
    completedIds: [],
    completionByLevel: { A: 0, B: 0, C: 0, D: 0, MISC: 0 },
    attempts: []
  });
  readonly exportControl = new FormControl('', { nonNullable: true });
  readonly importControl = new FormControl('', { nonNullable: true });
  readonly importError = signal('');
  readonly importSuccess = signal(false);
  readonly completedCount = computed(() => this.progress().completedIds.length);
  readonly levels: VocabLevel[] = ['A', 'B', 'C', 'D', 'MISC'];
  readonly selectedLevel = signal<VocabLevel>('A');

  async ngOnInit(): Promise<void> {
    const loaded = await this.progressStorage.load();
    this.progress.set(loaded);
    this.exportControl.setValue(JSON.stringify(loaded, null, 2));
  }

  startQuiz(): void {
    this.quizStore.setLevel(this.selectedLevel());
    void this.router.navigateByUrl('/quiz');
  }

  refreshExport(): void {
    this.exportControl.setValue(JSON.stringify(this.progress(), null, 2));
  }

  copyExport(): void {
    const value = this.exportControl.value;
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(value);
    }
  }

  async importProgress(): Promise<void> {
    this.importError.set('');
    this.importSuccess.set(false);

    const raw = this.importControl.value.trim();
    if (!raw) {
      this.importError.set('Paste JSON to import your progress.');
      return;
    }

    let parsed: ProgressState;
    try {
      parsed = JSON.parse(raw) as ProgressState;
    } catch {
      this.importError.set('Invalid JSON format.');
      return;
    }

    if (
      !parsed ||
      !Array.isArray(parsed.completedIds) ||
      !Array.isArray(parsed.attempts) ||
      !parsed.completionByLevel
    ) {
      this.importError.set('JSON does not match the expected progress shape.');
      return;
    }

    await this.progressStorage.save(parsed);
    const next = await this.progressStorage.load();
    this.progress.set(next);
    this.exportControl.setValue(JSON.stringify(next, null, 2));
    this.importControl.setValue('');
    this.importSuccess.set(true);
  }
}
