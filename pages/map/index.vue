<template>
  <div class="space-y-4">
    <div class="flex flex-col lg:flex-row gap-4" style="height: calc(100vh - 120px); min-height: 500px;">

      <!-- Sidebar -->
      <div class="card flex flex-col w-full lg:w-72 flex-shrink-0 overflow-hidden" style="max-height:300px; lg:max-height:none">
        <div class="card-header flex-shrink-0">
          <span class="font-semibold text-sm" style="color:var(--text)">Маршруты</span>
        </div>
        <div class="p-3 flex-shrink-0">
          <select v-model="filterStatus" class="inp text-sm py-1.5">
            <option value="">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="CLOSED">Закрытые</option>
          </select>
        </div>
        <div class="flex-1 overflow-y-auto divide-y" style="border-color:var(--border)">
          <div v-for="wb in waybillsWithCoords" :key="wb.id"
            @click="selectWaybill(wb)"
            class="p-3 cursor-pointer transition-colors"
            :style="selected?.id === wb.id ? 'background:var(--brand-pale)' : ''"
            onmouseover="if(!this.classList.contains('sel'))this.style.background='var(--bg-3)'"
            onmouseout="if(!this.classList.contains('sel'))this.style.background=''">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-mono text-xs font-semibold" style="color:var(--brand)">{{ wb.number }}</div>
                <div class="text-xs mt-0.5" style="color:var(--text)">{{ wb.car?.brand }} {{ wb.car?.plateNumber }}</div>
                <div class="text-xs" style="color:var(--text-3)">{{ wb.driver?.name?.split(' ')[0] }}</div>
                <div class="text-xs mt-1 truncate max-w-[160px]" style="color:var(--text-3)">{{ wb.routeStart }} → {{ wb.routeEnd }}</div>
              </div>
              <span class="badge flex-shrink-0" :class="wb.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'">
                {{ wb.status === 'ACTIVE' ? 'В рейсе' : 'Завершён' }}
              </span>
            </div>
          </div>
          <div v-if="!waybillsWithCoords.length" class="p-6 text-center text-sm" style="color:var(--text-3)">
            Нет маршрутов с координатами
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="card flex-1 relative overflow-hidden" style="min-height:300px">
        <div class="card-header absolute top-0 left-0 right-0 z-10">
          <span class="font-semibold text-sm" style="color:var(--text)">
            {{ selected ? `Маршрут: ${selected.number}` : 'Карта маршрутов' }}
          </span>
          <button v-if="selected" @click="selected = null; refreshMap()" class="btn btn-secondary btn-sm ml-auto">
            Показать все
          </button>
        </div>
        <div ref="mapContainer" class="absolute inset-0" style="top:49px" />
        <div v-if="!mapReady" class="absolute inset-0 flex items-center justify-center" style="background:var(--bg-3)">
          <span class="text-sm animate-pulse" style="color:var(--text-3)">Загрузка карты...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const filterStatus = ref('')
const selected = ref<any>(null)
const mapContainer = ref<HTMLElement>()
const mapReady = ref(false)

const url = computed(() => `/api/waybills${filterStatus.value ? `?status=${filterStatus.value}` : ''}`)
const { data } = await useFetch(url)
const waybills = computed(() => (data.value as any[]) || [])
const waybillsWithCoords = computed(() => waybills.value.filter((w: any) => w.startLat && w.startLng))

let map: any = null
let layerGroup: any = null
let L: any = null

onMounted(async () => {
  if (!process.client) return
  L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  await nextTick()
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, { zoomControl: true }).setView([43.2, 76.8], 9)

  // Light tile layer — clean OpenStreetMap, no dark filter
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  layerGroup = L.layerGroup().addTo(map)
  mapReady.value = true
  renderMarkers()
})

function renderMarkers() {
  if (!layerGroup || !L) return
  layerGroup.clearLayers()
  const list = selected.value ? [selected.value] : waybillsWithCoords.value

  list.forEach((wb: any) => {
    const isActive = wb.status === 'ACTIVE'
    const color = isActive ? '#1f8a1f' : '#6b7280'

    const startIcon = L.divIcon({
      html: `<div style="background:${color};border:2px solid white;border-radius:50% 50% 50% 0;width:18px;height:18px;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 18], className: ''
    })
    const endIcon = L.divIcon({
      html: `<div style="background:#dc2626;border:2px solid white;border-radius:50%;width:14px;height:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7], className: ''
    })

    const startPopup = `<div style="font-family:Inter,sans-serif;font-size:13px;min-width:140px">
      <strong>${wb.number}</strong><br>
      <span style="color:#6b7280">${wb.car?.brand} ${wb.car?.plateNumber}</span><br>
      📍 ${wb.routeStart || 'Старт'}
    </div>`

    L.marker([wb.startLat, wb.startLng], { icon: startIcon })
      .bindPopup(startPopup).addTo(layerGroup)

    if (wb.endLat && wb.endLng) {
      const endPopup = `<div style="font-family:Inter,sans-serif;font-size:13px">
        <strong>${wb.number}</strong><br>
        🏁 ${wb.routeEnd || 'Финиш'}
      </div>`
      L.marker([wb.endLat, wb.endLng], { icon: endIcon })
        .bindPopup(endPopup).addTo(layerGroup)

      L.polyline([[wb.startLat, wb.startLng], [wb.endLat, wb.endLng]], {
        color, weight: isActive ? 3 : 2,
        opacity: isActive ? 0.9 : 0.5,
        dashArray: isActive ? null : '6 4'
      }).addTo(layerGroup)
    }
  })

  if (list.length) {
    const pts = list.flatMap((wb: any) => {
      const p: any[] = [[wb.startLat, wb.startLng]]
      if (wb.endLat) p.push([wb.endLat, wb.endLng])
      return p
    })
    try { map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 }) } catch {}
  }
}

function selectWaybill(wb: any) {
  selected.value = selected.value?.id === wb.id ? null : wb
  nextTick(() => renderMarkers())
}

function refreshMap() { nextTick(() => renderMarkers()) }

watch(filterStatus, () => nextTick(() => renderMarkers()))
</script>

<style>
/* Light map popup styling */
.leaflet-popup-content-wrapper {
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
}
.leaflet-popup-content { margin: 10px 14px !important; }
/* Dark mode: only darken tiles, keep UI readable */
.dark .leaflet-tile-pane { filter: brightness(0.85) saturate(0.7); }
</style>
