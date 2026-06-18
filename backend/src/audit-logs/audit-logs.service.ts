import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
  AuditEntity,
} from './schema/audit-log.schema';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { PaginatedResult } from '../accounts/accounts.service';

export interface CreateAuditLogParams {
  actor_id: Types.ObjectId;
  action: AuditAction;
  entity: AuditEntity;
  entity_id: Types.ObjectId;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  ip_address?: string | null;
}

type LeanAuditLog = {
  _id: Types.ObjectId;

  actor_id: {
    _id: Types.ObjectId;

    employee_id: {
      _id: Types.ObjectId;
      employee_code: string;
      full_name: string;
    } | null;
  };

  action: AuditAction;
  entity: AuditEntity;
  entity_id: Types.ObjectId;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
};

type AuditLogFilter = {
  actor_id?: Types.ObjectId;
  action?: AuditAction;
  entity?: AuditEntity;
  entity_id?: Types.ObjectId;
  created_at?: { $gte?: Date; $lte?: Date };
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  // ─── Create (gọi từ interceptor hoặc service) ─────────────────────────────

  async createLog(params: CreateAuditLogParams): Promise<void> {
    await this.auditLogModel.create({
      actor_id: params.actor_id,
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id,
      before_data: params.before_data ?? null,
      after_data: params.after_data ?? null,
      ip_address: params.ip_address ?? null,
    });
  }

  // ─── FindAll (Admin only) ─────────────────────────────────────────────────

  async findAll(
    query: QueryAuditLogDto,
  ): Promise<PaginatedResult<LeanAuditLog>> {
    const {
      actor_id,
      action,
      entity,
      entity_id,
      from_date,
      to_date,
      page = 1,
      limit = 20,
    } = query;

    const filter: AuditLogFilter = {};

    if (actor_id) filter.actor_id = new Types.ObjectId(actor_id);
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (entity_id) filter.entity_id = new Types.ObjectId(entity_id);

    if (from_date || to_date) {
      filter.created_at = {};
      if (from_date) filter.created_at.$gte = new Date(from_date);
      if (to_date) filter.created_at.$lte = new Date(to_date);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate({
          path: 'actor_id',
          select: 'employee_id',
          populate: {
            path: 'employee_id',
            select: 'employee_code full_name',
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .lean<LeanAuditLog[]>(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
