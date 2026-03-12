<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="font-semibold" style="color:var(--text)">Учёт топлива</h2>
        <p class="text-xs mt-0.5" style="color:var(--text-3)">Операции фиксирует диспетчер или администратор</p>
      </div>
      <button @click="showRefuel = true" class="btn btn-primary w-full sm:w-auto justify-center">
        ⛽ Заправить автомобиль
      </button>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">Журнал операций</span>
        <span class="ml-1 text-xs" style="color:var(--text-3)">({{ ops.length }})</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead>
            <tr>
              <th>Дата/Время</th>
              <th>Автомобиль</th>
              <th>Тип</th>
              <th>Кол-во</th>
              <th>До</th>
              <th>После</th>
              <th>Путевой лист</th>
              <th>Оператор</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="op in ops" :key="op.id">
              <td class="text-xs font-mono" style="color:var(--text-3)">{{ fmtDT(op.createdAt) }}</td>
              <td class="text-xs">{{ op.car?.brand }} <span class="font-mono" style="color:var(--brand)">{{ op.car?.plateNumber }}</span></td>
              <td>
                <span class="badge" :class="op.type === 'REFUEL' ? 'badge-success' : op.type === 'CONSUMPTION' ? 'badge-danger' : 'badge-info'">
                  {{ typeLabel(op.type) }}
                </span>
              </td>
              <td class="font-mono text-sm font-semibold" :style="op.type === 'REFUEL' ? 'color:var(--success)' : 'color:var(--danger)'">
                {{ op.type === 'REFUEL' ? '+' : '-' }}{{ op.amount.toFixed(1) }} л
              </td>
              <td class="font-mono text-xs" style="color:var(--text-3)">{{ op.balanceBefore.toFixed(1) }}</td>
              <td class="font-mono text-xs font-semibold" style="color:var(--text)">{{ op.balanceAfter.toFixed(1) }}</td>
              <td class="font-mono text-xs" style="color:var(--text-3)">{{ op.waybill?.number || '—' }}</td>
              <td class="text-xs" style="color:var(--text-3)">{{ op.operator?.name }}</td>
            </tr>
            <tr v-if="!ops.length">
              <td colspan="8" class="text-center py-10 text-sm" style="color:var(--text-3)">Нет операций</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Refuel modal -->
    <div v-if="showRefuel" class="modal-overlay" @click.self="showRefuel = false">
      <div class="modal-box max-w-md">
        <div class="modal-header">
          <h3 class="font-semibold" style="color:var(--text)">⛽ Заправка автомобиля</h3>
          <button @click="showRefuel = false" style="color:var(--text-3)">✕</button>
        </div>
        <form @submit.prevent="doRefuel" class="p-5 space-y-4">
          <div>
            <label class="label block mb-1.5">Автомобиль *</label>
            <select v-model="form.carId" @change="onCarChange" class="inp" required>
              <option value="">— Выберите —</option>
              <option v-for="c in cars" :key="c.id" :value="c.id">
                {{ c.brand }} {{ c.model }} — {{ c.plateNumber }} ({{ c.fuelBalance.toFixed(1) }} л)
              </option>
            </select>
          </div>
          <div v-if="selCar" class="p-3 rounded-lg text-xs space-y-1" style="background:var(--bg-3)">
            <div class="flex justify-between">
              <span style="color:var(--text-3)">Текущий остаток:</span>
              <span class="font-mono font-semibold" style="color:var(--brand)">{{ selCar.fuelBalance.toFixed(1) }} л</span>
            </div>
            <div class="flex justify-between">
              <span style="color:var(--text-3)">Объём бака:</span>
              <span class="font-mono">{{ selCar.tankCapacity }} л</span>
            </div>
            <div class="flex justify-between">
              <span style="color:var(--text-3)">Максимально можно залить:</span>
              <span class="font-mono font-semibold" style="color:var(--success)">{{ (selCar.tankCapacity - selCar.fuelBalance).toFixed(1) }} л</span>
            </div>
            <div class="mt-2">
              <div class="fuel-bar">
                <div class="fuel-bar-fill" :class="fuelColorClass(selCar)"
                  :style="`width:${Math.min(100,(selCar.fuelBalance/selCar.tankCapacity)*100)}%`" />
              </div>
            </div>
          </div>
          <div>
            <label class="label block mb-1.5">Объём заправки (л) *</label>
            <input v-model.number="form.amount" type="number" min="0.1" step="0.5" class="inp" placeholder="0" required />
          </div>
          <div>
            <label class="label block mb-1.5">Примечание</label>
            <input v-model="form.notes" class="inp" placeholder="Номер накладной, АЗС..." />
          </div>
          <div v-if="err" class="alert-danger text-sm" style="color:var(--danger)">⚠ {{ err }}</div>
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1 justify-center">Заправить</button>
            <button type="button" @click="showRefuel = false" class="btn btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const showRefuel = ref(false)
const err = ref('')
const { data: opsData, refresh } = await useFetch('/api/fuel')
const { data: carsData } = await useFetch('/api/cars')
const ops = computed(() => (opsData.value as any[]) || [])
const cars = computed(() => (carsData.value as any[]) || [])
const form = reactive({ carId: '', amount: 0, notes: '' })
const selCar = computed(() => cars.value.find((c: any) => c.id === form.carId))
function onCarChange() {}

async function doRefuel() {
  err.value = ''
  try {
    await $fetch('/api/fuel/refuel', { method: 'POST', body: form })
    showRefuel.value = false
    form.carId = ''; form.amount = 0; form.notes = ''
    await refresh()
  } catch (e: any) { err.value = e?.data?.message || 'Ошибка' }
}

const fuelColorClass = (car: any) => {
  const p = car.fuelBalance / car.tankCapacity
  return p > 0.5 ? 'fuel-high' : p > 0.2 ? 'fuel-medium' : 'fuel-low'
}
const fmtDT = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const typeLabel = (t: string) => ({ REFUEL: '+ Заправка', CONSUMPTION: '- Расход', CORRECTION: '⚙ Корр.' }[t] || t)
</script>
