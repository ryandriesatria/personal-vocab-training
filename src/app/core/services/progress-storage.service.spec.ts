import { TestBed } from '@angular/core/testing';

import { ProgressStorageService } from './progress-storage.service';
import { ProgressState } from '../models';

const STORAGE_KEY = 'kr-en-vocab-progress-v1';

describe('ProgressStorageService', () => {
  let service: ProgressStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressStorageService);
    localStorage.clear();
  });

  it('returns empty state when storage is missing', () => {
    const state = service.load();
    expect(state).toEqual({ masteredIds: [], attempts: [] });
  });

  it('returns empty state when storage is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    const state = service.load();
    expect(state).toEqual({ masteredIds: [], attempts: [] });
  });

  it('saves and loads progress state', () => {
    const payload: ProgressState = {
      masteredIds: ['w001'],
      attempts: [
        {
          dateIso: '2026-01-05',
          score: 1,
          items: [{ wordId: 'w001', userAnswer: 'apple', isCorrect: true }]
        }
      ]
    };

    service.save(payload);
    const state = service.load();
    expect(state).toEqual(payload);
  });
});
