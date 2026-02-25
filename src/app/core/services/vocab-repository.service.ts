import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';

import { VocabWord } from '../models';

@Injectable({
  providedIn: 'root'
})
export class VocabRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly words$ = this.http.get<VocabWord[]>('assets/vocab.json').pipe(
    map((words) =>
      words.map((word) => ({
        ...word,
        level: word.level ?? 'MISC'
      }))
    ),
    shareReplay(1)
  );

  readonly words = toSignal(this.words$, { initialValue: [] });

  getAllWords() {
    return this.words$;
  }
}
