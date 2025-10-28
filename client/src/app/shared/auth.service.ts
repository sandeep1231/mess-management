import { Injectable, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private key = 'mm.token';
  private roleKey = 'mm.role';
  private mePhoneKey = 'mm.me.phone';
  get token() { return localStorage.getItem(this.key); }
  set token(v: string | null) { if (v) localStorage.setItem(this.key, v); else localStorage.removeItem(this.key); }
  get role(): 'admin' | 'user' | null { return (localStorage.getItem(this.roleKey) as any) || null; }
  set role(v: 'admin' | 'user' | null) { if (v) localStorage.setItem(this.roleKey, v); else localStorage.removeItem(this.roleKey); }
  get isAdmin() { return this.role === 'admin'; }
  get myPhone(): string | null { return localStorage.getItem(this.mePhoneKey); }
  set myPhone(v: string | null) { if (v) localStorage.setItem(this.mePhoneKey, v); else localStorage.removeItem(this.mePhoneKey); }
  logout() { this.token = null; this.role = null; this.myPhone = null; }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const svc = inject(AuthService);
  const router = inject(Router);
  const token = svc.token;
  // Attach token for API and protected auth endpoints (exclude register/login)
  const isApi = req.url.includes('/api/');
  const isProtectedAuth = req.url.includes('/auth/') && !req.url.endsWith('/auth/register') && !req.url.endsWith('/auth/login');
  const needsAuth = isApi || isProtectedAuth;
  if (token && needsAuth) {
    const clone = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(clone).pipe(
      catchError(err => {
        if ((err?.status || err?.statusCode) === 401) {
          svc.logout();
          router.navigateByUrl('/login');
        } else if ((err?.status || err?.statusCode) === 403) {
          alert('Action requires admin rights');
        }
        return throwError(() => err);
      })
    );
  }
  return next(req).pipe(
    catchError(err => {
      if ((err?.status || err?.statusCode) === 401) {
        svc.logout();
        router.navigateByUrl('/login');
      } else if ((err?.status || err?.statusCode) === 403) {
        alert('Action requires admin rights');
      }
      return throwError(() => err);
    })
  );
};
