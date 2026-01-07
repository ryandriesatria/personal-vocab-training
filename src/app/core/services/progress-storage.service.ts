import { Injectable } from '@angular/core';

import { ProgressState, VocabLevel } from '../models';

const STORAGE_KEY = 'kr-en-vocab-progress-v3';
const DB_NAME = 'kr-vocab-progress';
const DB_VERSION = 1;
const STORE_NAME = 'progress';
const STORE_KEY = 'state';
const LEVELS: VocabLevel[] = ['A', 'B', 'C', 'D', 'MISC'];
const EMPTY_STATE: ProgressState = {
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
export class ProgressStorageService {
  async load(): Promise<ProgressState> {
    const migrated = this.migrateFromLocalStorage();
    if (migrated) {
      await this.save(migrated);
      return migrated;
    }

    const db = await this.openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(STORE_KEY);
      request.onsuccess = () => {
        const parsed = request.result as ProgressState | undefined;
        resolve(this.normalizeState(parsed));
      };
      request.onerror = () => resolve({ ...EMPTY_STATE });
    });
  }

  async save(state: ProgressState): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(state, STORE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async reset(): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(STORE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private normalizeState(parsed?: ProgressState): ProgressState {
    if (
      !parsed ||
      !Array.isArray(parsed.completedIds) ||
      !Array.isArray(parsed.attempts) ||
      !parsed.completionByLevel
    ) {
      return { ...EMPTY_STATE };
    }

    return {
      completedIds: [...parsed.completedIds],
      completionByLevel: { ...EMPTY_STATE.completionByLevel, ...parsed.completionByLevel },
      attempts: [...parsed.attempts]
    };
  }

  private migrateFromLocalStorage(): ProgressState | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ProgressState;
      localStorage.removeItem(STORAGE_KEY);
      return this.normalizeState(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
