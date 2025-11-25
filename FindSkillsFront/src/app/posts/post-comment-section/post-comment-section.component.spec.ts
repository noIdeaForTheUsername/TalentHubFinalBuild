import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostCommentSectionComponent } from './post-comment-section.component';

describe('PostCommentSectionComponent', () => {
  let component: PostCommentSectionComponent;
  let fixture: ComponentFixture<PostCommentSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCommentSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostCommentSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
