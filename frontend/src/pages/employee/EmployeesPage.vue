<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">{{ $t('employees.title') }}</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          {{ $t('employees.subtitle') }}
        </p>
      </div>

      <div v-if="canCreateEmployee" class="col-auto">
        <q-btn color="primary" :label="$t('employees.addNew')" icon="add" @click="openCreateDialog" :disable="loading" />
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="page-header">
      <q-card class="q-mb-lg page-filter">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="searchText" outlined dense :placeholder="$t('employees.search')" clearable>
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-3">
              <q-select 
                v-model="filterStatus" 
                outlined 
                dense 
                options-dense 
                :options="EMPLOYEE_STATUS_OPTIONS"
                option-label="label" 
                option-value="value" 
                emit-value 
                map-options 
                :label="$t('common.status')" 
                clearable
                @update:model-value="onFilterChange" 
              />
            </div>

            <div class="col-12 col-md-3">
              <q-btn outline color="primary" :label="$t('common.reload')" icon="refresh" @click="loadEmployees" :loading="loading"
                class="full-width" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Table -->
    <q-card class="table-container">
      <q-table class="employee-table" :rows="employees" :columns="columns" row-key="_id" flat bordered
        v-model:pagination="pagination" :loading="loading" @request="onTableRequest">
        <template #body-cell-full_name="props">
          <q-td :props="props">
            <strong>{{ props.row.full_name }}</strong>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="statusColor(props.row.status)"
              :label="statusLabel(props.row.status)"
            />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" size="sm" color="primary" @click="openEditDialog(props.row)" />

            <q-btn flat dense round icon="more_vert" size="sm" color="grey-8">
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 200px">
                  <!--
                    FIX: status là EmployeeStatus ('working'|'retired'|'resigned'|null),
                    không phải 'active'. Chỉ cho toggle khi đang 'working'.
                  -->
                  <q-item
                    v-if="props.row.status === 'working'"
                    clickable v-close-popup
                    @click="toggleActive(props.row)"
                  >
                    <q-item-section>{{ $t('employees.markResigned') }}</q-item-section>
                  </q-item>

                  <!-- Delegation option — chỉ manager của phòng ban này -->
                  <q-item
                    v-if="canDelegate(props.row)"
                    clickable v-close-popup
                    @click="openDelegationDialog(props.row)"
                  >
                    <q-item-section>{{ $t('employees.delegate') }}</q-item-section>
                  </q-item>

                  <!-- Revoke delegation — chỉ khi nhân viên này đang là acting manager -->
                  <q-item
                    v-if="isEmployeeActingManager(props.row)"
                    clickable v-close-popup
                    @click="revokeActingManager(props.row)"
                    class="text-orange"
                  >
                    <q-item-section>Gỡ Ủy Quyền</q-item-section>
                  </q-item>

                  <!-- Reset password — admin only -->
                  <q-item
                    v-if="authStore.role === 'admin'"
                    clickable v-close-popup
                    @click="resetPassword(props.row)"
                  >
                    <q-item-section>Đặt lại mật khẩu</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useQuasar } from 'quasar';

import { useAuthStore } from 'src/stores/auth.store';
import { accountsApi } from 'src/api/account.api';
import { employeeApi } from 'src/api/employee.api';
import { departmentApi } from 'src/api/department.api';

import CreateEmployeeDialog from 'src/components/employees/CreateEmployeeDialog.vue';
import EditEmployeeDialog from 'src/components/employees/EditEmployeeDialog.vue';
import DelegationDialog from 'src/components/employees/DelegationDialog.vue';

import { useAlert } from 'src/composables/useAlert';
import { 
  EMPLOYEE_STATUS_OPTIONS,
  getEmployeeStatusLabel,
  getEmployeeStatusColor,
} from 'src/composables/useEmployeeLabels';

import type { Employee, EmployeeStatus, Department } from 'src/types/api.types';
import { useDebounceFn } from '@vueuse/core';

const $q = useQuasar();
const authStore = useAuthStore();
const { success, error } = useAlert();

const employees = ref<Employee[]>([]);
const loading = ref(false);

// Department hiện tại — dùng để check acting_manager_id
const currentDepartment = ref<Department | null>(null);

const searchText = ref('');

// FIX: 'canCreateDepartment' đổi tên cho đúng nghĩa
const canCreateEmployee = computed(() => authStore.role !== 'manager');

const filterStatus = ref<EmployeeStatus | 'all' | undefined>(undefined);

const pagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = [
  {
    name: 'full_name',
    label: 'Họ tên',
    field: 'full_name',
    align: 'left' as const,
  },
  {
    name: 'email',
    label: 'Email',
    field: (row: Employee) =>
      typeof row.account_id === 'object' ? row.account_id.email : '—',
    align: 'left' as const,
  },
  {
    name: 'position',
    label: 'Chức vụ',
    field: 'position',
    align: 'left' as const,
  },
  {
    name: 'status',
    label: 'Trạng thái',
    field: 'status',
    align: 'center' as const,
  },
  {
    name: 'actions',
    label: 'Thao tác',
    field: 'actions',
    align: 'center' as const,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: EmployeeStatus): string {
  return getEmployeeStatusColor(status);
}

function statusLabel(status: EmployeeStatus): string {
  return getEmployeeStatusLabel(status);
  }
}

