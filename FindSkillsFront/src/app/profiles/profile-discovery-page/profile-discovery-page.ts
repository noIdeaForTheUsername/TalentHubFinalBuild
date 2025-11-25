import { Component, computed, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../shared/header/header.component';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ProfileService } from '../profile.service';
import { getClassBounds } from '../../shared/form-utils';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { AuthService } from '../../accounts/auth-service/auth.service';

@Component({
  selector: 'app-profile-discovery-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatButtonModule, HeaderComponent, ProfileCardComponent, LoadingComponent],
  templateUrl: './profile-discovery-page.html',
  styleUrls: ['./profile-discovery-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDiscoveryPage implements OnInit {
  // expose service publicly so template can read `loading()` and `error()` signals
  protected profileService = inject(ProfileService);
  protected authService = inject(AuthService);

  profiles = this.profileService.searchResults;

  // Search / filter signals
  skills = signal<string | undefined>(undefined); // skills/favoriteSubjects
  city = signal<string | undefined>(undefined);
  schoolType = signal<'primary' | 'secondary' | 'university' | null>(null);
  minSchoolClass = signal<number | undefined>(undefined);
  maxSchoolClass = signal<number | undefined>(undefined);
  login = signal<string | undefined>(undefined);

  // internal flag whether currently search filters are active
  public searchActive = signal(false);
  // whether filter panel is visible
  public filtersOpen = signal(false);

  headerText = computed(() => {
    return Object.keys(this.profileService.searchFilters()).length ? 'Wyniki wyszukiwania:' : 'Najnowsi użytkownicy:';
  });


  ngOnInit() {
    // Get filters from profile service. Perform initial load only if there are no filters and no results are saved
    const filters = this.profileService.searchFilters();
    if (Object.keys(filters).length > 0) {
      this.skills.set(filters.skills);
      this.city.set(filters.city);
      this.schoolType.set(filters.schoolType);
      this.minSchoolClass.set(filters.minSchoolClass);
      this.maxSchoolClass.set(filters.maxSchoolClass);
      this.login.set(filters.login);
    }
    else if (this.profileService.searchResults().length === 0) {
      this.performSearch();
      this.searchActive.set(false);
    }
  }


  // public computed used by template to set min/max attributes
  classBounds = computed(() => {
    const st = this.schoolType();
    if (!st) return { min: 1, max: 8 };
    return getClassBounds(st);
  });

  performSearch() {
    const filters: any = {};
    if (this.skills()) filters.skills = this.skills();
    if (this.city()) filters.city = this.city();
    if (this.schoolType()) filters.schoolType = this.schoolType();
    if (typeof this.minSchoolClass() === 'number') filters.minSchoolClass = this.minSchoolClass();
    if (typeof this.maxSchoolClass() === 'number') filters.maxSchoolClass = this.maxSchoolClass();
    if (this.login()) filters.login = this.login();

    this.searchActive.set(true);
    this.profileService.loadProfilesWithFilters(filters);
  }

  resetFilters() {
    this.clearFilters();
    this.applyDefaultSearchFilters();
    this.performSearch();
  }

  showAll() {
    this.clearFilters();
    this.searchActive.set(false);
    this.profileService.loadProfilesWithFilters({});
  }

  private clearFilters() {
    this.skills.set(undefined);
    this.city.set(undefined);
    this.schoolType.set(null);
    this.minSchoolClass.set(undefined);
    this.maxSchoolClass.set(undefined);
    this.login.set(undefined);
  }

  private applyDefaultSearchFilters() {
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
      }
    });
  }
}
