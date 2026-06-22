<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 500px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Ủy Quyền Nhân Viên</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <!-- Info about who is delegating -->
        <div class="bg-blue-1 q-pa-md rounded">
          <div class="text-caption text-grey-7">Ủy quyền cho</div>
          <div class="text-body1 text-weight-bold">{{ employee.full_name }}</div>
          <div class="text-caption text-grey-7">{{ getEmployeeEmail() }}</div>
        </div>

        <!-- Start Date -->
        <div>
          <div class="text-subtitle2 q-mb-sm">
            Ngày bắt đầu <span class="text-red">*</span>
          </div>
          <q-input
            v-model="formData.startDate"
            outlined
            dense
            type="date"
            :min="minDate"
            @update:model-value="validateDates"
          />
          <div v-if="errors.startDate" class="text-caption text-red">
            {{ errors.startDate }}
          </div>
        </div>

        <!-- End Date (Optional) -->
        <div>
          <div class="text-subtitle2 q-mb-sm">
            Ngày kết thúc <span class="text-caption">(tùy chọn)</span>
          </div>
          <q-input
            v-model="formData.endDate"
            outlined
            dense
            type="date"
            :min="formData.startDate || minDate"
          />
          <div v-if="errors.endDate" class="text-caption text-red">
            {{ errors.endDate }}
          </div>
        </div>

        <!-- Show delegation summary -->
        <q-banner
          v-if="formData.startDate"
          class="bg-green-1 text-green-9"
          dense
          rounded
        >
          <template #avatar>
            <q-icon name="info" />
          </template>
          <span v-if="formData.endDate">
            Ủy quyền từ {{ formatDate(formData.startDate) }} đến
            {{ formatDate(formData.endDate) }}
          </span>
          <span v-else>
            Ủy quyền từ {{ formatDate(formData.startDate) }} (không xác định hết hạn)
          </span>
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Hủy" color="grey-7" v-close-popup />
        <q-btn
          unelevated
          label="Ủy Quyền"
          color="primary"
          :loading="loading"
          :disable="!formData.startDate || Object.keys(errors).length > 0"
          @click="handleDelegation"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { departmentApi } from 'src/api/department.api';
import { useAlert } from 'src/composables/useAlert';
import type { Employee } from 'src/types/api.types';

const props = withDefaults(
  defineProps<{
    employee: Employee;
    departmentId: string;
  }>(),
  {}
);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const { success, error } = useAlert();

const loading = ref(false);
const formData = ref({
  startDate: '',
  endDate: '',
});

const errors = ref<Record<string, string>>({});

const today = new Date();
today.setHours(0, 0, 0, 0);

const minDate = computed(() => {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0]!;
});

function getEmployeeEmail(): string {
  if (typeof props.employee.account_id === 'object') {
    return props.employee.account_id.email;
  }
  return '—';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function validateDates(): void {
  errors.value = {};

  if (!formData.value.startDate) {
    errors.value.startDate = 'Vui lòng chọn ngày bắt đầu';
    return;
  }

  if (formData.value.endDate && formData.value.endDate < formData.value.startDate) {
    errors.value.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
  }
}

async function handleDelegation(): Promise<void> {
  validateDates();

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  loading.value = true;

  try {
    const endDate = formData.value.endDate
      ? new Date(formData.value.endDate + 'T23:59:59').toISOString()
      : null;

    const employeeId = typeof props.employee.account_id === 'object'
      ? props.employee.account_id._id
      : props.employee.account_id;

    await departmentApi.setActingManager(
      props.departmentId,
      employeeId,
      endDate,
    );

    success('Ủy quyền thành công');
    onDialogOK();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    error(`Ủy quyền thất bại: ${message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  formData.value.startDate = minDate.value;
});
</script>

<style scoped>
.rounded {
  border-radius: 8px;
}

.text-red {
  color: #f44336;
}

.text-caption {
  font-size: 0.75rem;
}
</style>
