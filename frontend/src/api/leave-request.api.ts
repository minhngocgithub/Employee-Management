import { api } from 'src/lib/http';
import type {
    LeaveRequest,
    CreateLeaveRequestDto,
    ReviewLeaveRequestDto,
    QueryLeaveRequestDto,
    PaginatedResult,
} from 'src/types/api.types';

export const leaveRequestApi = {
    /**
     * POST /leave-requests
     * Create a new leave request
     * employee_id is automatically set from current user
     * Employee/Manager/HR can create, Admin cannot
     */
    create(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
        return api
            .post<LeaveRequest>('/leave-requests', dto)
            .then((res) => res.data);
    },

    /**
     * GET /leave-requests
     * List leave requests with role-based filtering
     * - Employee: sees only their own requests
     * - Manager: sees requests from their department
     * - Admin/HR: sees all requests, can filter by employee_id
     */
    list(query?: QueryLeaveRequestDto): Promise<PaginatedResult<LeaveRequest>> {
        return api
            .get<PaginatedResult<LeaveRequest>>('/leave-requests', { params: query })
            .then((res) => res.data);
    },

    /**
     * GET /leave-requests/:id
     * Get single leave request details
     */
    getById(id: string): Promise<LeaveRequest> {
        return api
            .get<LeaveRequest>(`/leave-requests/${id}`)
            .then((res) => res.data);
    },

    /**
     * PATCH /leave-requests/:id/review
     * Approve or reject a leave request (Manager/Admin only)
     */
    review(
        id: string,
        dto: ReviewLeaveRequestDto,
    ): Promise<LeaveRequest> {
        return api
            .patch<LeaveRequest>(`/leave-requests/${id}/review`, dto)
            .then((res) => res.data);
    },

    /**
     * PATCH /leave-requests/:id/cancel
     * Cancel a pending leave request
     * Only the requester or Admin can cancel
     */
    cancel(id: string): Promise<LeaveRequest> {
        return api
            .patch<LeaveRequest>(`/leave-requests/${id}/cancel`)
            .then((res) => res.data);
    },
};
