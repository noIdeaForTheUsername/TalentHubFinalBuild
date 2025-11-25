import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';


export function getClassBounds(type: 'primary' | 'secondary' | 'university') {
  switch (type) {
    case 'primary': return { min: 1, max: 8 };
    case 'secondary': return { min: 1, max: 5 };
    case 'university': return { min: 1, max: 6 };
    default: return { min: 1, max: 8 };
  }
}

export function controlSchoolClassValidator(schoolTypeControlName: string = 'schoolType'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (val == null || val === '') return null;
    const num = Number(val);
    if (Number.isNaN(num) || num < 1) return { invalid: true };
    const type = control.parent?.get(schoolTypeControlName)?.value as any;
    if (!type) return null;
    const bounds = getClassBounds(type);
    if (num > bounds.max) return { outOfRange: { max: bounds.max } };
    return null;
  };
}

// Group-level validator used in post form; returns composite errors about school fields
export function schoolFieldsValidator(
  schoolTypeCtrl: string = 'schoolType',
  schoolClassCtrl: string = 'schoolClass'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;
    const schoolType = group.get(schoolTypeCtrl)?.value;
    const schoolClass = group.get(schoolClassCtrl)?.value;

    if (!schoolType) return { schoolTypeRequired: true };
    if (!schoolClass) return null; // class optional until provided

    const num = Number(schoolClass);
    if (isNaN(num) || num < 1) return { schoolClassInvalid: true };
    const bounds = getClassBounds(schoolType);
    if (num > bounds.max) return { schoolClassRange: { max: bounds.max } };
    return null;
  };
}

// Group-level validator for min/max people relationship
export function minMaxPeopleValidator(
  minCtrl: string = 'minPeople',
  maxCtrl: string = 'maxPeople'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;
    const min = group.get(minCtrl)?.value;
    const max = group.get(maxCtrl)?.value;
    if (min != null && max != null && Number(min) > Number(max)) {
      return { minmax: true };
    }
    return null;
  };
}

// Generic group validator that sets an error on schoolClass control if out of bounds (used in profile edit/details)
export function schoolClassRangeValidator(
  schoolTypeCtrl: string = 'schoolType',
  schoolClassCtrl: string = 'schoolClass'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;
    const st = group.get(schoolTypeCtrl)?.value;
    const sc = group.get(schoolClassCtrl)?.value;
    const schoolClassControl = group.get(schoolClassCtrl);

    if (!st || sc == null || sc === '') {
      schoolClassControl?.setErrors(null);
      return null;
    }

    const bounds = getClassBounds(st);
    const num = Number(sc);
    if (isNaN(num) || num < bounds.min || num > bounds.max) {
      schoolClassControl?.setErrors({ schoolClassRange: true });
    } else {
      schoolClassControl?.setErrors(null);
    }
    return null; // errors handled at control level
  };
}
