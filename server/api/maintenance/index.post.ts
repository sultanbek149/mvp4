import { prisma } from '~/server/utils/prisma'
import { requireRole, MANAGE_ROLES } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, MANAGE_ROLES)
  const body = await readBody(event)
  const { carId, type, mileageAtService, nextServiceMileage, serviceDate, cost, description } = body

  if (!carId || !type || !mileageAtService || !serviceDate)
    throw createError({ statusCode: 400, message: 'Обязательные поля не заполнены' })

  const record = await prisma.$transaction(async (tx) => {
    const m = await tx.maintenance.create({
      data: {
        carId, type, mileageAtService, nextServiceMileage: nextServiceMileage || mileageAtService,
        serviceDate: new Date(serviceDate), cost: cost || null, description: description || null,
        performedById: user.id,
      }
    })
    // Update last TO mileage on car
    const updateData: any = {}
    if (type === 'TO1') updateData.lastTo1Mileage = mileageAtService
    if (type === 'TO2') updateData.lastTo2Mileage = mileageAtService
    if (type === 'TO3') updateData.lastTo3Mileage = mileageAtService
    if (type === 'TO4') updateData.lastTo4Mileage = mileageAtService
    if (Object.keys(updateData).length)
      await tx.car.update({ where: { id: carId }, data: updateData })
    return m
  })
  return record
})
