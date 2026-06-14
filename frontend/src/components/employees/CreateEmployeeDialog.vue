<template>
    <q-dialog ref="dialogRef">
        <q-card style="min-width: 800px; max-width: 90vw">
            <q-card-section>
                <div class="text-h6">
                    Thêm nhân viên mới
                </div>
            </q-card-section>

            <q-card-section>
                <div class="row q-col-gutter-md">

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.full_name" outlined label="Họ tên *" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.personal_email" outlined type="email" label="Email cá nhân *" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.phone" outlined label="Số điện thoại" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-select v-model="form.department_id" :options="departments" option-label="name"
                            option-value="_id" emit-value map-options outlined label="Phòng ban *" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.join_date" outlined type="date" label="Ngày vào làm *" />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-select v-model="form.gender" outlined label="Giới tính" :options="genderOptions" emit-value
                            map-options />
                    </div>

                    <div class="col-12 col-md-6">
                        <q-input v-model="form.date_of_birth" outlined type="date" label="Ngày sinh" />
                    </div>

                    <div class="col-12">
                        <q-input v-model="form.address" outlined label="Địa chỉ" />
                    </div>

                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Hủy" @click="onDialogCancel" />

                <q-btn color="primary" label="Tạo nhân viên" :loading="loading" @click="submit" />
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
    CreateEmployeeDto,
} from 'src/types/api.types'

const $q = useQuasar()

const {
    dialogRef,
    onDialogOK,
    onDialogCancel,
} = useDialogPluginComponent()

const loading = ref(false)

const departments = ref<Department[]>([])

const genderOptions = [
    { label: 'Nam', value: 'male' },
    { label: 'Nữ', value: 'female' },
    { label: 'Khác', value: 'other' },
]

const form = ref<CreateEmployeeDto>({
    full_name: '',
    personal_email: '',
    phone: '',
    department_id: '',
    join_date: '',
    date_of_birth: '',
    address: '',
    avatar_url: '',
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
    if (
        !form.value.full_name ||
        !form.value.personal_email ||
        !form.value.department_id ||
        !form.value.join_date
    ) {
        $q.notify({
            type: 'warning',
            message: 'Vui lòng nhập đầy đủ thông tin bắt buộc',
        })
        return
    }

    loading.value = true

    try {
        // Loại bỏ các field optional rỗng (class-validator @IsOptional
        // không bỏ qua chuỗi rỗng '', gây fail @IsDateString/@IsUrl...)
        const payload: CreateEmployeeDto = { ...form.value }
        for (const key of Object.keys(payload) as (keyof CreateEmployeeDto)[]) {
            if (payload[key] === '') {
                delete payload[key]
            }
        }

        const result = await employeeApi.create(payload)

        $q.notify({
            type: 'positive',
            timeout: 12000,
            message:
                `Tạo thành công\n` +
                `Mã NV: ${result.employee_code}\n` +
                `Email công ty: ${result.company_email}`,
        })

        onDialogOK(result)
    } catch (err: unknown) {
        const message =
            err instanceof Error
                ? err.message
                : 'Không thể tạo nhân viên'

        $q.notify({
            type: 'negative',
            message,
        })

    } finally {
    loading.value = false
}
}
</script>