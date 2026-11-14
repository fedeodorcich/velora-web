import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'velora-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly darkMode = signal(false);
  readonly isDarkMode = this.darkMode.asReadonly();

  constructor() {
    const view = this.document.defaultView;
    let storedTheme: string | null = null;
    try {
      storedTheme = view?.localStorage.getItem(THEME_STORAGE_KEY) ?? null;
    } catch {
      // El tema sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
    this.setTheme(storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : view?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  toggle(): void {
    this.setTheme(this.darkMode() ? 'light' : 'dark');
  }

  private setTheme(theme: Theme): void {
    this.darkMode.set(theme === 'dark');
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
    this.document.documentElement.style.colorScheme = theme;
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // No bloquea el cambio visual si el almacenamiento no está disponible.
    }
  }
}
