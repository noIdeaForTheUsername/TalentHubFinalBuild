import { Component, computed, signal, ChangeDetectionStrategy, inject, effect, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../shared/header/header.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../accounts/auth-service/auth.service';
import { ProfileService } from '../../profiles/profile.service';
import { PostCardComponent } from '../post-card/post-card.component';
import { PostService } from '../post.service';
import { getClassBounds } from '../../shared/form-utils';
import { LoadingComponent } from '../../shared/loading/loading.component';

@Component({
  selector: 'app-post-discovery-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatButtonModule, HeaderComponent, PostCardComponent, LoadingComponent, RouterLink],
  providers: [],
  templateUrl: './post-discovery-page.html',
  styleUrls: ['./post-discovery-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDiscoveryPage {
  // expose service publicly so template can read `loading()` and `error()` signals
  public postService = inject(PostService);
  protected authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  public pageType = signal<'project' | 'competition' | undefined>(undefined);
  protected posts = this.postService.searchResults;

  // Search / filter signals (controlled by Search button)
  q = signal<string | undefined>(undefined); // name or description
  subject = signal<string | undefined>(undefined);
  remote = signal<'all' | 'remote' | 'onsite'>('all');
  city = signal<string | undefined>(undefined);
  // null means "all"
  schoolType = signal<'primary' | 'secondary' | 'university' | null>(null);
  minSchoolClass = signal<number | undefined>(undefined);
  maxSchoolClass = signal<number | undefined>(undefined);

  // internal flag whether currently search filters are active
  public searchActive = signal(false);
  // whether filter panel is visible
  public filtersOpen = signal(false);

  headerText = computed(() => {
    return this.searchActive() ? 'Wyniki wyszukiwania:' : `Najnowsze ${this.pageTitle()}`;
  });

  pageTitle = computed(() => {
    return this.pageType() === 'competition' ? 'Konkursy' : 'Projekty';
  });

  private paramSignal = toSignal(this.route.paramMap);
  private profileService = inject(ProfileService);

  constructor() {
    // Restore filters from postService.searchFilters signal if available
    const savedFilters = this.postService.searchFilters();
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      if (savedFilters.q !== undefined) this.q.set(savedFilters.q);
      if (savedFilters.subject !== undefined) this.subject.set(savedFilters.subject);
      if (savedFilters.city !== undefined) this.city.set(savedFilters.city);
      if (savedFilters.remote !== undefined) this.remote.set(savedFilters.remote);
      if (savedFilters.schoolType !== undefined) this.schoolType.set(savedFilters.schoolType);
      if (savedFilters.minSchoolClass !== undefined) this.minSchoolClass.set(savedFilters.minSchoolClass);
      if (savedFilters.maxSchoolClass !== undefined) this.maxSchoolClass.set(savedFilters.maxSchoolClass);
      this.searchActive.set(true);
    }

    effect(() => {
      // react to route changes to update the displayed type if url changes

      const params = this.paramSignal();
      if (!params) return;
      const type = params.get('type');

      const targetType = type === 'competitions' ? 'competition' : 'project';
      this.pageType.set(targetType);

      untracked(() => {  // Exclude everything below out of the effect() change detection
        // Check if we have saved results for this type
        const currentResultsType = this.postService.searchResultsType();
        
        // Clear filters and reload data if the page type changed
        if (currentResultsType !== targetType) {
          this.showAll();
          // this.postService.loadPostsByType(targetType);

          // const savedFilters = this.postService.searchFilters();
          // if (savedFilters && Object.keys(savedFilters).length > 0) {
          //   // Restore the search with saved filters
          //   this.postService.loadPostsWithFilters(targetType, savedFilters);
          // } else {
          //   // Initial load without filters
          //   this.postService.loadPostsByType(targetType);
          // }
        }
      });
    });
  }
  
  isLoggedIn() { return this.authService.loggedIn(); }

  applyDefaultFilters() {
    this.clearFilters();
    const uid = this.authService.userId();
    if (!uid) return;
    this.profileService.getProfileById(uid).subscribe({
      next: p => {
        const me = p;

        // set city and schoolType defaults
        this.city.set(me.city ?? undefined);
        this.schoolType.set(me.schoolType ?? null);

        // Set min and max school class
        const bounds = getClassBounds(me.schoolType);
        let maxOffset = 1;
        if (me.schoolType != "primary") maxOffset = 3;

        const min = Math.max(bounds.min, me.schoolClass - maxOffset);
        const max = Math.min(bounds.max, me.schoolClass + maxOffset);
        this.minSchoolClass.set(min);
        this.maxSchoolClass.set(max);

        // Perform search
        this.performSearch();
      }
    });
  }


  // used by template to set min/max attributes
  classBounds = computed(() => {
    const st = this.schoolType();
    if (!st) return { min: 1, max: 8 };
    return getClassBounds(st);
  });

  performSearch() {
    const filters: any = {};
    if (this.q()) filters.q = this.q();
    if (this.subject()) filters.subject = this.subject();
    if (this.city()) filters.city = this.city();
    if (this.remote() && this.remote() !== 'all') filters.remote = this.remote();
    if (this.schoolType()) filters.schoolType = this.schoolType();
    if (typeof this.minSchoolClass() === 'number') filters.minSchoolClass = this.minSchoolClass();
    if (typeof this.maxSchoolClass() === 'number') filters.maxSchoolClass = this.maxSchoolClass();

    this.searchActive.set(true);
    this.postService.loadPostsWithFilters(this.pageType() === 'competition' ? 'competition' : 'project', filters);
  }

  showAll() {
    this.clearFilters();
    this.postService.loadPostsByType(this.pageType() === 'competition' ? 'competition' : 'project');
  }

  changePage(next: boolean) {
    this.postService.changeSearchPage(next);
    this.scrollToTop();
  }

  goToFirstPage() {
    this.postService.loadPostsWithFilters(
      this.pageType() === 'competition' ? 'competition' : 'project', this.postService.searchFilters());
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private clearFilters() {
    this.q.set(undefined);
    this.subject.set(undefined);
    this.remote.set('all');
    this.city.set(undefined);
    this.schoolType.set(null);
    this.minSchoolClass.set(undefined);
    this.maxSchoolClass.set(undefined);
    this.searchActive.set(false);
    // this.postService.searchFilters.set({});
  }
}

