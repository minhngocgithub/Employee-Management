import { IsDateString, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, AuditEntity } from '../schema/audit-log.schema';

export class QueryAuditLogDto {
  @IsOptional()
  @IsMongoId({ message: 'actor_id không hợp lệ' })
  actor_id?: string;

  @IsOptional()
  @IsEnum(AuditAction, { message: 'Action không hợp lệ' })
  action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditEntity, { message: 'Entity không hợp lệ' })
  entity?: AuditEntity;

  @IsOptional()
  @IsMongoId({ message: 'entity_id không hợp lệ' })
  entity_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from_date không hợp lệ' })
  from_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to_date không hợp lệ' })
  to_date?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
