import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validate format HH:mm (24h).
 * Hợp lệ: "08:30", "11:15", "23:59"
 * Không hợp lệ: "8:30", "24:00", "abc", "8:5"
 */
@ValidatorConstraint({ name: 'isTimeString', async: false })
export class IsTimeStringConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  defaultMessage(): string {
    return '$property phải đúng định dạng HH:mm (ví dụ: 08:30, 11:15, 23:59)';
  }
}

export function IsTimeString(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: (object as { constructor: new () => unknown }).constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsTimeStringConstraint,
    });
  };
}
