import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ConfirmAccountComponent } from './features/auth/confirm/confirm-account.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  {
    path: 'auth',
    canMatch: [guestGuard],
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'confirm', component: ConfirmAccountComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
    ],
  },

  {
    path: '',
    canMatch: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: '**', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
