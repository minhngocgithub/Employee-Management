<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-my-none">{{ $t('departments.title') }}</h1>
        <p class="text-subtitle2 text-grey-7 q-mt-xs">
          {{ $t('departments.subtitle') }}
        </p>
      </div>
      <div v-if="canCreateDepartment" class="col-auto">
        <q-btn color="primary" :label="$t('departments.addNew')" icon="add" @click="openCreateDialog" :disable="loading" />
      </div>
    </div>

    <!-- Search -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchText" outlined dense clearable debounce="500" :placeholder="$t('departments.search')">
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-btn outline color="primary" :label="$t('common.reload')" icon="refresh" @click="loadDepartments" :loading="loading"
              class="full-width" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card :loading="loading">
      <q-table :rows="departments" :columns="columns" row-key="_id" flat bordered v-model:pagination="pagination"
        @request="loadDepartments">
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

        <template #body-cell-acting_manager="props">
          <q-td :props="props">
            {{ props.row.acting_manager_id ? 'Có' : '—' }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" size="sm" color="primary" @click="openEditDialog(props.row)" />
            <q-btn flat dense round icon="more_vert" size="sm" color="grey-8">
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 200px">
                  <q-item clickable v-close-popup @click="assignManager(props.row)">
                    <q-item-section>Gán manager</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup :disable="!props.row.manager_id"
                    @click="assignActingManager(props.row)">
                    <q-item-section>Ủy quyền tạm thời</q-item-section>
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
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios'
import { useQuasar } from 'quasar';
import { departmentApi } from 'src/api';
import { useAlert } from 'src/composables/useAlert';
import type { Department, DepartmentEmployee } from 'src/types/api.types';
import CreateDepartmentDialog from 'src/components/departments/CreateDepartmentDialog.vue';
import EditDepartmentDialog from 'src/components/departments/EditDepartmentDialog.vue';
import AssignManagerDialog from 'src/components/departments/AssignManagerDialog.vue';
import AssignActingManagerDialog from 'src/components/departments/AssignActingManagerDialog.vue';
import { useAuthStore } from 'src/stores/auth.store'
import { useDebounceFn } from '@vueuse/core'
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
const authStore = useAuthStore()
const canCreateDepartment = computed(() =>
  authStore.role !== 'manager'
)
const departments = computed(() => {
  if (!searchText.value) return allDepartments.value;
  const q = searchText.value.toLowerCase();
  return allDepartments.value.filter((d) =>
    d.name.toLowerCase().includes(q) ||
    d.code.toLowerCase().includes(q),
  );
});

const columns = [
  { name: 'name', label: 'Tên phòng ban', field: 'name', align: 'left' as const },
  { name: 'code', label: 'Mã', field: 'code', align: 'left' as const },
  { name: 'level', label: 'Cấp', field: 'level', align: 'center' as const },
  { name: 'manager', label: 'Manager', field: 'manager_id', align: 'center' as const },
  { name: 'acting_manager', label: 'Ủy quyền', field: 'acting_manager_id', align: 'center' as const },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
];

async function loadDepartments(): Promise<void> {
  loading.value = true;
  try {
    const result = await departmentApi.list(
      false,
      searchText.value.trim(),
    )
    allDepartments.value = result;
    pagination.value.rowsNumber = result.length;
  } catch {
    error('Không thể tải danh sách phòng ban');
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounceFn(async () => {
  await loadDepartments()
}, 500)

watch(searchText, () => {
  void debouncedSearch();
})

function openCreateDialog(): void {
  $q.dialog({ component: CreateDepartmentDialog })
    .onOk(() => { void loadDepartments(); });
}

function openEditDialog(dept: Department): void {
  $q.dialog({ component: EditDepartmentDialog, componentProps: { department: dept } })
    .onOk(() => { void loadDepartments(); });
}


function assignManager(
  dept: Department,
): void {
  $q.dialog({
    component: AssignManagerDialog,
    componentProps: {
      department: dept,
    },
  }).onOk((managerId: string) => {
    if (managerId) {
      void _doAssignManager(
        dept,
        managerId,
      )
    }
  })
}


async function _doAssignManager(
  dept: Department,
  managerId: string,
): Promise<void> {
  loading.value = true

  try {
    await departmentApi.assignManager(
      dept._id,
      managerId,
    )

    success('Gán manager thành công')

    await loadDepartments()

  } catch (err: unknown) {
    let message = 'Không thể gán manager'

    if (axios.isAxiosError(err)) {
      message =
        err.response?.data?.message ??
        message
    }

    error(message)

    console.error(
      '[Assign Manager]',
      err,
    )
  } finally {
    loading.value = false
  }
}


function assignActingManager(dept: Department): void {
  $q.dialog({
    component: AssignActingManagerDialog,
    componentProps: {
      department: dept,
    },
  }).onOk((payload: ActingManagerPayload) => {
    void _doAssignActingManager(
      dept,
      payload,
    )
  })
}
interface ActingManagerPayload {
  acting_manager_id: string | null
  acting_until: string | null
}
async function _doAssignActingManager(
  dept: Department,
  payload: ActingManagerPayload,
): Promise<void> {
  loading.value = true;
  try {
    await departmentApi.setActingManager(dept._id, payload.acting_manager_id);
    success(
      payload.acting_manager_id
        ? 'Ủy quyền tạm thời thành công'
        : 'Đã gỡ ủy quyền tạm thời',
    );
    await loadDepartments();
  } catch (err: unknown) {
    let message = 'Không thể ủy quyền tạm thời';
    if (axios.isAxiosError(err)) {
      message = err.response?.data?.message ?? message;
    }
    error(message);
  } finally {
    loading.value = false;
  }
}


async function viewEmployees(
  dept: Department,
): Promise<void> {
  loading.value = true

  try {
    const employees =
      await departmentApi.getEmployees(
        dept._id,
      )

    if (employees.length === 0) {
      error(
        `Phòng ban ${dept.name} chưa có nhân viên`,
      )
      return
    }

    const employeeList = employees
      .map((emp: DepartmentEmployee) => {
        const email =
          emp.account_id?.email ?? 'N/A'

        const position =
          emp.position ?? 'Chưa gán'

        return `• ${emp.full_name} (${position}) - ${email}`
      })
      .join('<br>')

    $q.dialog({
      title: `Danh sách nhân viên - ${dept.name}`,
      message: `
        <div style="max-height:400px;overflow-y:auto;">
          ${employeeList}
        </div>
      `,
      html: true,
      ok: {
        label: 'Đóng',
      },
    })
  } catch {
    error(
      'Không thể lấy danh sách nhân viên',
    )
  } finally {
    loading.value = false
  }
}

onMounted(loadDepartments);

</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
