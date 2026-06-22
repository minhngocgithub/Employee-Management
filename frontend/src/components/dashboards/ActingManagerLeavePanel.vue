<template>
  <div v-if="isActingValid" class="acting-manager-panel">
    <q-card class="bg-amber-1 border-l-4 border-amber-5">
      <q-card-section class="row items-center q-pb-none q-pt-md">
        <div>
          <q-icon name="security_agent" color="amber-9" size="lg" />
        </div>
        <div class="q-ml-md flex-1">
          <div class="text-subtitle1 text-weight-bold text-amber-9">
            Bạn đang là Quản Lý Tạm Thời
          </div>
          <div class="text-caption text-amber-7">
            <span v-if="actingUntilDate">
              Hết hạn vào {{ formatDate(actingUntilDate) }}
            </span>
            <span v-else>Không xác định hết hạn</span>
          </div>
        </div>
        <q-btn
          flat
          dense
          icon="close"
          color="amber-9"
          @click="handleRevoke"
          :loading="revoking"
        />
      </q-card-section>

      <q-separator class="bg-amber-3" />

      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-amber-7">Đơn chờ duyệt</div>
            <div class="text-h5 text-amber-9">{{ pendingCount }}</div>
          </div>
          <div class="col-12 col-sm-6">
            <q-btn
              outline
              color="amber-9"
              label="Duyệt Đơn Nghỉ"
              icon="event_note"
              class="full-width"
              :to="{ name: 'leave-requests' }"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Recent Leave Requests Preview -->
      <q-separator v-if="recentRequests.length > 0" class="bg-amber-3" />

      <q-card-section v-if="recentRequests.length > 0">
        <div class="text-subtitle2 q-mb-md">Đơn Gần Đây</div>
        <q-list separator>
          <q-item
            v-for="request in recentRequests.slice(0, 3)"
            :key="request._id"
            clickable
            v-ripple
            :to="{ name: 'leave-requests' }"
          >
            <q-item-section avatar>
              <q-avatar
                :color="getStatusColor(request.status)"
                text-color="white"
              >
                {{ getStatusIcon(request.status) }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ getEmployeeName(request) }}</q-item-label>
              <!--
                FIX: LeaveRequest.start_date / end_date là metadata động ([key: string]: unknown).
                Truy cập an toàn qua helper, fallback về createdAt nếu không có.
              -->
              <q-item-label caption>
                {{ formatRequestDateRange(request) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="getStatusColor(request.status)">
                {{ getStatusLabel(request.status) }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator class="bg-amber-3" />

      <q-card-actions>
        <q-btn
          flat
          label="Xem Tất Cả"
          color="amber-9"
          class="full-width"
          :to="{ name: 'leave-requests' }"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth.store';
import { leaveRequestApi } from 'src/api/leave-request.api';
import { useAlert } from 'src/composables/useAlert';
import { departmentApi } from 'src/api/department.api';
import type { LeaveRequest } from 'src/types/api.types';

const authStore = useAuthStore();
const { error, success } = useAlert();

const pendingCount = ref(0);
const recentRequests = ref<LeaveRequest[]>([]);
const revoking = ref(false);

const actingUntilDate = computed(() => authStore.actingUntilDate);
const isActingValid = computed(() => authStore.isActingManagerValid);

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * FIX: start_date / end_date là metadata động trên LeaveRequest ([key]: unknown).
 * Không phải tất cả loại đơn đều có date range (OVERTIME dùng overtime_dates,
 * RESIGNATION dùng submission_date...).
 * → Truy cập có guard, fallback về ngày tạo đơn.
 */
function formatRequestDateRange(request: LeaveRequest): string {
  const startRaw = request['start_date'] ?? request['departure_date'] ?? request['incident_date'];
  const endRaw   = request['end_date']   ?? request['return_date']    ?? null;

  if (typeof startRaw === 'string') {
    const start = new Date(startRaw).toLocaleDateString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
    });
    if (typeof endRaw === 'string') {
      const end = new Date(endRaw).toLocaleDateString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
      });
      return `${start} - ${end}`;
    }
    return start;
  }

  // Fallback: hiển thị ngày tạo đơn
  return new Date(request.createdAt).toLocaleDateString('vi-VN', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function getEmployeeName(request: LeaveRequest): string {
  const empId = request.employee_id as { full_name: string } | string;
  if (typeof empId === 'object' && empId !== null) {
    return empId.full_name;
  }
  return 'Nhân viên';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:   'orange',
    approved:  'green',
    rejected:  'red',
    cancelled: 'grey',
  };
  return colors[status] ?? 'blue';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending:   '⏳',
    approved:  '✓',
    rejected:  '✕',
    cancelled: '○',
  };
  return icons[status] ?? '?';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:   'Chờ',
    approved:  'Duyệt',
    rejected:  'Từ chối',
    cancelled: 'Huỷ',
  };
  return labels[status] ?? status;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function loadLeaveRequests(): Promise<void> {
  try {
    const result = await leaveRequestApi.list({
      status: 'pending',
      limit: 10,
    });

    recentRequests.value = result.data;
    // FIX: pendingCount nên dùng result.total thay vì filter lại data
    // vì data chỉ là trang đầu, total mới là con số thực
    pendingCount.value = result.total;
  } catch (err: unknown) {
    console.error('[ActingManagerLeavePanel] Failed to load leave requests:', err);
  }
}

async function handleRevoke(): Promise<void> {
  if (!authStore.user?.department_id) return;

  revoking.value = true;
  try {
    await departmentApi.revokeActingManager(authStore.user.department_id);
    success('Đã gỡ ủy quyền');
    await authStore.refreshTokens();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    error(`Gỡ ủy quyền thất bại: ${message}`);
  } finally {
    revoking.value = false;
  }
}

onMounted(() => {
  void loadLeaveRequests();
});
</script>

<style scoped>
.acting-manager-panel {
  margin-bottom: 1.5rem;
}

.bg-amber-1 {
  background-color: #fffbf0;
}

.bg-amber-3 {
  background-color: #ffe4b5;
}

.border-l-4 {
  border-left: 4px solid;
}

.border-amber-5 {
  border-color: #ffd54f;
}

.text-amber-7 {
  color: #ffb300;
}

.text-amber-9 {
  color: #ff8f00;
}

.full-width {
  width: 100%;
}
</style>