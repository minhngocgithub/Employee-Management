import { Role } from '../../accounts/schema/account.schema';

export class TokenResponseDto {
  declare accessToken: string;

  declare user: {
    id: string;
    email: string;
    role: Role;
    department_id: string;
    employee_id: string | null;
    must_change_password: boolean;
  };
}
