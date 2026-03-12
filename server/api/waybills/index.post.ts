import { prisma } from '~/server/utils/prisma'
import { requireAuth, ROLES } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { carId, driverId, date, fuelAdded, routeStart, routeEnd, startLat, startLng, endLat, endLng, notes } = body

  if (!carId || !driverId) throw createError({ statusCode: 400, message: 'Автомобиль и водитель обязательны' })

  // Driver can only create waybill for themselves
  if (user.role === ROLES.DRIVER) {
    const driver = await prisma.driver.findFirst({ where: { userId: user.id } })
    if (!driver || driver.id !== driverId)
      throw createError({ statusCode: 403, message: 'Водитель может создавать листы только для себя' })
  }

  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car) throw createError({ statusCode: 404, message: 'Автомобиль не найден' })
  if (car.status !== 'ACTIVE') throw createError({ statusCode: 400, message: 'Автомобиль неактивен' })

  // Check for existing active waybill for this car
  const existing = await prisma.waybill.findFirst({ where: { carId, status: 'ACTIVE' } })
  if (existing) throw createError({ statusCode: 400, message: 'У этого автомобиля уже есть активный путевой лист' })

  const added = fuelAdded || 0
  if (added > 0) {
    if (car.fuelBalance + added > car.tankCapacity)
      throw createError({ statusCode: 400, message: `Превышен объём бака. Макс. заправка: ${(car.tankCapacity - car.fuelBalance).toFixed(1)} л` })
    await prisma.car.update({ where: { id: carId }, data: { fuelBalance: car.fuelBalance + added } })
  }

  const count = await prisma.waybill.count()
  const number = `ПЛ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const wb = await prisma.waybill.create({
    data: {
      number, carId, driverId, createdById: user.id,
      date: date ? new Date(date) : new Date(),
      startMileage: car.totalMileage,
      fuelStart: car.fuelBalance,
      fuelAdded: added,
      routeStart: routeStart || null, routeEnd: routeEnd || null,
      startLat: startLat || null, startLng: startLng || null,
      endLat: endLat || null, endLng: endLng || null,
      notes: notes || null,
      status: 'ACTIVE',
    },
    include: { car: true, driver: true }
  })

  if (added > 0) {
    await prisma.fuelOperation.create({
      data: {
        carId, waybillId: wb.id, type: 'REFUEL',
        amount: added, balanceBefore: car.fuelBalance,
        balanceAfter: car.fuelBalance + added, operatorId: user.id,
      }
    })
  }

  return wb
})
