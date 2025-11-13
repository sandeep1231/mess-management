import { Component, Input, effect, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { StateService } from '../../shared/state.service';
import { MessSelectorComponent } from '../../shared/mess-selector.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MessSelectorComponent, RouterLink],
  template: `
  <div class="container">
    <div class="d-flex align-items-center justify-content-between mt-3 mb-2" *ngIf="!hideTitle">
      <h2 class="h5 m-0">Meals</h2>
    </div>

    <div class="card">
      <div class="card-header py-2 bg-body sticky-top" style="top: 56px; z-index: 2;">
        <div class="row g-2 align-items-end">
          <div class="col-12 col-lg-3">
            <app-mess-selector label="Mess" placeholder="Search by name"></app-mess-selector>
          </div>
          <div class="col-12 col-sm-6 col-lg-4 position-relative">
            <div class="form-check form-switch mb-1">
              <input class="form-check-input" type="checkbox" id="applyFilter" [(ngModel)]="applyFilter" (change)="onApplyFilterChange()">
              <label class="form-check-label small" for="applyFilter">Filter list by this member</label>
            </div>
            <label class="form-label small mb-1">Member (name or phone)</label>
            <input class="form-control form-control-sm" placeholder="Type to search..." [(ngModel)]="memberQuery" (input)="onMemberInput()" />
            <div class="list-group position-absolute w-100 shadow" *ngIf="memberOptions().length">
              <button type="button" class="list-group-item list-group-item-action" *ngFor="let m of memberOptions()" (click)="selectMember(m)">
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
            <label class="form-label small mb-1 d-block">Meals</label>
            <div class="d-flex align-items-center gap-3">
              <div class="form-check m-0">
                <input class="form-check-input" type="checkbox" id="chkLunch" [(ngModel)]="lunch">
                <label class="form-check-label" for="chkLunch">Lunch</label>
              </div>
              <div class="form-check m-0">
                <input class="form-check-input" type="checkbox" id="chkDinner" [(ngModel)]="dinner">
                <label class="form-check-label" for="chkDinner">Dinner</label>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-lg-1" *ngIf="auth.isAdmin; else userAddMealBtn">
            <label class="form-label small mb-1 d-block">&nbsp;</label>
            <button class="btn btn-primary btn-sm w-100" (click)="add()" [disabled]="!messId() || !memberId || !date || (!lunch && !dinner)">Add</button>
          </div>
          <ng-template #userAddMealBtn>
            <div class="col-12 col-sm-6 col-lg-2">
              <label class="form-label small mb-1 d-block">&nbsp;</label>
              <button class="btn btn-primary btn-sm w-100" (click)="addSelf()" [disabled]="!messId() || !date || (!lunch && !dinner)">Add my meal</button>
            </div>
          </ng-template>
          <div class="col-6 col-sm-3 col-lg-2 ms-lg-auto">
            <label class="form-label small mb-1">Sort</label>
            <select class="form-select form-select-sm" [(ngModel)]="sortStr">
              <option value="date-desc">Date ↓</option>
              <option value="date-asc">Date ↑</option>
            </select>
          </div>
          
        </div>

        <div class="d-flex align-items-center flex-wrap gap-2 mt-2 small">
          <span class="badge text-bg-light border">Entries: {{ list().length }}</span>
          <span class="badge text-bg-success border">Lunch: {{ totalLunch() }}</span>
          <span class="badge text-bg-primary border">Dinner: {{ totalDinner() }}</span>
          <span class="badge text-bg-warning border" *ngIf="filterMemberId">Filtered by: {{ filterMemberLabel() }}</span>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else mealSkeleton">
        <div class="table-responsive">
          <table class="table table-sm table-striped mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 130px;">Date</th>
                <th>Member</th>
                <th class="text-center" style="width: 90px;">Lunch</th>
                <th class="text-center" style="width: 90px;">Dinner</th>
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
                    <input class="form-control form-control-sm" type="date" [(ngModel)]="editDate" />
                  </ng-template>
                </td>
                <td>
                  <a [routerLink]="['/member', r.memberId]" class="text-decoration-none">{{ displayMember(r.memberId) }}</a>
                </td>
                <td class="text-center">
                  <ng-container *ngIf="editId!==r._id; else lunchEdit">
                    <i class="bi" [class.bi-check-lg]="r.lunch" [class.bi-dash]="!r.lunch"></i>
                  </ng-container>
                  <ng-template #lunchEdit>
                    <input class="form-check-input" type="checkbox" [(ngModel)]="editLunch" />
                  </ng-template>
                </td>
                <td class="text-center">
                  <ng-container *ngIf="editId!==r._id; else dinnerEdit">
                    <i class="bi" [class.bi-check-lg]="r.dinner" [class.bi-dash]="!r.dinner"></i>
                  </ng-container>
                  <ng-template #dinnerEdit>
                    <input class="form-check-input" type="checkbox" [(ngModel)]="editDinner" />
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
                <td colspan="5" class="text-center py-4 text-muted">No meals found for this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
      <ng-template #mealSkeleton>
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
export class MealsComponent {
  @Input() hideTitle = false;
  private api = inject(ApiService);
  private state = inject(StateService);
  protected auth = inject(AuthService);
  messId = this.state.currentMessId;
  list = signal<any[]>([]);
  memberId = '';
  memberQuery = '';
  memberOptions = signal<any[]>([]);
  membersMap = signal<Record<string, any>>({});
  filterMemberId: string | null = null;
  applyFilter = false;
  date = new Date().toISOString().slice(0,10);
  lunch = false;
  dinner = false;
  editId: string | null = null;
  editDate = '';
  editLunch = false;
  editDinner = false;
  loading = signal(false);
  sortStr: 'date-desc' | 'date-asc' = 'date-desc';
  page = 1;
  pageSize = 12;

  setToday(){ this.date = new Date().toISOString().slice(0,10); }

  selectedMemberLabel = () => {
    const m = this.membersMap()[this.memberId];
    return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : '';
  };

  constructor(){
    effect(() => { const _ = this.messId(); this.refresh(); });
  }

  async refresh(){
    const id = this.messId(); if(!id) return;
    this.loading.set(true);
    try {
      const effectiveMemberId = this.applyFilter ? (this.filterMemberId || this.memberId || undefined) : undefined;
      const [members, meals] = await Promise.all([
        this.api.listMembers(id).toPromise(),
        this.api.listMeals(id, this.state.currentMonth(), effectiveMemberId).toPromise(),
      ]);
      const map: Record<string, any> = {};
      (members||[]).forEach(m => map[m._id] = m);
      this.membersMap.set(map);
      const rows = (meals||[]).slice();
      this.sortInPlace(rows);
      this.list.set(rows);
    } finally {
      this.loading.set(false);
    }
  }

  onApplyFilterChange(){
    // If filter is enabled and a member is currently selected for entry, apply that as filter
    if(this.applyFilter){ this.filterMemberId = this.memberId || null; }
    else { this.filterMemberId = null; }
    this.refresh();
  }

  async add(){
    const id = this.messId(); if(!id) return;
    await this.api.addMeal({ messId: id, memberId: this.memberId, date: this.date, lunch: this.lunch, dinner: this.dinner }).toPromise();
    this.lunch = false; this.dinner = false; this.memberQuery = ''; this.memberOptions.set([]);
    await this.refresh();
  }

  async addSelf(){
    const id = this.messId(); if(!id) return;
    await this.api.addMyMeal(id, this.date, { lunch: this.lunch, dinner: this.dinner }).toPromise();
    this.lunch = false; this.dinner = false;
    await this.refresh();
  }

  startEdit(r: any){ this.editId = r._id; this.editDate = r.date; this.editLunch = !!r.lunch; this.editDinner = !!r.dinner; }
  cancelEdit(){ this.editId = null; }
  async saveEdit(r: any){
    if(!this.editId) return;
    await this.api.updateMeal(this.editId, { date: this.editDate, lunch: this.editLunch, dinner: this.editDinner }).toPromise();
    this.editId = null; await this.refresh();
  }

  ngOnInit(){ this.refresh(); }

  async onMemberInput(){
    const id = this.messId();
    if(!id || !this.memberQuery || this.memberQuery.length < 2){ this.memberOptions.set([]); return; }
    const opts = await this.api.searchMembers(id, this.memberQuery).toPromise();
    this.memberOptions.set(opts || []);
  }
  selectMember(m: any){
    this.memberId = m._id;
    this.memberQuery = `${m.name}${m.phone ? ' ('+m.phone+')' : ''}`;
    this.memberOptions.set([]);
    if(this.applyFilter){ this.filterMemberId = this.memberId; this.refresh(); }
  }

  displayMember(id: string){
    const m = this.membersMap()[id];
    return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : id;
  }

  // Sorting and pagination helpers
  sortInPlace(rows: any[]){
    rows.sort((a,b) => this.sortStr === 'date-desc' ? (b.date || '').localeCompare(a.date || '') : (a.date || '').localeCompare(b.date || ''));
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
  totalLunch(){ return this.list().reduce((s,r) => s + (r?.lunch ? 1 : 0), 0); }
  totalDinner(){ return this.list().reduce((s,r) => s + (r?.dinner ? 1 : 0), 0); }
  filterMemberLabel(){ const id = this.filterMemberId; if(!id) return ''; const m = this.membersMap()[id]; return m ? `${m.name}${m.phone ? ' ('+m.phone+')' : ''}` : ''; }
}
