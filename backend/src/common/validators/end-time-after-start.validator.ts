import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Decorator đặt trên end_time (hoặc bất kỳ field "end" nào).
 * So sánh với field "start" được chỉ định qua tham số.
 *
 * Dùng:
 *   @EndTimeAfterStart('start_time')
 *   declare end_time: string;
 *
 *   @EndTimeAfterStart('makeup_start_time')
 *   declare makeup_end_time: string;
 */
@ValidatorConstraint({ name: 'endTimeAfterStart', async: false })
export class EndTimeAfterStartConstraint implements ValidatorConstraintInterface {
  validate(endTime: unknown, args: ValidationArguments): boolean {
    const startField = args.constraints[0] as string;
    const obj = args.object as Record<string, unknown>;
    const startTime = obj[startField];

    // Nếu một trong hai chưa có giá trị → bỏ qua (để @IsTimeString / @IsNotEmpty xử lý)
    if (typeof endTime !== 'string' || typeof startTime !== 'string')
      return true;

    return toMinutes(endTime) > toMinutes(startTime);
  }

  defaultMessage(args: ValidationArguments): string {
    const startField = args.constraints[0] as string;
    return `$property phải sau ${startField}`;
  }
}

export function EndTimeAfterStart(
  startFieldName: string,
  options?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: (object as { constructor: new () => unknown }).constructor,
      propertyName,
      options,
      constraints: [startFieldName],
      validator: EndTimeAfterStartConstraint,
    });
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
