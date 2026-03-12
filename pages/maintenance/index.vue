<template>
  <div class="space-y-5">
    <div v-if="isDriver()" class="alert-info flex items-start gap-3">
      <span class="text-xl">ℹ️</span>
      <div>
        <div class="font-semibold text-sm" style="color:var(--info)">Техническое обслуживание</div>
        <div class="text-sm mt-0.5" style="color:var(--text-2)">Записи ведёт администратор. При уведомлении — сообщите нач. автослужбы.</div>
      </div>
    </div>

    <div class="flex justify-end" v-if="isAdmin()">
      <button @click="showForm = true" class="btn btn-primary">+ Записать ТО</button>
    </div>

    <!-- TO schedule reference -->
    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">📅 График технического обслуживания</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Вид ТО</th><th>Интервал</th><th>Предупреждение за</th></tr></thead>
          <tbody>
            <tr v-for="s in toSchedule" :key="s.key">
              <td><span class="badge badge-info">{{ s.type }}</span></td>
              <td class="font-mono text-sm">каждые {{ s.interval.toLocaleString() }} км</td>
              <td class="font-mono text-sm" style="color:var(--warning)">за {{ s.warnBefore.toLocaleString() }} км</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="alerts.length" class="card" style="border-color:rgba(217,119,6,0.3)">
      <div class="card-header">
        <div class="w-2 h-2 rounded-full animate-pulse" style="background:var(--warning)" />
        <span class="font-semibold text-sm" style="color:var(--warning)">Требуют внимания ({{ alerts.length }} авто)</span>
      </div>
      <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="item in alerts" :key="item.car.id"
          class="p-3 rounded-lg border" style="border-color:var(--border);background:var(--bg-3)">
          <div class="font-semibold text-sm" style="color:var(--text)">{{ item.car.brand }} {{ item.car.model }}</div>
          <div class="font-mono text-xs" style="color:var(--brand)">{{ item.car.plateNumber }}</div>
          <div class="mt-1 space-y-0.5">
            <div v-for="a in item.alerts" :key="a.key" class="text-xs font-semibold"
              :style="a.overdue ? 'color:var(--danger)' : 'color:var(--warning)'">
              {{ a.type }}: {{ a.overdue ? `ПРОСРОЧЕНО на ${Math.abs(a.kmLeft)} км` : `через ${a.kmLeft} км` }}
            </div>
          </div>
          <div class="text-xs mt-2" style="color:var(--text-3)">
            Пробег: {{ item.car.totalMileage.toLocaleString() }} км
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!isDriver()" class="alert-success flex items-center gap-2">
      <span>✅</span>
      <span class="text-sm" style="color:var(--success)">Все автомобили в норме</span>
    </div>

    <!-- History -->
    <div v-if="!isDriver()" class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">Журнал ТО</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Дата</th><th>Авто</th><th>Вид</th><th>Пробег</th><th>Следующее</th><th>Стоимость</th><th>Описание</th></tr></thead>
          <tbody>
            <tr v-for="m in records" :key="m.id">
              <td class="text-xs font-mono" style="color:var(--text-3)">{{ fmtDate(m.serviceDate) }}</td>
              <td class="text-xs">{{ m.car?.brand }} <span class="font-mono" style="color:var(--brand)">{{ m.car?.plateNumber }}</span></td>
              <td><span class="badge badge-info">{{ toLabel(m.type) }}</span></td>
              <td class="text-xs font-mono">{{ m.mileageAtService.toLocaleString() }} км</td>
              <td class="text-xs font-mono" style="color:var(--text-3)">{{ m.nextServiceMileage.toLocaleString() }} км</td>
              <td class="text-xs">{{ m.cost ? m.cost.toLocaleString() + ' ₸' : '—' }}</td>
              <td class="text-xs max-w-40 truncate" style="color:var(--text-3)">{{ m.description || '—' }}</td>
            </tr>
            <tr v-if="!records.length"><td colspan="7" class="text-center py-8 text-sm" style="color:var(--text-3)">Нет записей</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add TO modal -->
    <div v-if="showForm && isAdmin()" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box max-w-lg">
        <div class="modal-header">
          <h3 class="font-semibold" style="color:var(--text)">Записать ТО</h3>
          <button @click="showForm = false" style="color:var(--text-3)">✕</button>
        </div>
        <form @submit.prevent="createRecord" class="p-5 space-y-4">
          <div>
            <label class="label block mb-1.5">Автомобиль *</label>
            <select v-model="form.carId" @change="onCarChange" class="inp" required>
              <option value="">— Выберите —</option>
              <option v-for="c in cars" :key="c.id" :value="c.id">{{ c.brand }} {{ c.plateNumber }} ({{ c.totalMileage.toLocaleString() }} км)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label block mb-1.5">Вид ТО *</label>
              <select v-model="form.type" @change="updateNext" class="inp" required>
                <option value="TO1">ТО-1 (каждые 1 800 км)</option>
                <option value="TO2">ТО-2 (каждые 3 600 км)</option>
                <option value="TO3">ТО-3 (каждые 5 400 км)</option>
                <option value="TO4">ТО-4 (каждые 7 200 км)</option>
                <option value="REPAIR">Ремонт</option>
                <option value="OTHER">Прочее</option>
              </select>
            </div>
            <div>
              <label class="label block mb-1.5">Дата *</label>
              <input v-model="form.serviceDate" type="date" class="inp" required />
            </div>
            <div>
              <label class="label block mb-1.5">Пробег при ТО (км) *</label>
              <input v-model.number="form.mileageAtService" @change="updateNext" type="number" class="inp" required />
            </div>
            <div>
              <label class="label block mb-1.5">Следующее ТО (км)</label>
              <input v-model.number="form.nextServiceMileage" type="number" class="inp" />
            </div>
            <div class="col-span-2">
              <label class="label block mb-1.5">Стоимость (₸)</label>
              <input v-model.number="form.cost" type="number" class="inp" placeholder="0" />
            </div>
          </div>
          <div>
            <label class="label block mb-1.5">Описание</label>
            <textarea v-model="form.description" class="inp" rows="3" style="resize:none" />
          </div>
          <div v-if="err" class="alert-danger text-sm" style="color:var(--danger)">{{ err }}</div>
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1 justify-center">Сохранить</button>
            <button type="button" @click="showForm = false" class="btn btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAdmin, isDriver } = useAuth()
