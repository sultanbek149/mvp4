import { prisma } from '~/server/utils/prisma'
import { requireRole, MANAGE_ROLES } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, MANAGE_ROLES)
  const body = await readBody(event)
  const { name, licenseNumber, licenseCategory, licenseExpiry, phone, userId } = body

  if (!name || !licenseNumber || !licenseExpiry) throw createError({ statusCode: 400, message: 'Имя, номер и срок удостоверения обязательны' })

  const driver = await prisma.driver.create({
    data: { name, licenseNumber, licenseCategory: licenseCategory || 'B', licenseExpiry: new Date(licenseExpiry), phone: phone || null, userId: userId || null }
  })
  return driver
})
