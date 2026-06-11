import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '../schema/account.schema';

export class CreateAccountDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  declare email: string;

  /**
   * Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 số.
   */
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  declare password: string;

  @IsEnum(Role, { message: 'Role không hợp lệ' })
  declare role: Role;

  @IsMongoId({ message: 'department_id không hợp lệ' })
  declare department_id: string;
}
