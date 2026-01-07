import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

type ThemeMode = 'light' | 'dark';
const THEME_STORAGE_KEY = 'kr-vocab-theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  readonly theme = signal<ThemeMode>(this.getStoredTheme());

  toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  }

  private getStoredTheme(): ThemeMode {
    if (typeof localStorage === 'undefined') {
      return 'light';
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  }
}
