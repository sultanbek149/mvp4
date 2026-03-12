import { prisma } from '~/server/utils/prisma'
import { requireRole, SUPER_ONLY } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, SUPER_ONLY)  // Only SUPER_ADMIN can add cars
  const body = await readBody(event)
  const { brand, model, plateNumber, year, fuelType, tankCapacity, fuelBalance, totalMileage,
          normCity, normCityColumn, normOutsideSingle, normOutsideColumn, notes } = body

  if (!brand || !plateNumber) throw createError({ statusCode: 400, message: 'Марка и гос. номер обязательны' })

  const car = await prisma.car.create({
    data: {
      brand, model: model || '', plateNumber, year: year || new Date().getFullYear(),
      fuelType: fuelType || 'DIESEL',
      tankCapacity: tankCapacity || 100,
      fuelBalance: fuelBalance || 0,
      totalMileage: totalMileage || 0,
      normCity: normCity || null,
      normCityColumn: normCityColumn || null,
      normOutsideSingle: normOutsideSingle || null,
      normOutsideColumn: normOutsideColumn || null,
      notes: notes || null,
    }
  })
  return car
})
