<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">Quản lý Phòng ban</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          Quản lý cấu trúc tổ chức và các phòng ban
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Thêm phòng ban"
          icon="add"
          @click="openCreateDialog"
          :disable="loading"
        />
      </div>
    </div>

    <!-- Search -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchText"
              outlined
              dense
              placeholder="Tìm kiếm phòng ban..."
              clearable
              @update:model-value="onSearch"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-btn
              outline
              color="primary"
              label="Tải lại"
              icon="refresh"
              @click="loadDepartments"
              :loading="loading"
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card :loading="loading">
      <q-table
        :rows="departments"
        :columns="columns"
        row-key="_id"
        flat
        bordered
        v-model:pagination="pagination"
        @request="loadDepartments"
      >
        <template #body-cell-name="props">
          <q-td :props="props">
            <strong>{{ props.row.name }}</strong>
          </q-td>
        </template>

        <template #body-cell-manager="props">
          <q-td :props="props">
            {{ props.row.manager_id ? 'Có' : 'Chưa gán' }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
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
              icon="more_vert"
              size="sm"
              color="grey-8"
            >
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 200px">
                  <q-item clickable v-close-popup @click="assignManager(props.row)">
                    <q-item-section>Gán manager</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="viewEmployees(props.row)">
                    <q-item-section>Xem nhân viên</q-item-section>
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
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { departmentApi } from 'src/api';
import { useAlert } from 'src/composables/useAlert';
import type { Department } from 'src/types/api.types';
import CreateDepartmentDialog from 'src/components/CreateDepartmentDialog.vue';

const $q = useQuasar();
const { success, error } = useAlert();

const allDepartments = ref<Department[]>([]);
const loading = ref(false);
const searchText = ref('');

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const departments = computed(() => {
  if (!searchText.value) return allDepartments.value;
  const q = searchText.value.toLowerCase();
  return allDepartments.value.filter((d) =>
    d.name.toLowerCase().includes(q) ||
    d.code.toLowerCase().includes(q),
  );
});

const columns = [
  { name: 'name',    label: 'Tên phòng ban', field: 'name',       align: 'left'   as const },
  { name: 'code',    label: 'Mã',            field: 'code',       align: 'left'   as const },
  { name: 'level',   label: 'Cấp',           field: 'level',      align: 'center' as const },
  { name: 'manager', label: 'Manager',       field: 'manager_id', align: 'center' as const },
  { name: 'actions', label: 'Thao tác',      field: 'actions',    align: 'center' as const },
];

async function loadDepartments(): Promise<void> {
  loading.value = true;
  try {
    const result = await departmentApi.list();
    allDepartments.value = result;
    pagination.value.rowsNumber = result.length;
  } catch {
    error('Không thể tải danh sách phòng ban');
  } finally {
    loading.value = false;
  }
}

// ✅ Fix require-await: bỏ async vì search dùng computed, không cần await
function onSearch(): void {
  pagination.value.page = 1;
}

function openCreateDialog(): void {
  $q.dialog({ component: CreateDepartmentDialog })
    .onOk(() => { void loadDepartments(); });
}

function openEditDialog(dept: Department): void {
  $q.dialog({
    title: `Chỉnh sửa: ${dept.name}`,
    message: 'Chức năng này sẽ được triển khai',
    ok: { label: 'Đóng' },
  });
}

function assignManager(dept: Department): void {
  $q.dialog({
    title: 'Gán manager',
    message: `Gán manager cho ${dept.name}?`,
    prompt: {
      model: '',
      type: 'text',
      label: 'ID nhân viên',
    },
    ok: { label: 'Gán', color: 'primary' },
    cancel: { label: 'Hủy' },
  }).onOk((managerId: string) => { void _doAssignManager(dept, managerId); });
}

async function _doAssignManager(dept: Department, managerId: string): Promise<void> {
  loading.value = true;
  try {
    await departmentApi.assignManager(dept._id, managerId);
    success('Gán manager thành công');
    await loadDepartments();
  } catch {
    error('Không thể gán manager');
  } finally {
    loading.value = false;
  }
}

function viewEmployees(dept: Department): void {
  $q.dialog({
    title: `Nhân viên - ${dept.name}`,
    message: 'Chức năng này sẽ được triển khai',
    ok: { label: 'Đóng' },
  });
}

onMounted(loadDepartments);
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>