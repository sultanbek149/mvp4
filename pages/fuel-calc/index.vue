<template>
  <div class="max-w-2xl space-y-5">

    <div class="card">
      <div class="card-header">
        <span class="text-xl">⛽</span>
        <span class="font-semibold text-sm" style="color:var(--text)">Калькулятор расхода топлива</span>
      </div>
      <div class="p-5 space-y-5">

        <!-- Car select -->
        <div>
          <label class="label block mb-1.5">Автомобиль</label>
          <div v-if="myCars.length === 1" class="p-3 rounded-lg border flex items-center gap-3"
            style="background:var(--bg-3);border-color:var(--border)">
            <span class="text-xl">🚛</span>
            <div>
              <div class="font-semibold text-sm" style="color:var(--text)">{{ myCars[0].brand }} {{ myCars[0].model }}</div>
              <div class="font-mono text-xs" style="color:var(--brand)">{{ myCars[0].plateNumber }}</div>
            </div>
          </div>
          <select v-else v-model="selectedCarId" class="inp" @change="onCarChange">
            <option value="">— Выберите автомобиль —</option>
            <option v-for="c in myCars" :key="c.id" :value="c.id">
              {{ c.brand }} {{ c.model }} · {{ c.plateNumber }}
            </option>
          </select>
        </div>

        <!-- Norms info for selected car -->
        <div v-if="selectedCar && hasNorms" class="rounded-lg p-3 border text-xs" style="background:var(--bg-3);border-color:var(--border)">
          <div class="label mb-2">Нормы расхода для {{ selectedCar.brand }} {{ selectedCar.model }}</div>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="t in normTypes" :key="t.key" class="flex justify-between items-center">
              <span style="color:var(--text-3)">{{ t.shortLabel }}</span>
              <span class="font-mono font-semibold" :style="selectedNorm?.key === t.key ? 'color:var(--brand)' : 'color:var(--text-2)'">
                {{ getNorm(t.field) !== null ? getNorm(t.field) + ' л/100' : '—' }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="selectedCar && !hasNorms" class="alert-warning text-sm" style="color:var(--warning)">
          ⚠️ Нормы расхода для этого автомобиля не установлены. Обратитесь к Суперадмину.
        </div>

        <!-- Distance input -->
        <div>
          <label class="label block mb-1.5">Пройденный километраж (км)</label>
          <input v-model.number="distance" type="number" min="0" step="0.1" class="inp"
            placeholder="Например: 150.5" />
        </div>

        <!-- Norm type select -->
        <div>
          <label class="label block mb-1.5">Тип пробега</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button v-for="t in normTypes" :key="t.key"
              @click="selectedNormKey = t.key"
              class="flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
              :style="selectedNormKey === t.key
                ? 'background:var(--brand-pale);border-color:var(--brand)'
                : 'background:var(--bg-2);border-color:var(--border)'">
              <span class="text-lg leading-none flex-shrink-0">{{ t.icon }}</span>
              <div>
                <div class="text-xs font-semibold" :style="selectedNormKey === t.key ? 'color:var(--brand)' : 'color:var(--text)'">
                  {{ t.label }}
                </div>
                <div class="text-xs mt-0.5" style="color:var(--text-3)">
                  {{ getNorm(t.field) !== null ? getNorm(t.field) + ' л/100 км' : 'норма не задана' }}
                </div>
              </div>
              <div v-if="selectedNormKey === t.key" class="ml-auto text-brand flex-shrink-0" style="color:var(--brand)">✓</div>
            </button>
          </div>
        </div>

        <!-- Manual norm override -->
        <div>
          <label class="label block mb-1.5">
            Норма расхода (л/100 км)
            <span class="ml-1 text-xs font-normal" style="color:var(--text-3)">(можно изменить вручную)</span>
          </label>
          <input v-model.number="manualNorm" type="number" min="0" step="0.1" class="inp"
            :placeholder="selectedNorm ? String(getNorm(selectedNorm.field) || '') : 'л/100 км'" />
        </div>

        <!-- Result -->
        <div v-if="result !== null" class="rounded-xl p-5 text-center"
          style="background:var(--brand-pale);border:2px solid var(--brand)">
          <div class="label mb-2">Расчётный расход топлива</div>
          <div class="text-4xl font-bold" style="color:var(--brand)">{{ result.toFixed(2) }} л</div>
          <div class="text-xs mt-2" style="color:var(--text-3)">
            {{ distance }} км × {{ effectiveNorm }} л/100 = {{ result.toFixed(2) }} л
          </div>
          <div v-if="selectedCar" class="text-xs mt-1" style="color:var(--text-3)">
            Остаток в баке: {{ selectedCar.fuelBalance.toFixed(1) }} л
            <span v-if="selectedCar.fuelBalance < result" class="ml-2 font-semibold" style="color:var(--danger)">
              ⚠️ Недостаточно топлива!
            </span>
          </div>
        </div>
        <div v-else-if="distance > 0 && !effectiveNorm" class="alert-warning text-sm" style="color:var(--warning)">
          Выберите тип пробега или введите норму расхода
        </div>
      </div>
    </div>

    <!-- History for this driver - last waybills with fuel data -->
    <div v-if="recentWaybills.length" class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">Последние поездки</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Дата</th><th>Маршрут</th><th>Пробег</th><th>Тип</th><th>Расчёт</th><th>Факт</th></tr></thead>
          <tbody>
            <tr v-for="wb in recentWaybills" :key="wb.id">
              <td class="text-xs font-mono" style="color:var(--text-3)">{{ fmtDate(wb.date) }}</td>
              <td class="text-xs max-w-32 truncate" style="color:var(--text-2)">{{ wb.routeStart || '—' }} → {{ wb.routeEnd || '—' }}</td>
              <td class="text-xs font-mono">
                {{ wb.distanceDriven ? wb.distanceDriven.toFixed(1) + ' км' : '—' }}
              </td>
              <td class="text-xs" style="color:var(--text-3)">
                {{ wb.fuelNormType ? normTypes.find(t => t.key === wb.fuelNormType)?.shortLabel || wb.fuelNormType : '—' }}
              </td>
              <td class="text-xs font-mono" style="color:var(--brand)">
                {{ wb.fuelCalculated ? wb.fuelCalculated.toFixed(1) + ' л' : '—' }}
              </td>
              <td class="text-xs font-mono" :style="wb.fuelConsumed ? 'color:var(--danger)' : 'color:var(--text-3)'">
                {{ wb.fuelConsumed ? wb.fuelConsumed.toFixed(1) + ' л' : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FUEL_NORM_TYPES } from '~/server/utils/maintenance'

const { data: carsData } = await useFetch('/api/cars')
const { data: wbData } = await useFetch('/api/waybills?status=CLOSED')
const myCars = computed(() => (carsData.value as any[]) || [])
const recentWaybills = computed(() => ((wbData.value as any[]) || []).slice(0, 8))

const selectedCarId = ref('')
const distance = ref<number>(0)
const selectedNormKey = ref('')
const manualNorm = ref<number | null>(null)

// Auto-select if only one car
onMounted(() => {
  if (myCars.value.length === 1) {
    selectedCarId.value = myCars.value[0].id
  }
})
watch(() => myCars.value, (cars) => {
  if (cars.length === 1 && !selectedCarId.value) selectedCarId.value = cars[0].id
}, { immediate: true })

function onCarChange() { selectedNormKey.value = ''; manualNorm.value = null }

const selectedCar = computed(() => myCars.value.find((c: any) => c.id === selectedCarId.value))

const normTypes = [
  { key: 'city_single',    label: 'Одиночный в городе',                     shortLabel: 'Город одиночный',  field: 'normCity',          icon: '🏙️' },
  { key: 'city_column',    label: 'В колонне в городе',                     shortLabel: 'Город колонна',    field: 'normCityColumn',    icon: '🏙️🚗' },
  { key: 'outside_single', label: 'За пределами нас. пункта — одиночный',   shortLabel: 'Вне города один',  field: 'normOutsideSingle', icon: '🛣️' },
  { key: 'outside_column', label: 'За пределами нас. пункта — в колонне',   shortLabel: 'Вне города колонна', field: 'normOutsideColumn', icon: '🛣️🚗' },
]

const getNorm = (field: string) => selectedCar.value?.[field] ?? null
const hasNorms = computed(() => normTypes.some(t => getNorm(t.field) !== null))
const selectedNorm = computed(() => normTypes.find(t => t.key === selectedNormKey.value))

const effectiveNorm = computed(() => {
  if (manualNorm.value && manualNorm.value > 0) return manualNorm.value
  if (selectedNorm.value) return getNorm(selectedNorm.value.field) ?? null
  return null
})

const result = computed(() => {
  if (!distance.value || distance.value <= 0 || !effectiveNorm.value) return null
  return (distance.value * effectiveNorm.value) / 100
})

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
</script>
