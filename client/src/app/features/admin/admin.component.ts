import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { StateService } from '../../shared/state.service';
import { MessSelectorComponent } from '../../shared/mess-selector.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule, MessSelectorComponent],
  template: `
  <div class="container mt-3" *ngIf="auth.isAdmin; else noAdmin">
    <h2 class="h4 mb-3">Admin Panel</h2>

    <div class="card mb-3">
      <div class="card-header">Create Mess</div>
      <div class="card-body row g-2 align-items-end">
        <div class="col-12 col-md-6">
          <label class="form-label">Mess name</label>
          <input class="form-control" [(ngModel)]="messName" placeholder="e.g. Hostel A Mess" />
        </div>
        <div class="col-12 col-md-2">
          <button class="btn btn-primary w-100" (click)="createMess()" [disabled]="!messName">Create</button>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">Pending Users</div>
      <div class="card-body">
        <div *ngIf="pending().length===0" class="text-muted">No pending users</div>
        <ul class="list-group" *ngIf="pending().length">
          <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let u of pending()">
            <div>
              <div><strong>{{u.phone}}</strong></div>
            </div>
            <button class="btn btn-success btn-sm" (click)="approve(u._id)">Approve</button>
          </li>
        </ul>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header">Users & Roles</div>
      <div class="card-body table-responsive">
        <table class="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Phone</th>
              <th>Approved</th>
              <th style="width:200px">Role</th>
              <th style="width:1%">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users()">
              <td>
                <ng-container *ngIf="editUserId!==u._id; else phoneEdit">
                  {{u.phone}}
                </ng-container>
                <ng-template #phoneEdit>
                  <input class="form-control form-control-sm" [(ngModel)]="editPhone" />
                </ng-template>
              </td>
              <td>
                <span class="badge" [class.text-bg-success]="u.approved" [class.text-bg-secondary]="!u.approved">{{u.approved ? 'Yes' : 'No'}}</span>
              </td>
              <td>
                <select class="form-select form-select-sm" [ngModel]="u.role || 'user'" (ngModelChange)="changeRole(u, $event)">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="text-nowrap">
                <ng-container *ngIf="editUserId!==u._id; else rowEditBtns">
                  <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-secondary" (click)="startEditUser(u)" title="Edit"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-danger" (click)="delete(u)" [disabled]="isSelf(u)" title="Delete"><i class="bi bi-trash"></i></button>
                  </div>
                </ng-container>
                <ng-template #rowEditBtns>
                  <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-success" (click)="saveUser(u)"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-outline-secondary" (click)="cancelEditUser()"><i class="bi bi-x-lg"></i></button>
                  </div>
                </ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Add Member to a Mess</div>
      <div class="card-body row g-2 align-items-end">
        <div class="col-12 col-md-3">
          <app-mess-selector label="Mess" placeholder="Search by name"></app-mess-selector>
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label">Member name</label>
          <input class="form-control" [(ngModel)]="memberName" placeholder="Full name" />
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label">Phone</label>
          <input class="form-control" [(ngModel)]="memberPhone" placeholder="Phone number" />
        </div>
        <div class="col-12 col-md-2">
      <button class="btn btn-primary w-100" (click)="addMember()" [disabled]="!messId() || !memberName || !memberPhone">Add</button>
        </div>
      </div>
    </div>
  </div>
  <ng-template #noAdmin>
    <div class="container mt-3">
      <div class="alert alert-danger">Admin access required.</div>
    </div>
  </ng-template>
  `,
})
export class AdminComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  private state = inject(StateService);

  messName = '';
  // messId comes from global state via MessSelector
  memberName = '';
  memberPhone = '';

  // expose messId signal for template
  messId = this.state.currentMessId;

  users = signal<any[]>([]);
  pending = signal<any[]>([]);
  editUserId: string | null = null;
  editPhone = '';

  async ngOnInit(){ await this.loadUsers(); }

  async loadUsers(){
    const list = await this.api.listUsers().toPromise();
    this.users.set(list || []);
    this.pending.set((list||[]).filter((u:any)=>!u.approved));
  }

  async createMess(){
    const res = await this.api.createMess(this.messName).toPromise();
    if(res){ this.messName = ''; }
  }

  async approve(id: string){
    await this.api.approveUser(id).toPromise();
    await this.loadUsers();
  }

  async addMember(){
    const id = localStorage.getItem('mm.messId');
    if(!id) return;
    await this.api.addMemberWithPhone(id, this.memberName, this.memberPhone).toPromise();
    this.memberName=''; this.memberPhone='';
  }

  async changeRole(u: any, newRole: 'admin'|'user'){
    await this.api.setUserRole(u._id, newRole).toPromise();
    await this.loadUsers();
  }

  startEditUser(u: any){ this.editUserId = u._id; this.editPhone = u.phone || ''; }
  cancelEditUser(){ this.editUserId = null; this.editPhone = ''; }
  async saveUser(u: any){
    if(!this.editUserId) return;
    const patch: any = {};
    if(this.editPhone && this.editPhone !== u.phone){ patch.phone = this.editPhone; }
    if(Object.keys(patch).length === 0){ this.cancelEditUser(); return; }
    await this.api.updateUser(u._id, patch).toPromise();
    this.cancelEditUser();
    await this.loadUsers();
  }
  isSelf(u: any){ return !!this.auth.myPhone && u.phone === this.auth.myPhone; }
  async delete(u: any){
    if(this.isSelf(u)) return;
    if(confirm('Delete this user? This cannot be undone.')){
      await this.api.deleteUser(u._id).toPromise();
      await this.loadUsers();
    }
  }
}
