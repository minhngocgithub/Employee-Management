import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { LeaveStatus } from '../schema/leave-request.schema';

const ReviewableStatus = {
  APPROVED: LeaveStatus.APPROVED,
  REJECTED: LeaveStatus.REJECTED,
} as const;

export class ReviewLeaveRequestDto {
  @IsEnum(ReviewableStatus, {
    message: 'Trạng thái chỉ được là approved hoặc rejected',
  })
  status!: LeaveStatus.APPROVED | LeaveStatus.REJECTED;

  /** Bắt buộc khi status = REJECTED */
  @ValidateIf((o: ReviewLeaveRequestDto) => o.status === LeaveStatus.REJECTED)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejection_reason?: string;

  /** Ghi chú nội bộ — chỉ ADMIN/MANAGER/HR/MANAGER_HR mới được set, service sẽ guard */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  internal_note?: string;
}
