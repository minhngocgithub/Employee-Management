import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeResponseDto } from './dto/create-employee-response.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { Role } from '../accounts/schema/account.schema';
import { PaginatedResult } from '../accounts/accounts.service';

@ApiTags('Employees')
@ApiBearerAuth('JWT')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /**
   * POST /employees
   * Admin + HR: tự động sinh email @company.com + mật khẩu tạm thời.
   */
  @Roles(Role.ADMIN, Role.HR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateEmployeeDto,
  ): Promise<CreateEmployeeResponseDto> {
    return this.employeesService.create(dto);
  }

  /**
   * GET /employees?search=&department_id=&status=&page=&limit=
   * Manager chỉ xem nhân viên trong phòng ban của mình.
   */
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @Get()
  async findAll(
    @Query() query: QueryEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResult<unknown>> {
    return this.employeesService.findAll(query, user);
  }

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.employeesService.findByAccountId(user.id);
  }

  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.employeesService.findById(id, user);
  }

  @Roles(Role.ADMIN, Role.HR)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<unknown> {
    return this.employeesService.update(id, dto);
  }

  @Patch('me/profile')
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<unknown> {
    const employee = await this.employeesService.findByAccountId(user.id);
    const allowedDto: UpdateEmployeeDto = {
      full_name: dto.full_name,
      phone: dto.phone,
      avatar_url: dto.avatar_url,
      date_of_birth: dto.date_of_birth,
      gender: dto.gender,
      address: dto.address,
    };
    return this.employeesService.update(
      (employee._id as unknown as { toString(): string }).toString(),
      allowedDto,
    );
  }

  @Roles(Role.ADMIN, Role.HR)
  @Patch(':id/resign')
  @HttpCode(HttpStatus.OK)
  async resign(@Param('id') id: string): Promise<unknown> {
    return this.employeesService.resign(id);
  }
}
