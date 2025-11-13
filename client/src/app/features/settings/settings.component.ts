import { Component, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Device } from '@capacitor/device';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  template: `
    <div class="settings">
      <ul class="nav nav-pills mb-3">
        <li class="nav-item"><button class="nav-link" [class.active]="activeTab==='profile'" (click)="activeTab='profile'">Profile</button></li>
        <li class="nav-item"><button class="nav-link" [class.active]="activeTab==='api'" (click)="activeTab='api'">API</button></li>
      </ul>

      <div *ngIf="activeTab==='profile'">
        <div class="hero">
          <div>
            <h2 class="title">My Profile</h2>
            <p class="subtitle">Manage your account and see your monthly activity at a glance.</p>
          </div>
          <div class="chip" [class.admin]="auth.isAdmin">
            <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></svg>
            {{ auth.isAdmin ? 'Admin' : 'Member' }}
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="card elevate">
              <div class="card-body">
                <div class="card-title">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/></svg>
                  Account
                </div>
                <div class="muted">Phone</div>
                <div class="big">{{ auth.myPhone }}</div>
              </div>
            </div>
          </div>
          <div>
            <div class="card elevate">
              <div class="card-body">
                <div class="card-title">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12v6"/><path d="M8 12v6"/><path d="M16 12v6"/><path d="M4 8h16"/><path d="M4 4h16"/></svg>
                  Change password
                </div>
                <div class="field-row">
                  <label for="current">Current</label>
                  <div class="password-field">
                    <input id="current" [(ngModel)]="currentPassword" [type]="showCurrent ? 'text' : 'password'" autocomplete="current-password" aria-label="Current password" />
                    <button type="button" class="ghost" (click)="showCurrent=!showCurrent" [attr.aria-pressed]="showCurrent">{{ showCurrent ? 'Hide' : 'Show' }}</button>
                  </div>
                </div>
                <div class="field-row">
                  <label for="new">New</label>
                  <div class="password-field">
                    <input id="new" [(ngModel)]="newPassword" [type]="showNew ? 'text' : 'password'" autocomplete="new-password" aria-label="New password" />
                    <button type="button" class="ghost" (click)="showNew=!showNew" [attr.aria-pressed]="showNew">{{ showNew ? 'Hide' : 'Show' }}</button>
                  </div>
                  <div class="pw-meter" [style.--c]="passwordStrength.color">
                    <span class="dot" [style.opacity]="passwordStrength.score>0?1:.3"></span>
                    <span class="dot" [style.opacity]="passwordStrength.score>1?1:.3"></span>
                    <span class="dot" [style.opacity]="passwordStrength.score>2?1:.3"></span>
                    <span class="meter-text">{{ passwordStrength.label }}</span>
                  </div>
                </div>
                <div class="actions">
                  <button class="primary" (click)="changePassword()" [disabled]="loading || !canSubmitPw">{{ loading ? 'Updating…' : 'Update' }}</button>
                </div>
                <div *ngIf="pwMsg" class="alert" [class.ok]="pwOk" [class.err]="!pwOk">{{ pwMsg }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-3 elevate">
          <div class="card-body">
            <div class="card-title">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/><path d="M12 3v18"/></svg>
              This month summary
            </div>
            <div *ngIf="summaryLoading" class="skeleton-grid">
              <div class="skeleton-tile"></div>
              <div class="skeleton-tile"></div>
              <div class="skeleton-tile"></div>
              <div class="skeleton-tile"></div>
            </div>
            <div *ngIf="!summaryLoading" class="stats">
              <div class="stat gradient blue">
                <div class="stat-top">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-2a8 8 0 0 1 16 0v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span class="label">My meals</span>
                </div>
                <div class="value">{{ myMeals }}</div>
              </div>
              <div class="stat gradient purple">
                <div class="stat-top">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7h-9"/><path d="M14 17H4"/><path d="M5 7l-3 3 3 3"/><path d="M19 17l3-3-3-3"/></svg>
                  <span class="label">My expense</span>
                </div>
                <div class="value">{{ myExpense | number:'1.0-0' }}</div>
              </div>
              <div class="stat gradient" [class.green]="myBalance>0" [class.red]="myBalance<0">
                <div class="stat-top">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 12h14"/></svg>
                  <span class="label">My balance</span>
                </div>
                <div class="value">{{ myBalance | number:'1.2-2' }}</div>
              </div>
              <div class="stat gradient teal">
                <div class="stat-top">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v6H3z"/><path d="M3 15h18v6H3z"/></svg>
                  <span class="label">Meal rate</span>
                </div>
                <div class="value">{{ mealRate | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="muted small tip">Positive balance means others owe you; negative means you owe.</div>
          </div>
        </div>
      </div>

      <div *ngIf="activeTab==='api'">
        <h2>Settings</h2>
        <div class="field">
          <label>API Base URL</label>
          <input [(ngModel)]="apiBaseUrl" placeholder="http://10.0.2.2:4001/api" />
          <small>
            Examples:
            <ul>
              <li>Emulator → http://10.0.2.2:4001/api</li>
              <li>Device on LAN → http://YOUR_PC_LAN_IP:4001/api</li>
            </ul>
          </small>
        </div>

        <button (click)="save()">Save</button>
        <button (click)="reset()" class="secondary">Reset to default</button>
        <button (click)="autoDetect()" class="secondary">Auto-detect for Android</button>
        <button (click)="useLocalhost()" class="secondary">Use localhost (web)</button>
        <button (click)="testConnection()">Test connection</button>

        <p class="note">This is stored locally only and can be changed anytime.</p>
        <p *ngIf="testStatus" [style.color]="testStatusColor">{{ testStatus }}</p>
      </div>
    </div>
  `,
  styles: [
    `
    .settings { max-width: 980px; margin: 1rem auto; padding: 1rem; }
    .field { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
    input { padding: .6rem .7rem; border: 1px solid #d7dbe0; border-radius: 8px; }
    button { margin-right: .5rem; border: 1px solid transparent; border-radius: 8px; padding: .55rem .9rem; cursor: pointer; }
    button.primary { background: #2563eb; color: #fff; }
    button.secondary { background: #f1f5f9; color: #0f172a; border-color: #e2e8f0; }
    button.ghost { background: transparent; color: #2563eb; padding: .25rem .5rem; }
    small { color: #666; }
    .note { margin-top: 1rem; color: #666; }
    .nav-pills .nav-link { cursor: pointer; }

    .hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: .5rem; }
    .title { margin: 0; font-size: 1.6rem; }
    .subtitle { margin: 0; color: #687385; }
    .chip { display: inline-flex; align-items: center; gap: .4rem; background: #eef2ff; color: #3730a3; padding: .35rem .6rem; border-radius: 999px; font-weight: 600; }
    .chip.admin { background: #ecfdf5; color: #065f46; }
    .chip-icon { width: 16px; height: 16px; }

    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 768px){ .grid { grid-template-columns: 1fr 1fr; } }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
    .elevate { box-shadow: 0 4px 16px rgba(15, 23, 42, .06); }
    .card-body { padding: 14px; }
    .card-title { display: flex; align-items: center; gap: .5rem; font-weight: 700; margin-bottom: .75rem; }
    .icon { width: 18px; height: 18px; }
    .muted { color: #667085; }
    .big { font-size: 1.1rem; font-weight: 600; }

    .field-row { display: grid; grid-template-columns: 80px 1fr; align-items: center; gap: 8px; margin-bottom: .6rem; }
    .password-field { display: flex; align-items: center; gap: .4rem; }
    .pw-meter { display: flex; align-items: center; gap: .4rem; margin-left: 80px; color: var(--c, #94a3b8); font-size: 12px; }
    .pw-meter .dot { width: 28px; height: 6px; background: var(--c, #94a3b8); border-radius: 6px; transition: opacity .2s ease; }
    .pw-meter .meter-text { margin-left: .25rem; }
    .actions { display: flex; justify-content: flex-end; }
    .alert { margin-top: .6rem; padding: .5rem .6rem; border-radius: 8px; font-weight: 500; }
    .alert.ok { background: #ecfdf5; color: #065f46; }
    .alert.err { background: #fef2f2; color: #991b1b; }

    .stats { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0,1fr)); }
    @media (min-width: 768px){ .stats { grid-template-columns: repeat(4, minmax(0,1fr)); } }
    .stat { border-radius: 12px; padding: 14px; color: #0f172a; display: flex; flex-direction: column; gap: .3rem; background: linear-gradient(180deg, #f8fafc, #f1f5f9); border: 1px solid #e5e7eb; }
    .stat.gradient.blue { background: linear-gradient(180deg, #eff6ff, #dbeafe); }
    .stat.gradient.purple { background: linear-gradient(180deg, #faf5ff, #ede9fe); }
    .stat.gradient.teal { background: linear-gradient(180deg, #ecfeff, #cffafe); }
    .stat.gradient.green { background: linear-gradient(180deg, #ecfdf5, #d1fae5); }
    .stat.gradient.red { background: linear-gradient(180deg, #fef2f2, #fee2e2); }
    .stat-top { display: flex; align-items: center; gap: .4rem; color: #475569; }
    .label { font-size: 12px; }
    .value { font-weight: 700; font-size: 1.2rem; }
    .tip { margin-top: .6rem; }

    /* Skeleton loaders */
    .skeleton-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0,1fr)); }
    @media (min-width: 768px){ .skeleton-grid { grid-template-columns: repeat(4, minmax(0,1fr)); } }
    .skeleton-tile { height: 80px; border-radius: 12px; background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `,
  ],
})
export class SettingsComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  activeTab: 'profile'|'api' = 'profile';
  apiBaseUrl = localStorage.getItem('mm.apiBase') || this.api.apiBase;
  testStatus: string | null = null;
  testStatusColor = '#666';
  // Profile fields
  currentPassword = '';
  newPassword = '';
  pwMsg: string | null = null;
  pwOk = false;
  loading = false;
  summaryLoading = true;
  myMeals = 0;
  myExpense = 0; // amount I paid
  mealRate = 0;
  myBalance = 0;
  showCurrent = false;
  showNew = false;

  ngOnInit(){
    // Choose tab based on route path
    try { if (location.pathname.endsWith('/settings')) this.activeTab = 'api'; } catch {}
    this.loadSummary();
  }

  private monthString(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
  async loadSummary(){
    this.summaryLoading = true;
    try {
      const members = await this.api.myMembers().toPromise();
      const month = this.monthString();
      let myMeals = 0, myPaid = 0, rate = 0, balance = 0;
      for (const m of members || []){
        const summary = await this.api.getSummary(m.messId, month).toPromise();
        if (summary){
          rate = summary.totals.mealRate;
          const me = summary.perMember.find(p => p.memberId === m._id);
          if (me) { myMeals += (me.meals || 0); myPaid += (me.paid || 0); balance += (me.balance || 0); }
        }
      }
      this.myMeals = myMeals; this.myExpense = myPaid; this.mealRate = rate; this.myBalance = balance;
    } catch {}
    finally { this.summaryLoading = false; }
  }

  changePassword(){
    this.pwMsg = null; this.pwOk = false; this.loading = true;
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => { this.pwMsg = 'Password updated. Please login again.'; this.pwOk = true; this.auth.logout(); },
      error: (e) => {
        if (e?.status === 404) {
          this.pwMsg = 'This server version does not yet support password change. Please update the server.';
        } else {
          this.pwMsg = e?.error?.error || 'Failed to change password';
        }
        this.pwOk = false;
      },
      complete: () => { this.loading = false; }
    });
  }

  get canSubmitPw(){ return this.currentPassword.length>=6 && this.newPassword.length>=6; }

  get passwordStrength(){
    const n = this.newPassword || '';
    let score = 0;
    if (n.length >= 6) score++;
    if (/[0-9]/.test(n) && /[a-zA-Z]/.test(n)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(n) || n.length >= 10) score++;
    const label = ['Weak','Fair','Strong'][Math.max(0, Math.min(2, score-1))] || 'Weak';
    const color = score>=3 ? '#059669' : score==2 ? '#2563eb' : '#e11d48';
    return { score, label, color };
  }

  save() {
    const url = (this.apiBaseUrl || '').trim();
    if (!url) return;
    localStorage.setItem('mm.apiBase', url);
    this.api.setApiBase(url);
    alert('Saved. API base set to ' + url);
  }

  reset() {
    localStorage.removeItem('mm.apiBase');
    // resetting will set ApiService base back to environment default on reload
    alert('Reset. Reload app to use default environment API base.');
  }

  async autoDetect() {
    try {
      const info = await Device.getInfo();
      // On Android emulator, host machine is reachable at 10.0.2.2
      if (info.platform === 'android') {
        // Heuristic: use emulator IP; for physical device, suggest entering LAN IP
        if (info.isVirtual) {
          this.apiBaseUrl = 'http://localhost:4001/api';
          this.save();
        } else {
          const ip = prompt('Enter your PC LAN IP (e.g., 192.168.1.100):', '');
          if (ip) {
            this.apiBaseUrl = `http://${ip}:4001/api`;
            this.save();
          }
        }
      } else {
        alert('Auto-detect is tailored for Android. For web/others, set URL manually.');
      }
    } catch (e) {
      console.error(e);
      alert('Could not auto-detect. Please set the API URL manually.');
    }
  }

  useLocalhost() {
    this.apiBaseUrl = 'http://localhost:4001/api';
    this.save();
  }

  testConnection() {
    this.testStatus = 'Testing...';
    this.testStatusColor = '#666';
    this.api.health().subscribe({
      next: (res: any) => {
        this.testStatus = 'Success: ' + (typeof res === 'string' ? res : 'OK');
        this.testStatusColor = 'green';
      },
      error: (err) => {
        console.error(err);
        this.testStatus = 'Failed: ' + (err?.message || 'Unknown error');
        this.testStatusColor = 'red';
      }
    });
  }
}
