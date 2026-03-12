<template>
  <div class="space-y-5 max-w-5xl">
    <!-- Role cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="role in roleCards" :key="role.key" class="card p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">{{ role.icon }}</span>
          <span class="font-semibold text-sm" style="color:var(--text)">{{ role.label }}</span>
          <span class="badge ml-auto" :class="role.badgeClass">{{ users.filter(u => u.role === role.key).length }}</span>
        </div>
        <div class="text-xs space-y-0.5" style="color:var(--text-3)">
          <div v-for="p in role.perms" :key="p">✓ {{ p }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="font-semibold text-sm" style="color:var(--text)">Пользователи системы</span>
        <span class="ml-1 text-xs" style="color:var(--text-3)">({{ users.length }})</span>
        <button @click="showForm = true" class="btn btn-primary btn-sm ml-auto">+ Добавить</button>
      </div>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr><th>ФИО</th><th>Email</th><th>Роль</th><th>Телефон</th><th>Статус</th><th>Создан</th><th></th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td class="font-medium text-sm" style="color:var(--text)">{{ u.name }}</td>
              <td class="font-mono text-xs" style="color:var(--text-3)">{{ u.email }}</td>
              <td>
                <span class="badge" :class="roleBadge(u.role)">
                  {{ roleCards.find(r => r.key === u.role)?.icon }} {{ roleLabel(u.role) }}
                </span>
              </td>
              <td class="text-xs" style="color:var(--text-3)">{{ u.phone || '—' }}</td>
              <td>
                <button @click="toggleActive(u)" class="badge cursor-pointer hover:opacity-80"
                  :class="u.isActive ? 'badge-success' : 'badge-danger'">
                  {{ u.isActive ? 'Активен' : 'Заблокирован' }}
                </button>
              </td>
              <td class="text-xs font-mono" style="color:var(--text-3)">{{ fmtDate(u.createdAt) }}</td>
              <td><button @click="editUser = {...u}; showEdit = true" class="btn btn-secondary btn-sm">✏️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box max-w-md">
        <div class="modal-header">
          <h3 class="font-semibold" style="color:var(--text)">Создать пользователя</h3>
          <button @click="showForm = false" style="color:var(--text-3)">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div><label class="label block mb-1.5">ФИО *</label><input v-model="form.name" class="inp" required /></div>
          <div><label class="label block mb-1.5">Email *</label><input v-model="form.email" type="email" class="inp" required /></div>
          <div><label class="label block mb-1.5">Пароль *</label><input v-model="form.password" type="password" class="inp" minlength="6" required /></div>
          <div>
            <label class="label block mb-1.5">Роль *</label>
            <select v-model="form.role" class="inp" required>
              <option value="ADMIN">🟠 Администратор (нач. автослужбы)</option>
              <option value="DRIVER">🟢 Водитель</option>
              <option value="SUPER_ADMIN">🔴 Супер Админ</option>
            </select>
            <div v-if="form.role" class="mt-2 p-3 rounded text-xs space-y-0.5" style="background:var(--bg-3);color:var(--text-3)">
              <div v-for="p in roleCards.find(r => r.key === form.role)?.perms" :key="p">✓ {{ p }}</div>
            </div>
          </div>
          <div><label class="label block mb-1.5">Телефон</label><input v-model="form.phone" class="inp" /></div>
          <div v-if="err" class="alert-danger text-sm" style="color:var(--danger)">{{ err }}</div>
          <div class="flex gap-3">
            <button @click="createUser" class="btn btn-primary flex-1 justify-center">Создать</button>
            <button @click="showForm = false" class="btn btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="showEdit && editUser" class="modal-overlay" @click.self="showEdit = false">
      <div class="modal-box max-w-md">
        <div class="modal-header">
          <h3 class="font-semibold" style="color:var(--text)">Редактировать</h3>
          <button @click="showEdit = false" style="color:var(--text-3)">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div><label class="label block mb-1.5">ФИО</label><input v-model="editUser.name" class="inp" /></div>
          <div><label class="label block mb-1.5">Телефон</label><input v-model="editUser.phone" class="inp" /></div>
          <div>
            <label class="label block mb-1.5">Роль</label>
            <select v-model="editUser.role" class="inp">
              <option value="SUPER_ADMIN">🔴 Супер Админ</option>
              <option value="ADMIN">🟠 Администратор</option>
              <option value="DRIVER">🟢 Водитель</option>
            </select>
          </div>
          <div class="flex gap-3">
            <button @click="saveEdit" class="btn btn-primary flex-1 justify-center">Сохранить</button>
            <button @click="showEdit = false" class="btn btn-secondary flex-1 justify-center">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const showForm = ref(false)
const showEdit = ref(false)
const editUser = ref<any>(null)
const err = ref('')
const { data, refresh } = await useFetch('/api/users')
const users = computed(() => (data.value as any[]) || [])
const form = reactive({ name: '', email: '', password: '', role: 'DRIVER', phone: '' })

const roleCards = [
  { key: 'SUPER_ADMIN', icon: '🔴', label: 'Супер Админ', badgeClass: 'badge-danger', perms: ['Все машины части', 'Добавить/удалить машины', 'Нормы расхода топлива', 'Добавить администраторов и водителей', 'Настройки системы'] },
  { key: 'ADMIN',       icon: '🟠', label: 'Администратор', badgeClass: 'badge-warning', perms: ['Все водители и их машины', 'Добавить/удалить водителей', 'Путевые листы (все)', 'ТО и учёт топлива', 'Отчёты'] },
  { key: 'DRIVER',      icon: '🟢', label: 'Водитель',     badgeClass: 'badge-success', perms: ['Только своя машина', 'Свои путевые листы', 'Калькулятор расхода', 'Уведомления ТО своего авто'] },
]

async function createUser() {
  err.value = ''
  try {
    await $fetch('/api/users', { method: 'POST', body: form })
    showForm.value = false
    Object.assign(form, { name: '', email: '', password: '', role: 'DRIVER', phone: '' })
    await refresh()
  } catch (e: any) { err.value = e?.data?.message || 'Ошибка' }
}

async function toggleActive(u: any) {
  await $fetch(`/api/users/${u.id}`, { method: 'PUT', body: { ...u, isActive: !u.isActive } })
  await refresh()
}
async function saveEdit() {
  await $fetch(`/api/users/${editUser.value.id}`, { method: 'PUT', body: editUser.value })
  showEdit.value = false; await refresh()
}

const roleBadge = (r: string) => ({ SUPER_ADMIN: 'badge-danger', ADMIN: 'badge-warning', DRIVER: 'badge-success' }[r] || 'badge-neutral')
const roleLabel = (r: string) => ({ SUPER_ADMIN: 'Супер Админ', ADMIN: 'Администратор', DRIVER: 'Водитель' }[r] || r)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU')
</script>
