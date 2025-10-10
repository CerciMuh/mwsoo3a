import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  private readonly auth = inject(AuthService);

  readonly user$ = this.auth.user$;

  protected isStudent(): boolean {
    return this.auth.isStudent();
  }

  protected isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  protected onLogout(): void {
    this.auth.logout();
  }
}
