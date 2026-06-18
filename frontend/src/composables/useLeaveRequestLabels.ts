import type { LeaveStatus, LeaveType } from 'src/types/api.types';

export const LEAVE_TYPE_OPTIONS: { label: string; value: LeaveType }[] = [
    { label: 'Nghỉ phép năm', value: 'annual' },
    { label: 'Nghỉ ốm', value: 'sick' },
    { label: 'Nghỉ không lương', value: 'unpaid' },
];

export const LEAVE_STATUS_OPTIONS: { label: string; value: LeaveStatus }[] = [
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đã duyệt', value: 'approved' },
    { label: 'Từ chối', value: 'rejected' },
    { label: 'Đã hủy', value: 'cancelled' },
];

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    annual: 'Nghỉ phép năm',
    sick: 'Nghỉ ốm',
    unpaid: 'Nghỉ không lương',
    other: 'Khác',
};

const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
};

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'grey',
};

export function getLeaveTypeLabel(type: LeaveType): string {
    return LEAVE_TYPE_LABELS[type] ?? type;
}

export function getLeaveStatusLabel(status: LeaveStatus): string {
    return LEAVE_STATUS_LABELS[status] ?? status;
}

export function getLeaveStatusColor(status: LeaveStatus): string {
    return LEAVE_STATUS_COLORS[status] ?? 'grey';
}

/** Số ngày nghỉ (bao gồm cả ngày bắt đầu và kết thúc) */
export function countLeaveDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end < start) return 0;
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN');
}
