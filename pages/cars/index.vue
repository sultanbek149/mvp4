<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3">
      <div class="flex gap-2 flex-wrap">
        <button v-for="s in statuses" :key="s.v" @click="filter = s.v"
          class="btn btn-sm" :class="filter === s.v ? 'btn-primary' : 'btn-secondary'">{{ s.l }}</button>
      </div>
      <button v-if="isSuperAdmin()" @click="showForm = true" class="btn btn-primary flex-shrink-0">+ Добавить</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat-card"><div class="label mb-1">Всего</div><div class="text-2xl font-bold" style="color:var(--text)">{{ cars.length }}</div></div>
      <div class="stat-card"><div class="label mb-1">Активных</div><div class="text-2xl font-bold" style="color:var(--brand)">{{ cars.filter(c => c.status === 'ACTIVE').length }}</div></div>
      <div class="stat-card"><div class="label mb-1">На ТО</div><div class="text-2xl font-bold" style="color:var(--warning)">{{ cars.filter(c => c.status === 'MAINTENANCE').length }}</div></div>
      <div class="stat-card"><div class="label mb-1">Требуют ТО</div><div class="text-2xl font-bold" style="color:var(--danger)">{{ cars.filter(c => c.maintenanceAlerts?.length).length }}</div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">Реестр автомобилей</span>
        <span class="ml-1 text-xs" style="color:var(--text-3)">({{ cars.length }})</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr>
            <th>Гос. номер</th><th>Марка / Модель</th><th>Год</th>
            <th>Топливо</th><th>Пробег</th>
            <th>Нормы расхода</th>
            <th>ТО</th><th>Статус</th><th></th>
          </tr></thead>
          <tbody>
            <tr v-for="car in cars" :key="car.id">
              <td><span class="font-mono text-sm font-semibold" style="color:var(--brand)">{{ car.plateNumber }}</span></td>
              <td><div class="font-medium text-sm" style="color:var(--text)">{{ car.brand }} {{ car.model }}</div></td>
              <td class="text-sm" style="color:var(--text-3)">{{ car.year }}</td>
              <td>
                <div class="flex items-center gap-2 min-w-[110px]">
                  <div class="flex-1 fuel-bar">
                    <div class="fuel-bar-fill" :class="fuelClass(car)"
                      :style="`width:${Math.min(100,(car.fuelBalance/car.tankCapacity)*100)}%`" />
                  </div>
                  <span class="text-xs font-mono whitespace-nowrap" style="color:var(--text-2)">
                    {{ car.fuelBalance.toFixed(0) }}/{{ car.tankCapacity }}л
                  </span>
                </div>
              </td>
              <td class="text-sm font-mono" style="color:var(--text-2)">{{ car.totalMileage.toLocaleString() }} км</td>
              <td class="text-xs">
                <div v-if="car.normCity" class="grid grid-cols-2 gap-x-3 gap-y-0.5 min-w-[140px]">
                  <span style="color:var(--text-3)">Город 1:</span><span class="font-mono" style="color:var(--text)">{{ car.normCity }}</span>
                  <span style="color:var(--text-3)">Город ↑:</span><span class="font-mono" style="color:var(--text)">{{ car.normCityColumn }}</span>
                  <span style="color:var(--text-3)">Вне 1:</span><span class="font-mono" style="color:var(--text)">{{ car.normOutsideSingle }}</span>
                  <span style="color:var(--text-3)">Вне ↑:</span><span class="font-mono" style="color:var(--text)">{{ car.normOutsideColumn }}</span>
                </div>
                <button v-if="isSuperAdmin()" @click="openNormsEdit(car)"
                  class="text-xs mt-1 underline" style="color:var(--brand)">
                  {{ car.normCity ? '✏️ Изменить' : '⚠️ Не заданы' }}
                </button>
              </td>
              <td>
                <div class="flex flex-col gap-0.5">
                  <span v-for="a in (car.maintenanceAlerts || [])" :key="a.key"
                    class="badge text-xs" :class="a.overdue ? 'badge-danger' : 'badge-warning'">
                    {{ a.type }}{{ a.overdue ? ' ‼' : '' }}
                  </span>
                </div>
              </td>
              <td><span class="badge" :class="statusBadge(car.status)">{{ statusLabel(car.status) }}</span></td>
              <td><NuxtLink :to="`/cars/${car.id}`" class="btn btn-secondary btn-sm">→</NuxtLink></td>
            </tr>
            <tr v-if="!cars.length"><td colspan="9" class="text-center py-10 text-sm" style="color:var(--text-3)">Нет автомобилей</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Car Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box max-w-xl">
        <div class="modal-header">
          <h3 class="font-semibold" style="color:var(--text)">Добавить автомобиль</h3>
          <button @click="showForm = false" style="color:var(--text-3)">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div class="flex gap-2 p-1 rounded-lg" style="background:var(--bg-3)">
            <button @click="addMode = 'preset'" class="flex-1 py-2 rounded-md text-sm font-medium transition-all"
              :style="addMode === 'preset' ? 'background:var(--bg-2);color:var(--brand)' : 'color:var(--text-2)'">
              📋 Из реестра
            </button>
            <button @click="addMode = 'manual'" class="flex-1 py-2 rounded-md text-sm font-medium transition-all"
              :style="addMode === 'manual' ? 'background:var(--bg-2);color:var(--brand)' : 'color:var(--text-2)'">
              ✏️ Вручную
            </button>
          </div>

          <div v-if="addMode === 'preset'" class="space-y-2 max-h-56 overflow-y-auto">
            <button v-for="p in presets" :key="p.plateNumber" @click="fillPreset(p)"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all"
              :style="form.plateNumber === p.plateNumber ? 'background:var(--brand-pale);border-color:var(--brand)' : 'background:var(--bg-2);border-color:var(--border)'">
              <span class="font-medium" style="color:var(--text)">{{ p.brand }} {{ p.model }}</span>
              <span class="font-mono text-xs" style="color:var(--text-3)">{{ p.plateNumber }}</span>
            </button>
          </div>

          <div v-if="addMode === 'manual'" class="grid grid-cols-2 gap-3">
            <div><label class="label block mb-1">Марка *</label><input v-model="form.brand" class="inp" /></div>
            <div><label class="label block mb-1">Модель</label><input v-model="form.model" class="inp" /></div>
            <div class="col-span-2"><label class="label block mb-1">Гос. номер *</label><input v-model="form.plateNumber" class="inp" /></div>
            <div>
              <label class="label block mb-1">Тип топлива</label>
              <select v-model="form.fuelType" class="inp">
                <option value="DIESEL">Дизель</option><option value="GASOLINE">Бензин</option>
                <option value="GAS">Газ</option><option value="ELECTRIC">Электро</option>
              </select>
            </div>
            <div><label class="label block mb-1">Объём бака (л)</label><input v-model.number="form.tankCapacity" type="number" class="inp" /></div>
          </div>

          <!-- Always show these fields -->
          <div class="grid grid-cols-2 gap-3 pt-2 border-t" style="border-color:var(--border)">
            <div><label class="label block mb-1">Год</label><input v-model.number="form.year" type="number" class="inp" /></div>
            <div><label class="label block mb-1">Начальный пробег (км)</label><input v-model.number="form.totalMileage" type="number" class="inp" /></div>
            <div><label class="label block mb-1">Остаток топлива (л)</label><input v-model.number="form.fuelBalance" type="number" class="inp" /></div>
          </div>

          <!-- Fuel norms (SUPER_ADMIN only) -->
          <div class="border-t pt-3 space-y-2" style="border-color:var(--border)">
            <div class="label">⛽ Нормы расхода (л/100 км)</div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label block mb-1">🏙️ Одиночный в городе</label><input v-model.number="form.normCity" type="number" step="0.1" class="inp" placeholder="0.0" /></div>
              <div><label class="label block mb-1">🏙️🚗 В колонне в городе</label><input v-model.number="form.normCityColumn" type="number" step="0.1" class="inp" placeholder="0.0" /></div>
              <div><label class="label block mb-1">🛣️ Вне нас. пункта — один</label><input v-model.number="form.normOutsideSingle" type="number" step="0.1" class="inp" placeholder="0.0" /></div>
              <div><label class="label block mb-1">🛣️🚗 Вне нас. пункта — колонна</label><input v-model.number="form.normOutsideColumn" type="number" step="0.1" class="inp" placeholder="0.0" /></div>
            </div>
          </div>

          <div v-if="error" class="alert-danger text-sm" style="color:var(--danger)">{{ error }}</div>
          <div class="flex gap-3">
            <button @click="createCar" class="btn btn-primary flex-1 justify-center">Добавить</button>
            <button @click="showForm = false" class="btn btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit norms modal -->
    <div v-if="normsEditCar" class="modal-overlay" @click.self="normsEditCar = null">
      <div class="modal-box max-w-md">
        <div class="modal-header">
          <div>
            <h3 class="font-semibold" style="color:var(--text)">Нормы расхода</h3>
            <div class="text-xs font-mono" style="color:var(--brand)">{{ normsEditCar.brand }} {{ normsEditCar.plateNumber }}</div>
          </div>
          <button @click="normsEditCar = null" style="color:var(--text-3)">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 gap-3">
            <div v-for="t in normTypes" :key="t.key" class="flex items-center gap-3">
              <div class="flex-1">
                <label class="label block mb-1">{{ t.icon }} {{ t.label }}</label>
                <input v-model.number="normsForm[t.field]" type="number" step="0.1" min="0" class="inp" placeholder="л/100 км" />
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="saveNorms" class="btn btn-primary flex-1 justify-center">Сохранить</button>
            <button @click="normsEditCar = null" class="btn btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isSuperAdmin } = useAuth()
