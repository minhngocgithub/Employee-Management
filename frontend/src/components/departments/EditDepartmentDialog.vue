<template>
    <q-dialog ref="dialogRef" @hide="onDialogHide">
        <q-card style="min-width: 400px">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Chỉnh sửa phòng ban</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-separator />

            <q-form @submit="onSubmit" class="q-gutter-md q-pa-md">
                <q-input v-model="form.name" outlined label="Tên phòng ban" :rules="[
                    (v) => !!v?.trim() || 'Vui lòng nhập tên phòng ban'
                ]" />

                <q-select v-model="form.is_active" :options="activeOptions" outlined label="Trạng thái" emit-value
                    map-options />

                <div class="row q-gutter-md">
                    <q-btn unelevated color="primary" label="Cập nhật" type="submit" class="col" :loading="loading" />
                    <q-btn unelevated color="grey-8" label="Hủy" @click="onDialogCancel" class="col" />
                </div>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { departmentApi } from 'src/api';
import { useAlert } from 'src/composables/useAlert';
import type { Department } from 'src/types/api.types';

const props = defineProps<{
    department: Department;
}>();

const { success, error } = useAlert();
const {
  dialogRef,
  onDialogHide,
  onDialogOK,
  onDialogCancel,
} = useDialogPluginComponent()

const loading = ref(false);

const form = ref({
    name: '',
    is_active: true,
});

const activeOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Vô hiệu hóa', value: false },
];

onMounted(() => {
    form.value.name = props.department.name;
    form.value.is_active = props.department.is_active;
});

async function onSubmit(): Promise<void> {
    loading.value = true;
    try {
        const updated = await departmentApi.update(props.department._id, {
            name: form.value.name.trim(),
            is_active: form.value.is_active,
        });
        success('Cập nhật phòng ban thành công');
        onDialogOK(updated);
    } catch {
        error('Không thể cập nhật phòng ban');
    } finally {
        loading.value = false;
    }
}
</script>
