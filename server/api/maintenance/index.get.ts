import { prisma } from '~/server/utils/prisma'
import { requireAuth, ROLES } from '~/server/utils/auth'
import { checkMaintenanceAlerts } from '~/server/utils/maintenance'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)

  if (query.alerts === 'true') {
    if (user.role === ROLES.DRIVER) {
      // Only alerts for driver's own active car
      const driver = await prisma.driver.findFirst({ where: { userId: user.id } })
      if (!driver) return []
      const active = await prisma.waybill.findMany({
        where: { driverId: driver.id, status: 'ACTIVE' },
        include: { car: true }
      })
      return active
        .map(wb => ({ car: wb.car, alerts: checkMaintenanceAlerts(wb.car as any) }))
        .filter(i => i.alerts.length > 0)
    }
    const cars = await prisma.car.findMany({ where: { status: 'ACTIVE' } })
    return cars
      .map(car => ({ car, alerts: checkMaintenanceAlerts(car as any) }))
      .filter(i => i.alerts.length > 0)
  }

  if (user.role === ROLES.DRIVER) return []

  const records = await prisma.maintenance.findMany({
    where: query.carId ? { carId: query.carId as string } : {},
    orderBy: { serviceDate: 'desc' },
    include: {
      car: { select: { brand: true, model: true, plateNumber: true } },
      performedBy: { select: { name: true } },
    }
  })
  return records
})
