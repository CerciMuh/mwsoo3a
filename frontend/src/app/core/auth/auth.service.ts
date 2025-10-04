import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(localStorage.getItem('token'));
  isAuthenticated = signal(!!this._token());

  constructor() {
    effect(() => {
      const t = this._token();
      if (t) localStorage.setItem('token', t);
      else localStorage.removeItem('token');
    });
  }

  login(token: string) {
    this._token.set(token);
    this.isAuthenticated.set(true);
  }

  logout() {
    this._token.set(null);
    this.isAuthenticated.set(false);
  }

  get token() { return this._token(); }
}
