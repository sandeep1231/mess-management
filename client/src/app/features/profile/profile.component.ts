import { Component, inject } from '@angular/core';import { Component, inject, signal, computed } from '@angular/core';import { Component, inject, signal } from '@angular/core';

import { CommonModule, NgIf, NgFor, DecimalPipe } from '@angular/common';

import { FormsModule } from '@angular/forms';import { CommonModule, NgIf, NgFor, DecimalPipe } from '@angular/common';import { CommonModule, NgIf } from '@angular/common';

import { ApiService } from '../../shared/api.service';

import { AuthService } from '../../shared/auth.service';import { FormsModule } from '@angular/forms';import { FormsModule } from '@angular/forms';



@Component({import { ApiService } from '../../shared/api.service';import { ApiService } from '../../shared/api.service';

  selector: 'app-profile',

  standalone: true,import { AuthService } from '../../shared/auth.service';import { AuthService } from '../../shared/auth.service';

  imports: [CommonModule, FormsModule, NgIf, NgFor, DecimalPipe],

  template: `import { Router } from '@angular/router';

  <div class="container" style="max-width:720px;">

    <h4 class="mb-3">My Profile</h4>@Component({import { StateService } from '../../shared/state.service';



    <div class="row g-3">  selector: 'app-profile',import { MessSelectorComponent } from '../../shared/mess-selector.component';

      <div class="col-12 col-md-6">

        <div class="card shadow-sm">  standalone: true,import { ToastService } from '../../shared/toast.service';

          <div class="card-body">

            <h6 class="card-title">Account</h6>  imports: [CommonModule, FormsModule, NgIf, NgFor, DecimalPipe],

            <div class="mb-1 small text-muted">Phone: {{ auth.myPhone }}</div>

            <div><span class="badge bg-primary">{{ auth.isAdmin ? 'Admin' : 'User' }}</span></div>  template: `@Component({

          </div>

        </div>  <div class="container" style="max-width:720px;">  selector: 'app-profile',

      </div>

      <div class="col-12 col-md-6">    <h4 class="mb-3">My Profile</h4>  standalone: true,

        <div class="card shadow-sm">

          <div class="card-body">    <div class="row g-3">  imports: [CommonModule, FormsModule, NgIf, MessSelectorComponent],

            <h6 class="card-title">Change Password</h6>

            <div class="mb-2">      <div class="col-12 col-md-6">  template: `

              <label class="form-label">Current password</label>

              <input type="password" class="form-control" [(ngModel)]="currentPassword" />        <div class="card shadow-sm">    <div class="container" style="max-width:520px;">

            </div>

            <div class="mb-2">          <div class="card-body">      <div class="card shadow-sm mt-4">

              <label class="form-label">New password</label>

              <input type="password" class="form-control" [(ngModel)]="newPassword" />            <h6 class="card-title">Account</h6>        <div class="card-body">

            </div>

            <button class="btn btn-outline-primary btn-sm" (click)="changePassword()" [disabled]="loading || currentPassword.length < 6 || newPassword.length < 6">Update</button>            <div class="mb-2 small text-muted">Phone: {{auth.myPhone}}</div>          <h5 class="card-title mb-3">Profile</h5>

            <div *ngIf="pwMsg" class="mt-2 alert py-1" [class.alert-success]="pwOk" [class.alert-danger]="!pwOk">{{ pwMsg }}</div>

          </div>            <div class="mb-2"><span class="badge bg-primary">{{ auth.isAdmin ? 'Admin' : 'User' }}</span></div>          <div class="mb-3"><app-mess-selector label="Mess" placeholder="Search mess by name"></app-mess-selector></div>

        </div>

      </div>          </div>          <div class="mb-2">

    </div>

        </div>            <label class="form-label">Phone</label>

    <div class="mt-4 card shadow-sm">

      <div class="card-body">      </div>            <div class="form-control-plaintext">{{ maskedPhone() }}</div>

        <h6 class="card-title mb-3">This Month Summary</h6>

        <div *ngIf="summaryLoading" class="small text-muted">Loading…</div>      <div class="col-12 col-md-6">          </div>

        <ng-container *ngIf="!summaryLoading">

          <div class="row text-center mb-3">        <div class="card shadow-sm">          <div class="mb-3">

            <div class="col-6 col-md-3 mb-2">

              <div class="p-2 border rounded">          <div class="card-body">            <label class="form-label">Name</label>

                <div class="small text-muted">Meals</div>

                <div class="fw-bold">{{ totalMeals }}</div>            <h6 class="card-title">Change Password</h6>            <input class="form-control" [(ngModel)]="name" placeholder="Your name" />

              </div>

            </div>            <div class="mb-2">            <div class="mt-2">

            <div class="col-6 col-md-3 mb-2">

              <div class="p-2 border rounded">              <label class="form-label">Current password</label>              <button class="btn btn-outline-primary btn-sm" (click)="saveName()" [disabled]="!name || savingName()">Save name</button>

                <div class="small text-muted">Expenses</div>

                <div class="fw-bold">{{ totalExpenses | number:'1.0-0' }}</div>              <input class="form-control" [(ngModel)]="currentPassword" type="password" />              <span *ngIf="nameMsg" class="ms-2 small" [class.text-success]="nameMsgColor==='green'" [class.text-danger]="nameMsgColor==='red'">{{nameMsg}}</span>

              </div>

            </div>            </div>            </div>

            <div class="col-6 col-md-3 mb-2">

              <div class="p-2 border rounded" [class.bg-success-subtle]="myBalance > 0" [class.bg-danger-subtle]="myBalance < 0">            <div class="mb-2">          </div>

                <div class="small text-muted">My Balance</div>

                <div class="fw-bold" [class.text-success]="myBalance > 0" [class.text-danger]="myBalance < 0">{{ myBalance | number:'1.2-2' }}</div>              <label class="form-label">New password</label>          <div class="mb-3 text-muted">

              </div>

            </div>              <input class="form-control" [(ngModel)]="newPassword" type="password" />            <small>

            <div class="col-6 col-md-3 mb-2">

              <div class="p-2 border rounded">            </div>              Last password change:

                <div class="small text-muted">Meal Rate</div>

                <div class="fw-bold">{{ mealRate | number:'1.2-2' }}</div>            <button class="btn btn-outline-primary btn-sm" (click)="changePassword()" [disabled]="loading || currentPassword.length<6 || newPassword.length<6">Update</button>              <ng-container *ngIf="lastChange(); else never">

              </div>

            </div>            <div *ngIf="pwMsg" class="mt-2 alert py-1" [class.alert-success]="pwOk" [class.alert-danger]="!pwOk">{{pwMsg}}</div>                {{ relativeTime(lastChange()!) }} ({{ formatDate(lastChange()!) }})

          </div>

          <div class="small text-muted">Balance: positive means others owe you; negative means you owe.</div>          </div>              </ng-container>

        </ng-container>

      </div>        </div>              <ng-template #never>Never changed</ng-template>

    </div>

  </div>      </div>            </small>

  `,

  styles: []    </div>          </div>

})

export class ProfileComponent {          <hr />

  private api = inject(ApiService);

  auth = inject(AuthService);    <div class="mt-4 card shadow-sm">          <div class="border rounded p-3 mb-3">



  currentPassword = '';      <div class="card-body">            <div class="d-flex justify-content-between align-items-center mb-2">

  newPassword = '';

  pwMsg = '';        <h6 class="card-title mb-3">This Month Summary</h6>              <h6 class="m-0">My balance</h6>

  pwOk = false;

  loading = false;        <div *ngIf="summaryLoading" class="small text-muted">Loading…</div>              <small class="text-muted">Month: {{ month() }}</small>



  summaryLoading = true;        <ng-container *ngIf="!summaryLoading">            </div>

  totalMeals = 0;

  totalExpenses = 0;          <div class="row text-center mb-3">            <ng-container *ngIf="!messId(); else haveMess">

  mealRate = 0;

  myBalance = 0;            <div class="col-6 col-md-3 mb-2">              <div class="text-muted">Select a mess to see dues.</div>



  ngOnInit() { this.loadSummary(); }              <div class="p-2 border rounded">            </ng-container>



  private monthString() {                <div class="small text-muted">Meals</div>            <ng-template #haveMess>

    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;                <div class="fw-bold">{{ totalMeals }}</div>              <div *ngIf="loadingBalance(); else bal">

  }

              </div>                <span class="text-muted">Calculating…</span>

  async loadSummary() {

    this.summaryLoading = true;            </div>              </div>

    try {

      const members = await this.api.myMembers().toPromise();            <div class="col-6 col-md-3 mb-2">              <ng-template #bal>

      const month = this.monthString();

      let meals = 0, expenses = 0, rate = 0, balance = 0;              <div class="p-2 border rounded">                <div *ngIf="balance() !== null; else noData">

      for (const m of members || []) {

        const summary = await this.api.getSummary(m.messId, month).toPromise();                <div class="small text-muted">Expenses</div>                  <div [class.text-success]="balance()! > 0" [class.text-danger]="balance()! < 0">

        if (summary) {

          meals += summary.totals.totalMeals;                <div class="fw-bold">{{ totalExpenses | number:'1.0-0' }}</div>                    <strong>{{ balance()! | number:'1.2-2' }}</strong>

          expenses += summary.totals.totalExpenses;

          rate = summary.totals.mealRate;              </div>                    <span class="ms-1">{{ balance()! > 0 ? 'to receive' : (balance()! < 0 ? 'to pay' : 'settled') }}</span>

          const meRow = summary.perMember.find(r => r.memberId === m._id);

          if (meRow) balance += meRow.balance;            </div>                  </div>

        }

      }            <div class="col-6 col-md-3 mb-2">                </div>

      this.totalMeals = meals;

      this.totalExpenses = expenses;              <div class="p-2 border rounded" [class.bg-success-subtle]="myBalance>0" [class.bg-danger-subtle]="myBalance<0">                <ng-template #noData><span class="text-muted">No data for this month.</span></ng-template>

      this.mealRate = rate;

      this.myBalance = balance;                <div class="small text-muted">My Balance</div>              </ng-template>

    } catch {}

    finally { this.summaryLoading = false; }                <div class="fw-bold" [class.text-success]="myBalance>0" [class.text-danger]="myBalance<0">{{ myBalance | number:'1.2-2' }}</div>              <div class="mt-3">

  }

              </div>                <button class="btn btn-outline-secondary btn-sm" (click)="loadHistory()" [disabled]="loadingHistory()">Load last 6 months</button>

  changePassword() {

    this.pwMsg=''; this.pwOk=false; this.loading=true;            </div>                <ul class="list-group list-group-flush" *ngIf="history().length">

    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({

      next: () => { this.pwMsg='Password updated. Please login again.'; this.pwOk=true; this.auth.logout(); },            <div class="col-6 col-md-3 mb-2">                  <li class="list-group-item d-flex justify-content-between" *ngFor="let h of history()">

      error: (e) => { this.pwMsg = e?.error?.error || 'Failed to change password'; this.pwOk=false; },

      complete: () => { this.loading=false; }              <div class="p-2 border rounded">                    <span class="text-muted">{{ h.month }}</span>

    });

  }                <div class="small text-muted">Meal Rate</div>                    <span [class.text-success]="h.balance > 0" [class.text-danger]="h.balance < 0">{{ h.balance | number:'1.2-2' }}</span>

}

                <div class="fw-bold">{{ mealRate | number:'1.2-2' }}</div>                  </li>

              </div>                </ul>

            </div>              </div>

          </div>            </ng-template>

          <div class="small text-muted">Balance: positive means others owe you; negative means you owe.</div>          </div>

        </ng-container>

      </div>          <h6 class="mb-3">Change password</h6>

    </div>          <div class="mb-3">

  </div>            <label class="form-label">Current password</label>

  `,            <input [type]="show ? 'text' : 'password'" class="form-control" [(ngModel)]="current" />

  styles: []          </div>

})          <div class="mb-3">

export class ProfileComponent {            <label class="form-label">New password</label>

  private api = inject(ApiService);            <input [type]="show ? 'text' : 'password'" class="form-control" [(ngModel)]="next" />

  auth = inject(AuthService);            <div class="form-text">At least 6 characters</div>

          </div>

  currentPassword = '';          <div class="mb-3">

  newPassword = '';            <label class="form-label">Confirm new password</label>

  pwMsg = '';            <input [type]="show ? 'text' : 'password'" class="form-control" [(ngModel)]="confirm" />

  pwOk = false;          </div>

  loading = false;          <div class="form-check mb-3">

            <input class="form-check-input" type="checkbox" id="showpwd" [(ngModel)]="show">

  // Summary metrics            <label class="form-check-label" for="showpwd">Show passwords</label>

  summaryLoading = true;          </div>

  totalMeals = 0;          <div class="d-grid gap-2">

  totalExpenses = 0;            <button class="btn btn-primary" (click)="change()" [disabled]="!canSubmit() || loading()">Change password</button>

  mealRate = 0;            <div *ngIf="msg" class="alert mt-3" [class.alert-danger]="msgColor==='red'" [class.alert-success]="msgColor==='green'">{{msg}}</div>

  myBalance = 0;          </div>

        </div>

  ngOnInit(){      </div>

    this.loadSummary();    </div>

  }  `,

})

  private monthString(){export class ProfileComponent {

    const d = new Date();  api = inject(ApiService);

    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;  auth = inject(AuthService);

  }  router = inject(Router);

  state = inject(StateService);

  async loadSummary(){  toast = inject(ToastService);

    this.summaryLoading = true;  current = '';

    try {  next = '';

      // Get memberships for this user  confirm = '';

      const members = await this.api.myMembers().toPromise();  show = false;

      const month = this.monthString();  msg = '';

      let meals = 0, expenses = 0, rate = 0, balance = 0;  msgColor: 'red'|'green'|'gray' = 'gray';

      for (const m of members || []){  loading = signal(false);

        const summary = await this.api.getSummary(m.messId, month).toPromise();  lastChange = signal<string | null>(null);

        if (summary){  name = '';

          meals += summary.totals.totalMeals;  savingName = signal(false);

          expenses += summary.totals.totalExpenses;  nameMsg = '';

          rate = summary.totals.mealRate; // assume same across messes (last one wins)  nameMsgColor: 'green'|'red'|'gray' = 'gray';

          const meRow = summary.perMember.find(r => r.memberId === m._id);  messId = this.state.currentMessId;

          if (meRow) balance += meRow.balance;  month = this.state.currentMonth;

        }  balance = signal<number | null>(null);

      }  loadingBalance = signal(false);

      this.totalMeals = meals;  history = signal<Array<{month:string; balance:number}>>([]);

      this.totalExpenses = expenses;  loadingHistory = signal(false);

      this.mealRate = rate;

      this.myBalance = balance;  async ngOnInit(){

    } catch {    this.api.getMe().subscribe({ next: (me) => {

      // swallow      if (me?.lastPasswordChange) this.lastChange.set(me.lastPasswordChange);

    } finally {      this.name = (me?.name || '').toString();

      this.summaryLoading = false;      this.auth.myName = this.name || null;

    }    }, error: () => {} });

  }    await this.refreshBalance();

  }

  changePassword(){

    this.pwMsg=''; this.pwOk=false; this.loading=true;  saveName(){

    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({    const trimmed = (this.name || '').trim();

      next: () => { this.pwMsg='Password updated. Please login again.'; this.pwOk=true; this.auth.logout(); },    if(!trimmed) { this.nameMsg = 'Name is required'; this.nameMsgColor='red'; return; }

      error: (e) => { this.pwMsg = e?.error?.error || 'Failed to change password'; this.pwOk=false; },    this.savingName.set(true); this.nameMsg=''; this.nameMsgColor='gray';

      complete: () => { this.loading=false; }    this.api.updateMe({ name: trimmed }).subscribe({

    });      next: (me) => { this.name = (me?.name || '').toString(); this.auth.myName = this.name || null; this.nameMsg='Saved'; this.nameMsgColor='green'; this.savingName.set(false); this.toast.success('Name updated'); },

  }      error: (e) => { const m = e?.error?.error || 'Save failed'; this.nameMsg = m; this.nameMsgColor='red'; this.savingName.set(false); this.toast.error(m); }

}    });

  }

  maskedPhone(){
    const p = this.auth.myPhone || '';
    if (p.length <= 4) return p;
    const last = p.slice(-4);
    return p.slice(0, Math.max(0, p.length-8)).replace(/./g, '*') + '****' + last;
  }

  formatDate(iso: string){
    try { const d = new Date(iso); return d.toLocaleString(); } catch { return iso; }
  }

  relativeTime(iso: string){
    try {
      const d = new Date(iso).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - d) / 1000));
      if (diff < 60) return `${diff}s ago`;
      const m = Math.floor(diff/60); if (m < 60) return `${m}m ago`;
      const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
      const days = Math.floor(h/24); if (days < 30) return `${days}d ago`;
      const months = Math.floor(days/30); if (months < 12) return `${months}mo ago`;
      const years = Math.floor(months/12); return `${years}y ago`;
    } catch { return ''; }
  }

  private monthStr(date: Date){ return date.toISOString().slice(0,7); }

  async refreshBalance(){
    const id = this.messId(); if(!id) { this.balance.set(null); return; }
    this.loadingBalance.set(true);
    try {
      const [summary, mine] = await Promise.all([
        this.api.getSummary(id, this.month()).toPromise(),
        this.api.myMembers().toPromise(),
      ]);
      if (!summary || !summary.perMember?.length || !mine?.length) { this.balance.set(null); return; }
      const myIds = new Set((mine||[]).map(m => m._id));
      const total = summary.perMember.filter(p => myIds.has(p.memberId)).reduce((s, p) => s + (p.balance||0), 0);
      this.balance.set(total);
    } finally {
      this.loadingBalance.set(false);
    }
  }

  async loadHistory(){
    const id = this.messId(); if(!id) return;
    this.loadingHistory.set(true);
    try {
      const mine = await this.api.myMembers().toPromise();
      const myIds = new Set((mine||[]).map(m => m._id));
      const items: Array<{month:string; balance:number}> = [];
      const base = new Date(this.month()+"-01T00:00:00Z");
      for(let i=1;i<=6;i++){
        const d = new Date(base);
        d.setUTCMonth(d.getUTCMonth() - i);
        const mon = this.monthStr(d);
        const s = await this.api.getSummary(id, mon).toPromise();
        const bal = (s?.perMember||[]).filter(p => myIds.has(p.memberId)).reduce((sum, p) => sum + (p.balance||0), 0);
        items.push({ month: mon, balance: bal });
      }
      this.history.set(items);
    } finally {
      this.loadingHistory.set(false);
    }
  }

  canSubmit(){ return this.current.length>=6 && this.next.length>=6 && this.next===this.confirm; }

  change(){
    if(!this.canSubmit()) return;
    this.loading.set(true); this.msg=''; this.msgColor='gray';
    this.api.changePassword(this.current, this.next).subscribe({
      next: () => {
        this.msg = 'Password changed. Please sign in again.'; this.msgColor='green';
        this.toast.success('Password changed');
        // Logout immediately
        setTimeout(()=>{ this.auth.logout(); this.router.navigateByUrl('/login'); }, 500);
      },
      error: (e) => { const m = e?.error?.error || 'Change failed'; this.msg = m; this.msgColor='red'; this.loading.set(false); this.toast.error(m); }
    });
  }
}
