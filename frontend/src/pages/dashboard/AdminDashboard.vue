<template>
  <q-page class="q-pa-md page-container">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">Admin Dashboard</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          Overview of your organization's workforce and activities.
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          flat
          dense
          icon="refresh"
          label="Reload"
          @click="loadDashboardData"
          :loading="loading"
        />
      </div>
    </div>

    <!-- 6 Stats Cards Grid -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Total Employees -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card class="stat-card bg-blue-50 border-l-4" style="border-left-color: #2563eb">
          <q-card-section class="q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-caption text-weight-medium text-grey-7">Total Employees</div>
              </div>
              <div class="col-auto">
                <q-icon name="people" size="20px" color="blue-9" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold text-blue-9 q-mb-xs">
              {{ stats?.total_employees || 0 }}
            </div>
            <div class="text-caption text-grey-7">
              {{ stats?.working_employees || 0 }} working
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Departments -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card class="stat-card bg-purple-50 border-l-4" style="border-left-color: #a855f7">
          <q-card-section class="q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-caption text-weight-medium text-grey-7">Departments</div>
              </div>
              <div class="col-auto">
                <q-icon name="domain" size="20px" color="purple-9" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold text-purple-9 q-mb-xs">
              {{ stats?.total_departments || 0 }}
            </div>
            <div class="text-caption text-grey-7">Active units</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Total Requests -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card class="stat-card bg-indigo-50 border-l-4" style="border-left-color: #4f46e5">
          <q-card-section class="q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-caption text-weight-medium text-grey-7">Total Requests</div>
              </div>
              <div class="col-auto">
                <q-icon name="description" size="20px" color="indigo-9" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold text-indigo-9 q-mb-xs">
              {{ (stats?.leave_stats_all_time?.total || 0) }}
            </div>
            <div class="text-caption text-grey-7">All time</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Pending -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card class="stat-card bg-amber-50 border-l-4" style="border-left-color: #f59e0b">
          <q-card-section class="q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-caption text-weight-medium text-grey-7">Pending</div>
              </div>
              <div class="col-auto">
                <q-icon name="schedule" size="20px" color="amber-9" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold text-amber-9 q-mb-xs">
              {{ stats?.leave_stats_this_month?.pending || 0 }}
            </div>
            <div class="text-caption text-grey-7">Awaiting action</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Approved -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card class="stat-card bg-emerald-50 border-l-4" style="border-left-color: #10b981">
          <q-card-section class="q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-caption text-weight-medium text-grey-7">Approved</div>
              </div>
              <div class="col-auto">
                <q-icon name="check_circle" size="20px" color="green-9" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold text-green-9 q-mb-xs">
              {{ stats?.leave_stats_this_month?.approved || 0 }}
            </div>
            <div class="text-caption text-grey-7">Completed</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Rejected -->
      <div class="col-12 col-sm-6 col-md-4 col-lg-2">
        <q-card class="stat-card bg-red-50 border-l-4" style="border-left-color: #ef4444">
          <q-card-section class="q-pa-md">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-caption text-weight-medium text-grey-7">Rejected</div>
              </div>
              <div class="col-auto">
                <q-icon name="cancel" size="20px" color="red-9" />
              </div>
            </div>
            <div class="text-h5 text-weight-bold text-red-9 q-mb-xs">
              {{ stats?.leave_stats_this_month?.rejected || 0 }}
            </div>
            <div class="text-caption text-grey-7">Declined</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <!-- Employee Distribution by Department - Bar Chart -->
      <div class="col-12 col-lg-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Employee Distribution by Department</div>
            <div style="position: relative; height: 300px; width: 100%">
              <Bar :data="departmentChartData" :options="chartOptions.bar" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Request Status - Pie Chart -->
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Request Status</div>
            <div style="position: relative; height: 300px; width: 100%">
              <Pie :data="statusChartData" :options="chartOptions.pie" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Additional Charts -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <!-- Request Types - Horizontal Bar Chart -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Request Types</div>
            <div style="position: relative; height: 250px; width: 100%">
              <Bar :data="requestTypesChartData" :options="chartOptions.barHorizontal" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Leave Stats This Month -->
      <div class="col-12 col-lg-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Leave Stats This Month</div>
            <div style="position: relative; height: 250px; width: 100%">
              <Bar :data="monthlyStatsChartData" :options="chartOptions.bar" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Activities Card -->
    <q-card>
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-h6 q-my-none">Recent Activities</div>
          </div>
          <div class="col-auto">
            <q-icon name="activity" />
          </div>
        </div>
        <q-separator />
      </q-card-section>
      <q-list separator>
        <q-item
          v-for="(activity, index) in recentActivities"
          :key="index"
          class="q-py-md"
        >
          <q-item-section avatar>
            <q-badge :label="activity.action" :color="getActionColor(activity.action)" />
          </q-item-section>
          <q-item-section>
            <q-item-label caption>{{ activity.details }}</q-item-label>
            <q-item-label caption class="text-grey-7">
              {{ formatDate(activity.timestamp) }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="recentActivities.length === 0">
          <q-item-section>
            <q-item-label caption>No recent activities</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAlert } from 'src/composables/useAlert';
