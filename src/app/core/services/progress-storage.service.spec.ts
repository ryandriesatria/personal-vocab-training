import { TestBed } from '@angular/core/testing';

import { ProgressStorageService } from './progress-storage.service';
import { ProgressState } from '../models';

const STORAGE_KEY = 'kr-en-vocab-progress-v3';

type StoreValue = ProgressState | undefined;

function mockIndexedDb() {
  const store = new Map<string, StoreValue>();

  (globalThis as { indexedDB?: unknown }).indexedDB = {
    open: () => {
      const request = {
        result: {
          objectStoreNames: {
            contains: () => true
          },
          createObjectStore: () => undefined,
          transaction: () => ({
            objectStore: () => ({
              get: (key: string) => {
                const getRequest: { result?: StoreValue; onsuccess?: () => void } = {
                  result: store.get(key)
                };
                queueMicrotask(() => getRequest.onsuccess?.());
                return getRequest;
              },
              put: (value: ProgressState, key: string) => {
                const putRequest: { result?: StoreValue; onsuccess?: () => void } = {
                  result: undefined
                };
                queueMicrotask(() => {
                  store.set(key, value);
                  putRequest.onsuccess?.();
                });
                return putRequest;
              },
              delete: (key: string) => {
                const deleteRequest: { result?: StoreValue; onsuccess?: () => void } = {
                  result: undefined
                };
                queueMicrotask(() => {
                  store.delete(key);
                  deleteRequest.onsuccess?.();
                });
                return deleteRequest;
              }
            })
          })
        },
        onupgradeneeded: undefined,
        onsuccess: undefined,
        onerror: undefined
      } as {
        result: {
          objectStoreNames: { contains: (name: string) => boolean };
          createObjectStore: (name: string) => void;
          transaction: (name: string, mode: IDBTransactionMode) => {
            objectStore: () => {
              get: (key: string) => { onsuccess?: () => void; result?: StoreValue };
              put: (
                value: ProgressState,
                key: string
              ) => { onsuccess?: () => void; result?: StoreValue };
              delete: (key: string) => { onsuccess?: () => void; result?: StoreValue };
            };
          };
        };
        onupgradeneeded?: () => void;
        onsuccess?: () => void;
        onerror?: () => void;
      };

      queueMicrotask(() => {
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });

      return request;
    }
  };
}

describe('ProgressStorageService', () => {
  let service: ProgressStorageService;

  beforeEach(() => {
    mockIndexedDb();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressStorageService);
    localStorage.clear();
  });

  it('returns empty state when storage is missing', async () => {
    const state = await service.load();
    expect(state).toEqual({
      completedIds: [],
      completionByLevel: { A: 0, B: 0, C: 0, D: 0, MISC: 0 },
      attempts: []
    });
  });

  it('returns empty state when storage is corrupted', async () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    const state = await service.load();
    expect(state).toEqual({
      completedIds: [],
      completionByLevel: { A: 0, B: 0, C: 0, D: 0, MISC: 0 },
      attempts: []
    });
  });

  it('saves and loads progress state', async () => {
    const payload: ProgressState = {
      completedIds: ['w001'],
      completionByLevel: { A: 1, B: 0, C: 0, D: 0, MISC: 0 },
      attempts: [
        {
          dateIso: '2026-01-05',
          score: 1,
          items: [{ wordId: 'w001', userAnswer: 'apple', isCorrect: true }]
        }
      ]
    };

    await service.save(payload);
    const state = await service.load();
    expect(state).toEqual(payload);
  });
});
