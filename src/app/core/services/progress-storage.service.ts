import { Injectable } from '@angular/core';

import { ProgressState } from '../models';

const STORAGE_KEY = 'kr-en-vocab-progress-v1';
const EMPTY_STATE: ProgressState = { masteredIds: [], attempts: [] };

@Injectable({
  providedIn: 'root'
})
export class ProgressStorageService {
  load(): ProgressState {
    if (typeof localStorage === 'undefined') {
      return { ...EMPTY_STATE };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_STATE };
    }

    try {
      const parsed = JSON.parse(raw) as ProgressState;
      if (!parsed || !Array.isArray(parsed.masteredIds) || !Array.isArray(parsed.attempts)) {
        return { ...EMPTY_STATE };
      }
      return {
        masteredIds: [...parsed.masteredIds],
        attempts: [...parsed.attempts]
      };
    } catch {
      return { ...EMPTY_STATE };
    }
  }

  save(state: ProgressState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
