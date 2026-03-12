<template>
  <div v-if="wb" class="space-y-5 max-w-3xl">
    <div class="flex items-center gap-3 flex-wrap">
      <NuxtLink to="/waybills" class="btn btn-secondary btn-sm">← Назад</NuxtLink>
      <div class="min-w-0">
        <h1 class="font-bold text-lg" style="color:var(--text)">{{ wb.number }}</h1>
        <div class="text-xs font-mono" style="color:var(--text-3)">{{ fmtDT(wb.date) }}</div>
      </div>
      <span class="badge text-sm px-3 py-1 ml-auto" :class="statusBadge(wb.status)">{{ statusLabel(wb.status) }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Info -->
      <div class="card">
        <div class="card-header"><span class="font-semibold text-sm" style="color:var(--text)">Данные листа</span></div>
        <div class="p-4 space-y-3">
          <row-item label="Автомобиль" :value="`${wb.car?.brand} ${wb.car?.model} · ${wb.car?.plateNumber}`" />
          <row-item label="Водитель" :value="wb.driver?.name" />
          <row-item label="Создал" :value="wb.createdBy?.name" />
          <row-item label="Маршрут" :value="`${wb.routeStart || '—'} → ${wb.routeEnd || '—'}`" />
          <div class="border-t pt-3" style="border-color:var(--border)">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><div class="label mb-0.5">Нач. пробег</div><div class="font-mono font-semibold" style="color:var(--text)">{{ wb.startMileage?.toLocaleString() }} км</div></div>
              <div><div class="label mb-0.5">Кон. пробег</div><div class="font-mono font-semibold" style="color:var(--text)">{{ wb.endMileage?.toLocaleString() || '—' }} км</div></div>
              <div v-if="wb.distanceDriven"><div class="label mb-0.5">Пройдено</div><div class="font-mono" style="color:var(--brand)">{{ wb.distanceDriven?.toFixed(1) }} км</div></div>
              <div><div class="label mb-0.5">Топливо выдано</div><div class="font-mono" style="color:var(--text)">{{ wb.fuelStart?.toFixed(1) }} л</div></div>
              <div><div class="label mb-0.5">Заправлено</div><div class="font-mono" style="color:var(--success)">+{{ wb.fuelAdded?.toFixed(1) }} л</div></div>
              <div v-if="wb.fuelEnd != null"><div class="label mb-0.5">Топливо на возврат</div><div class="font-mono" style="color:var(--text)">{{ wb.fuelEnd?.toFixed(1) }} л</div></div>
              <div v-if="wb.fuelConsumed != null"><div class="label mb-0.5">Фактический расход</div><div class="font-mono font-semibold" style="color:var(--danger)">-{{ wb.fuelConsumed?.toFixed(1) }} л</div></div>
            </div>
          </div>
          <!-- Fuel calculation summary -->
          <div v-if="wb.fuelCalculated" class="rounded-lg p-3 border" style="background:var(--brand-light);border-color:var(--border-2)">
            <div class="label mb-1">Расчёт расхода</div>
            <div class="text-sm space-y-0.5">
              <div class="flex justify-between"><span style="color:var(--text-3)">Тип пробега:</span><span class="font-medium" style="color:var(--text)">{{ normTypeLabel(wb.fuelNormType) }}</span></div>
              <div class="flex justify-between"><span style="color:var(--text-3)">Норма:</span><span class="font-mono" style="color:var(--text)">{{ wb.fuelNormUsed }} л/100 км</span></div>
              <div class="flex justify-between"><span style="color:var(--text-3)">Расчётный расход:</span><span class="font-mono font-semibold" style="color:var(--brand)">{{ wb.fuelCalculated?.toFixed(2) }} л</span></div>
              <div v-if="wb.fuelConsumed" class="flex justify-between border-t pt-1" style="border-color:var(--border)">
                <span style="color:var(--text-3)">Отклонение:</span>
                <span class="font-mono font-semibold" :style="Math.abs(wb.fuelConsumed - wb.fuelCalculated) > 2 ? 'color:var(--danger)' : 'color:var(--success)'">
                  {{ (wb.fuelConsumed - wb.fuelCalculated).toFixed(2) }} л
                </span>
              </div>
            </div>
          </div>
          <div v-if="wb.notes" class="border-t pt-3" style="border-color:var(--border)">
            <div class="label mb-1">Примечания</div>
            <div class="text-sm" style="color:var(--text)">{{ wb.notes }}</div>
          </div>
        </div>
      </div>

      <!-- Close form or TO alerts -->
      <div class="space-y-4">
        <div v-if="wb.status === 'ACTIVE'" class="card">
          <div class="card-header">
            <div class="w-2 h-2 rounded-full animate-pulse" style="background:var(--warning)" />
            <span class="font-semibold text-sm" style="color:var(--text)">Закрыть путевой лист</span>
          </div>
          <form @submit.prevent="closeWaybill" class="p-4 space-y-4">
            <div>
              <label class="label block mb-1.5">Конечный пробег (км) *</label>
              <input v-model.number="closeForm.endMileage" type="number" :min="wb.startMileage" step="0.1" class="inp"
                :placeholder="`мин. ${wb.startMileage}`" required @change="updateCalc" />
              <div v-if="closeForm.endMileage" class="text-xs mt-1 font-mono" style="color:var(--text-3)">
                Пройдено: {{ (closeForm.endMileage - wb.startMileage).toFixed(1) }} км
              </div>
            </div>

            <!-- Fuel norm type for calculation -->
            <div>
              <label class="label block mb-1.5">Тип пробега (для расчёта расхода)</label>
              <select v-model="closeForm.fuelNormType" @change="updateCalc" class="inp">
                <option value="">— Не указывать —</option>
                <option value="city_single">🏙️ Одиночный в городе</option>
                <option value="city_column">🏙️🚗 В колонне в городе</option>
                <option value="outside_single">🛣️ За пределами нас. пункта — одиночный</option>
                <option value="outside_column">🛣️🚗 За пределами нас. пункта — в колонне</option>
              </select>
            </div>

            <!-- Calculated preview -->
            <div v-if="calcResult" class="p-3 rounded-lg text-sm" style="background:var(--brand-light);border:1px solid var(--border-2)">
              <div class="label mb-1">Расчётный расход</div>
              <div class="font-mono font-bold text-lg" style="color:var(--brand)">{{ calcResult.toFixed(2) }} л</div>
              <div class="text-xs mt-0.5" style="color:var(--text-3)">{{ distanceDriven.toFixed(1) }} км × {{ calcNormUsed }} л/100 км</div>
            </div>

            <div>
              <label class="label block mb-1.5">Топливо на возврате (л) *</label>
              <input v-model.number="closeForm.fuelEnd" type="number" min="0" step="0.1" class="inp"
                :placeholder="`макс. ${(wb.fuelStart + wb.fuelAdded).toFixed(1)}`" required />
              <div class="text-xs mt-1 font-mono" :style="consumption >= 0 ? 'color:var(--text-3)' : 'color:var(--danger)'">
                Фактический расход: {{ consumption.toFixed(1) }} л
                <span v-if="consumption < 0" class="ml-1" style="color:var(--danger)">⚠️ Превышает выданное топливо!</span>
              </div>
            </div>

            <!-- TO alerts preview -->
            <div v-if="toAlerts.length" class="space-y-1">
              <div class="label">Уведомления ТО после закрытия:</div>
              <div v-for="a in toAlerts" :key="a.key" class="p-2 rounded text-xs font-semibold"
                :class="a.overdue ? 'alert-danger' : 'alert-warning'"
                :style="a.overdue ? 'color:var(--danger)' : 'color:var(--warning)'">
                ⚠ {{ a.type }}: {{ a.overdue ? `ПРОСРОЧЕНО на ${Math.abs(a.kmLeft)} км` : `через ${a.kmLeft} км` }}
              </div>
            </div>

            <div v-if="closeError" class="alert-danger text-sm" style="color:var(--danger)">{{ closeError }}</div>
            <button type="submit" :disabled="closing" class="btn btn-primary w-full justify-center py-2.5">
              {{ closing ? 'Закрытие...' : 'Закрыть путевой лист' }}
            </button>
          </form>
        </div>

        <div v-if="wb.status === 'CLOSED' && toAlerts.length" class="card">
          <div class="card-header">
            <div class="w-2 h-2 rounded-full" style="background:var(--warning)" />
            <span class="font-semibold text-sm" style="color:var(--warning)">Уведомления ТО</span>
          </div>
          <div class="p-4 space-y-2">
            <div v-for="a in toAlerts" :key="a.key" class="p-3 rounded-lg"
              :class="a.overdue ? 'alert-danger' : 'alert-warning'">
              <span class="font-semibold text-sm" :style="a.overdue ? 'color:var(--danger)' : 'color:var(--warning)'">
                {{ a.type }}: {{ a.overdue ? `ПРОСРОЧЕНО` : `через ${a.kmLeft} км` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-20 text-sm" style="color:var(--text-3)">Загрузка...</div>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: wbData, refresh } = await useFetch(`/api/waybills/${route.params.id}`)
const wb = computed(() => wbData.value as any)

const closeForm = reactive({ endMileage: null as number|null, fuelEnd: null as number|null, fuelNormType: '' })
const closeError = ref('')
const closing = ref(false)
const toAlerts = ref<any[]>([])

const NORM_FIELD: Record<string, string> = {
  city_single: 'normCity', city_column: 'normCityColumn',
  outside_single: 'normOutsideSingle', outside_column: 'normOutsideColumn'
}
const NORM_LABELS: Record<string, string> = {
  city_single: 'Город одиночный', city_column: 'Город колонна',
  outside_single: 'Вне города — одиночный', outside_column: 'Вне города — колонна'
}

const distanceDriven = computed(() =>
  closeForm.endMileage && wb.value ? (closeForm.endMileage - wb.value.startMileage) : 0)

const calcNormUsed = computed(() => {
  if (!closeForm.fuelNormType || !wb.value?.car) return null
  return wb.value.car[NORM_FIELD[closeForm.fuelNormType]] ?? null
})

const calcResult = computed(() => {
  if (!distanceDriven.value || !calcNormUsed.value) return null
  return (distanceDriven.value * calcNormUsed.value) / 100
})

const consumption = computed(() =>
  wb.value ? (wb.value.fuelStart + wb.value.fuelAdded - (closeForm.fuelEnd ?? 0)) : 0)

function updateCalc() {}

function normTypeLabel(key: string) { return NORM_LABELS[key] || key || '—' }

async function closeWaybill() {
  closeError.value = ''; closing.value = true
  try {
    const body: any = {
      endMileage: closeForm.endMileage,
      fuelEnd: closeForm.fuelEnd,
      distanceDriven: distanceDriven.value,
    }
    if (closeForm.fuelNormType && calcResult.value) {
      body.fuelNormType = closeForm.fuelNormType
      body.fuelNormUsed = calcNormUsed.value
      body.fuelCalculated = calcResult.value
    }
    const res = await $fetch(`/api/waybills/${route.params.id}/close`, { method: 'PATCH', body })
    toAlerts.value = (res as any).toAlerts || []
    await refresh()
  } catch (e: any) { closeError.value = e?.data?.message || 'Ошибка' }
  finally { closing.value = false }
}

const fmtDT = (d: string) => new Date(d).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })
const statusBadge = (s: string) => ({ ACTIVE: 'badge-success', CLOSED: 'badge-neutral', CANCELLED: 'badge-danger', DRAFT: 'badge-info' }[s] || 'badge-neutral')
const statusLabel = (s: string) => ({ ACTIVE: 'Активен', CLOSED: 'Закрыт', CANCELLED: 'Отменён', DRAFT: 'Черновик' }[s] || s)
</script>

<script lang="ts">
// Simple row component
export default { components: { 'row-item': { props: ['label', 'value'], template: `<div class="flex justify-between items-start gap-3"><span class="label flex-shrink-0">{{label}}</span><span class="text-sm text-right" style="color:var(--text)">{{value || '—'}}</span></div>` } } }
</script>
