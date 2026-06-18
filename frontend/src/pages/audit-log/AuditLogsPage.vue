<template>
  <q-page class="audit-page q-pa-md">

    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <q-icon name="manage_search" size="28px" color="primary" />
          <div>
            <h1 class="text-h5 q-my-none text-weight-bold">Nhật ký hoạt động</h1>
            <p class="text-caption text-grey-6 q-my-none">Theo dõi mọi thay đổi trong hệ thống</p>
          </div>
        </div>
      </div>
      <div class="col-auto">
        <q-chip v-if="totalRecords > 0" color="primary" text-color="white" icon="receipt_long"
          :label="`${totalRecords.toLocaleString()} bản ghi`" square />
      </div>
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md filter-card">
      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-sm items-end">

          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="filters.action" :options="actionOptions" option-label="label" option-value="value"
              options-dense emit-value map-options outlined dense clearable label="Hành động"
              @update:model-value="onFilterChange">
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="actionIcon(scope.opt.value)" :color="actionColor(scope.opt.value)" size="18px" />
                  </q-item-section>
                  <q-item-section>{{ scope.opt.label }}</q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="filters.entity" :options="entityOptions" option-label="label" option-value="value"
              emit-value map-options outlined dense clearable label="Đối tượng" @update:model-value="onFilterChange" />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-input v-model="filters.from_date" outlined dense label="Từ ngày" type="date"
              @update:model-value="onFilterChange" />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-input v-model="filters.to_date" outlined dense label="Đến ngày" type="date"
              @update:model-value="onFilterChange" />
          </div>

          <div class="col-12 col-md-2 row q-gutter-xs">
            <q-btn outline color="primary" icon="refresh" label="Tải lại" :loading="loading" dense class="col"
              @click="loadLogs" />
            <q-btn flat color="grey-7" icon="filter_alt_off" dense class="col-auto" title="Xóa bộ lọc"
              @click="clearFilters" />
          </div>

        </div>
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card flat bordered>
      <q-table :rows="logs" :columns="columns" row-key="_id" flat :loading="loading" v-model:pagination="pagination"
        @request="onTableRequest" binary-state-sort :rows-per-page-options="[10, 20, 50]"
        no-data-label="Không có bản ghi nào" loading-label="Đang tải...">
        <!-- Action badge -->
        <template #body-cell-action="props">
          <q-td :props="props">
            <q-chip dense square :color="actionColor(props.row.action)" text-color="white"
              :icon="actionIcon(props.row.action)" :label="actionLabel(props.row.action)" class="action-chip" />
          </q-td>
        </template>

        <!-- Entity badge -->
        <template #body-cell-entity="props">
          <q-td :props="props">
            <q-chip dense square outline :color="entityColor(props.row.entity)"
              :label="entityLabel(props.row.entity)" />
          </q-td>
        </template>

        <!-- Actor -->
        <template #body-cell-actor_id="props">
          <q-td :props="props">
            <div v-if="props.row.actor_id?.employee_id">
              <div class="text-weight-medium">
                {{ props.row.actor_id.employee_id.full_name }}
              </div>

              <div class="text-caption text-grey-6">
                {{ props.row.actor_id.employee_id.employee_code }}
              </div>
            </div>

            <span v-else class="text-grey-5">
              —
            </span>
          </q-td>
        </template>

        <!-- Entity ID -->
        <template #body-cell-entity_id="props">
          <q-td :props="props">
            <span class="text-caption text-mono text-grey-7">{{ shortId(props.row.entity_id) }}</span>
          </q-td>
        </template>

        <!-- IP -->
        <template #body-cell-ip_address="props">
          <q-td :props="props">
            <span v-if="props.row.ip_address" class="text-caption text-mono">{{ props.row.ip_address }}</span>
            <span v-else class="text-grey-5 text-caption">—</span>
          </q-td>
        </template>

        <!-- Timestamp -->
        <template #body-cell-created_at="props">
          <q-td :props="props">
            <div class="text-caption">{{ formatDate(props.row.created_at) }}</div>
            <div class="text-caption text-grey-5">{{ formatTime(props.row.created_at) }}</div>
          </q-td>
        </template>

        <!-- Detail expand -->
        <template #body-cell-detail="props">
          <q-td :props="props" auto-width>
            <q-btn v-if="props.row.before_data || props.row.after_data" flat dense round icon="chevron_right" size="sm"
              color="grey-6" @click="openDetail(props.row)" />
            <span v-else class="text-grey-4 text-caption">—</span>
          </q-td>
        </template>

      </q-table>
    </q-card>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="detail-card">
        <q-bar class="bg-primary text-white">
          <q-icon name="manage_search" />
          <div class="q-ml-sm">Chi tiết thay đổi</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section v-if="selectedLog" class="q-pa-md">
          <!-- Meta info -->
          <div class="row q-gutter-md q-mb-lg">
            <div class="meta-chip">
              <q-icon :name="actionIcon(selectedLog.action)" :color="actionColor(selectedLog.action)" size="16px"
                class="q-mr-xs" />
              <span>{{ actionLabel(selectedLog.action) }}</span>
            </div>
            <div class="meta-chip">
              <q-icon name="category" size="16px" class="q-mr-xs text-grey-6" />
              <span>{{ entityLabel(selectedLog.entity) }}</span>
            </div>
            <div class="meta-chip">
              <q-icon name="schedule" size="16px" class="q-mr-xs text-grey-6" />
              <span>{{ formatDate(selectedLog.created_at) }} {{ formatTime(selectedLog.created_at) }}</span>
            </div>
            <div v-if="selectedLog.ip_address" class="meta-chip">
              <q-icon name="router" size="16px" class="q-mr-xs text-grey-6" />
              <span>{{ selectedLog.ip_address }}</span>
            </div>
          </div>

          <!-- Diff view -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6" v-if="selectedLog.before_data">
              <div class="diff-label text-negative q-mb-sm">
                <q-icon name="remove_circle_outline" class="q-mr-xs" />Trước thay đổi
              </div>
              <pre class="diff-pre diff-before">{{ JSON.stringify(selectedLog.before_data, null, 2) }}</pre>
            </div>
            <div class="col-12 col-md-6" v-if="selectedLog.after_data">
              <div class="diff-label text-positive q-mb-sm">
                <q-icon name="add_circle_outline" class="q-mr-xs" />Sau thay đổi
              </div>
              <pre class="diff-pre diff-after">{{ JSON.stringify(selectedLog.after_data, null, 2) }}</pre>
            </div>
            <div class="col-12" v-if="!selectedLog.before_data && !selectedLog.after_data">
              <p class="text-grey-6 text-center q-pa-lg">Không có dữ liệu thay đổi</p>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { auditLogApi } from 'src/api/audit-log.api'