const filter = ref('')
const showForm = ref(false)
const addMode = ref<'preset'|'manual'>('preset')
const error = ref('')
const normsEditCar = ref<any>(null)
const normsForm = reactive({ normCity: null as any, normCityColumn: null as any, normOutsideSingle: null as any, normOutsideColumn: null as any })

const normTypes = [
  { key: 'city_single',    label: 'Одиночный в городе',                   shortLabel: 'Город одиночный',  field: 'normCity',          icon: '🏙️' },
  { key: 'city_column',    label: 'В колонне в городе',                   shortLabel: 'Город колонна',    field: 'normCityColumn',    icon: '🏙️🚗' },
  { key: 'outside_single', label: 'За пределами нас. пункта — одиночный', shortLabel: 'Вне города один',  field: 'normOutsideSingle', icon: '🛣️' },
  { key: 'outside_column', label: 'За пределами нас. пункта — в колонне', shortLabel: 'Вне города колонна', field: 'normOutsideColumn', icon: '🛣️🚗' },
]

const statuses = [
  { v: '', l: 'Все' }, { v: 'ACTIVE', l: 'Активные' }, { v: 'MAINTENANCE', l: 'На ТО' }, { v: 'INACTIVE', l: 'Неактивные' }
]
const url = computed(() => `/api/cars${filter.value ? `?status=${filter.value}` : ''}`)
const { data, refresh } = await useFetch(url)
const cars = computed(() => (data.value as any[]) || [])

