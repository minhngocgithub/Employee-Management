<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">
          Ủy quyền tạm thời - {{ department.name }}
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Người được ủy quyền phải khác manager hiện tại
        </div>
      </q-card-section>

      <q-card-section>
        <q-select v-model="selectedActingManager" :options="employeeOptions" label="Chọn nhân viên ủy quyền" outlined
          emit-value map-options option-label="label" option-value="value" clearable :loading="loading" />
        <q-input v-model="actingUntil" outlined type="date" label="Ngày kết thúc ủy quyền"
        hint="Để trống nếu không tự động hết hạn" class="q-mt-md" />
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat label="Hủy" color="grey" @click="onDialogCancel" />

        <q-btn v-if="department.acting_manager_id" flat label="Gỡ ủy quyền" color="orange"
          @click="clearActingManager" />

        <q-btn color="primary" label="Lưu" :disable="!selectedActingManager" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { departmentApi } from 'src/api';
import type { Department, DepartmentEmployee } from 'src/types/api.types';

const props = defineProps<{
  department: Department;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent();

const loading = ref(false);
const employees = ref<DepartmentEmployee[]>([]);
const selectedActingManager = ref<string | null>(
  props.department.acting_manager_id ?? null,
);
const actingUntil = ref<string | null>(
  props.department.acting_until
    ? new Date(props.department.acting_until)
        .toISOString()
        .split('T')[0] ?? null
    : null,
)
const employeeOptions = computed(() =>
  employees.value
    .filter((emp) => emp.account_id?._id !== props.department.manager_id)
    .map((emp) => ({
      label: `${emp.full_name} (${emp.account_id?.email ?? 'N/A'})`,
      value: emp.account_id?._id ?? '',
    }))
    .filter((opt) => opt.value),
);

async function loadEmployees(): Promise<void> {
  loading.value = true;
  try {
    employees.value = await departmentApi.getEmployees(props.department._id);
  } finally {
    loading.value = false;
  }
}

function submit(): void {
  if (!selectedActingManager.value) return;

  onDialogOK({
    acting_manager_id: selectedActingManager.value,
    acting_until: actingUntil.value,
  });
}

function clearActingManager(): void {
  onDialogOK({
    acting_manager_id: null,
    acting_until: null,
  });
}

onMounted(() => {
  void loadEmployees();
});
</script>
