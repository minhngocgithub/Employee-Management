<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">{{ $t('leaveRequests.title') }}</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          {{ $t('leaveRequests.subtitle') }}
        </p>
      </div>
      <div class="col-auto">
        <q-btn flat dense icon="refresh" :label="$t('common.reload')" :loading="loading" @click="loadRequests" />
      </div>
    </div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-select v-model="filterStatus" outlined dense :options="LEAVE_STATUS_OPTIONS" :label="$t('common.status')"
              emit-value map-options clearable @update:model-value="onFilterChange" />
          </div>
          <div class="col-12 col-md-3">
            <q-select v-model="filterLeaveType" outlined dense :options="LEAVE_TYPE_OPTIONS" :label="$t('leaveRequests.filters.type')"
              emit-value map-options clearable @update:model-value="onFilterChange" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-table :rows="requests" :columns="columns" row-key="_id" flat bordered :loading="loading"
        v-model:pagination="pagination" @request="onTableRequest">
        <template #body-cell-employee="props">
          <q-td :props="props"> 
            {{ props.row.employee_id.employee_code }}
          </q-td>
        </template>
        <template #body-cell-employee_name="props">
          <q-td :props="props"> 
            {{ props.row.employee_id.full_name }}
          </q-td>
        </template>

        <template #body-cell-leave_type="props">
          <q-td :props="props">
            {{ getLeaveTypeLabel(props.row.leave_type) }}
          </q-td>
        </template>

        <template #body-cell-dates="props">
          <q-td :props="props">
            {{ formatDate(props.row.start_date) }}
            →
            {{ formatDate(props.row.end_date) }}
            <div class="text-caption text-grey-7">
              {{ countLeaveDays(props.row.start_date, props.row.end_date) }} ngày
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="getLeaveStatusColor(props.row.status)" :label="getLeaveStatusLabel(props.row.status)" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <template v-if="props.row.status === 'pending'">
              <q-btn flat dense color="positive" :label="$t('leaveRequests.approveBtn')" size="sm"
                @click="openReviewDialog(props.row, 'approve')" />
              <q-btn flat dense color="negative" :label="$t('leaveRequests.rejectBtn')" size="sm"
                @click="openReviewDialog(props.row, 'reject')" />
            </template>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { leaveRequestApi } from 'src/api/leave-request.api';
import { employeeApi } from 'src/api/employee.api';
import ReviewLeaveRequestDialog from 'src/components/leave-requests/ReviewLeaveRequestDialog.vue';
import { useAlert } from 'src/composables/useAlert';
import {
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getLeaveStatusColor,
  countLeaveDays,
  formatDate,
} from 'src/composables/useLeaveRequestLabels';
import type { LeaveRequest, LeaveStatus, LeaveType } from 'src/types/api.types';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const { success, error } = useAlert();

const requests = ref<LeaveRequest[]>([]);
const loading = ref(false);
const filterStatus = ref<LeaveStatus | null>('pending');
const filterLeaveType = ref<LeaveType | null>(null);
const employeeNameMap = ref<Record<string, string>>({});

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  { name: 'employee', label: 'Mã nhân viên', field: 'employee_id', align: 'left' },
  { name: 'employee_name', label: 'Tên nhân viên', field: 'employee_fullname', align: 'left' },
  { name: 'leave_type', label: 'Loại nghỉ', field: 'leave_type', align: 'left' },
  { name: 'dates', label: 'Thời gian', field: 'start_date', align: 'left' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
];

async function loadEmployeeNames(): Promise<void> {
  try {
    const result = await employeeApi.list({ limit: 500, status: 'active' });
    const map: Record<string, string> = {};
    for (const emp of result.data) {
      map[emp.employee_code] = emp.full_name;
    }
    employeeNameMap.value = map;
  } catch {
    // Không chặn trang nếu không load được tên nhân viên
  }
}

async function loadRequests(): Promise<void> {
  loading.value = true;
  try {
    const result = await leaveRequestApi.list({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
      ...(filterLeaveType.value ? { leave_type: filterLeaveType.value } : {}),
    });
    requests.value = result.data;
    pagination.value.rowsNumber = result.total;
  } catch {
    error('Không thể tải danh sách đơn nghỉ phép');
  } finally {
    loading.value = false;
  }
}

function onFilterChange(): void {
  pagination.value.page = 1;
  void loadRequests();
}

function onTableRequest(
  requestProp: Parameters<NonNullable<QTableProps['onRequest']>>[0],
): void {
  pagination.value.page = requestProp.pagination.page;
  pagination.value.rowsPerPage = requestProp.pagination.rowsPerPage;
  void loadRequests();
}

function openReviewDialog(row: LeaveRequest, action: 'approve' | 'reject'): void {
  $q.dialog({
    component: ReviewLeaveRequestDialog,
    componentProps: { leaveRequest: row, action },
  }).onOk(() => {
    success(action === 'approve' ? 'Đã duyệt đơn' : 'Đã từ chối đơn');
    void loadRequests();
  });
}

onMounted(async () => {
  await loadEmployeeNames();
  await loadRequests();
});
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
