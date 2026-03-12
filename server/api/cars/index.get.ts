import { prisma } from '~/server/utils/prisma'
import { requireAuth, ROLES } from '~/server/utils/auth'
import { checkMaintenanceAlerts } from '~/server/utils/maintenance'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  // DRIVER: only see car(s) assigned to them via waybills
  if (user.role === ROLES.DRIVER) {
    const driver = await prisma.driver.findFirst({ where: { userId: user.id } })
    if (!driver) return []
    const waybills = await prisma.waybill.findMany({
      where: { driverId: driver.id },
      select: { carId: true }, distinct: ['carId'],
      orderBy: { date: 'desc' }, take: 5,
    })
    const carIds = waybills.map(w => w.carId)
    if (!carIds.length) return []
    const cars = await prisma.car.findMany({ where: { id: { in: carIds } } })
    return cars.map(car => ({ ...car, maintenanceAlerts: checkMaintenanceAlerts(car as any) }))
  }

  const query = getQuery(event)
  const cars = await prisma.car.findMany({
    where: query.status ? { status: query.status as any } : undefined,
    orderBy: { brand: 'asc' },
  })
  return cars.map(car => ({ ...car, maintenanceAlerts: checkMaintenanceAlerts(car as any) }))
})
