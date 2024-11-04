import { Route } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ShortLinkRedirectComponent } from './short-link-redirect/short-link-redirect.component';

export const appRoutes: Route[] = [
  { path: '', component: MainPageComponent, pathMatch: 'full' },
  { path: 'profile', component: ProfilePageComponent, pathMatch: 'full' },
  { path: ':id', component: ShortLinkRedirectComponent, pathMatch: 'full' },
];
