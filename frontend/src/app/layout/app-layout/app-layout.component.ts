import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})
export class AppLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  onLogout() {
    this.auth.logout();                 // clear token + isAuthenticated=false
    this.router.navigateByUrl('/auth/login'); // now guestGuard will allow /auth/*
  }
}
