import { prisma } from '~/server/utils/prisma'
import { requireRole, SUPER_ONLY, MANAGE_ROLES } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, MANAGE_ROLES)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  // Only SUPER_ADMIN can modify fuel norms
  const updateData: any = {
    brand: body.brand, model: body.model, plateNumber: body.plateNumber,
    year: body.year, fuelType: body.fuelType, tankCapacity: body.tankCapacity,
    status: body.status, notes: body.notes,
  }

  if (user.role === 'SUPER_ADMIN') {
    updateData.normCity = body.normCity ?? null
    updateData.normCityColumn = body.normCityColumn ?? null
    updateData.normOutsideSingle = body.normOutsideSingle ?? null
    updateData.normOutsideColumn = body.normOutsideColumn ?? null
  }

  const car = await prisma.car.update({ where: { id }, data: updateData })
  return car
})
