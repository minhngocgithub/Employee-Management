import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LeaveStatus, LeaveType } from 'src/types/api.types';

// ─── Composable para sa i18n translations ─────────────────────────────────────

export function useLeaveRequestI18n() {
  const { t } = useI18n();

  const LEAVE_TYPE_OPTIONS = computed(() => [
    { label: t('leaveType.annual'), value: 'annual' },
    { label: t('leaveType.sick'), value: 'sick' },
    { label: t('leaveType.unpaid'), value: 'unpaid' },
    { label: t('leaveType.maternity'), value: 'maternity' },
    { label: t('leaveType.other_leave'), value: 'other_leave' },
    { label: t('leaveType.wfh'), value: 'wfh' },
    { label: t('leaveType.shift_change'), value: 'shift_change' },
    { label: t('leaveType.late_early'), value: 'late_early' },
    { label: t('leaveType.overtime'), value: 'overtime' },
    { label: t('leaveType.attendance_correction'), value: 'attendance_correction' },
    { label: t('leaveType.business_trip'), value: 'business_trip' },
    { label: t('leaveType.salary_advance'), value: 'salary_advance' },
    { label: t('leaveType.resignation'), value: 'resignation' },
  ]);

  const LEAVE_STATUS_OPTIONS = computed(() => [
    { label: t('leaveStatus.pending'), value: 'pending' },
    { label: t('leaveStatus.approved'), value: 'approved' },
    { label: t('leaveStatus.rejected'), value: 'rejected' },
    { label: t('leaveStatus.cancelled'), value: 'cancelled' },
  ]);

  return {
    LEAVE_TYPE_OPTIONS,
    LEAVE_STATUS_OPTIONS,
  };
}

// ─── Fallback Options (English) para sa backward compatibility ─────────────────

export const LEAVE_TYPE_OPTIONS = [
  { label: 'Annual Leave', value: 'annual' },
  { label: 'Sick Leave', value: 'sick' },
  { label: 'Unpaid Leave', value: 'unpaid' },
  { label: 'Maternity Leave', value: 'maternity' },
  { label: 'Other Leave', value: 'other_leave' },
  { label: 'Work From Home', value: 'wfh' },
  { label: 'Shift Change', value: 'shift_change' },
  { label: 'Late/Early', value: 'late_early' },
  { label: 'Overtime', value: 'overtime' },
  { label: 'Attendance Correction', value: 'attendance_correction' },
  { label: 'Business Trip', value: 'business_trip' },
  { label: 'Salary Advance', value: 'salary_advance' },
  { label: 'Resignation', value: 'resignation' },
] as const;

export const LEAVE_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

// ─── Label maps (English fallback) ───────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  unpaid: 'Unpaid Leave',
  maternity: 'Maternity Leave',
  other_leave: 'Other Leave',
  wfh: 'Work From Home',
  shift_change: 'Shift Change',
  late_early: 'Late/Early',
  overtime: 'Overtime',
  attendance_correction: 'Attendance Correction',
  business_trip: 'Business Trip',
  salary_advance: 'Salary Advance',
  resignation: 'Resignation',
};

const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
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
