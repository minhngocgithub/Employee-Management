<template>
  <q-dialog ref="dialogRef">
    <q-card style="min-width: 600px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Thêm phòng ban mới</div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">

          <div class="col-12">
            <q-input
              v-model="form.name"
              outlined
              label="Tên phòng ban *"
              :error="!!errors.name"
              :error-message="errors.name"
              @update:model-value="errors.name = ''"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="form.code"
              outlined
              label="Mã phòng ban *"
              hint="Chỉ chữ hoa, số, gạch dưới. VD: IT, BOARD_HR"
              :error="!!errors.code"
              :error-message="errors.code"
              @update:model-value="errors.code = ''"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="form.level"
              :options="levelOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              label="Cấp độ *"
              :error="!!errors.level"
              :error-message="errors.level"
              @update:model-value="onLevelChange"
            />
          </div>

          <div class="col-12" v-if="form.level && form.level !== 1">
            <q-select
              v-model="form.parent_id"
              :options="filteredParents"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              outlined
              label="Phòng ban cha *"
              :hint="parentHint"
              :error="!!errors.parent_id"
              :error-message="errors.parent_id"
              @update:model-value="errors.parent_id = ''"
            />
          </div>

        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Hủy" @click="onDialogCancel" />
        <q-btn
          color="primary"
          label="Tạo phòng ban"
          :loading="loading"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { departmentApi } from 'src/api/department.api'
import type { Department } from 'src/types/api.types'

// Bắt buộc để $q.dialog({ component }) hoạt động
defineEmits([...useDialogPluginComponent.emits])

const $q = useQuasar()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const loading = ref(false)
const allDepartments = ref<Department[]>([])

const levelOptions = [
  { label: 'Cấp 1 — Công ty (Company)', value: 1 },
  { label: 'Cấp 2 — Ban (Board)',        value: 2 },
  { label: 'Cấp 3 — Phòng (Department)', value: 3 },
]

// Chỉ khai báo field nào DTO backend cần: name, code, level, parent_id, manager_id
const form = ref<{
  name: string
  code: string
  level: number | null
  parent_id?: string
}>({
  name: '',
  code: '',
  level: null,
})

const errors = ref({ name: '', code: '', level: '', parent_id: '' })

// Lọc danh sách parent theo level đang chọn:
// level 2 (Board) → parent phải là level 1 (Company)
// level 3 (Department) → parent phải là level 2 (Board)
const filteredParents = computed(() => {
  if (!form.value.level || form.value.level === 1) return []
  const requiredParentLevel = form.value.level - 1
  // api.types.ts không có field level nên cast any ở đây
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return allDepartments.value.filter((d) => (d as any).level === requiredParentLevel)
})
const parentHint = computed(() => {
  if (form.value.level === 2) return 'Chọn phòng ban cấp Công ty làm cha'
  if (form.value.level === 3) return 'Chọn phòng ban cấp Ban làm cha'
  return ''
})

function onLevelChange(): void {
  errors.value.level = ''
  // Reset parent khi đổi level
  delete form.value.parent_id
  errors.value.parent_id = ''
}

onMounted(async () => {
  try {
    allDepartments.value = await departmentApi.list()
  } catch {
    $q.notify({ type: 'warning', message: 'Không tải được danh sách phòng ban' })
  }
})

async function submit(): Promise<void> {
  // Reset errors
  errors.value = { name: '', code: '', level: '', parent_id: '' }

  let hasError = false

  if (!form.value.name.trim()) {
    errors.value.name = 'Tên phòng ban là bắt buộc'
    hasError = true
  }
  if (!form.value.code.trim()) {
    errors.value.code = 'Mã phòng ban là bắt buộc'
    hasError = true
  } else if (!/^[A-Z0-9_]+$/.test(form.value.code.trim())) {
    errors.value.code = 'Chỉ chữ hoa, số và dấu gạch dưới'
    hasError = true
  }
  if (!form.value.level) {
    errors.value.level = 'Cấp độ là bắt buộc'
    hasError = true
  }
  if (form.value.level && form.value.level !== 1 && !form.value.parent_id) {
    errors.value.parent_id = 'Phòng ban cha là bắt buộc'
    hasError = true
  }

  if (hasError) return

  loading.value = true
  try {
    // Chỉ gửi đúng fields mà CreateDepartmentDto backend yêu cầu
    const payload: {
      name: string
      code: string
      level: number
      parent_id?: string
    } = {
      name:  form.value.name.trim(),
      code:  form.value.code.trim().toUpperCase(),
      level: form.value.level!,
    }
    if (form.value.parent_id) payload.parent_id = form.value.parent_id

    const result = await departmentApi.create(payload as Parameters<typeof departmentApi.create>[0])

    $q.notify({
      type: 'positive',
      message: `Tạo phòng ban "${result.name}" thành công`,
    })

    onDialogOK(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Không thể tạo phòng ban'
    $q.notify({ type: 'negative', message })
  } finally {
    loading.value = false
  }
}
</script>