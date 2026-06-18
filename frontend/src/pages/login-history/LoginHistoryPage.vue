<template>
  <q-page class="lh-page q-pa-md">

    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <q-icon name="login" size="28px" color="indigo-6" />
          <div>
            <h1 class="text-h5 q-my-none text-weight-bold">Lịch sử đăng nhập</h1>
            <p class="text-caption text-grey-6 q-my-none">Theo dõi hoạt động đăng nhập / đăng xuất</p>
          </div>
        </div>
      </div>
      <div class="col-auto row q-gutter-sm items-center">
        <q-chip
          v-if="pagination.total > 0"
          color="indigo-6" text-color="white"
          icon="receipt_long" square
          :label="`${pagination.total.toLocaleString()} bản ghi`"
        />
      </div>
    </div>

    <!-- Stats bar (admin only) -->
    <div v-if="isAdmin" class="row q-col-gutter-md q-mb-md">
      <div class="col-6 col-md-3" v-for="stat in summaryStats" :key="stat.label">
        <q-card flat bordered class="stat-card text-center q-pa-md">
          <q-icon :name="stat.icon" :color="stat.color" size="28px" />
          <div class="text-h5 text-weight-bold q-mt-xs">{{ stat.value }}</div>
          <div class="text-caption text-grey-6">{{ stat.label }}</div>
        </q-card>
      </div>
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md" style="background:#fafafa">
      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-sm items-end">

          <div v-if="isAdmin" class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="filters.account_id"
              outlined dense clearable
              label="Account"
              @update:model-value="onFilterChange"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <q-select
              v-model="filters.action"
              :options="actionOptions"
              option-label="label" option-value="value"
              emit-value map-options
              outlined dense clearable
              label="Hành động"
              @update:model-value="onFilterChange"
            />
          </div>

          <div class="col-auto row q-gutter-xs items-center q-ml-auto">
            <q-btn
              outline color="indigo-6" icon="refresh" label="Tải lại"
              :loading="loading" dense
              @click="loadHistory"
            />
            <q-btn
              class="q-ml-sm q-pl-xs" outline
              flat color="grey-7" icon="filter_alt_off" dense title="Xóa bộ lọc"
              @click="clearFilters"
            />
          </div>

        </div>
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card flat bordered>
      <q-table
        :rows="records"
        :columns="columns"
        row-key="_id"
        flat
        :loading="loading"
        :pagination="{ rowsPerPage: filters.limit }"
        hide-pagination
        no-data-label="Chưa có lịch sử đăng nhập"
        loading-label="Đang tải..."
      >
        <!-- Action -->
        <template #body-cell-action="props">
          <q-td :props="props">
            <q-chip
              dense square
              :color="props.row.action === 'login' ? 'positive' : 'grey-6'"
              text-color="white"
              :icon="props.row.action === 'login' ? 'login' : 'logout'"
              :label="props.row.action === 'login' ? 'Đăng nhập' : 'Đăng xuất'"
              class="action-chip"
            />
          </q-td>
        </template>

        <!-- Email (populated) -->
        <template #body-cell-email="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs">
              <q-avatar size="26px" color="indigo-2" text-color="indigo-9" font-size="11px">
                {{ emailInitial(props.row) }}
              </q-avatar>
              <span class="text-body2">{{ emailOf(props.row) }}</span>
            </div>
          </q-td>
        </template>

        <!-- IP -->
        <template #body-cell-ip_address="props">
          <q-td :props="props">
            <span v-if="props.row.ip_address" class="text-caption text-mono">
              {{ props.row.ip_address }}
            </span>
            <span v-else class="text-grey-4 text-caption">—</span>
          </q-td>
        </template>

        <!-- User Agent -->
        <template #body-cell-user_agent="props">
          <q-td :props="props">
            <div v-if="props.row.user_agent" class="row items-center q-gutter-xs">
              <q-icon :name="uaIcon(props.row.user_agent)" size="16px" color="grey-6" />
              <span class="text-caption text-grey-7 ellipsis" style="max-width:200px">
                {{ shortUa(props.row.user_agent) }}
              </span>
              <q-tooltip>{{ props.row.user_agent }}</q-tooltip>
            </div>
            <span v-else class="text-grey-4 text-caption">—</span>
          </q-td>
        </template>

        <!-- Time -->
        <template #body-cell-created_at="props">
          <q-td :props="props">
            <div class="text-caption">{{ formatDate(props.row.created_at) }}</div>
            <div class="text-caption text-grey-5">{{ formatTime(props.row.created_at) }}</div>
          </q-td>
        </template>

      </q-table>

      <!-- Pagination footer -->
      <div class="row justify-between items-center q-px-md q-py-sm border-top">
        <span class="text-caption text-grey-6">
          Trang {{ pagination.page }} / {{ pagination.pages }} —
          {{ pagination.total }} bản ghi
        </span>
        <q-pagination
          v-model="currentPage"
          :max="pagination.pages"
          :max-pages="6"
          boundary-numbers
          color="indigo-6"
          @update:model-value="onPageChange"
        />
        <q-select
          v-model="filters.limit"
          :options="[10, 20, 50]"
          dense outlined
          style="width:80px"
          @update:model-value="onFilterChange"
        />
      </div>
    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import { loginHistoryApi } from 'src/api/login-history.api'
