import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { StateService } from './state.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-mess-selector',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  template: `
  <div class="position-relative">
    <label class="form-label">{{label}}</label>
    <input class="form-control" [placeholder]="placeholder" [(ngModel)]="query" (input)="onInput()" [disabled]="!auth.isAdmin" />
    <div class="list-group position-absolute w-100 shadow" *ngIf="options().length">
      <button type="button" class="list-group-item list-group-item-action" *ngFor="let m of options()" (click)="select(m)">
        {{m.name}}
      </button>
    </div>
  </div>
  `,
})
export class MessSelectorComponent {
  @Input() label = 'Mess';
  @Input() placeholder = 'Search mess by name';

  private api = inject(ApiService);
  private state = inject(StateService);
  protected auth = inject(AuthService);

  query = '';
  options = signal<Array<{ _id: string; name: string }>>([]);

  async ngOnInit(){
    // If user (non-admin), pin mess to their membership's messId
    if (!this.auth.isAdmin) {
      try {
        const list = await this.api.myMembers().toPromise();
        const first = (list||[])[0];
        if (first?.messId) {
          this.state.currentMessId.set(first.messId as any);
          const m = await this.api.getMess(first.messId as any).toPromise();
          if (m) this.query = m.name;
        }
      } catch {}
      return;
    }
    // Admin: keep existing behavior
    const id = this.state.currentMessId();
    if (id) {
      try {
        const m = await this.api.getMess(id).toPromise();
        if (m) this.query = m.name;
      } catch {}
    }
  }

  async onInput(){
    if(!this.query || this.query.length < 2){ this.options.set([]); return; }
    const list = await this.api.searchMesses(this.query).toPromise();
    this.options.set(list || []);
  }

  select(m: { _id: string; name: string }){
    this.state.currentMessId.set(m._id);
    this.query = m.name;
    this.options.set([]);
  }
}
