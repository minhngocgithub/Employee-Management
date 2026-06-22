<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">{{ $t('dashboard.managerDashboard') }}</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          {{ $t('dashboard.managerDashboardSubtitle') }}
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          flat
          dense
          icon="refresh"
          :label="$t('common.reload')"
          :loading="loading"
          @click="loadDashboardData"
        />
      </div>
    </div>

    <!-- Acting Manager Panel -->
    <ActingManagerLeavePanel />

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-4 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-blue-1">
            <div class="text-subtitle2 text-blue-9">{{ $t('dashboard.totalEmployees') }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-blue-9">{{ stats?.total_employees ?? 0 }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-green-1">
            <div class="text-subtitle2 text-green-9">{{ $t('dashboard.working') }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-green-9">{{ stats?.working_employees ?? 0 }}</div>
            <q-linear-progress
              :value="(stats?.working_employees ?? 0) / (stats?.total_employees || 1)"
              color="green"
              class="q-mt-md"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-red-1">
            <div class="text-subtitle2 text-red-9">{{ $t('dashboard.awaitingAction') }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-red-9">{{ stats?.pending_reviews ?? 0 }}</div>
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              :label="$t('leaveRequests.approve')"
              class="q-mt-sm"
              :to="{ name: 'leave-requests' }"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-6">
        <q-card class="hover-lift animate-fade-in">
          <q-card-section class="bg-teal-1">
            <div class="text-subtitle2 text-teal-9">Nghỉ phép tháng này</div>
          </q-card-section>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="text-caption text-grey-7">Tổng đơn</div>
                <div class="text-h6">{{ stats?.leave_stats_this_month?.total ?? 0 }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Đã duyệt</div>
                <div class="text-h6 text-green-9">
                  {{ stats?.leave_stats_this_month?.approved ?? 0 }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Chờ duyệt</div>
                <div class="text-h6 text-orange-9">
                  {{ stats?.leave_stats_this_month?.pending ?? 0 }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Từ chối</div>
                <div class="text-h6 text-red-9">
                  {{ stats?.leave_stats_this_month?.rejected ?? 0 }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-6">
        <q-card class="hover-lift animate-fade-in">
          <q-card-section>
            <div class="text-h6 q-mb-md">Thao tác nhanh</div>
            <div class="column q-gutter-md">
              <q-btn
                outline
                color="primary"
                label="Xem nhân viên phòng ban"
                icon="people"
                :to="{ name: 'employees' }"
              />
              <q-btn
                outline
                color="primary"
                label="Duyệt đơn nghỉ phép"
                icon="event_note"
                :to="{ name: 'leave-requests' }"
              />
              <q-btn
                outline
                color="primary"
                label="Xem phòng ban"
                icon="domain"
                :to="{ name: 'departments' }"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAlert } from 'src/composables/useAlert';
import { dashboardApi } from 'src/api';
import ActingManagerLeavePanel from 'src/components/dashboards/ActingManagerLeavePanel.vue';
import type { AdminDashboardStats, ManagerDashboardStats } from 'src/types/api.types';

const { error } = useAlert();
const loading = ref(false);
const stats = ref<ManagerDashboardStats | null>(null);

function isManagerStats(
  data: AdminDashboardStats | ManagerDashboardStats,
): data is ManagerDashboardStats {
  return 'pending_reviews' in data;
}

async function loadDashboardData(): Promise<void> {
  loading.value = true;
  try {
    const data = await dashboardApi.getStats();
    if (!isManagerStats(data)) {
      error('Không có quyền xem dashboard manager');
      return;
    }
    stats.value = data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    error(`Không thể tải dữ liệu dashboard: ${message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDashboardData();
});
</script>

<style scoped>
.h-full {
  height: 100%;
}

.q-card {
  border-radius: 8px;
}
</style>
