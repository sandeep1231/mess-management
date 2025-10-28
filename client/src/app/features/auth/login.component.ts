import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  template: `
    <div class="container" style="max-width:420px;">
      <div class="card shadow-sm mt-4">
        <div class="card-body">
          <h5 class="card-title mb-3">{{ mode()==='login' ? 'Sign in' : 'Sign up' }}</h5>
          <div class="mb-3">
            <label class="form-label">Phone</label>
            <input class="form-control" placeholder="Phone number" [(ngModel)]="phone" />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group">
              <input [type]="show ? 'text' : 'password'" class="form-control" placeholder="••••••" [(ngModel)]="password" />
              <button class="btn btn-outline-secondary" type="button" (click)="show=!show">
                <i class="bi" [ngClass]="show ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            <div class="form-text">At least 6 characters</div>
          </div>
          <div class="mb-3" *ngIf="mode()==='signup'">
            <label class="form-label">Role</label>
            <select class="form-select" [(ngModel)]="registerRole" [disabled]="!firstUser()">
              <ng-container *ngIf="firstUser(); else userOnly">
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </ng-container>
              <ng-template #userOnly>
                <option value="user">User</option>
              </ng-template>
            </select>
            <div class="form-text" *ngIf="firstUser(); else userHelp">First user can choose Admin. After this, all signups default to User.</div>
            <ng-template #userHelp><span class="form-text">New registrations are created with role User.</span></ng-template>
          </div>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" *ngIf="mode()==='login'" (click)="login()" [disabled]="!phone || password.length<6">
              <i class="bi bi-box-arrow-in-right me-1"></i> Login
            </button>
            <button class="btn btn-success" *ngIf="mode()==='signup'" (click)="register()" [disabled]="!phone || password.length<6">
              <i class="bi bi-person-plus me-1"></i> Create account
            </button>
            <div class="text-center small text-muted">
              <a href="#" (click)="$event.preventDefault(); toggleMode()" class="text-decoration-none">
                {{ mode()==='login' ? "Don't have an account? Sign up" : 'Already have an account? Login' }}
              </a>
            </div>
          </div>
          <div *ngIf="msg" class="alert mt-3" [class.alert-danger]="msgColor==='red'" [class.alert-success]="msgColor==='green'">
            {{msg}}
          </div>
          <div class="mt-2 text-muted" style="font-size:.9rem;">
            Trouble connecting? Set your API base in <a routerLink="/settings">Settings</a>.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  phone = '';
  password = '';
  msg = '';
  msgColor = '#666';
  show = false;
  firstUser = signal(false);
  registerRole: 'admin'|'user' = 'admin';
  mode = signal<'login'|'signup'>('login');

  async ngOnInit(){
    try {
      const res = await this.api.isFirstUser().toPromise();
      const isFirst = !!res?.firstUser;
      this.firstUser.set(isFirst);
      if (!isFirst) this.registerRole = 'user';
    } catch {
      this.firstUser.set(false);
      this.registerRole = 'user';
    }
  }

  login(){
    this.msg='';
    this.api.login(this.phone, this.password).subscribe({
      next: ({token, role}) => { this.auth.token = token; this.auth.role = role; this.api.getMe().subscribe({ next: me => this.auth.myPhone = me.phone, error: () => {} }); this.router.navigateByUrl('/'); },
      error: (e) => { this.msg = e?.error?.error || 'Login failed'; this.msgColor='red'; }
    });
  }
  register(){
    this.msg='';
  const role = this.firstUser() ? this.registerRole : 'user';
    this.api.register(this.phone, this.password, role).subscribe({
      next: (res) => {
        if(res.approved && res.token && res.role){ this.auth.token = res.token; this.auth.role = res.role; this.api.getMe().subscribe({ next: me => this.auth.myPhone = me.phone, error: () => {} }); this.router.navigateByUrl('/'); }
        else { this.msg = 'Registered. Waiting for admin approval.'; this.msgColor='green'; }
      },
      error: (e) => { this.msg = e?.error?.error || 'Register failed'; this.msgColor='red'; }
    });
  }
  toggleMode(){
    if (this.mode()==='login') {
      this.mode.set('signup');
      // Ensure role defaults based on first-user state
      this.registerRole = this.firstUser() ? 'admin' : 'user';
    } else {
      this.mode.set('login');
    }
  }
}
