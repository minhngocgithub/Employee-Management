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
import { DepartmentsService, DepartmentTree } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../accounts/schema/account.schema';
import { DepartmentDocument } from './schema/department.schema';

@ApiTags('Departments')
@ApiBearerAuth('JWT')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * POST /departments
   * Chỉ Admin.
   */
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDepartmentDto): Promise<DepartmentDocument> {
    return this.departmentsService.create(dto);
  }

  /**
   * GET /departments
   * Admin + Manager xem được.
   * ?includeInactive=true → Admin mới xem được phòng ban đã vô hiệu hóa.
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  @Get()
  async findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<DepartmentDocument[]> {
    return this.departmentsService.findAll(includeInactive === 'true');
  }

  /**
   * GET /departments/tree
   * Trả về cấu trúc cây phân cấp 3 cấp.
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  @Get('tree')
  async findTree(): Promise<DepartmentTree[]> {
    return this.departmentsService.findTree();
  }

  /**
   * GET /departments/:id
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DepartmentDocument> {
    return this.departmentsService.findById(id);
  }

  /**
   * GET /departments/:id/children
   * Lấy danh sách phòng ban con trực tiếp.
   */
  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  @Get(':id/children')
  async findChildren(@Param('id') id: string): Promise<DepartmentDocument[]> {
    return this.departmentsService.findChildren(id);
  }

  /**
   * PATCH /departments/:id
   * Cập nhật tên, manager, is_active.
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentDocument> {
    return this.departmentsService.update(id, dto);
  }

  /**
   * PATCH /departments/:id/manager
   * Gán / gỡ manager cho phòng ban.
   * Body: { manager_id: string | null }
   */
  @Roles(Role.ADMIN)
  @Patch(':id/manager')
  async assignManager(
    @Param('id') id: string,
    @Body('manager_id') managerId: string | null,
  ): Promise<DepartmentDocument> {
    return this.departmentsService.assignManager(id, managerId);
  }

  /**
   * DELETE /departments/:id
   * Soft delete — đánh dấu is_active = false.
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.departmentsService.softDelete(id);
    return { message: 'Xóa phòng ban thành công' };
  }
}
