import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../accounts/schema/account.schema';
import { PaginatedResult } from '../accounts/accounts.service';

@Roles(Role.ADMIN)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * GET /audit-logs
   * Admin only. Filter theo actor, entity, action, date range.
   */
  @Get()
  async findAll(
    @Query() query: QueryAuditLogDto,
  ): Promise<PaginatedResult<unknown>> {
    return this.auditLogsService.findAll(query);
  }
}
