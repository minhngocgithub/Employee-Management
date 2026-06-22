import type { LeaveStatus, LeaveType } from 'src/types/api.types';

// ─── Options cho dropdown/filter ─────────────────────────────────────────────

export const LEAVE_TYPE_OPTIONS: { label: string; value: LeaveType }[] = [
  // Nhóm 1 — Nghỉ phép & vắng mặt
  { label: 'Nghỉ phép năm',    value: 'annual' },
  { label: 'Nghỉ ốm',          value: 'sick' },
  { label: 'Nghỉ không lương', value: 'unpaid' },
  { label: 'Nghỉ thai sản',    value: 'maternity' },
  { label: 'Nghỉ khác',        value: 'other_leave' },
  // Nhóm 2 — Chấm công & thời gian làm việc
  { label: 'Làm việc từ xa',        value: 'wfh' },
  { label: 'Đổi ca',                value: 'shift_change' },
  { label: 'Đi muộn / Về sớm',      value: 'late_early' },
  { label: 'Đăng ký làm thêm',      value: 'overtime' },
  { label: 'Cập nhật công',         value: 'attendance_correction' },
  // Nhóm 3 — Tài chính & công tác
  { label: 'Công tác',       value: 'business_trip' },
  { label: 'Tạm ứng lương', value: 'salary_advance' },
  // Nhóm 4 — Quan hệ lao động
  { label: 'Thôi việc', value: 'resignation' },
];

export const LEAVE_STATUS_OPTIONS: { label: string; value: LeaveStatus }[] = [
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt',  value: 'approved' },
  { label: 'Từ chối',   value: 'rejected' },
  { label: 'Đã hủy',   value: 'cancelled' },
];

// ─── Label maps ───────────────────────────────────────────────────────────────

/**
 * Record<LeaveType, string> — phải có đủ 13 key khớp với LeaveType enum.
 * Thiếu key → TypeScript lỗi compile → Vite hot reload crash → store reset → token mất.
 */
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  // Nhóm 1
  annual:      'Nghỉ phép năm',
  sick:        'Nghỉ ốm',
  unpaid:      'Nghỉ không lương',
  maternity:   'Nghỉ thai sản',
  other_leave: 'Nghỉ khác',
  // Nhóm 2
  wfh:                   'Làm việc từ xa',
  shift_change:          'Đổi ca',
  late_early:            'Đi muộn / Về sớm',
  overtime:              'Đăng ký làm thêm',
  attendance_correction: 'Cập nhật công',
  // Nhóm 3
  business_trip:  'Công tác',
  salary_advance: 'Tạm ứng lương',
  // Nhóm 4
  resignation: 'Thôi việc',
};

const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending:   'Chờ duyệt',
  approved:  'Đã duyệt',
  rejected:  'Từ chối',
  cancelled: 'Đã hủy',
};

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending:   'orange',
  approved:  'green',
  rejected:  'red',
  cancelled: 'grey',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getLeaveTypeLabel(type: LeaveType): string {
  return LEAVE_TYPE_LABELS[type] ?? type;
}

export function getLeaveStatusLabel(status: LeaveStatus): string {
  return LEAVE_STATUS_LABELS[status] ?? status;
}

export function getLeaveStatusColor(status: LeaveStatus): string {
  return LEAVE_STATUS_COLORS[status] ?? 'grey';
}

/**
 * Số ngày nghỉ (bao gồm cả ngày bắt đầu và kết thúc).
 * Chỉ áp dụng cho loại đơn có start_date/end_date.
 */
export function countLeaveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end < start) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN');
}