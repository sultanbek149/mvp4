<template>
  <div class="space-y-6 max-w-3xl">

    <!-- Permission matrix -->
    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">🔐 Матрица прав доступа</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Функция</th><th class="text-center">🔴 Супер Админ</th><th class="text-center">🟠 Администратор</th><th class="text-center">🟢 Водитель</th></tr></thead>
          <tbody>
            <tr v-for="row in permMatrix" :key="row.label">
              <td class="text-sm" style="color:var(--text)">{{ row.label }}</td>
              <td class="text-center text-base">{{ row.sa ? '✅' : '—' }}</td>
              <td class="text-center text-base">{{ row.ad ? '✅' : '—' }}</td>
              <td class="text-center text-base">{{ row.dr ? '✅' : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TO Schedule -->
    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">🔧 График технического обслуживания</span>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>Вид ТО</th><th>Интервал (км)</th><th>Предупреждение за (км)</th></tr></thead>
          <tbody>
            <tr v-for="s in toSchedule" :key="s.key">
              <td><span class="badge badge-info font-mono">{{ s.type }}</span></td>
              <td class="font-mono text-sm">{{ s.interval.toLocaleString() }}</td>
              <td class="font-mono text-sm" style="color:var(--warning)">{{ s.warnBefore.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 text-xs" style="color:var(--text-3)">
        При закрытии путевого листа система автоматически проверяет пробег и генерирует уведомления.
      </div>
    </div>

    <!-- Company info -->
    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">🏢 Данные воинской части</span>
        <button @click="saveCompany" class="btn btn-primary btn-sm ml-auto">Сохранить</button>
      </div>
      <div class="p-5 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label class="label block mb-1.5">Наименование</label><input v-model="company.name" class="inp" placeholder="Военная часть 5547" /></div>
          <div><label class="label block mb-1.5">Командир части</label><input v-model="company.commander" class="inp" placeholder="Полковник Иванов И.И." /></div>
          <div><label class="label block mb-1.5">Адрес</label><input v-model="company.address" class="inp" /></div>
          <div><label class="label block mb-1.5">Телефон</label><input v-model="company.phone" class="inp" /></div>
        </div>
        <div v-if="saved" class="alert-success text-sm" style="color:var(--success)">✅ Данные сохранены</div>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="card" style="border-color:rgba(220,38,38,0.3)">
      <div class="card-header" style="background:var(--danger-bg)">
        <span class="font-semibold text-sm" style="color:var(--danger)">⚠️ Опасная зона (только Супер Админ)</span>
      </div>
      <div class="p-5 space-y-3">
        <div class="flex items-center justify-between p-3 rounded-lg border" style="border-color:var(--border)">
          <div>
            <div class="text-sm font-medium" style="color:var(--text)">Удалить закрытые путевые листы старше 1 года</div>
            <div class="text-xs" style="color:var(--text-3)">Операция необратима</div>
          </div>
          <button class="btn btn-danger btn-sm">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const saved = ref(false)
const company = reactive({ name: 'Военная часть 5547', commander: '', address: '', phone: '' })

function saveCompany() { saved.value = true; setTimeout(() => { saved.value = false }, 3000) }

const permMatrix = [
  { label: 'Добавить/удалить/изменить автомобили',    sa: true,  ad: false, dr: false },
  { label: 'Нормы расхода топлива (по типам)',         sa: true,  ad: false, dr: false },
  { label: 'Управление пользователями системы',        sa: true,  ad: false, dr: false },
  { label: 'Удаление данных',                         sa: true,  ad: false, dr: false },
  { label: 'Добавить/удалить водителей',               sa: true,  ad: true,  dr: false },
  { label: 'Видит все автомобили части',               sa: true,  ad: true,  dr: false },
  { label: 'Все путевые листы',                        sa: true,  ad: true,  dr: false },
  { label: 'Учёт топлива и заправки',                  sa: true,  ad: true,  dr: false },
  { label: 'Запись на ТО',                             sa: true,  ad: true,  dr: false },
  { label: 'Отчёты и аналитика',                       sa: true,  ad: true,  dr: false },
  { label: 'Создать путевой лист для себя',            sa: true,  ad: true,  dr: true  },
  { label: 'Видит только свою машину',                 sa: false, ad: false, dr: true  },
  { label: 'Калькулятор расхода топлива',              sa: true,  ad: true,  dr: true  },
  { label: 'Карта маршрутов',                          sa: true,  ad: true,  dr: true  },
]

const toSchedule = [
  { key: 'TO1', type: 'ТО-1', interval: 1800, warnBefore: 600 },
  { key: 'TO2', type: 'ТО-2', interval: 3600, warnBefore: 1200 },
  { key: 'TO3', type: 'ТО-3', interval: 5400, warnBefore: 1800 },
  { key: 'TO4', type: 'ТО-4', interval: 7200, warnBefore: 2400 },
]
</script>
