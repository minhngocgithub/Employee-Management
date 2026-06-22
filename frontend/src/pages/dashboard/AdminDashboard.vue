<template>
  <q-page class="q-pa-md page-container">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">Admin Dashboard</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          Quản lý toàn hệ thống Employee Management System
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          flat
          dense
          icon="refresh"
          label="Tải lại"
          @click="loadDashboardData"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Total Employees -->
      <div class="col-12 col-sm-6 col-md-3 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-blue-1">
            <div class="text-subtitle2 text-blue-9">Tổng nhân viên</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-blue-9 q-my-md">
              {{ stats?.total_employees || 0 }}
            </div>
            <!-- FIX: active_employees → working_employees -->
            <q-linear-progress
              :value="(stats?.working_employees || 0) / (stats?.total_employees || 1)"
              color="green"
              class="q-mt-md"
            />
            <div class="text-caption text-grey-7 q-mt-sm">
              {{ stats?.working_employees || 0 }} đang làm việc
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Working Employees (FIX: active → working) -->
      <div class="col-12 col-sm-6 col-md-3 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-green-1">
            <div class="text-subtitle2 text-green-9">Nhân viên đang làm việc</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-green-9 q-my-md">
              {{ stats?.working_employees || 0 }}
            </div>
            <div class="text-caption text-grey-7 q-mt-md">
              {{ (((stats?.working_employees || 0) / (stats?.total_employees || 1)) * 100).toFixed(1) }}%
              tổng số
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Resigned Employees -->
      <div class="col-12 col-sm-6 col-md-3 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-orange-1">
            <div class="text-subtitle2 text-orange-9">Nhân viên đã nghỉ</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-orange-9 q-my-md">
              {{ stats?.resigned_employees || 0 }}
            </div>
            <div class="text-caption text-grey-7 q-mt-md">
              {{ (((stats?.resigned_employees || 0) / (stats?.total_employees || 1)) * 100).toFixed(1) }}%
              tổng số
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Total Departments -->
      <div class="col-12 col-sm-6 col-md-3 animate-slide-in-up">
        <q-card class="hover-lift h-full">
          <q-card-section class="bg-purple-1">
            <div class="text-subtitle2 text-purple-9">Tổng phòng ban</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-purple-9 q-my-md">
              {{ stats?.total_departments || 0 }}
            </div>
            <div class="text-caption text-grey-7 q-mt-md">
              Phòng ban trong hệ thống
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Leave Requests Info -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6">
        <q-card class="hover-lift">
          <q-card-section class="bg-red-1">
            <div class="text-subtitle2 text-red-9">Đơn xin nghỉ phép đang chờ</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-red-9 q-my-md">
              {{ stats?.leave_stats_this_month?.pending || 0 }}
            </div>
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              label="Xem tất cả đơn"
              :to="{ name: 'leave-requests' }"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="hover-lift">
          <q-card-section class="bg-teal-1">
            <div class="text-subtitle2 text-teal-9">Đơn xin nghỉ tháng này</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h4 text-teal-9 q-my-md">
              {{ stats?.leave_stats_this_month?.approved || 0 }}
            </div>
            <div class="text-caption text-grey-7 q-mt-md">
              Số đơn được duyệt trong tháng
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Main Content Tabs -->
    <q-card>
      <q-tabs
        v-model="selectedTab"
        dense
        class="text-grey-8"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="overview" label="Tổng quan" icon="dashboard" />
        <q-tab name="employees" label="Nhân viên" icon="people" />
        <q-tab name="departments" label="Phòng ban" icon="domain" />
        <q-tab name="leave-requests" label="Đơn xin nghỉ phép" icon="event_note" />
      </q-tabs>

      <q-tab-panels v-model="selectedTab" animated>
        <!-- Overview Tab -->
        <q-tab-panel name="overview" class="q-pa-lg">
          <div class="row q-col-gutter-lg">
            <!-- Department Distribution Chart -->
            <div class="col-12 col-lg-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-md">Phân bố nhân viên theo phòng ban</div>
                  <div class="q-mt-md">
                    <div
                      v-for="dept in stats?.headcount_by_department"
                      :key="dept.department_id"
                      class="q-mb-md"
                    >
                      <div class="row items-center q-mb-xs">
                        <div class="col">
                          <span class="text-subtitle2">{{ dept.department_name }}</span>
                        </div>
                        <div class="col-auto">
                          <span class="text-bold">{{ dept.total }}</span>
                          <!-- FIX: dept.active → dept.working -->
                          <span class="text-caption text-grey-7 q-ml-xs">
                            ({{ dept.working }} đang làm việc)
                          </span>
                        </div>
                      </div>
                      <q-linear-progress
                        :value="dept.total / (stats?.total_employees || 1)"
                        color="primary"
                        size="12px"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Quick Actions -->
            <div class="col-12 col-lg-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6 q-mb-md">Thao tác nhanh</div>
                  <div class="column q-gutter-md">
                    <q-btn
                      outline
                      color="primary"
                      label="Tạo nhân viên mới"
                      icon="add_circle"
                      :to="{ name: 'employees' }"
                    />
                    <q-btn
                      outline
                      color="primary"
                      label="Tạo phòng ban mới"
                      icon="add_circle"
                      :to="{ name: 'departments' }"
                    />
                    <q-btn
                      outline
                      color="primary"
                      label="Duyệt đơn xin nghỉ phép"
                      icon="check_circle"
                      :to="{ name: 'leave-requests' }"
                    />
                    <q-btn
                      outline
                      color="primary"
                      label="Xem nhật ký hoạt động"
                      icon="history"
                      :to="{ name: 'audit-logs' }"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Leave stats tháng này -->
          <q-card class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Thống kê nghỉ phép tháng này</div>
              <div class="row q-col-gutter-md">
                <div class="col-6 col-sm-3">
                  <div class="text-caption text-grey-7">Tổng đơn</div>
                  <div class="text-h6">{{ stats?.leave_stats_this_month?.total ?? 0 }}</div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="text-caption text-grey-7">Chờ duyệt</div>
                  <div class="text-h6 text-orange-9">
                    {{ stats?.leave_stats_this_month?.pending ?? 0 }}
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="text-caption text-grey-7">Đã duyệt</div>
                  <div class="text-h6 text-green-9">
                    {{ stats?.leave_stats_this_month?.approved ?? 0 }}
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="text-caption text-grey-7">Từ chối</div>
                  <div class="text-h6 text-red-9">
                    {{ stats?.leave_stats_this_month?.rejected ?? 0 }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- Employees Tab -->
        <q-tab-panel name="employees" class="q-pa-lg">
          <div class="row items-center q-mb-md">
            <div class="col">
              <h6 class="q-my-none">Quản lý nhân viên</h6>
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                label="Thêm nhân viên"
                icon="add"
                size="sm"
                :to="{ name: 'employees' }"
              />
            </div>
          </div>
          <p class="text-grey-7 text-caption">
            Quản lý thông tin nhân viên, cập nhật hồ sơ, khóa/mở khóa tài khoản
          </p>
          <q-btn
            flat
            dense
            color="primary"
            label="Đi tới trang quản lý nhân viên"
            icon="arrow_forward"
            :to="{ name: 'employees' }"
          />
        </q-tab-panel>

        <!-- Departments Tab -->
        <q-tab-panel name="departments" class="q-pa-lg">
          <div class="row items-center q-mb-md">
            <div class="col">
              <h6 class="q-my-none">Quản lý phòng ban</h6>
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                label="Thêm phòng ban"
                icon="add"
                size="sm"
                :to="{ name: 'departments' }"
              />
            </div>
          </div>
          <p class="text-grey-7 text-caption">
            Quản lý cấu trúc phòng ban, gán manager, xem cây tổ chức
          </p>
          <q-btn
            flat
            dense
            color="primary"
            label="Đi tới trang quản lý phòng ban"
            icon="arrow_forward"
            :to="{ name: 'departments' }"
          />
        </q-tab-panel>

        <!-- Leave Requests Tab -->
        <q-tab-panel name="leave-requests" class="q-pa-lg">
          <div class="row items-center q-mb-md">
            <div class="col">
              <h6 class="q-my-none">Quản lý đơn xin nghỉ phép</h6>
            </div>
          </div>
          <p class="text-grey-7 text-caption">
            Duyệt hoặc từ chối đơn xin nghỉ phép, xem lịch sử
          </p>
          <q-btn
            flat
            dense
            color="primary"
            label="Đi tới trang quản lý đơn xin nghỉ phép"
            icon="arrow_forward"
            :to="{ name: 'leave-requests' }"
          />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAlert } from 'src/composables/useAlert';
import { dashboardApi } from 'src/api';
import type { AdminDashboardStats, ManagerDashboardStats } from 'src/types/api.types';

const { error } = useAlert();
const loading = ref(false);
const selectedTab = ref('overview');
const stats = ref<AdminDashboardStats | null>(null);

function isAdminStats(
  data: AdminDashboardStats | ManagerDashboardStats,
): data is AdminDashboardStats {
  return 'total_departments' in data;
}

async function loadDashboardData(): Promise<void> {
  loading.value = true;
  try {
    const data = await dashboardApi.getStats();
    if (!isAdminStats(data)) {
      error('Không có quyền xem dashboard admin');
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

@media (max-width: 599px) {
  .q-page {
    padding: 12px;
  }
}
</style>