import type { AuditLog, AuditAction, AuditEntity, QueryAuditLogDto } from 'src/api/audit-log.api'

const $q = useQuasar()

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const detailDialog = ref(false)
const selectedLog = ref<AuditLog | null>(null)

const filters = ref<QueryAuditLogDto>({})

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  sortBy: null as string | null,
  descending: true,
})

// ─── Table columns ────────────────────────────────────────────────────────────
const columns = [
  { name: 'action', label: 'Hành động', field: 'action', align: 'left' as const, sortable: false },
  { name: 'entity', label: 'Đối tượng', field: 'entity', align: 'left' as const, sortable: false },
  { name: 'entity_id', label: 'ID đối tượng', field: 'entity_id', align: 'left' as const, sortable: false },
  { name: 'actor_id', label: 'Thực hiện bởi', field: 'actor_id', align: 'left' as const, sortable: false },
  { name: 'ip_address', label: 'IP', field: 'ip_address', align: 'left' as const, sortable: false },
  { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' as const, sortable: false },
  { name: 'detail', label: 'Chi tiết', field: 'detail', align: 'center' as const, sortable: false },
]

// ─── Options ──────────────────────────────────────────────────────────────────
const actionOptions = [
  { label: 'Tạo mới', value: 'CREATE' },
  { label: 'Cập nhật', value: 'UPDATE' },
  { label: 'Xóa', value: 'DELETE' },
]

const entityOptions = [
  { label: 'Nhân viên', value: 'Employee' },
  { label: 'Phòng ban', value: 'Department' },
  { label: 'Đơn nghỉ phép', value: 'LeaveRequest' },
  { label: 'Tài khoản', value: 'Account' },
]

// ─── Display helpers ──────────────────────────────────────────────────────────
function actionColor(action: AuditAction): string {
  return { CREATE: 'positive', UPDATE: 'primary', DELETE: 'negative' }[action] ?? 'grey'
}

function actionIcon(action: AuditAction): string {
  return { CREATE: 'add_circle', UPDATE: 'edit', DELETE: 'delete' }[action] ?? 'help'
}

function actionLabel(action: AuditAction): string {
  return { CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa' }[action] ?? action
}

function entityColor(entity: AuditEntity): string {
  return {
    Employee: 'teal',
    Department: 'indigo',
    LeaveRequest: 'orange',
    Account: 'purple',
  }[entity] ?? 'grey'
}

function entityLabel(entity: AuditEntity): string {
  return {
    Employee: 'Nhân viên',
    Department: 'Phòng ban',
    LeaveRequest: 'Đơn nghỉ',
    Account: 'Tài khoản',
  }[entity] ?? entity
}

function shortId(id: string): string {
  return id ? `…${id.slice(-8)}` : '—'
}

// function actorInitial(id: string): string {
//   return id ? id.slice(-2).toUpperCase() : '?'
// }

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ─── Load data ────────────────────────────────────────────────────────────────
async function loadLogs(): Promise<void> {
  loading.value = true
  try {
    const query: QueryAuditLogDto = {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
    }
    if (filters.value.action) query.action = filters.value.action
    if (filters.value.entity) query.entity = filters.value.entity
    if (filters.value.from_date) query.from_date = filters.value.from_date
    if (filters.value.to_date) query.to_date = filters.value.to_date

    const result = await auditLogApi.list(query)
    logs.value = result.data
    totalRecords.value = result.total
    pagination.value.rowsNumber = result.total
  } catch {
    $q.notify({ type: 'negative', message: 'Không thể tải nhật ký hoạt động' })
  } finally {
    loading.value = false
  }
}

function onFilterChange(): void {
  pagination.value.page = 1
  void loadLogs()
}

function onTableRequest(props: { pagination: { page: number; rowsPerPage: number } }): void {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  void loadLogs()
}

function clearFilters(): void {
  filters.value = {}
  pagination.value.page = 1
  void loadLogs()
}

function openDetail(log: AuditLog): void {
  selectedLog.value = log
  detailDialog.value = true
}

onMounted(() => { void loadLogs() })
</script>

<style scoped>
.audit-page {
  max-width: 1400px;
  margin: 0 auto;
}

.filter-card {
  background: #fafafa;
}

.action-chip {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.text-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
}

/* Detail dialog */
.detail-card {
  display: flex;
  flex-direction: column;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  color: #444;
}

.diff-label {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.diff-pre {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
  max-height: 60vh;
  border: 1px solid #e0e0e0;
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-before {
  border-left: 3px solid #f44336;
  background: #fff8f8;
}

.diff-after {
  border-left: 3px solid #4caf50;
  background: #f8fff8;
}
</style>