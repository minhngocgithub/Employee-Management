import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class SetActingManagerDto {
  /**
   * null = xóa ủy quyền.
   * string = account_id của người được ủy quyền.
   */
  @IsOptional()
  @IsMongoId({ message: 'acting_manager_id không hợp lệ' })
  acting_manager_id: string | null = null;

  /**
   * Ngày kết thúc ủy quyền (YYYY-MM-DD).
   * null hoặc không truyền = không tự động hết hạn.
   * Cronjob sẽ clear acting_manager_id khi acting_until < hôm nay.
   */
  @IsOptional()
  @IsDateString({}, { message: 'acting_until không hợp lệ (YYYY-MM-DD)' })
  acting_until?: string | null;
}
