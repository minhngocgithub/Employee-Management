import { LeaveType } from '../schema/leave-request.schema';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';

// Nhóm 1
import { CreateAnnualLeaveDto } from '../dto/types/create-annual-leave.dto';
import { CreateSickLeaveDto } from '../dto/types/create-sick-leave.dto';
import { CreateUnpaidLeaveDto } from '../dto/types/create-unpaid-leave.dto';
import { CreateMaternityLeaveDto } from '../dto/types/create-maternity-leave.dto';
import { CreateOtherLeaveDto } from '../dto/types/create-other-leave.dto';

// Nhóm 2
import { CreateWfhDto } from '../dto/types/create-wfh.dto';
import { CreateShiftChangeDto } from '../dto/types/create-shift-change.dto';
import { CreateLateEarlyDto } from '../dto/types/create-late-early.dto';
import { CreateOvertimeDto } from '../dto/types/create-overtime.dto';
import { CreateAttendanceCorrectionDto } from '../dto/types/create-attendance-correction.dto';

// Nhóm 3
import { CreateBusinessTripDto } from '../dto/types/create-business-trip.dto';
import { CreateSalaryAdvanceDto } from '../dto/types/create-salary-advance.dto';

// Nhóm 4
import { CreateResignationDto } from '../dto/types/create-resignation.dto';

/**
 * Map từ leave_type → DTO class tương ứng.
 * Controller dùng map này để plainToInstance + validate đúng DTO.
 *
 * Thêm loại đơn mới: chỉ cần thêm 1 dòng vào đây — controller & service không đổi.
 */
export const LeaveTypeToDtoMap: Record<
  LeaveType,
  new () => CreateLeaveRequestDto
> = {
  // Nhóm 1
  [LeaveType.ANNUAL]: CreateAnnualLeaveDto,
  [LeaveType.SICK]: CreateSickLeaveDto,
  [LeaveType.UNPAID]: CreateUnpaidLeaveDto,
  [LeaveType.MATERNITY]: CreateMaternityLeaveDto,
  [LeaveType.OTHER_LEAVE]: CreateOtherLeaveDto,

  // Nhóm 2
  [LeaveType.WFH]: CreateWfhDto,
  [LeaveType.SHIFT_CHANGE]: CreateShiftChangeDto,
  [LeaveType.LATE_EARLY]: CreateLateEarlyDto,
  [LeaveType.OVERTIME]: CreateOvertimeDto,
  [LeaveType.ATTENDANCE_CORRECTION]: CreateAttendanceCorrectionDto,

  // Nhóm 3
  [LeaveType.BUSINESS_TRIP]: CreateBusinessTripDto,
  [LeaveType.SALARY_ADVANCE]: CreateSalaryAdvanceDto,

  // Nhóm 4
  [LeaveType.RESIGNATION]: CreateResignationDto,
};
