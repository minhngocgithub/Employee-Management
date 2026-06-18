<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">Đơn nghỉ phép của tôi</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          Tạo và theo dõi đơn xin nghỉ phép
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Tạo đơn"
          icon="add"
          :disable="loading"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="filterStatus"
              outlined
              dense
              :options="LEAVE_STATUS_OPTIONS"
              label="Trạng thái"
              emit-value
              map-options
              clearable
              @update:model-value="onFilterChange"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-btn
              outline
              color="primary"
              label="Tải lại"
              icon="refresh"
              class="full-width"
              :loading="loading"
              @click="loadRequests"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-table
        :rows="requests"
        :columns="columns"
        row-key="_id"
        flat
        bordered
        :loading="loading"
        v-model:pagination="pagination"
        @request="onTableRequest"
      >
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
            <q-badge
              :color="getLeaveStatusColor(props.row.status)"
              :label="getLeaveStatusLabel(props.row.status)"
            />
          </q-td>
        </template>

        <template #body-cell-rejection_reason="props">
          <q-td :props="props">
            {{ props.row.rejection_reason || '—' }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <template v-if="props.row.status === 'pending'">
              <q-btn
                flat
                dense
                round
                icon="edit"
                size="sm"
                color="primary"
                @click="openEditDialog(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="cancel"
                size="sm"
                color="orange"
                @click="confirmCancel(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                size="sm"
                color="negative"
                @click="confirmDelete(props.row)"
              />
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
import axios from 'axios';
import { useQuasar } from 'quasar';
import { leaveRequestApi } from 'src/api/leave-request.api';
import CreateLeaveRequestDialog from 'src/components/leave-requests/CreateLeaveRequestDialog.vue';
import EditLeaveRequestDialog from 'src/components/leave-requests/EditLeaveRequestDialog.vue';
import { useAlert } from 'src/composables/useAlert';
import {
  LEAVE_STATUS_OPTIONS,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getLeaveStatusColor,
  countLeaveDays,
  formatDate,
} from 'src/composables/useLeaveRequestLabels';
import type { LeaveRequest, LeaveStatus } from 'src/types/api.types';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const { success, error } = useAlert();

const requests = ref<LeaveRequest[]>([]);
const loading = ref(false);
const filterStatus = ref<LeaveStatus | null>(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableProps['columns'] = [
  { name: 'leave_type', label: 'Loại nghỉ', field: 'leave_type', align: 'left' },
  { name: 'dates', label: 'Thời gian', field: 'start_date', align: 'left' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  {
    name: 'rejection_reason',
    label: 'Lý do từ chối',
    field: 'rejection_reason',
    align: 'left',
  },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
];

async function loadRequests(): Promise<void> {
  loading.value = true;
  try {
    const result = await leaveRequestApi.list({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      ...(filterStatus.value ? { status: filterStatus.value } : {}),
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

function openCreateDialog(): void {
  $q.dialog({ component: CreateLeaveRequestDialog }).onOk(() => {
    success('Gửi đơn nghỉ phép thành công');
    void loadRequests();
  });
}

function openEditDialog(row: LeaveRequest): void {
  $q.dialog({
    component: EditLeaveRequestDialog,
    componentProps: { leaveRequest: row },
  }).onOk(() => {
    success('Cập nhật đơn thành công');
    void loadRequests();
  });
}

function confirmCancel(row: LeaveRequest): void {
  $q.dialog({
    title: 'Hủy đơn',
    message: 'Bạn có chắc muốn hủy đơn nghỉ phép này?',
    cancel: { label: 'Không', flat: true },
    ok: { label: 'Hủy đơn', color: 'orange' },
  }).onOk(() => { void doCancel(row); });
}

async function doCancel(row: LeaveRequest): Promise<void> {
  loading.value = true;
  try {
    await leaveRequestApi.cancel(row._id);
    success('Đã hủy đơn nghỉ phép');
    await loadRequests();
  } catch (err: unknown) {
    let message = 'Không thể hủy đơn';
    if (axios.isAxiosError(err)) {
      message = (err.response?.data as { message?: string })?.message ?? message;
    }
    error(message);
  } finally {
    loading.value = false;
  }
}

function confirmDelete(row: LeaveRequest): void {
  $q.dialog({
    title: 'Xóa đơn',
    message: 'Bạn có chắc muốn xóa đơn nghỉ phép này?',
    cancel: { label: 'Không', flat: true },
    ok: { label: 'Xóa', color: 'negative' },
  }).onOk(() => { void doDelete(row); });
}

async function doDelete(row: LeaveRequest): Promise<void> {
  loading.value = true;
  try {
    await leaveRequestApi.delete(row._id);
    success('Đã xóa đơn nghỉ phép');
    await loadRequests();
  } catch (err: unknown) {
    let message = 'Không thể xóa đơn';
    if (axios.isAxiosError(err)) {
      message = (err.response?.data as { message?: string })?.message ?? message;
    }
    error(message);
  } finally {
    loading.value = false;
  }
}

onMounted(loadRequests);
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
