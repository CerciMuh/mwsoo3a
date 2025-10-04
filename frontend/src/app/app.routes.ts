import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
export const routes: Routes = [
  // default → login (first page)
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },


  // Public (guest-only) area
  {
    path: 'auth',
    canMatch: [guestGuard],
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      // { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) }
    ]
  },

  // Protected app area
  {
    path: '',
    canMatch: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: '**', redirectTo: 'home' }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' }
];
