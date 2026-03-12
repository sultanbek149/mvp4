// ТО intervals: TO1=1800, TO2=3600, TO3=5400, TO4=7200 km
export const TO_SCHEDULE = [
  { type: 'ТО-1', key: 'TO1', lastField: 'lastTo1Mileage', interval: 1800, warnBefore: 600 },
  { type: 'ТО-2', key: 'TO2', lastField: 'lastTo2Mileage', interval: 3600, warnBefore: 1200 },
  { type: 'ТО-3', key: 'TO3', lastField: 'lastTo3Mileage', interval: 5400, warnBefore: 1800 },
  { type: 'ТО-4', key: 'TO4', lastField: 'lastTo4Mileage', interval: 7200, warnBefore: 2400 },
]

export interface ToAlert {
  type: string
  key: string
  kmLeft: number
  overdue: boolean
  nextAtKm: number
}

export function checkMaintenanceAlerts(car: {
  totalMileage: number
  lastTo1Mileage: number
  lastTo2Mileage: number
  lastTo3Mileage: number
  lastTo4Mileage: number
}): ToAlert[] {
  const alerts: ToAlert[] = []

  for (const s of TO_SCHEDULE) {
    const lastMileage = (car as any)[s.lastField] as number
    const nextAtKm = lastMileage + s.interval
    const kmLeft = nextAtKm - car.totalMileage
    if (kmLeft <= s.warnBefore) {
      alerts.push({ type: s.type, key: s.key, kmLeft, overdue: kmLeft <= 0, nextAtKm })
    }
  }

  return alerts
}

// Fuel norm type labels
export const FUEL_NORM_TYPES = [
  { key: 'city_single',    label: 'Одиночный в городе',                    field: 'normCity' },
  { key: 'city_column',    label: 'В колонне в городе',                    field: 'normCityColumn' },
  { key: 'outside_single', label: 'За пределами нас. пункта — одиночный',  field: 'normOutsideSingle' },
  { key: 'outside_column', label: 'За пределами нас. пункта — в колонне',  field: 'normOutsideColumn' },
]

export function calcFuelConsumption(distanceKm: number, normLPer100: number): number {
  return (distanceKm * normLPer100) / 100
}

export function getNormValue(car: any, normKey: string): number | null {
  const t = FUEL_NORM_TYPES.find(t => t.key === normKey)
  if (!t) return null
  return car[t.field] ?? null
}
