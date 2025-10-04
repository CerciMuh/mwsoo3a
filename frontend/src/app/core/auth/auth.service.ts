import { Injectable, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, from, map } from 'rxjs';

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  birthdate: string;
  phoneNumber: string;
  updated_at: string;
}

export interface AuthUserProfile {
  [key: string]: string | undefined;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  phone_number?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly pool = new CognitoUserPool({
    UserPoolId: environment.cognito.userPoolId,
    ClientId: environment.cognito.clientId,
  });

  private currentUser: CognitoUser | null = null;
  private session = signal<CognitoUserSession | null>(null);

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly userSubject = new BehaviorSubject<AuthUserProfile | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly router: Router) {
    this.ensureSession();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  login(email: string, password: string): Observable<void> {
    return new Observable((observer) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({ Username: email, Pool: this.pool });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          this.setSession(cognitoUser, session);
          observer.next();
          observer.complete();
        },
        onFailure: (error) => {
          observer.error(error);
        },
        newPasswordRequired: () => {
          observer.error(new Error('Password update required. Please complete setup in the hosted UI.'));
        },
      });
    });
  }

  signUp(request: SignUpRequest): Observable<void> {
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: request.email }),
      new CognitoUserAttribute({ Name: 'name', Value: request.name }),
      new CognitoUserAttribute({ Name: 'birthdate', Value: request.birthdate }),
      new CognitoUserAttribute({ Name: 'phone_number', Value: request.phoneNumber }),
      new CognitoUserAttribute({ Name: 'updated_at', Value: request.updated_at }),
    ];

    return new Observable((observer) => {
      this.pool.signUp(request.email, request.password, attributeList, [], (err) => {
        if (err) {
          observer.error(err);
          return;
        }
        observer.next();
        observer.complete();
      });
    });
  }

  confirmSignUp(email: string, code: string): Observable<void> {
    const cognitoUser = new CognitoUser({ Username: email, Pool: this.pool });
    return new Observable((observer) => {
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          observer.error(err);
          return;
        }
        observer.next();
        observer.complete();
      });
    });
  }

  resendConfirmationCode(email: string): Observable<void> {
    const cognitoUser = new CognitoUser({ Username: email, Pool: this.pool });
    return new Observable((observer) => {
      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          observer.error(err);
          return;
        }
        observer.next();
        observer.complete();
      });
    });
  }

  forgotPassword(email: string): Observable<void> {
    const cognitoUser = new CognitoUser({ Username: email, Pool: this.pool });
    return new Observable((observer) => {
      let finished = false;
      const completeOnce = () => {
        if (finished) return;
        finished = true;
        observer.next();
        observer.complete();
      };

      cognitoUser.forgotPassword({
        onSuccess: () => completeOnce(),
        onFailure: (error) => observer.error(error),
        inputVerificationCode: () => completeOnce(),
      });
    });
  }

  confirmForgotPassword(email: string, code: string, newPassword: string): Observable<void> {
    const cognitoUser = new CognitoUser({ Username: email, Pool: this.pool });
    return new Observable((observer) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          observer.next();
          observer.complete();
        },
        onFailure: (error) => observer.error(error),
      });
    });
  }

  logout(): void {
    this.currentUser?.signOut();
    this.clearSession();
    this.router.navigateByUrl('/auth/login');
  }

  requireAuthenticated(): Observable<boolean | UrlTree> {
    return from(this.ensureSession()).pipe(
      map((isAuthenticated) => (isAuthenticated ? true : this.router.parseUrl('/auth/login'))),
    );
  }

  requireGuest(): Observable<boolean | UrlTree> {
    return from(this.ensureSession()).pipe(
      map((isAuthenticated) => (!isAuthenticated ? true : this.router.parseUrl('/home'))),
    );
  }

  private async ensureSession(): Promise<boolean> {
    if (this.session()?.isValid() && this.currentUser) {
      return true;
    }

    const existingUser = this.pool.getCurrentUser();
    if (!existingUser) {
      this.clearSession();
      return false;
    }

    return new Promise<boolean>((resolve) => {
      existingUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          this.clearSession();
          resolve(false);
          return;
        }

        this.setSession(existingUser, session);
        resolve(true);
      });
    });
  }

  private setSession(user: CognitoUser, session: CognitoUserSession): void {
    this.currentUser = user;
    this.session.set(session);
    this.isAuthenticatedSubject.next(true);
    this.persistTokens(session);
    this.loadUserAttributes(user);
  }

  private loadUserAttributes(user: CognitoUser): void {
    user.getUserAttributes((err: Error | undefined, attributes: CognitoUserAttribute[] | undefined) => {
      if (err || !attributes) {
        this.userSubject.next(null);
        return;
      }

      const profile = attributes.reduce<AuthUserProfile>((acc, attribute: CognitoUserAttribute) => {
        acc[attribute.getName()] = attribute.getValue();
        return acc;
      }, {});

      this.userSubject.next(profile);
    });
  }

  private persistTokens(session: CognitoUserSession): void {
    localStorage.setItem('cognito-id-token', session.getIdToken().getJwtToken());
    localStorage.setItem('cognito-access-token', session.getAccessToken().getJwtToken());
    localStorage.setItem('cognito-refresh-token', session.getRefreshToken().getToken());
  }

  private clearSession(): void {
    this.currentUser = null;
    this.session.set(null);
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    localStorage.removeItem('cognito-id-token');
    localStorage.removeItem('cognito-access-token');
    localStorage.removeItem('cognito-refresh-token');
  }
}