const { data: presetsData } = await useFetch('/api/cars/presets')
const presets = computed(() => (presetsData.value as any[]) || [])

const form = reactive({ brand: '', model: '', plateNumber: '', year: new Date().getFullYear(), fuelType: 'DIESEL', tankCapacity: 100, fuelBalance: 0, totalMileage: 0, normCity: null as any, normCityColumn: null as any, normOutsideSingle: null as any, normOutsideColumn: null as any })

function fillPreset(p: any) {
  Object.assign(form, { brand: p.brand, model: p.model, plateNumber: p.plateNumber, fuelType: p.fuelType, tankCapacity: p.tankCapacity })
}

function openNormsEdit(car: any) {
  normsEditCar.value = car
  Object.assign(normsForm, { normCity: car.normCity, normCityColumn: car.normCityColumn, normOutsideSingle: car.normOutsideSingle, normOutsideColumn: car.normOutsideColumn })
}

async function saveNorms() {
  const car = normsEditCar.value
  await $fetch(`/api/cars/${car.id}`, { method: 'PUT', body: { ...car, ...normsForm } })
  normsEditCar.value = null
  await refresh()
}

async function createCar() {
  error.value = ''
  if (!form.brand || !form.plateNumber) { error.value = 'Заполните Марку и Гос. номер'; return }
  try {
    await $fetch('/api/cars', { method: 'POST', body: form })
    showForm.value = false
    await refresh()
  } catch (e: any) { error.value = e?.data?.message || 'Ошибка' }
}

const fuelClass = (car: any) => { const p = car.fuelBalance / car.tankCapacity; return p > 0.5 ? 'fuel-high' : p > 0.2 ? 'fuel-medium' : 'fuel-low' }
const statusBadge = (s: string) => ({ ACTIVE: 'badge-success', MAINTENANCE: 'badge-warning', INACTIVE: 'badge-neutral' }[s] || 'badge-neutral')
const statusLabel = (s: string) => ({ ACTIVE: 'Активен', MAINTENANCE: 'На ТО', INACTIVE: 'Неактивен' }[s] || s)
</script>
