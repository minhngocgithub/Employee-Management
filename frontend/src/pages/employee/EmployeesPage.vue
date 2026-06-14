<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">Quản lý Nhân viên</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          Quản lý thông tin và tài khoản nhân viên
        </p>
      </div>

      <div class="col-auto">
        <q-btn color="primary" label="Thêm nhân viên" icon="add" @click="openCreateDialog" :disable="loading" />
      </div>
    </div>

    <!-- Search & Filter -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchText" outlined dense placeholder="Tìm kiếm theo email hoặc tên..." clearable
              @update:model-value="onSearch">
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select v-model="filterStatus" outlined dense options-dense :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options label="Trạng thái" clearable
              @update:model-value="loadEmployees" />
          </div>

          <div class="col-12 col-md-3">
            <q-btn outline color="primary" label="Tải lại" icon="refresh" @click="loadEmployees" :loading="loading"
              class="full-width" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card>
      <q-table :rows="employees" :columns="columns" row-key="_id" flat bordered v-model:pagination="pagination"
        :loading="loading" @request="loadEmployees">
        <template #body-cell-full_name="props">
          <q-td :props="props">
            <strong>{{ props.row.full_name }}</strong>
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="props.row.is_active ? 'green' : 'orange'" :label="props.row.is_active
                ? 'Hoạt động'
                : 'Đã resign'
              " />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" size="sm" color="primary" @click="openEditDialog(props.row)" />

            <q-btn flat dense round icon="more_vert" size="sm" color="grey-8">
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 200px">
                  <q-item clickable v-close-popup @click="toggleActive(props.row)">
                    <q-item-section>
                      {{
                        props.row.is_active
                          ? 'Đánh dấu resign'
                          : 'Mở khóa'
                      }}
                    </q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup @click="resetPassword(props.row)">
                    <q-item-section>
                      Đặt lại mật khẩu
                    </q-item-section>
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

import { accountsApi } from 'src/api/account.api';
import { employeeApi } from 'src/api/employee.api';

import CreateEmployeeDialog from 'src/components/employees/CreateEmployeeDialog.vue';
import EditEmployeeDialog from 'src/components/employees/EditEmployeeDialog.vue';

import { useAlert } from 'src/composables/useAlert';

import type { Employee } from 'src/types/api.types';

const $q = useQuasar();
const { success, error } = useAlert();

const employees = ref<Employee[]>([]);
const loading = ref(false);

const searchText = ref('');

const filterStatus = ref<
  'active' | 'resigned' | 'all' | undefined
>(undefined);

const statusOptions = [
  {
    label: 'Hoạt động',
    value: 'active',
  },
  {
    label: 'Đã resign',
    value: 'resigned',
  },
  {
    label: 'Tất cả',
    value: 'all',
  },
];

const pagination = ref({
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
    field: 'email',
    align: 'left' as const,
  },
  {
    name: 'position',
    label: 'Chức vụ',
    field: 'position',
    align: 'left' as const,
  },
  {
    name: 'is_active',
    label: 'Trạng thái',
    field: 'is_active',
    align: 'center' as const,
  },
  {
    name: 'actions',
    label: 'Thao tác',
    field: 'actions',
    align: 'center' as const,
  },
];

async function loadEmployees(): Promise<void> {
  loading.value = true;

  try {
    const result = await employeeApi.list({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,

      ...(filterStatus.value &&
        filterStatus.value !== 'all'
        ? { status: filterStatus.value }
        : {}),

      ...(searchText.value
        ? { search: searchText.value }
        : {}),
    });

    employees.value = result.data;
    pagination.value.rowsNumber = result.total;
  } catch {
    error('Không thể tải danh sách nhân viên');
  } finally {
    loading.value = false;
  }
}

async function onSearch(): Promise<void> {
  pagination.value.page = 1;
  await loadEmployees();
}

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
    componentProps: {
      employee,
    },
  }).onOk(() => {
    void loadEmployees();
  });
}

function toggleActive(employee: Employee): void {
  $q.dialog({
    title: 'Xác nhận',
    message: employee.is_active
      ? 'Đánh dấu nhân viên này đã resign?'
      : 'Mở khóa nhân viên này?',
    ok: {
      label: 'Đồng ý',
      color: 'primary',
    },
    cancel: {
      label: 'Hủy',
    },
  }).onOk(() => {
    void doToggleActive(employee);
  });
}

async function doToggleActive(
  employee: Employee,
): Promise<void> {
  loading.value = true;

  try {
    await employeeApi.resign(employee._id);

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
    ok: {
      label: 'Đồng ý',
      color: 'primary',
    },
    cancel: {
      label: 'Hủy',
    },
  }).onOk(() => {
    void doResetPassword(employee);
  });
}

async function doResetPassword(
  employee: Employee,
): Promise<void> {
  loading.value = true;

  try {
    const tempPassword = `Temp@${Date.now()
      .toString()
      .slice(-6)}`;

    await accountsApi.resetPassword(
      employee.account_id,
      {
        newPassword: tempPassword,
      },
    );

    success('Đặt lại mật khẩu thành công');
  } catch {
    error('Không thể đặt lại mật khẩu');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadEmployees();
});
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>