import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ProgressStorageService } from '../../core/services/progress-storage.service';
import { VocabRepositoryService } from '../../core/services/vocab-repository.service';
import { ProgressState } from '../../core/models';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private readonly vocabRepository = inject(VocabRepositoryService);
  private readonly progressStorage = inject(ProgressStorageService);

  readonly progress = signal(this.progressStorage.load());
  readonly exportControl = new FormControl('', { nonNullable: true });
  readonly importControl = new FormControl('', { nonNullable: true });
  readonly importError = signal('');
  readonly importSuccess = signal(false);
  readonly totalWords = computed(() => this.vocabRepository.words().length);
  readonly masteredCount = computed(() => this.progress().masteredIds.length);
  readonly remainingCount = computed(() => {
    const remaining = this.totalWords() - this.masteredCount();
    return remaining < 0 ? 0 : remaining;
  });

  ngOnInit(): void {
    this.progress.set(this.progressStorage.load());
    this.exportControl.setValue(JSON.stringify(this.progress(), null, 2));
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

  importProgress(): void {
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

    if (!parsed || !Array.isArray(parsed.masteredIds) || !Array.isArray(parsed.attempts)) {
      this.importError.set('JSON does not match the expected progress shape.');
      return;
    }

    this.progressStorage.save(parsed);
    const next = this.progressStorage.load();
    this.progress.set(next);
    this.exportControl.setValue(JSON.stringify(next, null, 2));
    this.importControl.setValue('');
    this.importSuccess.set(true);
  }
}
