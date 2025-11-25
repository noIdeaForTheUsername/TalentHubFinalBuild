import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDetailsPage } from './profile-details-page';

describe('ProfileDetailsPage', () => {
  let component: ProfileDetailsPage;
  let fixture: ComponentFixture<ProfileDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDetailsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
