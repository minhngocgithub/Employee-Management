<template>
    <q-dialog ref="dialogRef">
        <q-card style="min-width: 800px; max-width: 90vw">
            <q-card-section>
                <div class="text-h6">
                    Chỉnh sửa nhân viên
                </div>
            </q-card-section>

            <q-card-section>
                <div class="row q-col-gutter-md">

                    <div class="col-12 col-md-6">
                        <q-input :model-value="employee.employee_code" outlined label="Mã nhân viên" readonly
                            disable />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.full_name" outlined label="Họ tên *" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.phone" outlined label="Số điện thoại" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.position" outlined label="Chức vụ" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-select v-model="form.department_id" :options="departments" option-label="name"
                            option-value="_id" emit-value map-options outlined label="Phòng ban" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-select v-model="form.gender" outlined label="Giới tính" :options="genderOptions"
                            emit-value map-options clearable />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.date_of_birth" outlined type="date" label="Ngày sinh" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model.number="form.salary" outlined type="number" label="Lương" />
                    </div>

                    <div class="col-12">
                        <q-input v-model="form.address" outlined label="Địa chỉ" />
                    </div>

                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Hủy" @click="onDialogCancel" />

                <q-btn color="primary" label="Lưu" :loading="loading" @click="submit" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'

import { employeeApi } from 'src/api/employee.api'
import { departmentApi } from 'src/api/department.api'

import type {
    Department,
    Employee,
    UpdateEmployeeDto,
} from 'src/types/api.types'

const props = defineProps<{
    employee: Employee
}>()

const $q = useQuasar()

const {
    dialogRef,
    onDialogOK,
    onDialogCancel,
} = useDialogPluginComponent()

defineEmits([...useDialogPluginComponent.emits])

const loading = ref(false)

const departments = ref<Department[]>([])

const genderOptions = [
    { label: 'Nam', value: 'male' },
    { label: 'Nữ', value: 'female' },
    { label: 'Khác', value: 'other' },
]

// Khởi tạo form từ dữ liệu employee hiện có
// UpdateEmployeeDto với exactOptionalPropertyTypes: gender/salary cần
// chấp nhận giá trị undefined tường minh (employee chưa điền thông tin)
type EditEmployeeForm = Omit<UpdateEmployeeDto, 'gender' | 'salary'> & {
    gender?: 'male' | 'female' | 'other' | undefined
    salary?: number | undefined
}

const form = ref<EditEmployeeForm>({
    full_name: props.employee.full_name ?? '',
    phone: props.employee.phone ?? '',
    avatar_url: props.employee.avatar_url ?? '',
    date_of_birth: props.employee.date_of_birth
        ? props.employee.date_of_birth.slice(0, 10)
        : '',
    gender: props.employee.gender,
    address: props.employee.address ?? '',
    department_id: props.employee.department_id,
    position: props.employee.position ?? '',
    salary: props.employee.salary,
})

onMounted(async () => {
    try {
        departments.value = await departmentApi.list()
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Không tải được danh sách phòng ban',
        })
    }
})

async function submit(): Promise<void> {
    if (!form.value.full_name?.trim()) {
        $q.notify({ type: 'warning', message: 'Họ tên không được để trống' })
        return
    }

    loading.value = true

    try {
        // Loại bỏ field rỗng '' hoặc undefined để tránh fail
        // @IsOptional validators và để khớp UpdateEmployeeDto (exactOptionalPropertyTypes)
        const payload: UpdateEmployeeDto = {}
        for (const [key, value] of Object.entries(form.value)) {
            if (value !== '' && value !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload as any)[key] = value
            }
        }

        const result = await employeeApi.update(props.employee._id, payload)

        $q.notify({
            type: 'positive',
            message: `Cập nhật "${result.full_name}" thành công`,
        })

        onDialogOK(result)
    } catch (err: unknown) {
        const message =
            err instanceof Error
                ? err.message
                : 'Không thể cập nhật nhân viên'

        $q.notify({
            type: 'negative',
            message,
        })
    } finally {
        loading.value = false
    }
}
</script>