const showForm = ref(false)
const err = ref('')

const TO_SCHEDULE_UI = [
  { key: 'TO1', type: 'ТО-1', interval: 1800, warnBefore: 600 },
  { key: 'TO2', type: 'ТО-2', interval: 3600, warnBefore: 1200 },
  { key: 'TO3', type: 'ТО-3', interval: 5400, warnBefore: 1800 },
  { key: 'TO4', type: 'ТО-4', interval: 7200, warnBefore: 2400 },
]
const toSchedule = TO_SCHEDULE_UI

const { data: recordsData, refresh } = await useFetch('/api/maintenance')
const { data: alertsData } = await useFetch('/api/maintenance?alerts=true')
const { data: carsData } = !isDriver() ? await useFetch('/api/cars') : { data: ref([]) }

const records = computed(() => (recordsData.value as any[]) || [])
const alerts = computed(() => (alertsData.value as any[]) || [])
const cars = computed(() => (carsData.value as any[]) || [])

const INTERVALS: Record<string, number> = { TO1: 1800, TO2: 3600, TO3: 5400, TO4: 7200 }
const form = reactive({ carId: '', type: 'TO1', mileageAtService: 0, nextServiceMileage: 1800, serviceDate: new Date().toISOString().split('T')[0], cost: null as any, description: '' })

function onCarChange() {
  const c = cars.value.find((c: any) => c.id === form.carId)
  if (c) { form.mileageAtService = c.totalMileage; updateNext() }
}
function updateNext() {
  const i = INTERVALS[form.type]; if (i) form.nextServiceMileage = form.mileageAtService + i
}

async function createRecord() {
  err.value = ''
  try {
    await $fetch('/api/maintenance', { method: 'POST', body: form })
    showForm.value = false; await refresh()
  } catch (e: any) { err.value = e?.data?.message || 'Ошибка' }
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU')
const toLabel = (t: string) => ({ TO1: 'ТО-1', TO2: 'ТО-2', TO3: 'ТО-3', TO4: 'ТО-4', REPAIR: 'Ремонт', OTHER: 'Прочее' }[t] || t)
</script>
