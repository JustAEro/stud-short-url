import { Route } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';

export const appRoutes: Route[] = [
    {path: 'profile', component: ProfilePageComponent},
    {path: '', component: MainPageComponent, pathMatch: 'full'}
];
