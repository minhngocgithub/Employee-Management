import { api } from 'src/lib/http';
import type {
    LeaveRequest,
    CreateLeaveRequestDto,
    UpdateLeaveRequestDto,
    ReviewLeaveRequestDto,
    QueryLeaveRequestDto,
    PaginatedResult,
} from 'src/types/api.types';

export const leaveRequestApi = {
    create(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
        return api
            .post<LeaveRequest>('/leave-requests', dto)
            .then((res) => res.data);
    },

    list(query?: QueryLeaveRequestDto): Promise<PaginatedResult<LeaveRequest>> {
        return api
            .get<PaginatedResult<LeaveRequest>>('/leave-requests', { params: query })
            .then((res) => res.data);
    },

    getById(id: string): Promise<LeaveRequest> {
        return api
            .get<LeaveRequest>(`/leave-requests/${id}`)
            .then((res) => res.data);
    },

    update(id: string, dto: UpdateLeaveRequestDto): Promise<LeaveRequest> {
        return api
            .patch<LeaveRequest>(`/leave-requests/${id}`, dto)
            .then((res) => res.data);
    },

    delete(id: string): Promise<{ message: string }> {
        return api
            .delete<{ message: string }>(`/leave-requests/${id}`)
            .then((res) => res.data);
    },

    review(id: string, dto: ReviewLeaveRequestDto): Promise<LeaveRequest> {
        return api
            .patch<LeaveRequest>(`/leave-requests/${id}/review`, dto)
            .then((res) => res.data);
    },

    cancel(id: string): Promise<LeaveRequest> {
        return api
            .patch<LeaveRequest>(`/leave-requests/${id}/cancel`)
            .then((res) => res.data);
    },
};
