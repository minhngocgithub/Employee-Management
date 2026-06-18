import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { Types } from 'mongoose';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import {
  AuditAction,
  AuditEntity,
} from '../../audit-logs/schema/audit-log.schema';
import { AuthenticatedUser } from '../../auth/strategies/jwt-payload.interface';

/**
 * Map HTTP method → AuditAction.
 */
const METHOD_ACTION_MAP: Record<string, AuditAction | undefined> = {
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/**
 * Map route prefix → AuditEntity.
 * Tự suy ra entity từ URL segment đầu tiên.
 */
const PATH_ENTITY_MAP: Record<string, AuditEntity | undefined> = {
  employees: AuditEntity.EMPLOYEE,
  departments: AuditEntity.DEPARTMENT,
  'leave-requests': AuditEntity.LEAVE_REQUEST,
  accounts: AuditEntity.ACCOUNT,
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    // Chỉ ghi log CUD — bỏ qua GET
    if (!METHOD_ACTION_MAP[method]) {
      return next.handle();
    }

    // Bỏ qua auth routes
    if (req.path.startsWith('/auth')) {
      return next.handle();
    }

    const user = req.user as AuthenticatedUser | undefined;
    if (!user?.id) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response: unknown) => {
        void this.recordLog(req, method, user, response);
      }),
    );
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async recordLog(
    req: Request,
    method: string,
    user: AuthenticatedUser,
    response: unknown,
  ): Promise<void> {
    try {
      const action = METHOD_ACTION_MAP[method];
      if (!action) return;

      const entity = this.resolveEntity(req.path);
      if (!entity) return;

      const entityId = this.resolveEntityId(req, response);
      if (!entityId || !Types.ObjectId.isValid(entityId)) return;

      await this.auditLogsService.createLog({
        actor_id: new Types.ObjectId(user.id),
        action,
        entity,
        entity_id: new Types.ObjectId(entityId),
        before_data: null,
        after_data: this.safeSerialize(response),
        ip_address: this.extractIp(req),
      });
    } catch {
      // Lỗi ghi log không được làm hỏng response
    }
  }

  /**
   * Tách segment đầu của path để map sang AuditEntity.
   * /employees/123        → EMPLOYEE
   * /departments/tree     → DEPARTMENT
   * /leave-requests/123   → LEAVE_REQUEST
   */
  private resolveEntity(path: string): AuditEntity | null {
    // Bỏ global prefix /api nếu có, sau đó lấy segment đầu
    const stripped = path.replace(/^\/api\//, '').replace(/^\//, '');
    const firstSegment = stripped.split('/')[0] ?? '';
    return PATH_ENTITY_MAP[firstSegment] ?? null;
  }

  /**
   * Lấy entity_id theo thứ tự ưu tiên:
   * 1. :id từ route params (PATCH/DELETE)
   * 2. _id từ response body (POST tạo mới)
   */
  private resolveEntityId(req: Request, response: unknown): string | null {
    const params = req.params as Record<string, string | undefined>;
    if (params['id']) return params['id'];

    if (response && typeof response === 'object' && '_id' in response) {
      const id = (response as Record<string, unknown>)['_id'];
      if (id === null || id === undefined) return null;
      // Dùng toString() explicit — ObjectId, string, number đều có toString() đúng
      // Tránh String() vì ESLint no-base-to-string cảnh báo với unknown object type
      if (typeof id === 'string') return id;
      if (typeof id === 'object' && 'toString' in id) {
        return (id as { toString(): string }).toString();
      }
      return null;
    }

    return null;
  }

  private safeSerialize(data: unknown): Record<string, unknown> | null {
    if (!data || typeof data !== 'object') return null;
    try {
      const obj = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
      // Strip fields nhạy cảm
      delete obj['password_hash'];
      delete obj['refresh_token_hash'];
      return obj;
    } catch {
      return null;
    }
  }

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? null;
  }
}
