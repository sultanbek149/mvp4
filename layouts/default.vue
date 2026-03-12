<template>
  <div class="min-h-screen" style="background:var(--bg)">

    <!-- Mobile top bar -->
    <header class="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 border-b"
      style="background:var(--bg-2);border-color:var(--border)">
      <button @click="sidebarOpen = !sidebarOpen" class="p-2 rounded-md mr-3" style="color:var(--text-2)">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style="background:var(--brand)">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <div class="min-w-0">
          <div class="font-bold text-xs truncate leading-tight" style="color:var(--brand)">В/Ч 5547</div>
          <div class="text-xs truncate" style="color:var(--text-3)">Автопарк</div>
        </div>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <button @click="toggleTheme" class="p-2 rounded-md" style="color:var(--text-3)">{{ isDark ? '☀️' : '🌙' }}</button>
        <button @click="logout" class="p-2 rounded-md" style="color:var(--text-3)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </header>

    <div v-if="sidebarOpen" class="lg:hidden fixed inset-0 z-30 bg-black/50" @click="sidebarOpen = false" />

    <div class="flex">
      <aside class="fixed lg:static inset-y-0 left-0 z-40 flex flex-col border-r transition-transform duration-200"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
        style="width:244px;background:var(--bg-2);border-color:var(--border);min-height:100vh">

        <!-- Desktop logo -->
        <div class="hidden lg:block px-4 py-4 border-b" style="border-color:var(--border)">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:var(--brand)">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <div class="font-bold text-sm leading-tight" style="color:var(--brand)">Военная часть 5547</div>
              <div class="text-xs" style="color:var(--text-3)">Автопарк</div>
            </div>
          </div>
        </div>

        <div class="lg:hidden h-14 flex-shrink-0" />

        <nav class="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <template v-for="group in navGroups" :key="group.label">
            <template v-if="showGroup(group)">
              <div class="section-label">{{ group.label }}</div>
              <template v-for="item in group.items" :key="item.path">
                <NuxtLink v-if="canSee(item)" :to="item.path"
                  class="nav-link" :class="{ active: isActive(item.path) }"
                  @click="sidebarOpen = false">
                  <span class="text-base leading-none">{{ item.icon }}</span>
                  <span class="flex-1 text-sm">{{ item.label }}</span>
                </NuxtLink>
              </template>
            </template>
          </template>
        </nav>

        <div class="border-t p-3 space-y-2" style="border-color:var(--border)">
          <button @click="toggleTheme" class="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors hover:opacity-80"
            style="color:var(--text-2);background:var(--bg-3)">
            <span>{{ isDark ? '☀️' : '🌙' }}</span>
            <span class="text-sm font-medium">{{ isDark ? 'Светлая тема' : 'Тёмная тема' }}</span>
          </button>
          <div class="flex items-center gap-3 px-3 py-2 rounded-md" style="background:var(--bg-3)">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style="background:var(--brand)">{{ userInitials }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold truncate" style="color:var(--text)">{{ user?.name?.split(' ')[0] }}</div>
              <div class="text-xs" style="color:var(--text-3)">{{ roleLabel }}</div>
            </div>
            <button @click="logout" title="Выйти" class="hidden lg:block hover:text-red-500 transition-colors" style="color:var(--text-3)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0 lg:min-h-screen">
        <header class="hidden lg:flex h-14 items-center px-6 border-b flex-shrink-0"
          style="background:var(--bg-2);border-color:var(--border)">
          <h1 class="font-semibold text-base" style="color:var(--text)">{{ currentPageTitle }}</h1>
          <div class="ml-auto text-xs font-mono" style="color:var(--text-3)">{{ now }}</div>
        </header>

        <main class="flex-1 p-4 lg:p-6 mt-14 lg:mt-0 pb-24 lg:pb-6">
          <slot />
        </main>

        <!-- Mobile bottom nav -->
        <nav class="lg:hidden fixed bottom-0 left-0 right-0 border-t flex z-30"
          style="background:var(--bg-2);border-color:var(--border)">
          <NuxtLink v-for="item in mobileNav" :key="item.path" :to="item.path"
            class="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
            :style="isActive(item.path) ? 'color:var(--brand)' : 'color:var(--text-3)'">
            <span class="text-lg leading-tight">{{ item.icon }}</span>
            <span class="text-xs font-medium">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout, isRole, isAdmin, isSuperAdmin, isDriver } = useAuth()