import { dashboardApi } from 'src/api';
import type { AdminDashboardStats, ManagerDashboardStats } from 'src/types/api.types';
import { Bar, Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const { error } = useAlert();
const loading = ref(false);
const stats = ref<AdminDashboardStats | null>(null);

// Chart options
const chartOptions = {
  bar: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
  barHorizontal: {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  },
  pie: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  },
};

// Department Distribution Chart Data
const departmentChartData = computed(() => ({
  labels: (stats.value?.headcount_by_department || []).map(d => d.department_name),
  datasets: [
    {
      label: 'Employees',
      data: (stats.value?.headcount_by_department || []).map(d => d.total),
      backgroundColor: '#2563eb',
      borderRadius: 4,
    },
  ],
}));

// Request Status Pie Chart Data
const statusChartData = computed(() => {
  const statuses = [
    {
      name: 'Pending',
      value: stats.value?.leave_stats_this_month?.pending || 0,
      color: '#f59e0b',
    },
    {
      name: 'Approved',
      value: stats.value?.leave_stats_this_month?.approved || 0,
      color: '#10b981',
    },
    {
      name: 'Rejected',
      value: stats.value?.leave_stats_this_month?.rejected || 0,
      color: '#ef4444',
    },
    {
      name: 'Cancelled',
      value: stats.value?.leave_stats_this_month?.cancelled || 0,
      color: '#6b7280',
    },
  ].filter(s => s.value > 0);

  return {
    labels: statuses.map(s => s.name),
    datasets: [
      {
        data: statuses.map(s => s.value),
        backgroundColor: statuses.map(s => s.color),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };
});

// Request Types Chart Data (top 6 types)
const requestTypesChartData = computed(() => {
  const typeMap: Record<string, number> = {};

  // Group requests by type (this would come from API in real scenario)
  const types = [
    'Annual Leave',
    'Sick Leave',
    'Unpaid Leave',
    'Maternity Leave',
    'Work From Home',
    'Other',
  ];

  return {
    labels: types,
    datasets: [
      {
        label: 'Requests',
        data: types.map(() => Math.floor(Math.random() * 20) + 5), // Placeholder
        backgroundColor: '#818cf8',
        borderRadius: 4,
      },
    ],
  };
});

// Monthly Stats Chart Data
const monthlyStatsChartData = computed(() => ({
  labels: ['Total', 'Pending', 'Approved', 'Rejected'],
  datasets: [
    {
      label: 'Requests This Month',
      data: [
        stats.value?.leave_stats_this_month?.total || 0,
        stats.value?.leave_stats_this_month?.pending || 0,
        stats.value?.leave_stats_this_month?.approved || 0,
        stats.value?.leave_stats_this_month?.rejected || 0,
      ],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
      borderRadius: 4,
    },
  ],
}));

// Recent activities - placeholder data
const recentActivities = computed(() => [
  {
    action: 'CREATE',
    details: 'New employee created: John Doe',
    timestamp: new Date().toISOString(),
  },
  {
    action: 'APPROVE',
    details: 'Leave request approved for Jane Smith',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    action: 'UPDATE',
    details: 'Department information updated: Engineering',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
]);

function isAdminStats(
  data: AdminDashboardStats | ManagerDashboardStats,
): data is AdminDashboardStats {
  return 'total_departments' in data;
}

function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    APPROVE: 'green',
    REJECT: 'red',
    LOGIN: 'grey',
    LOGOUT: 'grey',
    CANCEL: 'orange',
    ASSIGN: 'purple',
  };
  return colors[action] || 'grey';
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

async function loadDashboardData(): Promise<void> {
  loading.value = true;
  try {
    const data = await dashboardApi.getStats();
    if (!isAdminStats(data)) {
      error('You do not have permission to view the admin dashboard');
      return;
    }
    stats.value = data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    error(`Failed to load dashboard data: ${message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDashboardData();
});
</script>

<style scoped>
.page-container {
  background-color: #f9fafb;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.bg-purple-50 {
  background-color: #faf5ff;
}

.bg-indigo-50 {
  background-color: #eef2ff;
}

.bg-amber-50 {
  background-color: #fffbeb;
}

.bg-emerald-50 {
  background-color: #f0fdf4;
}

.bg-red-50 {
  background-color: #fef2f2;
}

.text-blue-9 {
  color: #1e40af;
}

.text-purple-9 {
  color: #6b21a8;
}

.text-indigo-9 {
  color: #3730a3;
}

.text-amber-9 {
  color: #92400e;
}

.text-green-9 {
  color: #15803d;
}

.text-red-9 {
  color: #991b1b;
}

q-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 599px) {
  .q-page {
    padding: 12px;
  }
}
</style>