import type { LoginHistoryRecord } from 'src/api/login-history.api'

const $q      = useQuasar()
const auth    = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin')

// ─── State ────────────────────────────────────────────────────────────────────
const records     = ref<LoginHistoryRecord[]>([])
const loading     = ref(false)
const currentPage = ref(1)

const pagination = ref({
  page: 1, limit: 20, total: 0, pages: 1,
})

const filters = ref<{
  account_id?: string
  action?: 'login' | 'logout'
  limit: number
}>({ limit: 20 })

// ─── Summary stats (tính từ dữ liệu hiện tại, admin only) ────────────────────
const summaryStats = computed(() => {
  const logins  = records.value.filter(r => r.action === 'login').length
  const logouts = records.value.filter(r => r.action === 'logout').length
  const uniqueIps = new Set(records.value.map(r => r.ip_address).filter(Boolean)).size
  return [
    { label: 'Đăng nhập',    value: logins,    icon: 'login',     color: 'positive' },
    { label: 'Đăng xuất',    value: logouts,   icon: 'logout',    color: 'grey-7'   },
    { label: 'IP khác nhau', value: uniqueIps, icon: 'router',    color: 'indigo-6' },
    { label: 'Tổng bản ghi', value: pagination.value.total, icon: 'receipt_long', color: 'orange-7' },
  ]
})

// ─── Options / columns ────────────────────────────────────────────────────────
const actionOptions = [
  { label: 'Đăng nhập',  value: 'login'  },
  { label: 'Đăng xuất', value: 'logout' },
]

const columns = computed(() => [
  { name: 'action',     label: 'Hành động',   field: 'action',     align: 'left'   as const },
  ...(isAdmin.value
    ? [{ name: 'email', label: 'Tài khoản',   field: 'account_id', align: 'left'   as const }]
    : []),
  { name: 'ip_address', label: 'IP',          field: 'ip_address', align: 'left'   as const },
  { name: 'user_agent', label: 'Trình duyệt', field: 'user_agent', align: 'left'   as const },
  { name: 'created_at', label: 'Thời gian',   field: 'created_at', align: 'left'   as const },
])

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emailOf(row: LoginHistoryRecord): string {
  if (typeof row.account_id === 'object' && row.account_id !== null) {
    return row.account_id.email
  }
  return String(row.account_id).slice(-8)
}

function emailInitial(row: LoginHistoryRecord): string {
  const e = emailOf(row)
  return e.charAt(0).toUpperCase()
}

function shortUa(ua: string): string {
  // Rút gọn user agent thành tên browser/OS
  if (ua.includes('Chrome'))  return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari'))  return 'Safari'
  if (ua.includes('Edge'))    return 'Edge'
  return ua.slice(0, 40)
}

function uaIcon(ua: string): string {
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'smartphone'
  return 'computer'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadHistory(): Promise<void> {
  loading.value = true
  try {
    const result = await loginHistoryApi.list({
      page:  currentPage.value,
      limit: filters.value.limit,
      ...(filters.value.account_id && { account_id: filters.value.account_id }),
    })

    // Filter action client-side vì API không có param action
    let data = result.data
    if (filters.value.action) {
      data = data.filter(r => r.action === filters.value.action)
    }

    records.value   = data
    pagination.value = result.pagination
  } catch {
    $q.notify({ type: 'negative', message: 'Không thể tải lịch sử đăng nhập' })
  } finally {
    loading.value = false
  }
}

function onFilterChange(): void {
  currentPage.value = 1
  void loadHistory()
}

function onPageChange(page: number): void {
  currentPage.value = page
  void loadHistory()
}

function clearFilters(): void {
  filters.value = { limit: 20 }
  currentPage.value = 1
  void loadHistory()
}

onMounted(() => { void loadHistory() })
</script>

<style scoped>
.lh-page {
  max-width: 1300px;
  margin: 0 auto;
}

.stat-card {
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
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

.border-top {
  border-top: 1px solid #f0f0f0;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}
</style>