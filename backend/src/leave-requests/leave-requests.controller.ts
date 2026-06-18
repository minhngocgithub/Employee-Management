import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt-payload.interface';
import { PaginatedResult } from '../accounts/accounts.service';
@ApiTags('Leave Requests')
@ApiBearerAuth('JWT')
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
   * PATCH /leave-requests/:id
   * Update leave request (only creator, only PENDING status)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.leaveRequestsService.update(id, dto, user);
  }

  /**
   * DELETE /leave-requests/:id
   * Delete leave request (only creator, only PENDING status)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.leaveRequestsService.delete(id, user);
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
