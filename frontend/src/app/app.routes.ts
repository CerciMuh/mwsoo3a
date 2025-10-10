import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { studentGuard } from './core/auth/student.guard';
import { adminGuard } from './core/auth/admin.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ConfirmAccountComponent } from './features/auth/confirm/confirm-account.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { UniversityComponent } from './features/university/university.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { AdminDegreesComponent } from './features/admin/admin-degrees/admin-degrees.component';
import { AdminCoursesComponent } from './features/admin/admin-courses/admin-courses.component';

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

  // Admin section (admins only) - MUST come before general authenticated routes
  {
    path: 'admin',
    canMatch: [adminGuard],
    component: AdminDashboardComponent,
    children: [
      { path: '', redirectTo: 'degrees', pathMatch: 'full' },
      { path: 'degrees', component: AdminDegreesComponent },
      { path: 'courses', component: AdminCoursesComponent },
    ],
  },

  {
    path: '',
    canMatch: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },

      // University section (students only)
      {
        path: 'university',
        canMatch: [studentGuard],
        component: UniversityComponent,
      },

      { path: '**', redirectTo: 'home' },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
