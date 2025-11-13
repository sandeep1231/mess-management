import { Component, Input, effect, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { StateService } from '../../shared/state.service';
import { MessSelectorComponent } from '../../shared/mess-selector.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MessSelectorComponent, RouterLink],
  template: `
  <div class="container">
    <div class="d-flex align-items-center justify-content-between mt-3 mb-2" *ngIf="!hideTitle">
      <h2 class="h4 m-0">Members</h2>
    </div>

    <!-- Toolbar -->
    <div class="row g-2 align-items-end mb-3">
      <div class="col-12 col-lg-4">
        <app-mess-selector label="Mess" placeholder="Search by name"></app-mess-selector>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <label class="form-label">Search</label>
        <input class="form-control" placeholder="Name or phone" [ngModel]="query()" (ngModelChange)="query.set($event)" />
      </div>
      <div class="col-6 col-sm-3 col-lg-2">
        <label class="form-label">Status</label>
        <select class="form-select" [ngModel]="activeFilterStr()" (ngModelChange)="activeFilterStr.set($event)">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="col-6 col-sm-3 col-lg-2">
        <label class="form-label">Sort</label>
        <select class="form-select" [ngModel]="sortStr()" (ngModelChange)="sortStr.set($event)">
          <option value="name-asc">Name A→Z</option>
          <option value="name-desc">Name Z→A</option>
        </select>
      </div>
      <div class="col-6 col-sm-3 col-lg-1">
        <label class="form-label">View</label>
        <div class="btn-group w-100" role="group">
          <button class="btn btn-outline-secondary" [class.active]="viewMode==='grid'" (click)="setView('grid')" title="Grid"><i class="bi bi-grid"></i></button>
          <button class="btn btn-outline-secondary" [class.active]="viewMode==='list'" (click)="setView('list')" title="List"><i class="bi bi-list"></i></button>
        </div>
      </div>
      <div class="col-12 col-lg-2 d-flex justify-content-lg-end align-items-end" *ngIf="auth.isAdmin && viewMode==='list'">
        <button class="btn btn-primary w-100" (click)="openAddModal()"><i class="bi bi-person-plus me-1"></i>Add member</button>
      </div>
    </div>

    <!-- Grid view -->
    <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3" *ngIf="viewMode==='grid'">
      <!-- Add member card -->
      <div class="col" *ngIf="auth.isAdmin">
        <div class="card h-100 add-card">
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="avatar avatar-muted"><i class="bi bi-person-plus"></i></div>
              <div>
                <div class="fw-semibold">Add member</div>
                <div class="text-muted small">Create a new member</div>
              </div>
            </div>
            <div class="mb-2">
              <input class="form-control" placeholder="Name" [(ngModel)]="newName" />
            </div>
            <div class="mb-3">
              <input class="form-control" placeholder="Phone (optional)" [(ngModel)]="newPhone" />
            </div>
            <button class="btn btn-primary mt-auto" (click)="add()" [disabled]="!messId() || !newName">Add</button>
          </div>
        </div>
      </div>

      <!-- Member cards -->
      <ng-container *ngIf="!loading(); else gridSkeleton">
        <div class="col" *ngFor="let m of paged()">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="avatar" [class.avatar-inactive]="m.active===false">{{ initials(m.name) }}</div>
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <ng-container *ngIf="editId!==m._id; else editNameTpl">
                      <a [routerLink]="['/member', m._id]" class="fw-semibold text-decoration-none">{{ m.name }}</a>
                    </ng-container>
                    <ng-template #editNameTpl>
                      <div class="input-group input-group-sm" style="max-width: 280px;">
                        <input class="form-control" [(ngModel)]="editName" />
                        <button class="btn btn-success" [disabled]="savingId===m._id || !editName?.trim()" (click)="saveRename(m)"><i class="bi bi-check-lg"></i></button>
                        <button class="btn btn-outline-secondary" [disabled]="savingId===m._id" (click)="cancelRename()"><i class="bi bi-x-lg"></i></button>
                      </div>
                    </ng-template>
                    <ng-container *ngIf="editId!==m._id; else editPhoneTpl">
                      <span class="badge bg-secondary" *ngIf="m.phone">{{ m.phone }}</span>
                    </ng-container>
                    <ng-template #editPhoneTpl>
                      <div class="input-group input-group-sm" style="max-width: 220px;">
                        <input class="form-control" [(ngModel)]="editPhone" placeholder="Phone" />
                        <button class="btn btn-success" [disabled]="savingId===m._id" (click)="saveRename(m)"><i class="bi bi-check-lg"></i></button>
                      </div>
                    </ng-template>
                    <span class="badge bg-light text-dark border" *ngIf="m.active===false">Inactive</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <button *ngIf="auth.isAdmin && editId!==m._id" class="btn btn-outline-secondary btn-sm" (click)="startRename(m)" title="Edit"><i class="bi bi-pencil"></i></button>
                  <button *ngIf="auth.isAdmin" class="btn btn-outline-danger btn-sm" (click)="remove(m._id)" title="Delete"><i class="bi bi-trash"></i></button>
                </div>
              </div>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <div class="form-check form-switch" *ngIf="auth.isAdmin">
                  <input class="form-check-input" type="checkbox" [checked]="m.active !== false" (change)="toggleActive(m)" id="sw-{{m._id}}" />
                  <label class="form-check-label" for="sw-{{m._id}}">Active</label>
                </div>
                <a [routerLink]="['/member', m._id]" class="btn btn-sm btn-outline-primary">View details</a>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- List view -->
    <div class="card" *ngIf="viewMode==='list'">
      <div class="table-responsive">
        <table class="table table-sm table-striped mb-0 align-middle">
          <thead>
            <tr>
              <th style="width:44px"></th>
              <th>Member</th>
              <th>Phone</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody *ngIf="!loading(); else listSkeleton">
            <tr *ngFor="let m of paged()">
              <td><div class="avatar" [class.avatar-inactive]="m.active===false">{{ initials(m.name) }}</div></td>
              <td>
                <ng-container *ngIf="editId!==m._id; else listEditName">
                  <a [routerLink]="['/member', m._id]" class="text-decoration-none fw-semibold">{{ m.name }}</a>
                </ng-container>
                <ng-template #listEditName>
                  <div class="input-group input-group-sm" style="max-width: 320px;">
                    <input class="form-control" [(ngModel)]="editName" />
                    <button class="btn btn-success" [disabled]="savingId===m._id || !editName?.trim()" (click)="saveRename(m)"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-outline-secondary" [disabled]="savingId===m._id" (click)="cancelRename()"><i class="bi bi-x-lg"></i></button>
                  </div>
                </ng-template>
              </td>
              <td>
                <ng-container *ngIf="editId!==m._id; else listEditPhone">
                  <span class="badge bg-secondary" *ngIf="m.phone">{{ m.phone }}</span>
                </ng-container>
                <ng-template #listEditPhone>
                  <div class="input-group input-group-sm" style="max-width: 220px;">
                    <input class="form-control" [(ngModel)]="editPhone" placeholder="Phone" />
                    <button class="btn btn-success" [disabled]="savingId===m._id" (click)="saveRename(m)"><i class="bi bi-check-lg"></i></button>
                  </div>
                </ng-template>
              </td>
              <td>
                <div class="form-check form-switch" *ngIf="auth.isAdmin">
                  <input class="form-check-input" type="checkbox" [checked]="m.active !== false" (change)="toggleActive(m)" id="ls-{{m._id}}" />
                  <label class="form-check-label" for="ls-{{m._id}}">Active</label>
                </div>
                <span class="badge bg-light text-dark border" *ngIf="m.active===false">Inactive</span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm" role="group">
                  <button *ngIf="auth.isAdmin && editId!==m._id" class="btn btn-outline-secondary" (click)="startRename(m)" title="Rename"><i class="bi bi-pencil"></i></button>
                  <a [routerLink]="['/member', m._id]" class="btn btn-outline-primary">Details</a>
                  <button *ngIf="auth.isAdmin" class="btn btn-outline-danger" (click)="remove(m._id)" title="Delete"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #listSkeleton>
        <div class="p-3">
          <span class="placeholder col-8"></span>
          <div class="mt-2"><span class="placeholder col-6"></span></div>
        </div>
      </ng-template>
    </div>

    <!-- Empty state -->
    <div class="text-center text-muted py-5" *ngIf="!loading() && filtered().length===0">
      No members found.
    </div>

    <!-- Grid skeleton -->
    <ng-template #gridSkeleton>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
        <div class="col" *ngFor="let _ of skeletonCards">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="avatar"><span class="placeholder col-12" style="display:block;height:100%"></span></div>
                <div class="flex-grow-1">
                  <span class="placeholder col-8"></span>
                  <div class="mt-2"><span class="placeholder col-5"></span></div>
                </div>
              </div>
              <span class="placeholder col-4"></span>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Pagination -->
    <div class="d-flex align-items-center justify-content-between mt-3" *ngIf="filtered().length > 0 && !loading()">
      <div class="text-muted small">Showing {{ showFrom() }}–{{ showTo() }} of {{ filtered().length }}</div>
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

    <!-- Add Member Modal (List view) -->
    <div class="overlay-backdrop" *ngIf="showAddModal" (click)="closeAddModal()">
      <div class="overlay-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <strong>Add member</strong>
          <button class="btn-close" (click)="closeAddModal()"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label class="form-label">Name</label>
            <input class="form-control" [(ngModel)]="newName" placeholder="Name" />
          </div>
          <div class="mb-3">
            <label class="form-label">Phone (optional)</label>
            <input class="form-control" [(ngModel)]="newPhone" placeholder="Phone" />
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary" (click)="closeAddModal()">Cancel</button>
            <button class="btn btn-primary" (click)="add(); closeAddModal()" [disabled]="!messId() || !newName">Add</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [
    `
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #e9ecef; color: #495057; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; }
    .avatar.avatar-inactive { filter: grayscale(0.7); opacity: 0.7; }
    .avatar.avatar-muted { background: #e9ecef; color: #6c757d; }
    .add-card { border-style: dashed; }
    .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1060; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .overlay-modal { width: 100%; max-width: 460px; background: #fff; border: 1px solid #dee2e6; border-radius: 12px; }
    .overlay-modal .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e9ecef; }
    .overlay-modal .modal-body { padding: 12px 16px; }
    `
  ]
})
export class MembersComponent {
  @Input() hideTitle = false;
  private api = inject(ApiService);
  private state = inject(StateService);
  protected auth = inject(AuthService);
  messId = this.state.currentMessId;
  members = signal<any[]>([]);
  filtered = signal<any[]>([]);
  newName = '';
  newPhone = '';
  query = signal('');
  loading = signal(false);
  activeFilterStr = signal<'all' | 'active' | 'inactive'>('all');
  sortStr = signal<'name-asc' | 'name-desc'>('name-asc');
  skeletonCards = Array.from({ length: 4 });
  // View and paging
  viewMode: 'grid' | 'list' = 'grid';
  page = 1;
  pageSize = 12;
  // Add modal
  showAddModal = false;
  // Inline edit
  editId: string | null = null;
  editName: string = '';
  editPhone: string = '';
  savingId: string | null = null;

  constructor(){
    effect(() => { const _ = this.messId(); this.refresh(); });
    // Reactive local filtering and sorting
    effect(() => {
      const _members = this.members();
      const _q = (this.query()||'').toLowerCase();
      const _status = this.activeFilterStr();
      const _sort = this.sortStr();
      let list = [..._members];
      if(_q){ list = list.filter(m => `${m.name||''} ${m.phone||''}`.toLowerCase().includes(_q)); }
      if(_status==='active'){ list = list.filter(m => m.active !== false); }
      else if(_status==='inactive'){ list = list.filter(m => m.active === false); }
      list.sort((a,b) => {
        const an = (a.name||'').toLowerCase();
        const bn = (b.name||'').toLowerCase();
        const cmp = an.localeCompare(bn);
        return _sort==='name-asc' ? cmp : -cmp;
      });
      this.filtered.set(list);
    });
    // Reset to first page on filter changes
    effect(() => { const _ = this.filtered(); this.page = 1; });
  }

  async refresh(){
    const id = this.messId(); if(!id) return;
    this.loading.set(true);
    try {
      const data = await this.api.listMembers(id).toPromise();
      this.members.set(data || []);
    } finally {
      this.loading.set(false);
    }
  }

  async add(){
    const id = this.messId(); if(!id || !this.newName) return;
    if(this.newPhone){ await this.api.addMemberWithPhone(id, this.newName, this.newPhone).toPromise(); }
    else { await this.api.addMember(id, this.newName).toPromise(); }
    this.newName=''; this.newPhone=''; await this.refresh();
  }

  async remove(id: string){ await this.api.deleteMember(id).toPromise(); await this.refresh(); }

  async toggleActive(m: any){
    const id = m._id; const next = !(m.active===false);
    await this.api.updateMember(id, { active: !next }).toPromise();
    await this.refresh();
  }

  // Inline rename helpers
  startRename(m: any){ this.editId = m._id; this.editName = m.name; this.editPhone = m.phone || ''; }
  cancelRename(){ this.editId = null; this.editName = ''; }
  async saveRename(m: any){
    if(!this.editName || !this.editName.trim()) return;
    this.savingId = m._id;
    try {
      await this.api.updateMember(m._id, { name: this.editName.trim(), phone: this.editPhone?.trim() || undefined }).toPromise();
      await this.refresh();
      this.cancelRename();
    } finally {
      this.savingId = null;
    }
  }

  initials(name: string){
    if(!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts.length>1 ? parts[1][0] : '';
    return (first + second).toUpperCase();
  }

  // View helpers
  setView(v: 'grid'|'list'){ this.viewMode = v; }
  totalPages(){ return Math.max(1, Math.ceil(this.filtered().length / this.pageSize)); }
  onPageSizeChange(){ this.page = 1; }
  prevPage(){ if(this.page>1) this.page--; }
  nextPage(){ const tp = this.totalPages(); if(this.page<tp) this.page++; }
  showFrom(){ const total = this.filtered().length; if(total===0) return 0; const start = (this.page-1)*this.pageSize + 1; return Math.min(start, total); }
  showTo(){ const total = this.filtered().length; return Math.min(this.page*this.pageSize, total); }
  paged(){
    const list = this.filtered();
    const total = list.length; if(total===0) return [];
    const tp = Math.max(1, Math.ceil(total/this.pageSize));
    const page = Math.min(this.page, tp);
    const start = (page-1)*this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  // Modal helpers
  openAddModal(){ this.showAddModal = true; }
  closeAddModal(){ this.showAddModal = false; }
}
