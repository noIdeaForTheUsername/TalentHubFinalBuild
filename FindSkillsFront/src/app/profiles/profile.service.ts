import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, Signal } from '@angular/core';
import { Profile } from './profile.interface';
import { of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {

  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  private readonly maxProfiles: string = '30';  // has to be string for URLSearchParams
  
  public profileCache = signal(new Map<number, Profile>());  // used to load profiles by id
  public searchResults = signal<Profile[]>([]);  // used to store the current/latest search until a new search is made
  public searchFilters = signal<any>({});  // used to store the current/latest search filters

  public loading = signal(false);
  public error = signal<string | undefined>(undefined);

  constructor() {
    // attempt to load list from server on startup
    // this.loadProfilesWithFilters({});
  }

  // Update profile by id (partial allowed)
  updateProfile(id: number, dto: Partial<Profile>) {
    this.loading.set(true);
    this.error.set(undefined);
    return this.http.put<Profile>(`${this.configService.config.api_url}/api/profiles/${id}`, dto, { withCredentials: true }).pipe(
      tap((updated) => {
        // update local cache
        this.profileCache.update(cache => {
          cache.set(updated.id, updated);
          return cache;
        });
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Get profiles with optional filters (from server)
  loadProfilesWithFilters(filters: any) {
    this.loading.set(true);
    this.error.set(undefined);

    this.searchFilters.set(filters);
    
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.skills) params.append('skills', filters.skills);
    if (filters.city) params.append('city', filters.city);
    if (filters.schoolType) params.append('schoolType', filters.schoolType);
    if (typeof filters.minSchoolClass === 'number') params.append('minSchoolClass', String(filters.minSchoolClass));
    if (typeof filters.maxSchoolClass === 'number') params.append('maxSchoolClass', String(filters.maxSchoolClass));
    if (filters.login) params.append('login', filters.login);
    params.append('limit', this.maxProfiles);

    const queryString = params.toString();
    const url = queryString ? `${this.configService.config.api_url}/api/profiles?${queryString}` : `${this.configService.config.api_url}/api/profiles`;

    // Return searched profiles
    this.http.get<Profile[]>(url).pipe(
      tap((profiles: Profile[]) => {
        this.profileCache.update(cache => {
          // update cache
          profiles.forEach(p => cache.set(p.id, p));
          return cache;
        });
        this.searchResults.set(profiles || []);
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return of([] as Profile[]);
      })
    ).subscribe();
  }

  // fetch a single profile by id and update loading/error signals during the request
  getProfileById(id: number) {
    const fromCache = this.profileCache().get(id);
    if (fromCache) return of(fromCache);

    this.loading.set(true);
    this.error.set(undefined);
    return this.http.get<Profile>(`${this.configService.config.api_url}/api/profiles/${id}`).pipe(
      tap((p) => {
        // update cache
        this.profileCache.update(cache => {
          cache.set(p.id, p);
          return cache;
        });
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  private finishLoading() {
    this.loading.set(false);
    this.error.set(undefined);
  }
  private setError(err: any) {
    this.loading.set(false);
    const msg = this.getErrorMessage(err);
    this.error.set(msg);
  }

  // return error message based on HTTP status
  private getErrorMessage(err: any): string {
    if (err?.status === 404) {
      return 'Nie znaleziono profilu. Sprawdź wpisany adres URL lub wróć na stronę główną';
    }
    return 'Problem z serwerem. Nie można załadować danych.';
  }

  public resetErrors() {
    this.error.set(undefined);
  }
}
