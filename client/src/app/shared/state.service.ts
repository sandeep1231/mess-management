import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StateService {
  currentMessId = signal<string | null>(localStorage.getItem('mm.messId'));
  currentMonth = signal<string>(localStorage.getItem('mm.month') || new Date().toISOString().slice(0,7)); // YYYY-MM

  constructor(){
    effect(() => {
      const id = this.currentMessId();
      if (id) localStorage.setItem('mm.messId', id); else localStorage.removeItem('mm.messId');
    });
    effect(() => {
      localStorage.setItem('mm.month', this.currentMonth());
    });
  }
}
