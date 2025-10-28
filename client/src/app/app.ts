import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './shared/auth.service';
import { ApiService } from './shared/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  template: `
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
    <div class="container-fluid">
      <a class="navbar-brand" routerLink="/">Mess Manager</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav" aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" data-bs-toggle="collapse" data-bs-target="#nav">Dashboard</a></li>
          <li class="nav-item"><a class="nav-link" routerLink="/manage" routerLinkActive="active" data-bs-toggle="collapse" data-bs-target="#nav">Manage</a></li>
          <!-- Settings temporarily hidden
          <li class="nav-item"><a class="nav-link" routerLink="/settings" routerLinkActive="active" data-bs-toggle="collapse" data-bs-target="#nav">Settings</a></li>
          -->
          <li class="nav-item" *ngIf="auth.isAdmin"><a class="nav-link" routerLink="/admin" routerLinkActive="active" data-bs-toggle="collapse" data-bs-target="#nav">Admin</a></li>
        </ul>
        <ng-container *ngIf="auth.token; else loggedOut">
          <span class="badge rounded-pill bg-primary me-3" [title]="auth.role ?? ''">{{ auth.isAdmin ? 'Admin' : 'User' }}</span>
          <button class="btn btn-outline-danger btn-sm" (click)="logout()" data-bs-toggle="collapse" data-bs-target="#nav"><i class="bi bi-box-arrow-right me-1"></i>Logout</button>
        </ng-container>
        <ng-template #loggedOut>
          <a class="btn btn-outline-primary btn-sm" routerLink="/login" data-bs-toggle="collapse" data-bs-target="#nav">Login</a>
        </ng-template>
      </div>
    </div>
  </nav>
  <main class="container my-3">
    <router-outlet></router-outlet>
  </main>
  `,
  styles: [`.topbar{display:flex;gap:12px;padding:12px;border-bottom:1px solid #ddd;align-items:center} .content{padding:16px;} .role{padding:2px 8px;border-radius:10px;background:#eef;color:#334;}`]
})
export class App {
  protected readonly title = signal('client');
  auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);
  logout(){ this.auth.logout(); location.href = '/login'; }

  constructor(){
    // Verify token on startup; if invalid or user missing, force logout
    if (this.auth.token) {
      this.api.getMe().subscribe({
        next: (me) => { this.auth.role = me.role; this.auth.myPhone = me.phone; },
        error: () => { this.logout(); }
      });
    }
    // Auto-close navbar collapse after any navigation ends
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        const el = document.getElementById('nav');
        if (el && el.classList.contains('show')) {
          // Prefer Bootstrap's Collapse API when available (from bootstrap.bundle)
          const w = window as any;
          const CollapseApi = w?.bootstrap?.Collapse;
          if (CollapseApi) {
            const inst = CollapseApi.getInstance?.(el) || new CollapseApi(el, { toggle: false });
            inst.hide();
          } else {
            // Fallback: manually close the collapse
            el.classList.remove('show');
            const toggler = document.querySelector('[data-bs-target="#nav"]');
            if (toggler) (toggler as HTMLElement).setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  }
}
