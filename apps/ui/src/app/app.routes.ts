import { Route } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./main-page/main-page.component').then(
        (m) => m.MainPageComponent
      ),
    pathMatch: 'full',
    canActivate: [AuthGuard],
  },
  // { path: 'profile', component: ProfilePageComponent, pathMatch: 'full', canActivate: [AuthGuard] },
  {
    path: 'login',
    loadComponent: () =>
      import('./login-page/login-page.component').then((m) => m.LoginComponent),
    pathMatch: 'full',
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./register-page/register-page.component').then(
        (m) => m.RegisterComponent
      ),
    pathMatch: 'full',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-short-link-page/create-short-link-page.component').then(
        (m) => m.CreateShortLinkPageComponent
      ),
    pathMatch: 'full',
    canActivate: [AuthGuard],
  },
  {
    path: 'short-links/:id',
    loadComponent: () =>
      import('./short-link-page/short-link-page.component').then(
        (m) => m.ShortLinkPageComponent
      ),
    pathMatch: 'full',
    canActivate: [AuthGuard],
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports-list-page/reports-list-page.component').then(
        (m) => m.ReportsListPageComponent
      ),
    pathMatch: 'full',
    canActivate: [AuthGuard],
  },
  {
    path: 'reports/create',
    loadComponent: () =>
      import('./create-report-page/create-report-page.component').then(
        (m) => m.CreateReportPageComponent
      ),
    pathMatch: 'full',
    canActivate: [AuthGuard],
  },
  {
    path: 'reports/:id',
    loadComponent: () =>
      import('./report-page/report-page.component').then(
        (m) => m.ReportPageComponent
      ),
    pathMatch: 'full',
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./short-link-redirect/short-link-redirect.component').then(
        (m) => m.ShortLinkRedirectComponent
      ),
    pathMatch: 'full',
  },
];
