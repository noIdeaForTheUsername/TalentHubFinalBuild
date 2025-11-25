import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { controlSchoolClassValidator, schoolFieldsValidator, minMaxPeopleValidator } from '../../shared/form-utils';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Post } from '../post.interface';
import { normalizeUrl } from '../../shared/url-utils';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatSlideToggleModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './post-form.html',
  styleUrls: ['./post-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostFormComponent {
  title = input<string>();
  type = input.required<'competition' | 'project'>();
  post = input<Post | null>(null);
  submitPost = output<Partial<Post>>();

  selectedType = signal<'project' | 'competition'>('project');
  form: FormGroup;
  private fb = new FormBuilder();

  constructor() {
    this.form = this.buildForm(null);
    // revalidate the form when selectedType changes (signals don't auto-trigger form validators)
    effect(() => {
      this.selectedType();
      this.form?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.selectedType.set(this.type());
  }

  ngOnChanges() {
    // rebuild form when input post changes
    this.form = this.buildForm(this.post());
    this.selectedType.set(this.type());
    // revalidate city when remote toggles
    this.form.get('remote')?.valueChanges.subscribe(() => {
      this.form.get('city')?.updateValueAndValidity();
    });
    // revalidate schoolClass when schoolType changes
    this.form.get('schoolType')?.valueChanges.subscribe(() => {
      this.form.get('schoolClass')?.updateValueAndValidity();
      this.form.updateValueAndValidity();
    });
  }

  private buildForm(p: Post | null) {
    return this.fb.group({
      name: [p?.name ?? '', Validators.required],
      remote: [p?.remote ?? false],
      subject: [p?.subject ?? '', Validators.required],
      description: [p?.description ?? '', Validators.required],
      city: [p?.city ?? '', this.cityRequiredIfNotRemote.bind(this)],
      schoolType: [p?.schoolType ?? '', Validators.required],
      schoolClass: [p?.schoolClass ?? null, controlSchoolClassValidator()],
      link: [p?.link || null],
      beginDate: [p?.beginDate ? this.formatDateForInput(p.beginDate) : ''],
      endDate: [p?.endDate ? this.formatDateForInput(p.endDate) : ''],
      currentPeople: [p?.currentPeople ?? null],
      minPeople: [p?.minPeople ?? null],
      maxPeople: [p?.maxPeople ?? null]
    }, { 
      validators: [
        schoolFieldsValidator(),
        minMaxPeopleValidator()
      ]
    });
  }

  private formatDateForInput(d: any) {
    const date = d ? new Date(d) : null;
    return date ? date.toISOString().substring(0,10) : '';
  }

  private cityRequiredIfNotRemote(control: AbstractControl) {
    const parent = control.parent as any;
    if (!parent) return null;
    const remote = parent.get('remote')?.value;
    const val = control.value;
    if (!remote && (!val || (typeof val === 'string' && val.trim() === ''))) {
      return { required: true };
    }
    return null;
  }

  onSubmit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const dto: any = {};
    dto.name = val.name;
    dto.remote = !!val.remote;
    dto.subject = val.subject;
    dto.description = val.description;
    if (val.link) dto.link = normalizeUrl(val.link);
    dto.type = this.selectedType();
    if (val.city) dto.city = val.city;
    if (val.schoolType) dto.schoolType = val.schoolType;
    if (val.schoolClass != null) dto.schoolClass = Number(val.schoolClass);
    if (val.beginDate) dto.beginDate = new Date(val.beginDate).toISOString();
    if (val.endDate) dto.endDate = new Date(val.endDate).toISOString();
    if (val.minPeople != null) dto.minPeople = Number(val.minPeople);
    if (val.maxPeople != null) dto.maxPeople = Number(val.maxPeople);
    if (val.currentPeople != null) dto.currentPeople = Number(val.currentPeople);

    this.submitPost.emit(dto);
  }
}
