import { prisma } from '~/server/utils/prisma'
import { requireAuth, ROLES } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  if (user.role === ROLES.DRIVER) {
    const driver = await prisma.driver.findFirst({ where: { userId: user.id } })
    if (!driver) return { myWaybills: 0, myActiveWaybills: 0 }
    const [myWaybills, myActiveWaybills] = await Promise.all([
      prisma.waybill.count({ where: { driverId: driver.id } }),
      prisma.waybill.count({ where: { driverId: driver.id, status: 'ACTIVE' } }),
    ])
    return { myWaybills, myActiveWaybills }
  }

  const [totalCars, activeCars, totalWaybills, activeWaybills, fuelToday] = await Promise.all([
    prisma.car.count(), prisma.car.count({ where: { status: 'ACTIVE' } }),
    prisma.waybill.count(), prisma.waybill.count({ where: { status: 'ACTIVE' } }),
    prisma.fuelOperation.aggregate({
      where: { type: 'REFUEL', createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      _sum: { amount: true }
    }),
  ])
  return { totalCars, activeCars, totalWaybills, activeWaybills, fuelRefueledToday: fuelToday._sum.amount || 0 }
})
