import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { RouterLink } from '@angular/router';
import { StateService } from '../../shared/state.service';
import { MessSelectorComponent } from '../../shared/mess-selector.component';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DecimalPipe, MessSelectorComponent, RouterLink, FormsModule],
  template: `
  <div class="container mt-3">
    <div class="row g-2 align-items-end mb-3">
      <div class="col-12 col-md-5">
        <app-mess-selector label="Mess" placeholder="Search by name"></app-mess-selector>
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label">Month</label>
        <input class="form-control" type="month" [value]="month()" (change)="setMonth($any($event.target).value)" />
      </div>
      <div class="col-6 col-md-2">
        <button class="btn btn-primary w-100" (click)="refresh()" [disabled]="!messId()">Refresh</button>
      </div>
    </div>

    <div *ngIf="hasRefreshed && !summary()" class="alert alert-warning" role="alert">
      No data found for the selected Mess ID and month.
    </div>

    <ng-container *ngIf="summary() as s">
      <div class="row g-3 mb-3">
        <div class="col-12 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <div class="text-muted">Total Expenses</div>
              <button class="btn btn-link p-0 h4 m-0 text-decoration-none" (click)="openExpensesDetails()">{{ s.totals.totalExpenses | number:'1.2-2' }}</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <div class="text-muted">Total Meals</div>
              <button class="btn btn-link p-0 h4 m-0 text-decoration-none" (click)="openMealsDetails()">{{ s.totals.totalMeals }}</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-3">
          <div class="card h-100">
            <div class="card-body">
              <div class="text-muted">Meal Rate</div>
              <div class="h4 m-0">{{ s.totals.mealRate | number:'1.2-2' }}</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-3">
          <div class="card h-100">
            <div class="card-body" (click)="openTodayDetails()" style="cursor: pointer;">
              <div class="d-flex align-items-center justify-content-between">
                <div class="text-muted">Today's Meals ({{ todayDate }})</div>
                <div *ngIf="todayLoading()" class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>
              </div>
              <div class="d-flex align-items-center gap-3 mt-2">
                <span class="badge text-bg-success">Lunch: {{ todayLunchCount() }}</span>
                <span class="badge text-bg-primary">Dinner: {{ todayDinnerCount() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Per-member totals bar chart -->
        <div class="card mb-3">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div>Per-member totals — {{ chartMetric() === 'meals' ? 'Meals' : 'Paid' }}</div>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn" [class.btn-primary]="chartMetric()==='meals'" [class.btn-outline-secondary]="chartMetric()!=='meals'" (click)="setChartMetric('meals')">Meals</button>
              <button type="button" class="btn" [class.btn-primary]="chartMetric()==='paid'" [class.btn-outline-secondary]="chartMetric()!=='paid'" (click)="setChartMetric('paid')">Paid</button>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="chartItems().length; else noChartData" class="vstack gap-2">
              <div *ngFor="let it of chartItems()" class="w-100">
                <div class="d-flex justify-content-between align-items-center mb-1 small">
                  <div class="text-truncate" title="{{ displayMember(it.memberId) }}">{{ displayMember(it.memberId) }}</div>
                  <div class="ms-2 fw-semibold">{{ it.value | number: chartMetric()==='paid' ? '1.2-2' : '1.0-0' }}</div>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar" role="progressbar" [style.width]="it.percent + '%'" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            </div>
            <ng-template #noChartData>
              <div class="text-muted text-center">No data to plot for this month.</div>
            </ng-template>
          </div>
        </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>Member-wise Breakdown — {{ month() }}</div>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-striped mb-0">
            <thead>
              <tr>
                <th>Member</th>
                <th class="text-end">Meals</th>
                <th class="text-end">Cost</th>
                <th class="text-end">Paid</th>
                <th class="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of s.perMember">
                <td>
                  <a [routerLink]="['/member', row.memberId]">{{ displayMember(row.memberId) }}</a>
                </td>
                <td class="text-end">{{ row.meals }}</td>
                <td class="text-end">{{ row.cost | number:'1.2-2' }}</td>
                <td class="text-end">{{ row.paid | number:'1.2-2' }}</td>
                <td class="text-end" [class.text-success]="row.balance>0" [class.text-danger]="row.balance<0">{{ row.balance | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- Meals Details Modal -->
  <div class="modal-backdrop fade show" *ngIf="showMeals()"></div>
  <div class="modal d-block" tabindex="-1" *ngIf="showMeals()">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Meals — {{ month() }}</h5>
          <button type="button" class="btn-close" (click)="closeMealsDetails()"></button>
        </div>
        <div class="modal-body">
          <div *ngIf="mealsLoading()" class="placeholder-glow">
            <div class="placeholder col-12 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-10 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-8" style="height: 10px;"></div>
          </div>
          <div *ngIf="!mealsLoading()">
            <div *ngIf="mealsDetails()?.length" class="mb-3">
              <div class="fw-semibold mb-1">Per-member totals</div>
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th class="text-center" style="width: 120px;">Lunch</th>
                      <th class="text-center" style="width: 120px;">Dinner</th>
                      <th class="text-center" style="width: 120px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let t of mealsTotalsByMember()">
                      <td>{{ displayMember(t.memberId) }}</td>
                      <td class="text-center">{{ t.lunch }}</td>
                      <td class="text-center">{{ t.dinner }}</td>
                      <td class="text-center fw-semibold">{{ t.total }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th style="width: 120px;">Date</th>
                    <th>Member</th>
                    <th class="text-center" style="width: 90px;">Lunch</th>
                    <th class="text-center" style="width: 90px;">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of mealsDetails()">
                    <td><span class="badge text-bg-light border">{{ r.date }}</span></td>
                    <td>{{ displayMember(r.memberId) }}</td>
                    <td class="text-center"><i class="bi" [class.bi-check-lg]="r.lunch" [class.bi-dash]="!r.lunch"></i></td>
                    <td class="text-center"><i class="bi" [class.bi-check-lg]="r.dinner" [class.bi-dash]="!r.dinner"></i></td>
                  </tr>
                  <tr *ngIf="!mealsDetails()?.length">
                    <td colspan="4" class="text-center text-muted py-4">No meals found for this month.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeMealsDetails()">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Expenses Details Modal -->
  <div class="modal-backdrop fade show" *ngIf="showExpenses()"></div>
  <div class="modal d-block" tabindex="-1" *ngIf="showExpenses()">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Expenses — {{ month() }}</h5>
          <button type="button" class="btn-close" (click)="closeExpensesDetails()"></button>
        </div>
        <div class="modal-body">
          <div *ngIf="expensesLoading()" class="placeholder-glow">
            <div class="placeholder col-12 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-10 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-8" style="height: 10px;"></div>
          </div>
          <div *ngIf="!expensesLoading()">
            <div *ngIf="expensesDetails()?.length" class="mb-3">
              <div class="fw-semibold mb-1">Per-member totals</div>
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th class="text-end" style="width: 160px;">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let t of expensesTotalsByMember()">
                      <td>{{ displayMember(t.memberId) }}</td>
                      <td class="text-end fw-semibold">{{ t.total | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th style="width: 120px;">Date</th>
                    <th>Payer</th>
                    <th>Category</th>
                    <th class="text-end" style="width: 140px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of expensesDetails()">
                    <td><span class="badge text-bg-light border">{{ r.date }}</span></td>
                    <td>{{ displayMember(r.payerMemberId) }}</td>
                    <td><span class="badge text-bg-secondary">{{ r.category || '—' }}</span></td>
                    <td class="text-end"><span class="badge text-bg-dark">{{ r.amount | number:'1.2-2' }}</span></td>
                  </tr>
                  <tr *ngIf="!expensesDetails()?.length">
                    <td colspan="4" class="text-center text-muted py-4">No expenses found for this month.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeExpensesDetails()">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Today's Meals Details Modal (view only) -->
  <div class="modal-backdrop fade show" *ngIf="showTodayDetails()"></div>
  <div class="modal d-block" tabindex="-1" *ngIf="showTodayDetails()">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Today's Meals — {{ todayDate }}</h5>
          <button type="button" class="btn-close" (click)="closeTodayDetails()"></button>
        </div>
        <div class="modal-body">
          <div *ngIf="todayDetailsLoading()" class="placeholder-glow">
            <div class="placeholder col-12 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-10 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-8" style="height: 10px;"></div>
          </div>
          <div *ngIf="!todayDetailsLoading()">
            <div class="mb-3 small text-muted">Mark attendance for today. {{ auth.isAdmin ? 'As admin you can update everyone.' : 'You can update only your own row.' }}</div>
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th class="text-center" style="width:100px">Lunch</th>
                    <th class="text-center" style="width:100px">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of todayAttendance()">
                    <td>{{ displayMember(row.memberId) }}</td>
                    <td class="text-center">
                      <input type="checkbox" class="form-check-input" [disabled]="!canEditMember(row.memberId)" [(ngModel)]="row.lunch" />
                    </td>
                    <td class="text-center">
                      <input type="checkbox" class="form-check-input" [disabled]="!canEditMember(row.memberId)" [(ngModel)]="row.dinner" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="saveTodayAttendance()" [disabled]="savingToday() || !todayAttendance().length">
            <span *ngIf="!savingToday(); else savingTpl">Save</span>
          </button>
          <ng-template #savingTpl>
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving
          </ng-template>
          <button class="btn btn-outline-secondary" (click)="closeTodayDetails()" [disabled]="savingToday()">Close</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: []
})
export class DashboardComponent {
  private api = inject(ApiService);
  private state = inject(StateService);
  auth = inject(AuthService);

  messId = this.state.currentMessId;
  month = this.state.currentMonth;
  summary = signal<any | null>(null);
  hasRefreshed = false;
  membersMap = signal<Record<string, any>>({});
  // Details modal state
  showMeals = signal(false);
  showExpenses = signal(false);
  mealsLoading = signal(false);
  expensesLoading = signal(false);
  mealsDetails = signal<any[]>([]);
  expensesDetails = signal<any[]>([]);
  // Chart metric state
  chartMetric = signal<'meals' | 'paid'>('meals');
  // Today's meals state
  todayLunchCount = signal(0);
  todayDinnerCount = signal(0);
  todayLoading = signal(false);
  readonly todayDate = new Date().toISOString().slice(0,10);
  // Today's details modal state
  showTodayDetails = signal(false);
  todayDetailsLoading = signal(false);
  todayLunchMembers = signal<string[]>([]);
  todayDinnerMembers = signal<string[]>([]);
  todayAttendance = signal<Array<{ memberId: string; lunch: boolean; dinner: boolean }>>([]);
  savingToday = signal(false);

  setMonth(v: string){ if(v) this.state.currentMonth.set(v); }

  constructor(){
    // Auto-load when mess or month changes
    effect(() => {
      const id = this.messId();
      const _m = this.month();
      if (id) this.refresh();
      if (id) this.refreshTodayCounts();
    });
  }

  async refresh(){
    const id = this.messId(); if(!id) return;
    const [summary, members] = await Promise.all([
      this.api.getSummary(id, this.month()).toPromise(),
      this.api.listMembers(id).toPromise(),
    ]);
    const map: Record<string, any> = {};
    (members||[]).forEach(m => map[m._id] = m);
    this.membersMap.set(map);
    this.summary.set(summary || null);
    this.hasRefreshed = true;
  }

  displayMember(id: string){
    const m = this.membersMap()[id];
    return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : id;
  }

  // Totals click handlers
  async openMealsDetails(){
    const id = this.messId(); if(!id) return;
    this.showMeals.set(true);
    this.mealsLoading.set(true);
    try {
      const rows = await this.api.listMeals(id, this.month()).toPromise();
      this.mealsDetails.set(rows || []);
    } finally {
      this.mealsLoading.set(false);
    }
  }
  closeMealsDetails(){ this.showMeals.set(false); }

  async openExpensesDetails(){
    const id = this.messId(); if(!id) return;
    this.showExpenses.set(true);
    this.expensesLoading.set(true);
    try {
      const rows = await this.api.listExpenses(id, this.month()).toPromise();
      this.expensesDetails.set(rows || []);
    } finally {
      this.expensesLoading.set(false);
    }
  }
  closeExpensesDetails(){ this.showExpenses.set(false); }

  // Per-member totals derived from details
  mealsTotalsByMember(){
    const rows = this.mealsDetails() || [];
    const acc = new Map<string, { lunch: number; dinner: number }>();
    for(const r of rows){
      const e = acc.get(r.memberId) || { lunch: 0, dinner: 0 };
      if (r.lunch) e.lunch += 1;
      if (r.dinner) e.dinner += 1;
      acc.set(r.memberId, e);
    }
    const arr = Array.from(acc.entries()).map(([memberId, v]) => ({ memberId, lunch: v.lunch, dinner: v.dinner, total: v.lunch + v.dinner }));
    arr.sort((a,b) => b.total - a.total);
    return arr;
  }

  expensesTotalsByMember(){
    const rows = this.expensesDetails() || [];
    const acc = new Map<string, number>();
    for(const r of rows){
      acc.set(r.payerMemberId, (acc.get(r.payerMemberId) || 0) + (Number(r.amount) || 0));
    }
    const arr = Array.from(acc.entries()).map(([memberId, total]) => ({ memberId, total }));
    arr.sort((a,b) => b.total - a.total);
    return arr;
  }

  setChartMetric(m: 'meals' | 'paid'){ this.chartMetric.set(m); }

  chartItems(){
    type Raw = { memberId: string; value: number };
    type Out = { memberId: string; value: number; percent: number };
    const s = this.summary();
    if(!s || !Array.isArray(s.perMember)) return [] as Out[];
    const metric = this.chartMetric();
    const raw: Raw[] = s.perMember.map((row: any) => ({
      memberId: row.memberId as string,
      value: Number(metric === 'paid' ? row.paid : row.meals) || 0,
    }));
    const max = raw.reduce((m: number, r: Raw) => Math.max(m, r.value), 0);
    const withPct: Out[] = raw
      .map((r: Raw) => ({ ...r, percent: max > 0 ? Math.max(2, Math.round((r.value / max) * 100)) : 0 }))
      .filter((r: Out) => r.value > 0)
      .sort((a: Out, b: Out) => b.value - a.value);
    return withPct;
  }

  async refreshTodayCounts(){
    const id = this.messId(); if(!id) return;
    this.todayLoading.set(true);
    try {
      const todayMonth = this.todayDate.slice(0,7);
      const rows = await this.api.listMeals(id, todayMonth).toPromise();
      let lunch = 0, dinner = 0;
      for(const r of (rows || [])){
        if(r?.date === this.todayDate){
          if (r.lunch) lunch += 1;
          if (r.dinner) dinner += 1;
        }
      }
      this.todayLunchCount.set(lunch);
      this.todayDinnerCount.set(dinner);
    } finally {
      this.todayLoading.set(false);
    }
  }

  async openTodayDetails(){
    const id = this.messId(); if(!id) return;
    this.showTodayDetails.set(true);
    this.todayDetailsLoading.set(true);
    try {
      const todayMonth = this.todayDate.slice(0,7);
      const [rows, members] = await Promise.all([
        this.api.listMeals(id, todayMonth).toPromise(),
        this.api.listMembers(id).toPromise(),
      ]);
      const activeMembers = (members || []).filter((m:any) => m.active !== false);
      const todayMap = new Map<string, { lunch: boolean; dinner: boolean }>();
      for(const r of (rows || [])){
        if(r?.date === this.todayDate){
          todayMap.set(r.memberId, { lunch: !!r.lunch, dinner: !!r.dinner });
        }
      }
      // Build attendance rows for all active members
      const att = activeMembers.map((m:any) => ({
        memberId: m._id as string,
        lunch: todayMap.get(m._id)?.lunch ?? false,
        dinner: todayMap.get(m._id)?.dinner ?? false,
      }));
      this.todayAttendance.set(att);
      // For counts display
      this.todayLunchMembers.set(att.filter(a=>a.lunch).map(a=>a.memberId));
      this.todayDinnerMembers.set(att.filter(a=>a.dinner).map(a=>a.memberId));
    } finally {
      this.todayDetailsLoading.set(false);
    }
  }
  closeTodayDetails(){ this.showTodayDetails.set(false); }

  canEditMember(memberId: string){
    return this.auth.isAdmin || !!this.membersMap()[memberId]?.phone && this.membersMap()[memberId]?.phone === this.auth.myPhone;
  }

  async saveTodayAttendance(){
    const id = this.messId(); if(!id) return;
    const items = this.todayAttendance().map(r => ({ memberId: r.memberId, lunch: !!r.lunch, dinner: !!r.dinner }));
    this.savingToday.set(true);
    try{
      await this.api.saveAttendance(id, this.todayDate, items).toPromise();
      await this.refreshTodayCounts();
      this.closeTodayDetails();
    } finally {
      this.savingToday.set(false);
    }
  }
}
