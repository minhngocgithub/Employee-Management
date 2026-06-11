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
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { PaginatedResult } from '../accounts/accounts.service';
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}
  /**
   * POST /leave-requests
   * Employee / Manager / HR có thể tạo đơn cho chính mình.
   * Admin không được phép tạo đơn.
   * employee_id lấy từ token — không cho client tự truyền.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.leaveRequestsService.create(dto, user);
  }
  /**
   * GET /leave-requests
   * - Employee: chỉ thấy đơn của mình
   * - Manager: thấy đơn của nhân viên trong dept
   * - Admin/HR: thấy tất cả, có thể filter theo employee_id
   */
  @Get()
  async findAll(
    @Query() query: QueryLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResult<unknown>> {
    return this.leaveRequestsService.findAll(query, user);
  }
  /**
   * GET /leave-requests/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.leaveRequestsService.findById(id, user);
  }
  /**
   * PATCH /leave-requests/:id/review
   * Manager/Admin duyệt hoặc từ chối đơn.
   */
  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.leaveRequestsService.review(id, dto, user);
  }
  /**
   * PATCH /leave-requests/:id/cancel
   * Người tạo đơn hoặc Admin hủy đơn PENDING.
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.leaveRequestsService.cancel(id, user);
  }
}
