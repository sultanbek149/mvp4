<template>
  <div class="max-w-2xl">
    <div class="flex items-center gap-3 mb-5">
      <NuxtLink to="/waybills" class="btn btn-secondary btn-sm">← Назад</NuxtLink>
      <h1 class="font-semibold text-lg" style="color:var(--text)">Новый путевой лист</h1>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="w-2 h-2 rounded-full" style="background:var(--brand)" />
        <span class="font-semibold text-sm" style="color:var(--text)">Данные путевого листа</span>
      </div>
      <form @submit.prevent="createWaybill" class="p-4 lg:p-5 space-y-4">
        <div>
          <label class="label block mb-1.5">Автомобиль *</label>
          <select v-model="form.carId" @change="onCarChange" class="inp" required>
            <option value="">— Выберите автомобиль —</option>
            <option v-for="car in availableCars" :key="car.id" :value="car.id">
              {{ car.brand }} {{ car.model }} · {{ car.plateNumber }}
            </option>
          </select>
        </div>

        <div v-if="selectedCar" class="grid grid-cols-2 gap-3 p-3 rounded-lg" style="background:var(--bg-3);border:1px solid var(--border)">
          <div><div class="label mb-0.5">Пробег</div><div class="font-mono font-semibold" style="color:var(--text)">{{ selectedCar.totalMileage.toLocaleString() }} км</div></div>
          <div><div class="label mb-0.5">Остаток топлива</div><div class="font-mono font-semibold" style="color:var(--brand)">{{ selectedCar.fuelBalance.toFixed(1) }} л</div></div>
          <div><div class="label mb-0.5">Объём бака</div><div class="font-mono text-sm" style="color:var(--text-2)">{{ selectedCar.tankCapacity }} л</div></div>
          <div><div class="label mb-0.5">Топливо</div><div class="font-mono text-sm" style="color:var(--text-2)">{{ fuelLabel(selectedCar.fuelType) }}</div></div>
        </div>

        <!-- Driver select - admin picks any driver, driver sees only themselves -->
        <div>
          <label class="label block mb-1.5">Водитель *</label>
          <div v-if="isDriver() && myDriver" class="p-3 rounded-lg border flex items-center gap-3"
            style="background:var(--bg-3);border-color:var(--border)">
            <span class="text-xl">👤</span>
            <div>
              <div class="font-semibold text-sm" style="color:var(--text)">{{ myDriver.name }}</div>
              <div class="text-xs" style="color:var(--text-3)">Кат. {{ myDriver.licenseCategory }}</div>
            </div>
          </div>
          <select v-else v-model="form.driverId" class="inp" required>
            <option value="">— Выберите водителя —</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id" :disabled="!d.isActive">
              {{ d.name }} ({{ d.licenseCategory }}){{ !d.isActive ? ' [неактивен]' : '' }}
            </option>
          </select>
        </div>

        <div><label class="label block mb-1.5">Дата *</label><input v-model="form.date" type="date" class="inp" required /></div>

        <div>
          <label class="label block mb-1.5">Заправка при выдаче (л)</label>
          <input v-model.number="form.fuelAdded" type="number" min="0" step="0.1" class="inp" placeholder="0" />
          <div v-if="selectedCar" class="text-xs mt-1 font-mono" style="color:var(--text-3)">
            После заправки: {{ ((selectedCar.fuelBalance || 0) + (form.fuelAdded || 0)).toFixed(1) }} л
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label class="label block mb-1.5">Откуда</label><input v-model="form.routeStart" class="inp" placeholder="Автопарк в/ч 5547" /></div>
          <div><label class="label block mb-1.5">Куда</label><input v-model="form.routeEnd" class="inp" placeholder="Объект №1" /></div>
        </div>

        <details class="rounded-lg border" style="border-color:var(--border)">
          <summary class="px-4 py-3 cursor-pointer text-sm font-medium" style="color:var(--text-2)">📍 Координаты (для карты)</summary>
          <div class="p-4 pt-2 grid grid-cols-2 gap-3">
            <div><label class="label block mb-1">Широта старта</label><input v-model.number="form.startLat" type="number" step="0.000001" class="inp" /></div>
            <div><label class="label block mb-1">Долгота старта</label><input v-model.number="form.startLng" type="number" step="0.000001" class="inp" /></div>
            <div><label class="label block mb-1">Широта финиша</label><input v-model.number="form.endLat" type="number" step="0.000001" class="inp" /></div>
            <div><label class="label block mb-1">Долгота финиша</label><input v-model.number="form.endLng" type="number" step="0.000001" class="inp" /></div>
          </div>
        </details>

        <div><label class="label block mb-1.5">Примечания</label><textarea v-model="form.notes" class="inp" rows="2" style="resize:none" /></div>

        <div v-if="error" class="alert-danger text-sm" style="color:var(--danger)">⚠ {{ error }}</div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button type="submit" :disabled="loading" class="btn btn-primary flex-1 justify-center py-2.5">
            {{ loading ? 'Создание...' : 'Создать путевой лист' }}
          </button>
          <NuxtLink to="/waybills" class="btn btn-secondary flex-1 justify-center py-2.5">Отмена</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isDriver } = useAuth()
const { data: carsData } = await useFetch('/api/cars')
const { data: driversData } = await useFetch('/api/drivers')
const availableCars = computed(() => ((carsData.value as any[]) || []).filter((c: any) => c.status === 'ACTIVE'))
const drivers = computed(() => ((driversData.value as any[]) || []).filter((d: any) => d.isActive))
const myDriver = computed(() => drivers.value[0] || null)

const form = reactive({
  carId: '', driverId: '',
  date: new Date().toISOString().split('T')[0],
  fuelAdded: 0, routeStart: '', routeEnd: '',
  startLat: null as any, startLng: null as any, endLat: null as any, endLng: null as any, notes: ''
})
const selectedCar = computed(() => availableCars.value.find((c: any) => c.id === form.carId))
const error = ref(''); const loading = ref(false)

// Auto-fill for driver
onMounted(() => {
  if (isDriver() && myDriver.value) form.driverId = myDriver.value.id
  if (availableCars.value.length === 1) form.carId = availableCars.value[0].id
})
watch(() => availableCars.value, (cars) => {
  if (cars.length === 1) form.carId = cars[0].id
}, { immediate: true })
watch(() => myDriver.value, (d) => {
  if (d && isDriver()) form.driverId = d.id
}, { immediate: true })

function onCarChange() {}
const fuelLabel = (t: string) => ({ DIESEL: 'Дизель', GASOLINE: 'Бензин', GAS: 'Газ', ELECTRIC: 'Электро' }[t] || t)

async function createWaybill() {
  error.value = ''; loading.value = true
  try {
    const wb = await $fetch('/api/waybills', { method: 'POST', body: form })
    await navigateTo(`/waybills/${(wb as any).id}`)
  } catch (e: any) { error.value = e?.data?.message || 'Ошибка' }
  finally { loading.value = false }
}
</script>
