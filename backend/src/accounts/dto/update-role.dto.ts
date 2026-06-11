import { IsEnum } from 'class-validator';
import { Role } from '../schema/account.schema';

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'Role không hợp lệ' })
  declare role: Role;
}
