import { Route } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ShortLinkRedirectComponent } from './short-link-redirect/short-link-redirect.component';
import { LoginComponent } from './login-page/login-page.component';
import { RegisterComponent } from './register-page/register-page.component';
import { CreateShortLinkPageComponent } from './create-short-link-page/create-short-link-page.component';
import { ShortLinkPageComponent } from './short-link-page/short-link-page.component';

export const appRoutes: Route[] = [
  { path: '', component: MainPageComponent, pathMatch: 'full' },
  { path: 'profile', component: ProfilePageComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent, pathMatch: 'full' },
  { path: 'signup', component: RegisterComponent, pathMatch: 'full' },
  { path: 'create', component: CreateShortLinkPageComponent, pathMatch: 'full' },
  { path: 'short-links/:id', component: ShortLinkPageComponent, pathMatch: 'full' },
  { path: ':id', component: ShortLinkRedirectComponent, pathMatch: 'full' },
];
