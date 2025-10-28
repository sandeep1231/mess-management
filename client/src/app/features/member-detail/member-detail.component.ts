import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { StateService } from '../../shared/state.service';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule, DecimalPipe, RouterLink],
  template: `
  <div class="container mt-3 member-detail">
    <a routerLink="/" class="btn btn-link p-0 mb-2">← Back to Dashboard</a>
    <div class="d-flex flex-wrap gap-3 align-items-end mb-3">
      <h2 class="h5 m-0">{{ displayMember() }}</h2>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" (click)="navMonth(-1)" title="Previous month">◀</button>
        <input class="form-control" style="max-width: 180px" type="month" [value]="month()" (change)="setMonth($any($event.target).value)" />
        <button class="btn btn-outline-secondary btn-sm" (click)="navMonth(1)" title="Next month">▶</button>
      </div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-6 col-md-3">
        <div class="card summary h-100"><div class="card-body">
          <div class="text-muted">Lunches</div>
          <div class="h4 m-0" *ngIf="!isLoading(); else ph1">{{ totals().lunches }}</div>
          <ng-template #ph1><span class="placeholder col-6"></span></ng-template>
        </div></div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card summary h-100"><div class="card-body">
          <div class="text-muted">Dinners</div>
          <div class="h4 m-0" *ngIf="!isLoading(); else ph2">{{ totals().dinners }}</div>
          <ng-template #ph2><span class="placeholder col-6"></span></ng-template>
        </div></div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card summary h-100"><div class="card-body">
          <div class="text-muted">Total Meals</div>
          <div class="h4 m-0" *ngIf="!isLoading(); else ph3">{{ totals().meals }}</div>
          <ng-template #ph3><span class="placeholder col-6"></span></ng-template>
        </div></div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card summary h-100"><div class="card-body">
          <div class="text-muted">Total Expenses</div>
          <div class="h4 m-0" *ngIf="!isLoading(); else ph4">{{ totals().expenses | number:'1.2-2' }}</div>
          <ng-template #ph4><span class="placeholder col-8"></span></ng-template>
        </div></div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-lg-7">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Meals Calendar — {{ month() }}</span>
          </div>
          <div class="card-body position-relative">
            <div class="weekday-row d-none d-md-grid">
              <div *ngFor="let w of weekdays">{{w}}</div>
            </div>
            <div class="calendar-grid" *ngIf="!isLoading(); else calSkeleton">
              <div class="day placeholder" *ngFor="let _ of leadingPlaceholders()"></div>
              <div class="day" *ngFor="let d of daysInMonth()" (click)="toggleDay(d.date, $event)" [class.selected]="selectedDay()===d.date">
                <div class="date">{{ d.day }}</div>
                <div class="mt-2 d-flex flex-wrap gap-1">
                  <span class="badge text-bg-success" *ngIf="hasMeal(d.date, 'lunch')"><i class="bi bi-sun me-1"></i>Lunch</span>
                  <span class="badge text-bg-primary" *ngIf="hasMeal(d.date, 'dinner')"><i class="bi bi-moon me-1"></i>Dinner</span>
                </div>
              </div>
              <div class="day placeholder" *ngFor="let _ of trailingPlaceholders()"></div>
            </div>
            <ng-template #calSkeleton>
              <div class="calendar-grid">
                <div class="day" *ngFor="let _ of skeletonDays"><span class="placeholder col-6"></span><div class="mt-2"><span class="placeholder col-7 me-1"></span><span class="placeholder col-5"></span></div></div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Expenses — {{ month() }}</span>
          </div>
          <div class="card-body">
            <ng-container *ngIf="!isLoading(); else expSkeleton">
              <div *ngIf="groupedExpenses().length===0" class="text-muted">No expenses</div>
              <div *ngFor="let g of groupedExpenses()" class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <strong>{{ g.date }}</strong>
                  <span class="badge text-bg-secondary">{{ g.total | number:'1.2-2' }}</span>
                </div>
                <ul class="list-group">
                  <li class="list-group-item d-flex justify-content-between align-items-start gap-2 flex-wrap" *ngFor="let e of g.items">
                    <span class="wrap-anywhere flex-grow-1">{{ e.category || '—' }}</span>
                    <span class="text-nowrap">{{ e.amount | number:'1.2-2' }}</span>
                  </li>
                </ul>
              </div>
            </ng-container>
            <ng-template #expSkeleton>
              <div class="list-group">
                <div class="list-group-item"><span class="placeholder col-8"></span><div class="mt-2"><span class="placeholder col-5"></span></div></div>
                <div class="list-group-item"><span class="placeholder col-7"></span><div class="mt-2"><span class="placeholder col-4"></span></div></div>
                <div class="list-group-item"><span class="placeholder col-9"></span><div class="mt-2"><span class="placeholder col-6"></span></div></div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
    <!-- Centered overlay modal for selected day -->
    <div class="detail-overlay" *ngIf="selectedDay()" (click)="closePopover()">
      <div class="detail-modal shadow" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <strong>{{ selectedDay() }}</strong>
          <button class="btn-close" (click)="closePopover()"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <span class="badge text-bg-success me-1" *ngIf="hasMeal(selectedDay()!, 'lunch')">Lunch</span>
            <span class="badge text-bg-primary" *ngIf="hasMeal(selectedDay()!, 'dinner')">Dinner</span>
          </div>
          <div *ngIf="dayExpenses(selectedDay()!).length===0" class="text-muted small">No expenses</div>
          <ul class="list-group" *ngIf="dayExpenses(selectedDay()!).length">
            <li class="list-group-item d-flex justify-content-between align-items-start gap-2 flex-wrap" *ngFor="let e of dayExpenses(selectedDay()!)">
              <span class="wrap-anywhere flex-grow-1">{{ e.category || '—' }}</span>
              <span class="text-nowrap">{{ e.amount | number:'1.2-2' }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
  .member-detail .summary .card-body { padding: 12px 16px; }
  .weekday-row { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-weight: 600; color: #6c757d; margin-bottom: 6px; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .calendar-grid .day { position: relative; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; padding: 8px; min-height: 90px; cursor: pointer; z-index: 6; }
  .day.selected { outline: 2px solid #0d6efd; }
  .day .date { font-weight: 600; font-size: .9rem; color: #495057; }
  .day.placeholder { background: #f8f9fa; border-style: dashed; }
  .wrap-anywhere { overflow-wrap: anywhere; }
  .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 1060; }
  .detail-modal { width: 100%; max-width: 420px; background: #fff; border: 1px solid #dee2e6; border-radius: 12px; }
  .detail-modal .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e9ecef; }
  .detail-modal .modal-body { padding: 12px 16px; max-height: 70vh; overflow: auto; }
  @media (max-width: 576px) {
    .calendar-grid { grid-template-columns: repeat(3, 1fr); }
    .weekday-row { display: none; }
  }
  `]
})
export class MemberDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private state = inject(StateService);

  messId = this.state.currentMessId;
  month = this.state.currentMonth;

  memberId = signal<string>('');
  member = signal<any | null>(null);
  meals = signal<any[]>([]);
  expenses = signal<any[]>([]);
  totals = signal<{ lunches: number; dinners: number; meals: number; expenses: number }>({ lunches: 0, dinners: 0, meals: 0, expenses: 0 });
  isLoading = signal(false);
  selectedDay = signal<string | null>(null);

  constructor(){
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id') || '';
      this.memberId.set(id);
      this.refresh();
    });
    effect(() => { const _m = this.month(); const _id = this.messId(); this.refresh(); });
  }

  setMonth(v: string){ if(v) this.state.currentMonth.set(v); }

  async refresh(){
    const messId = this.messId(); const memberId = this.memberId(); const month = this.month();
    if(!messId || !memberId) return;
    this.isLoading.set(true);
    try {
      const [members, meals, expenses] = await Promise.all([
        this.api.listMembers(messId).toPromise(),
        this.api.listMeals(messId, month, memberId).toPromise(),
        this.api.listExpenses(messId, month, memberId).toPromise(),
      ]);
      this.member.set((members||[]).find(m => m._id === memberId) || null);
      this.meals.set(meals || []);
      this.expenses.set(expenses || []);
      // totals
      let lunches = 0, dinners = 0; (meals||[]).forEach((x:any)=>{ lunches += x.lunch ? 1 : 0; dinners += x.dinner ? 1 : 0; });
      const totalExpenses = (expenses||[]).reduce((s:number,e:any)=> s + (e.amount||0), 0);
      this.totals.set({ lunches, dinners, meals: lunches + dinners, expenses: totalExpenses });
      this.selectedDay.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  displayMember(){
    const m = this.member();
    return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : '';
  }

  days(){
    const monthStr = this.month();
    const [y, m] = monthStr.split('-').map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({length: days}, (_,i)=> `${monthStr}-${String(i+1).padStart(2,'0')}`);
  }

  hasMeal(date: string, which: 'lunch'|'dinner'){
    return this.meals().some(x => x.date === date && !!x[which]);
  }

  // Calendar helpers
  get weekdays(){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; }
  private ymd(){ const [y,m] = this.month().split('-').map(Number); return { y, m }; }
  firstDayOffset(){ const {y,m} = this.ymd(); return new Date(y, m-1, 1).getDay(); }
  daysInMonth(){
    const {y,m} = this.ymd();
    const count = new Date(y, m, 0).getDate();
    return Array.from({length: count}, (_,i)=> ({ day: i+1, date: `${this.month()}-${String(i+1).padStart(2,'0')}` }));
  }
  leadingPlaceholders(){ return Array.from({length: this.firstDayOffset()}); }
  trailingPlaceholders(){
    const lead = this.firstDayOffset();
    const count = this.daysInMonth().length;
    const rem = (lead + count) % 7;
    const trail = rem === 0 ? 0 : 7 - rem;
    return Array.from({length: trail});
  }

  groupedExpenses(){
    const map: Record<string, any[]> = {};
    for(const e of this.expenses()){
      (map[e.date] ||= []).push(e);
    }
    const out = Object.keys(map).sort().map(d => ({ date: d, items: map[d], total: map[d].reduce((s, e:any)=> s + (e.amount||0), 0) }));
    return out;
  }

  navMonth(delta: number){
    const [y,m] = this.month().split('-').map(Number);
    const cur = new Date(y, m-1, 1);
    cur.setMonth(cur.getMonth() + delta);
    const next = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`;
    this.setMonth(next);
  }

  dayExpenses(date: string){
    return this.expenses().filter(e => e.date === date);
  }
  toggleDay(date: string, ev: MouseEvent){
    ev.stopPropagation();
    this.selectedDay.set(this.selectedDay() === date ? null : date);
  }
  closePopover(){ this.selectedDay.set(null); }

  // skeleton helpers
  get skeletonDays(){ return Array.from({length: 14}); }

  // removed global document click; using local backdrop for stability
}
