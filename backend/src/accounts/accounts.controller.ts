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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsService, PaginatedResult } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryAccountDto } from './dto/query-account.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { Role, AccountDocument } from './schema/account.schema';

@ApiTags('Accounts')
@ApiBearerAuth('JWT')
@Roles(Role.ADMIN)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /** POST /accounts — Tạo tài khoản mới */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAccountDto): Promise<AccountDocument> {
    return this.accountsService.create(dto);
  }

  /** GET /accounts?role=&search=&status=&page=&limit= */
  @Get()
  @ApiOperation({ summary: 'Danh sách tài khoản (US-311, US-312, US-313)' })
  async findAll(
    @Query() query: QueryAccountDto,
  ): Promise<PaginatedResult<unknown>> {
    return this.accountsService.findAll(query);
  }

  /** GET /accounts/:id */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<unknown> {
    return this.accountsService.findById(id);
  }

  /** PATCH /accounts/:id/role */
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.accountsService.updateRole(id, dto, user.id);
  }

  /**
   * PATCH /accounts/:id/activate
   * Admin kích hoạt tài khoản INACTIVE hoặc LOCKED → ACTIVE (US-315).
   * Gửi SMS thông tin đăng nhập về SĐT nhân viên (xử lý ở service/SMS module).
   */
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt tài khoản (US-315)' })
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.accountsService.activate(id, user.id);
  }

  /**
   * PATCH /accounts/:id/lock
   * Admin khóa tài khoản đang ACTIVE → LOCKED (US-314).
   * Dùng khi nhân viên RETIRED/RESIGNED hoặc có vi phạm.
   */
  @Patch(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Khóa tài khoản (US-314)' })
  async lock(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.accountsService.lock(id, user.id);
  }

  /** PATCH /accounts/:id/reset-password */
  @Patch(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.accountsService.resetPassword(id, dto);
    return { message: 'Đặt lại mật khẩu thành công' };
  }
}
