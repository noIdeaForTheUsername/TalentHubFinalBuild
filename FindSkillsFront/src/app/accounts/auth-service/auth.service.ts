import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { lastValueFrom, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { ConfigService } from '../../config/config.service';

export interface RegisterDto {
  login: string;
  password: string;
  schoolType: string;
  schoolClass: number;
  city: string;
  favoriteSubjects?: string;
  bio?: string;
}

export interface LoginDto {
  login: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  id?: number;
  login?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);

  // state signals
  public loading = signal(false);
  public error = signal<string | undefined>(undefined);

  // signals for auth state that may be resolved async
  public loggedIn = signal(false);
  public userId = signal<number | undefined>(undefined);
  public username = signal<string | undefined>(undefined);
  public notLoggedInConfirmed = signal(false);

  constructor() {
    if (!this.loggedIn()) {
      this.checkLoggedIn();
    }
  }

  checkLoggedIn() {
    this.http.get<AuthResponse>(
      `${this.configService.config.api_url}/api/auth/me`,
      { withCredentials: true }).subscribe({
        next: (resp) => {
          if (resp.ok && resp.id) {
            this.loggedIn.set(true);
            this.userId.set(resp.id);
            this.username.set(resp.login);
          } else {
            this.notLoggedInConfirmed.set(true);
          }
        },
        error: (err) => {
          this.error.set(this.getErrorMessage(err));
        }
      });
  }

  /**
   * Register a new user
   */
  register(dto: RegisterDto) {
    this.loading.set(true);
    this.error.set(undefined);

    return this.http.post<AuthResponse>(
      `${this.configService.config.api_url}/api/profiles`,
      dto,
      { withCredentials: true }
    ).pipe(
      tap((resp) => {
        this.loading.set(false);
        this.userId.set(resp.id);
        this.loggedIn.set(true);
        this.notLoggedInConfirmed.set(false);
      }),
      catchError((err) => {
        this.loading.set(false);
        this.error.set(this.getErrorMessage(err));
        return throwError(() => err);
      })
    );
  }

  /**
   * Log in user
   */
  login(dto: LoginDto) {
    this.loading.set(true);
    this.error.set(undefined);

    return this.http.post<AuthResponse>(
      `${this.configService.config.api_url}/api/auth/login`,
      dto,
      { withCredentials: true }
    ).pipe(
      tap((resp) => {
        this.loading.set(false);
        if (resp.ok && resp.login) {
          this.error.set(undefined);
          this.loggedIn.set(true);
          this.notLoggedInConfirmed.set(false);
          this.userId.set(resp.id);
        } else {
          this.error.set('Nieprawidłowy login lub hasło');
        }
      }),
      catchError((err) => {
        this.loading.set(false);
        const msg = this.getErrorMessage(err);
        this.error.set(msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * Logout (optional if backend provides endpoint)
   */
  logout() {
    this.http.post(
      `${this.configService.config.api_url}/api/auth/logout`, {}, {withCredentials: true})
      .subscribe({
        next: () => {
          this.error.set(undefined);
          this.loggedIn.set(false);
          this.userId.set(undefined);
        }
      }
    );
  }


  async addPasskey() {
    try {
      const options = await lastValueFrom(this.http
      .post(`${this.configService.config.api_url}/api/webauthn/register/options`, {}, {withCredentials: true}));

      const attestation = await startRegistration(options as any);

      const verification = await lastValueFrom(this.http
        .post(`${this.configService.config.api_url}/api/webauthn/register/verify`, { attestation }, {withCredentials: true}));

      return verification;
    }
    catch (e) {
      console.log("passkey registration failed:", e);
      throw e;
      // window.alert("Nie udało się zarejestrować klucza dostępu");
    }
  }

  async loginWithPasskey() {
    const options = await lastValueFrom(
      this.http.post(`${this.configService.config.api_url}/api/webauthn/login/options`, {}, { withCredentials: true })
    );

    const assertion = await startAuthentication(options as any);

    const verification: any = await lastValueFrom(
      this.http.post(`${this.configService.config.api_url}/api/webauthn/login/verify`, { assertion }, { withCredentials: true })
    );

    // Backend powinien w odpowiedzi zwrócić userId / login
    if (verification?.ok && verification?.id) {
      this.loggedIn.set(true);
      this.userId.set(verification.id);
      this.username.set(verification.login);
    }
    return verification;
  }

  /**
   * Helper: return user-friendly error message based on HTTP status
   */
  private getErrorMessage(err: any): string {
    if (err?.status === 400 && err?.error?.message == "password must be at least 8 characters long") {
      return "Hasło musi mieć co najmniej 8 znaków.";
    }
    else if (err?.status === 409) {
      return 'Login już istnieje. Wybierz inny.';
    }
    else if (err?.status === 404) {
      return 'Użytkownik nie znaleziony.';
    }
    else if (err?.status === 400) {
      return err?.error?.error || 'Nieprawidłowe dane. Sprawdź login i hasło.';
    }
    return 'Problem z serwerem. Spróbuj później.';
  }

  public resetErrors() {
    this.error.set(undefined);
    this.notLoggedInConfirmed.set(false);
  }
}
