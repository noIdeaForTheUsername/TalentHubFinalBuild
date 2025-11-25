import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, Signal } from '@angular/core';
import { Post } from './post.interface';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ConfigService } from '../config/config.service';

interface PostSearchFilters {
  q?: string;
  subject?: string;
  city?: string;
  remote?: 'all' | 'remote' | 'onsite';
  schoolType?: 'primary' | 'secondary' | 'university';
  minSchoolClass?: number | undefined;
  maxSchoolClass?: number | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {

  private http = inject(HttpClient);
  private configService = inject(ConfigService);

  // Posts
  private readonly maxCachedPosts = 100;
  public cachedPosts = signal(new Map<number, Post>());  // used to load posts by id

  // Search results and filters
  public searchResults = signal<Post[]>([]);  // used to store the current/latest search until a new search is made
  public searchResultsType = signal<'project' | 'competition' | null>(null);
  public searchFilters = signal<any>({});  // used to store the current/latest search filters
  // Search results - page control variables
  private readonly _postsPerPage = 12;
  private readonly _searchPage = signal(1); public readonly searchPage = this._searchPage.asReadonly();
  private searchResultsMaxIds: number[] = [];
  public readonly searchResultsFinalPage = computed(() => this.searchResults().length < this._postsPerPage);

  // User posts (for user profile page)
  public userPosts = signal<Post[]>([]);  // used to store posts of the currently/latest viewed user page
  public loadedUserPostsId = signal<number | null>(null);

  // Loading and error
  public loading = signal(false);
  public error = signal<string | undefined>(undefined);

  constructor() {
    effect(() => {
      // Update cache every time the search results change
      const searchResults = this.searchResults();
      const userPosts = this.userPosts();
      this.cachedPosts.update(postsMap => {
        for (const post of searchResults) {
          postsMap.set(post.id, post);
        }
        for (const post of userPosts) {
          postsMap.set(post.id, post);
        }
        return postsMap;
      });
    });

    effect(() => {
      const posts = this.cachedPosts();

      // Limit the cachedPosts size to maxCachedPosts
      if (posts.size <= this.maxCachedPosts) return;
      let keys = posts.keys();
      for (let key of keys) {
        posts.delete(key);
        if (posts.size <= this.maxCachedPosts) break;
      }

      this.cachedPosts.set(posts);
    });
  }

  // ------------------------------------------ PUBLIC FUNCTIONS ------------------------------------------

  // Loaders and getters

  // Load posts of given type without filters
  loadPostsByType(type: 'project' | 'competition') {
    if (this.searchResultsType() === type && this.searchPage() === 1
      && Object.keys(this.searchFilters()).length === 0) return;
    this.loading.set(true);
    this.error.set(undefined);
    this.searchFilters.set({});  // Clear filters when loading all posts
    this.loadPostsWithFilters(type, {});
  }

  // Load posts with server-side filters.
  // This will cause a return to the page 1 of results - use only when reload really needed.
  loadPostsWithFilters(type: 'project' | 'competition', filters: PostSearchFilters = {}) {
    // Go to page 1
    this._searchPage.set(1);
    this.searchResultsMaxIds = [];
    // Set loading true
    this.loading.set(true);
    this.error.set(undefined);
    // Save applied filters
    this.searchFilters.set(filters);

    // Call API
    const url = this.getSearchUrl(type, filters);
    this.http.get<any[]>(url).pipe(
      map((posts: any[]) => posts.map(p => this.convertPostDates(p))),
      tap((posts: Post[]) => {
        this.searchResults.set(posts || []);
        this.searchResultsType.set(type);
        if (posts.length > 0) this.searchResultsMaxIds.push(posts[posts.length - 1].id);
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return of([] as Post[]);
      })
    ).subscribe();
  }

  changeSearchPage(next = true) {  // if false, goes to the previous page
    if ((next && this.searchResults().length < this._postsPerPage)
    || (!next && this._searchPage() === 1)) {
      // no more posts to load
      window.alert("Nie ma dalszych stron wyników");
      return;
    } 
    this.loading.set(true);
    this.error.set(undefined);

    const subtraction = next ? 1 : 3;
    const currentMaxId = this.searchResultsMaxIds[this.searchResultsMaxIds.length - subtraction];
    // Call API
    const url = this.getSearchUrl(this.searchResultsType()!, this.searchFilters(), currentMaxId);
    this.http.get<any[]>(url).pipe(
      map((posts: any[]) => posts.map(p => this.convertPostDates(p))),
      tap((posts: Post[]) => {
        this.searchResults.set(posts || []);
        // update maxIds and page number
        if (next) {
          if (posts.length > 0) this.searchResultsMaxIds.push(posts[posts.length - 1].id);
          else this.searchResultsMaxIds.push(currentMaxId); // no new posts, push the same maxId
          // increment page
          this._searchPage.update(n => n + 1);
        }
        else {
          this.searchResultsMaxIds.pop(); // remove last maxId
          this._searchPage.update(n => n - 1);
        }
        
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return of([] as Post[]);
      })
    ).subscribe();
  }

  loadUserPosts(userId: number) {
    if (this.loadedUserPostsId() === userId) return of(this.userPosts());
    this.userPosts.set([]);  // reset posts - we don't want to show previous user's posts while loading new ones
    this.loadedUserPostsId.set(null);
    this.loading.set(true);
    this.error.set(undefined);
    return this.http.get<any[]>(`${this.configService.config.api_url}/api/projects/author/${userId}`).pipe(
      map((array: any) => array.map((p: any) => this.convertPostDates(p))),
      tap((posts: Post[]) => {
        this.userPosts.set(posts || []);
        this.finishLoading();
        this.loadedUserPostsId.set(userId);
      }),
      catchError((err) => {
        this.setError(err);
        this.loadedUserPostsId.set(null);
        return throwError(() => err);
      })
    );
  }

  getPostById(id: number) {
    if (this.cachedPosts().has(id)) return of(this.cachedPosts().get(id)!);
    this.loading.set(true);
    this.error.set(undefined);
    return this.http.get<any>(`${this.configService.config.api_url}/api/projects/${id}`).pipe(
      map((p: any) => this.convertPostDates(p)),
      tap(() => {
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Post modifications

  // Update a post by id (partial allowed). Updates local cache on success.
  updatePost(id: number, dto: Partial<Post>) {
    this.loading.set(true);
    this.error.set(undefined);
    return this.http.put<any>(`${this.configService.config.api_url}/api/projects/${id}`, dto, { withCredentials: true }).pipe(
      map((updated: any) => this.convertPostDates(updated)),
      tap((updated: Post) => {
        // update local cache on success
        this.cachedPosts.update(postsMap => {
          postsMap.set(updated.id, updated);
          return postsMap;
        });
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  deletePost(id: number) {
    this.loading.set(true);
    this.error.set(undefined);
    return this.http.delete<{ ok: boolean }>(`${this.configService.config.api_url}/api/projects/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        // remove from cache on success
        this.cachedPosts.update(postsMap => {
          postsMap.delete(id);
          // Reset saved results
          this.searchResultsType.set(null);
          this.loadedUserPostsId.set(null);
          return postsMap;
        });
        this.searchResults.update(posts => posts.filter(p => p.id !== id));
        this.finishLoading();
      }),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  createPost(dto: Partial<Post>) {
    this.loading.set(true);
    this.error.set(undefined);
    return this.http.post<any>(`${this.configService.config.api_url}/api/projects`, dto, { withCredentials: true }).pipe(
      map((created: any) => this.convertPostDates(created)),
      tap((created: Post) => {
        // add to local cache on success
        this.cachedPosts.update(postsMap => {
          postsMap.set(created.id, created);
          // Reset saved results
          this.searchResultsType.set(null);
          this.loadedUserPostsId.set(null);
          return postsMap;
        });
        this.finishLoading();
        this.searchResultsType.set(null); // forces reload of the search results next time so the new post appears too
      }),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Comments

  getComments(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.configService.config.api_url}/api/projects/${postId}/comments`, { withCredentials: true });
  }

  postComment(postId: number, content: string, parentId?: number): Observable<any> {
    const body: any = { content };
    this.loading.set(true);
    if (parentId !== undefined) body.parentId = parentId;
    return this.http.post<any>(`${this.configService.config.api_url}/api/projects/${postId}/comments`, body, { withCredentials: true }).pipe(
      tap(() => this.finishLoading()),
      catchError((err) => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Reset error messages

  public resetErrors() {
    this.error.set(undefined);
  }

  // ------------------------------------ PRIVATE FUNCTIONS ------------------------------------------


  // normalize post object coming from backend (convert ISO date strings to Date)
  private convertPostDates(raw: any): Post {
    if (!raw) return raw;
    const p: any = { ...raw };
    if (p.beginDate && typeof p.beginDate === 'string') {
      p.beginDate = new Date(p.beginDate);
    }
    if (p.endDate && typeof p.endDate === 'string') {
      p.endDate = new Date(p.endDate);
    }
    return p as Post;
  }

  private getSearchUrl(type: 'project' | 'competition', filters: PostSearchFilters, maxId?: number): string {
    const params: string[] = [];
    if (type) params.push(`type=${type}`);
    if (filters.q) params.push(`q=${encodeURIComponent(filters.q)}`);
    if (filters.subject) params.push(`subject=${encodeURIComponent(filters.subject)}`);
    if (filters.city) params.push(`city=${encodeURIComponent(filters.city)}`);
    if (filters.remote && filters.remote !== 'all') params.push(`remote=${filters.remote}`);
    if (filters.schoolType) params.push(`schoolType=${filters.schoolType}`);
    if (filters.minSchoolClass) params.push(`minSchoolClass=${filters.minSchoolClass}`);
    if (filters.maxSchoolClass) params.push(`maxSchoolClass=${filters.maxSchoolClass}`);
    params.push(`limit=${this._postsPerPage}`);
    params.push(`maxId=${maxId}`);

    return `${this.configService.config.api_url}/api/projects${params.length ? '?' + params.join('&') : ''}`;
  }

  private setError(err: any) {
    this.loading.set(false);
    const msg = this.getErrorMessage(err);
    this.error.set(msg);
  }
  private finishLoading() {
    this.loading.set(false);
    this.error.set(undefined);
  }

  // helper: return user-friendly error message based on HTTP status
  private getErrorMessage(err: any): string {
    if (err?.status === 404) {
      return 'Nie znaleziono posta. Sprawdź wpisany adres URL lub wróć na stronę główną';
    }
    return 'Problem z serwerem. Spróbuj później.';
  }
}
