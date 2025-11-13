import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './shared/auth.service';

const requireAuth: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	return !!auth.token || router.createUrlTree(['/login']);
};

const requireAdmin: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAdmin || router.createUrlTree(['/']);
};

export const routes: Routes = [
	{
		path: '', canActivate: [requireAuth],
		loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
	},
	{
		path: 'profile', canActivate: [requireAuth],
		loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
	},
  {
    path: 'member/:id', canActivate: [requireAuth],
    loadComponent: () => import('./features/member-detail/member-detail.component').then(m => m.MemberDetailComponent)
  },
	{
		path: 'manage', canActivate: [requireAuth],
		loadComponent: () => import('./features/manage/manage.component').then(m => m.ManageComponent)
	},
	{
		path: 'members', canActivate: [requireAuth],
		loadComponent: () => import('./features/manage/manage.component').then(m => m.ManageComponent)
	},
	{
		path: 'meals', canActivate: [requireAuth],
		loadComponent: () => import('./features/manage/manage.component').then(m => m.ManageComponent)
	},
	{
		path: 'expenses', canActivate: [requireAuth],
		loadComponent: () => import('./features/manage/manage.component').then(m => m.ManageComponent)
	},
	{
		path: 'admin', canActivate: [requireAuth, requireAdmin],
		loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
	},
	{
		path: 'settings',
		loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
	},
	{ path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
];
