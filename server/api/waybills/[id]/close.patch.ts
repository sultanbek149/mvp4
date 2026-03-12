import { prisma } from '~/server/utils/prisma'
import { requireAuth, ROLES } from '~/server/utils/auth'
import { checkMaintenanceAlerts } from '~/server/utils/maintenance'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { endMileage, fuelEnd, distanceDriven, fuelNormType, fuelNormUsed, fuelCalculated } = body

  const wb = await prisma.waybill.findUnique({
    where: { id },
    include: { car: true, driver: true }
  })
  if (!wb) throw createError({ statusCode: 404, message: 'Путевой лист не найден' })
  if (wb.status !== 'ACTIVE') throw createError({ statusCode: 400, message: 'Лист уже закрыт' })

  // Driver can close their own waybill; admin/super can close any
  if (user.role === ROLES.DRIVER) {
    const driver = await prisma.driver.findFirst({ where: { userId: user.id } })
    if (!driver || driver.id !== wb.driverId)
      throw createError({ statusCode: 403, message: 'Нет прав закрыть этот лист' })
  }

  const fuelConsumed = wb.fuelStart + wb.fuelAdded - (fuelEnd ?? 0)
  const newMileage = endMileage ?? wb.startMileage

  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.waybill.update({
      where: { id },
      data: {
        endMileage, fuelEnd, fuelConsumed,
        distanceDriven: distanceDriven || (endMileage ? endMileage - wb.startMileage : null),
        fuelNormType: fuelNormType || null,
        fuelNormUsed: fuelNormUsed || null,
        fuelCalculated: fuelCalculated || null,
        status: 'CLOSED',
      }
    })
    // Update car fuel balance and mileage
    await tx.car.update({
      where: { id: wb.carId },
      data: { fuelBalance: fuelEnd ?? wb.car.fuelBalance, totalMileage: newMileage }
    })
    // Log fuel consumption
    if (fuelConsumed > 0) {
      await tx.fuelOperation.create({
        data: {
          carId: wb.carId, waybillId: id, type: 'CONSUMPTION',
          amount: fuelConsumed,
          balanceBefore: wb.fuelStart + wb.fuelAdded,
          balanceAfter: fuelEnd ?? wb.car.fuelBalance,
          operatorId: user.id,
        }
      })
    }
    return w
  })

  // Check TO alerts after closing
  const updatedCar = await prisma.car.findUnique({ where: { id: wb.carId } })
  const alerts = updatedCar ? checkMaintenanceAlerts(updatedCar as any) : []

  return { waybill: updated, toAlerts: alerts }
})
