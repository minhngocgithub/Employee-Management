<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">
          Gán Manager - {{ department.name }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedManager"
          :options="employeeOptions"
          label="Chọn nhân viên"
          outlined
          emit-value
          map-options
          option-label="label"
          option-value="value"
          :loading="loading"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Hủy"
          color="grey"
          @click="onDialogCancel"
        />

        <q-btn
          color="primary"
          label="Gán"
          :disable="!selectedManager"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { departmentApi } from 'src/api'

import type {
  Department,
  DepartmentEmployee,
} from 'src/types/api.types'

const props = defineProps<{
  department: Department
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent()

const loading = ref(false)

const employees = ref<DepartmentEmployee[]>([])

const selectedManager = ref('')

const employeeOptions = computed(() =>
  employees.value.map((emp) => ({
    label: `${emp.full_name} (${emp.account_id?.email ?? 'N/A'})`,
    value: emp.account_id?._id ?? '',
  })),
)

async function loadEmployees(): Promise<void> {
  loading.value = true

  try {
    employees.value =
      await departmentApi.getEmployees(
        props.department._id,
      )
  } finally {
    loading.value = false
  }
}

function submit(): void {
  onDialogOK(selectedManager.value)
}

onMounted(() => {
  void loadEmployees()
})
</script>