const route = useRoute()
const sidebarOpen = ref(false)
const isDark = useState('dark_mode', () => false)

function toggleTheme() {
  isDark.value = !isDark.value
  if (process.client) {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark.value)
  }
}
onMounted(() => {
  const saved = localStorage.getItem('theme')
  isDark.value = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDark.value)
})
watch(() => route.path, () => { sidebarOpen.value = false })

const now = ref('')
onMounted(() => {
  const tick = () => { now.value = new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) }
  tick(); setInterval(tick, 60000)
})

const navGroups = [
  { label: 'Главное', roles: null, items: [
    { path: '/dashboard',    label: 'Сводка',         icon: '📊', roles: null },
    { path: '/waybills',     label: 'Путевые листы',  icon: '📋', roles: null },
    { path: '/fuel-calc',    label: 'Расход топлива', icon: '⛽', roles: null },
    { path: '/map',          label: 'Карта',          icon: '🗺️', roles: null },
  ]},
  { label: 'Управление', roles: ['SUPER_ADMIN','ADMIN'], items: [
    { path: '/cars',         label: 'Автомобили',     icon: '🚛', roles: ['SUPER_ADMIN','ADMIN'] },
    { path: '/drivers',      label: 'Водители',       icon: '👤', roles: ['SUPER_ADMIN','ADMIN'] },
    { path: '/fuel',         label: 'Топливо',        icon: '🪣', roles: ['SUPER_ADMIN','ADMIN'] },
    { path: '/maintenance',  label: 'ТО',             icon: '🔧', roles: ['SUPER_ADMIN','ADMIN'] },
  ]},
  { label: 'Аналитика', roles: ['SUPER_ADMIN','ADMIN'], items: [
    { path: '/reports',      label: 'Отчёты',         icon: '📈', roles: ['SUPER_ADMIN','ADMIN'] },
  ]},
  { label: 'Система', roles: ['SUPER_ADMIN'], items: [
    { path: '/users',        label: 'Пользователи',   icon: '👥', roles: ['SUPER_ADMIN'] },
    { path: '/settings',     label: 'Настройки',      icon: '⚙️', roles: ['SUPER_ADMIN'] },
  ]},
]

const mobileNav = computed(() => {
  if (isDriver()) return [
    { path: '/dashboard',  label: 'Сводка',   icon: '📊' },
    { path: '/waybills',   label: 'Листы',    icon: '📋' },
    { path: '/fuel-calc',  label: 'Расход',   icon: '⛽' },
    { path: '/map',        label: 'Карта',    icon: '🗺️' },
  ]
  return [
    { path: '/dashboard',  label: 'Сводка',  icon: '📊' },
    { path: '/waybills',   label: 'Листы',   icon: '📋' },
    { path: '/cars',       label: 'Авто',    icon: '🚛' },
    { path: '/fuel',       label: 'Топливо', icon: '🪣' },
  ]
})

const canSee = (item: any) => !item.roles || isRole(...item.roles)
const showGroup = (group: any) => !group.roles || isRole(...group.roles)
const isActive = (path: string) => path === '/dashboard' ? route.path === path : route.path.startsWith(path)
const allItems = navGroups.flatMap(g => g.items)
const currentPageTitle = computed(() => allItems.find(i => isActive(i.path))?.label || 'Военная часть 5547')
const userInitials = computed(() => user.value?.name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || '?')
const roleLabel = computed(() => ({ SUPER_ADMIN: 'Супер Админ', ADMIN: 'Администратор', DRIVER: 'Водитель' }[user.value?.role as string] || user.value?.role))
</script>
