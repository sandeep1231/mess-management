import { Component, Input, effect, inject, signal } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { StateService } from '../../shared/state.service';
import { MessSelectorComponent } from '../../shared/mess-selector.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DecimalPipe, MessSelectorComponent, RouterLink],
  template: `
  <div class="container">
    <div class="d-flex align-items-center justify-content-between mt-3 mb-2" *ngIf="!hideTitle">
      <h2 class="h5 m-0">Expenses</h2>
    </div>
    <div class="card">
      <div class="card-header py-2 bg-body sticky-top" style="top: 56px; z-index: 2;">
        <div class="row g-2 align-items-end">
          <div class="col-12 col-lg-3">
            <app-mess-selector label="Mess" placeholder="Search by name"></app-mess-selector>
          </div>
          <div class="col-12 col-sm-6 col-lg-4 position-relative">
            <div class="form-check form-switch mb-1">
              <input class="form-check-input" type="checkbox" id="applyPayerFilter" [(ngModel)]="applyPayerFilter" (change)="onApplyPayerFilterChange()">
              <label class="form-check-label small" for="applyPayerFilter">Filter list by this payer</label>
            </div>
            <label class="form-label small mb-1">Payer (name or phone)</label>
            <input class="form-control form-control-sm" placeholder="Type to search..." [(ngModel)]="payerQuery" (input)="onMemberInput()" />
            <div class="list-group position-absolute w-100 shadow" *ngIf="memberOptions().length">
              <button type="button" class="list-group-item list-group-item-action" *ngFor="let m of memberOptions()" (click)="selectPayer(m)">
                {{m.name}} <span class="text-muted">{{m.phone || ''}}</span>
              </button>
            </div>
          </div>
          <div class="col-6 col-sm-3 col-lg-2">
            <label class="form-label small mb-1">Date</label>
            <div class="input-group input-group-sm">
              <input class="form-control" type="date" [(ngModel)]="date" />
              <button class="btn btn-outline-secondary" type="button" (click)="setToday()" title="Today"><i class="bi bi-calendar-event"></i></button>
            </div>
          </div>
          <div class="col-6 col-sm-3 col-lg-2">
            <label class="form-label small mb-1">Category</label>
            <input class="form-control form-control-sm" placeholder="Category" [(ngModel)]="category" />
          </div>
          <div class="col-6 col-sm-3 col-lg-2">
            <label class="form-label small mb-1">Amount</label>
            <input class="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Amount" [(ngModel)]="amount" />
          </div>
          <div class="col-12 col-sm-3 col-lg-1" *ngIf="auth.isAdmin; else userAddExpenseBtn">
            <label class="form-label small mb-1 d-block">&nbsp;</label>
            <button class="btn btn-primary btn-sm w-100" (click)="add()" [disabled]="!messId() || !payerMemberId || !date || amount<=0">Add</button>
          </div>
          <ng-template #userAddExpenseBtn>
            <div class="col-12 col-sm-4 col-lg-2">
              <label class="form-label small mb-1 d-block">&nbsp;</label>
              <button class="btn btn-primary btn-sm w-100" (click)="addSelf()" [disabled]="!messId() || !date || amount<=0">Add my expense</button>
            </div>
          </ng-template>
          <div class="col-6 col-sm-3 col-lg-2 ms-lg-auto">
            <label class="form-label small mb-1">Sort</label>
            <select class="form-select form-select-sm" [(ngModel)]="sortStr">
              <option value="date-desc">Date ↓</option>
              <option value="date-asc">Date ↑</option>
              <option value="amount-desc">Amount ↓</option>
              <option value="amount-asc">Amount ↑</option>
            </select>
          </div>
          
        </div>

        <div class="d-flex align-items-center flex-wrap gap-2 mt-2 small">
          <span class="badge text-bg-light border">Entries: {{ list().length }}</span>
          <span class="badge text-bg-dark border">Total: {{ totalAmount() | number:'1.2-2' }}</span>
          <span class="badge text-bg-warning border" *ngIf="filterMemberId">Filtered by: {{ filterLabel() }}</span>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else expenseSkeleton">
        <div class="table-responsive">
          <table class="table table-sm table-striped mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 130px;">Date</th>
                <th>Payer</th>
                <th style="width: 30%;">Category</th>
                <th class="text-end" style="width: 140px;">Amount</th>
                <th class="text-end" style="width: 1%; white-space: nowrap;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of paged()">
                <td>
                  <ng-container *ngIf="editId!==r._id; else dateEdit">
                    <span class="badge text-bg-light border">{{ r.date }}</span>
                  </ng-container>
                  <ng-template #dateEdit>
                    <input class="form-control form-control-sm" style="max-width: 160px" type="date" [(ngModel)]="editDate" />
                  </ng-template>
                </td>
                <td>
                  <a [routerLink]="['/member', r.payerMemberId]" class="text-decoration-none">{{ displayMember(r.payerMemberId) }}</a>
                </td>
                <td>
                  <ng-container *ngIf="editId!==r._id; else catEdit">
                    <span class="badge text-bg-secondary">{{ r.category || '—' }}</span>
                  </ng-container>
                  <ng-template #catEdit>
                    <input class="form-control form-control-sm" style="max-width: 220px" placeholder="Category" [(ngModel)]="editCategory" />
                  </ng-template>
                </td>
                <td class="text-end">
                  <ng-container *ngIf="editId!==r._id; else amtEdit">
                    <span class="badge text-bg-dark">{{ r.amount | number:'1.2-2' }}</span>
                  </ng-container>
                  <ng-template #amtEdit>
                    <input class="form-control form-control-sm text-end" style="max-width: 140px; margin-left: auto;" type="number" min="0" step="0.01" [(ngModel)]="editAmount" />
                  </ng-template>
                </td>
                <td class="text-end">
                  <ng-container *ngIf="editId!==r._id; else rowEditBtns">
                    <button *ngIf="auth.isAdmin" class="btn btn-outline-secondary btn-sm" (click)="startEdit(r)" title="Edit"><i class="bi bi-pencil"></i></button>
                  </ng-container>
                  <ng-template #rowEditBtns>
                    <div class="btn-group btn-group-sm" role="group">
                      <button class="btn btn-success" (click)="saveEdit(r)"><i class="bi bi-check-lg"></i></button>
                      <button class="btn btn-outline-secondary" (click)="cancelEdit()"><i class="bi bi-x-lg"></i></button>
                    </div>
                  </ng-template>
                </td>
              </tr>
              <tr *ngIf="!paged().length">
                <td colspan="5" class="text-center py-4 text-muted">No expenses found for this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
      <ng-template #expenseSkeleton>
        <div class="p-3">
          <div class="placeholder-glow">
            <div class="placeholder col-12 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-10 mb-2" style="height: 10px;"></div>
            <div class="placeholder col-8" style="height: 10px;"></div>
          </div>
        </div>
      </ng-template>
    </div>

    <!-- Pagination -->
    <div class="d-flex align-items-center justify-content-between mt-3" *ngIf="!loading() && list().length > 0">
      <div class="text-muted small">Showing {{ showFrom() }}–{{ showTo() }} of {{ list().length }}</div>
      <div class="d-flex align-items-center gap-2">
        <label class="small text-muted me-1">Per page</label>
        <select class="form-select form-select-sm w-auto" [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
          <option [ngValue]="8">8</option>
          <option [ngValue]="12">12</option>
          <option [ngValue]="24">24</option>
        </select>
        <div class="btn-group" role="group">
          <button class="btn btn-outline-secondary btn-sm" (click)="prevPage()" [disabled]="page<=1">Prev</button>
          <button class="btn btn-outline-secondary btn-sm" (click)="nextPage()" [disabled]="page>=totalPages()">Next</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [
    `:host ::ng-deep .sticky-top { position: sticky; }`
  ]
})
export class ExpensesComponent {
  @Input() hideTitle = false;
  private api = inject(ApiService);
  private state = inject(StateService);
  protected auth = inject(AuthService);
  messId = this.state.currentMessId;
  list = signal<any[]>([]);
  payerMemberId = '';
  payerQuery = '';
  memberOptions = signal<any[]>([]);
  membersMap = signal<Record<string, any>>({});
  filterMemberId: string | null = null;
  filterQuery = '';
  filterOptions = signal<any[]>([]);
  date = new Date().toISOString().slice(0,10);
  amount = 0;
  category = '';
  editId: string | null = null;
  editDate = '';
  editAmount = 0;
  editCategory = '';
  loading = signal(false);
  sortStr: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' = 'date-desc';
  page = 1;
  pageSize = 12;
  applyPayerFilter = false;

  constructor(){
    effect(() => { const _ = this.messId(); this.refresh(); });
  }

  async refresh(){
    const id = this.messId(); if(!id) return;
    this.loading.set(true);
    try {
      const effectiveMemberId = this.applyPayerFilter ? (this.filterMemberId || this.payerMemberId || undefined) : undefined;
      const [members, expenses] = await Promise.all([
        this.api.listMembers(id).toPromise(),
        this.api.listExpenses(id, this.state.currentMonth(), effectiveMemberId).toPromise(),
      ]);
      const map: Record<string, any> = {};
      (members||[]).forEach(m => map[m._id] = m);
      this.membersMap.set(map);
      const rows = (expenses||[]).slice();
      this.sortInPlace(rows);
      this.list.set(rows);
    } finally {
      this.loading.set(false);
    }
  }

  async add(){
    const id = this.messId(); if(!id) return;
    await this.api.addExpense({ messId: id, payerMemberId: this.payerMemberId, date: this.date, amount: this.amount, category: this.category || undefined }).toPromise();
    this.amount = 0; this.category='';
    await this.refresh();
  }

  async addSelf(){
    const id = this.messId(); if(!id) return;
    await this.api.addMyExpense(id, this.date, this.amount, this.category || undefined);
    this.amount = 0; this.category='';
    await this.refresh();
  }

  startEdit(r: any){ this.editId = r._id; this.editDate = r.date; this.editAmount = r.amount; this.editCategory = r.category || ''; }
  cancelEdit(){ this.editId = null; }
  async saveEdit(r: any){
    if(!this.editId) return;
    await this.api.updateExpense(this.editId, { date: this.editDate, amount: this.editAmount, category: this.editCategory || undefined }).toPromise();
    this.editId = null; await this.refresh();
  }

  ngOnInit(){ this.refresh(); }

  async onFilterInput(){
    const id = this.messId();
    if(!id || !this.filterQuery || this.filterQuery.length < 2){ this.filterOptions.set([]); return; }
    const opts = await this.api.searchMembers(id, this.filterQuery).toPromise();
    this.filterOptions.set(opts || []);
  }
  selectFilterMember(m: any){ this.filterMemberId = m._id; this.filterQuery = `${m.name}${m.phone ? ' ('+m.phone+')' : ''}`; this.filterOptions.set([]); this.refresh(); }
  filterLabel(){
    const id = this.filterMemberId; if(!id) return '';
    const m = this.membersMap()[id]; return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : '';
  }
  clearFilter(){ this.filterMemberId = null; this.filterQuery = ''; this.refresh(); }

  async onMemberInput(){
    const id = this.messId();
    if(!id || !this.payerQuery || this.payerQuery.length < 2){ this.memberOptions.set([]); return; }
    const opts = await this.api.searchMembers(id, this.payerQuery).toPromise();
    this.memberOptions.set(opts || []);
  }
  selectPayer(m: any){
    this.payerMemberId = m._id;
    this.payerQuery = `${m.name}${m.phone ? ' ('+m.phone+')' : ''}`;
    this.memberOptions.set([]);
    if(this.applyPayerFilter){ this.filterMemberId = this.payerMemberId; this.refresh(); }
  }
  displayMember(id: string){
    const m = this.membersMap()[id];
    return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : id;
  }
  payerLabel(){ return this.displayMember(this.payerMemberId); }

  onApplyPayerFilterChange(){
    if(this.applyPayerFilter){ this.filterMemberId = this.payerMemberId || null; }
    else { this.filterMemberId = null; }
    this.refresh();
  }

  setToday(){ this.date = new Date().toISOString().slice(0,10); }

  // Sorting and pagination helpers
  sortInPlace(rows: any[]){
    rows.sort((a,b) => {
      switch(this.sortStr){
        case 'date-asc': return (a.date||'').localeCompare(b.date||'');
        case 'date-desc': return (b.date||'').localeCompare(a.date||'');
        case 'amount-asc': return (a.amount||0) - (b.amount||0);
        case 'amount-desc': return (b.amount||0) - (a.amount||0);
      }
    });
  }
  onPageSizeChange(){ this.page = 1; }
  totalPages(){ return Math.max(1, Math.ceil(this.list().length / this.pageSize)); }
  prevPage(){ if(this.page>1) this.page--; }
  nextPage(){ const tp = this.totalPages(); if(this.page<tp) this.page++; }
  showFrom(){ const total = this.list().length; if(total===0) return 0; const start = (this.page-1)*this.pageSize + 1; return Math.min(start, total); }
  showTo(){ const total = this.list().length; return Math.min(this.page*this.pageSize, total); }
  paged(){
    const rows = this.list();
    const total = rows.length; if(total===0) return [];
    const tp = Math.max(1, Math.ceil(total/this.pageSize));
    const page = Math.min(this.page, tp);
    const start = (page-1)*this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  // Summary helpers
  totalAmount(){ return this.list().reduce((s,r) => s + (Number(r?.amount)||0), 0); }
}