/**
 * FIX: implement đúng — so sánh employee._id với acting_manager_id của phòng ban.
 * Cần department data để biết ai đang là acting manager.
 */
function isEmployeeActingManager(employee: Employee): boolean {
  if (!currentDepartment.value?.acting_manager_id) return false;
  const accountId =
    typeof employee.account_id === 'object'
      ? employee.account_id._id
      : employee.account_id;
  // acting_manager_id trỏ vào Account._id
  return currentDepartment.value.acting_manager_id === accountId;
}

/**
 * Manager chỉ ủy quyền khi đang xem nhân viên cùng phòng ban.
 * employee và không phải chính mình.
 */
function canDelegate(employee: Employee): boolean {
  if (authStore.role !== 'manager') return false;
  const accountId =
    typeof employee.account_id === 'object'
      ? employee.account_id._id
      : employee.account_id;
  // Không ủy quyền cho chính mình
  return accountId !== authStore.user?.id;
}

// ─── Data loading ──────────────────────────────────────────────────────────────

async function loadEmployees(): Promise<void> {
  loading.value = true;

  try {
    const result = await employeeApi.list({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,

      ...(filterStatus.value && filterStatus.value !== 'all'
        ? { status: filterStatus.value }
        : {}),

      ...(searchText.value ? { search: searchText.value } : {}),
    });

    employees.value = result.data;
    pagination.value.rowsNumber = result.total;
  } finally {
    loading.value = false;
  }
}

/** Load department để biết acting_manager_id */
async function loadCurrentDepartment(): Promise<void> {
  const deptId = authStore.user?.department_id;
  if (!deptId) return;
  try {
    currentDepartment.value = await departmentApi.getById(deptId);
  } catch {
    // non-critical — chỉ ảnh hưởng tới nút "Gỡ ủy quyền"
  }
}

function onTableRequest(props: {
  pagination: { page: number; rowsPerPage: number };
}): void {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  void loadEmployees();
}

const debouncedSearch = useDebounceFn(async () => {
  await loadEmployees();
}, 500);

watch(searchText, () => {
  void debouncedSearch();
});

async function onFilterChange(): Promise<void> {
  pagination.value.page = 1;
  await loadEmployees();
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function openCreateDialog(): void {
  $q.dialog({
    component: CreateEmployeeDialog,
  }).onOk(() => {
    void loadEmployees();
  });
}

function openEditDialog(employee: Employee): void {
  $q.dialog({
    component: EditEmployeeDialog,
    componentProps: { employee },
  }).onOk(() => {
    void loadEmployees();
  });
}

function toggleActive(employee: Employee): void {
  $q.dialog({
    title: 'Xác nhận',
    message: `Đánh dấu ${employee.full_name} đã nghỉ việc?`,
    ok: { label: 'Đồng ý', color: 'primary' },
    cancel: { label: 'Hủy' },
  }).onOk(() => {
    void doToggleActive(employee);
  });
}

async function doToggleActive(employee: Employee): Promise<void> {
  loading.value = true;
  try {
    await employeeApi.toggleStatus(employee._id);
    success('Cập nhật trạng thái thành công');
    await loadEmployees();
  } catch {
    error('Không thể cập nhật trạng thái');
  } finally {
    loading.value = false;
  }
}

function resetPassword(employee: Employee): void {
  $q.dialog({
    title: 'Đặt lại mật khẩu',
    message: `Đặt lại mật khẩu cho ${employee.full_name}?`,
    ok: { label: 'Đồng ý', color: 'primary' },
    cancel: { label: 'Hủy' },
  }).onOk(() => {
    void doResetPassword(employee);
  });
}

async function doResetPassword(employee: Employee): Promise<void> {
  loading.value = true;
  try {
    const tempPassword = `Temp@${Date.now().toString().slice(-6)}`;
    const accountId =
      typeof employee.account_id === 'object'
        ? employee.account_id._id
        : employee.account_id;
    await accountsApi.resetPassword(accountId, { newPassword: tempPassword });
    success('Đặt lại mật khẩu thành công');
  } catch {
    error('Không thể đặt lại mật khẩu');
  } finally {
    loading.value = false;
  }
}

function openDelegationDialog(employee: Employee): void {
  $q.dialog({
    component: DelegationDialog,
    componentProps: {
      employee,
      departmentId: authStore.user?.department_id,
    },
  }).onOk(() => {
    success('Ủy quyền thành công');
    // Reload cả department để cập nhật acting_manager_id
    void loadCurrentDepartment();
    void loadEmployees();
  });
}

function revokeActingManager(employee: Employee): void {
  $q.dialog({
    title: 'Xác nhận',
    message: `Gỡ ủy quyền cho ${employee.full_name}?`,
    ok: { label: 'Đồng ý', color: 'primary' },
    cancel: { label: 'Hủy' },
  }).onOk(() => {
    void doRevokeActingManager();
  });
}

async function doRevokeActingManager(): Promise<void> {
  loading.value = true;
  try {
    await departmentApi.revokeActingManager(authStore.user?.department_id || '');
    success('Gỡ ủy quyền thành công');
    await loadCurrentDepartment();
    await loadEmployees();
  } catch {
    error('Không thể gỡ ủy quyền');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadEmployees();
  void loadCurrentDepartment();
});
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.page-header,
.page-filter {
  flex-shrink: 0;
}

.table-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.employee-table {
  height: 100%;
}
</style>
