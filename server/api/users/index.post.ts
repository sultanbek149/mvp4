import { prisma } from '~/server/utils/prisma'
import { requireRole, SUPER_ONLY, hashPassword } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, SUPER_ONLY)
  const body = await readBody(event)
  const { name, email, password, role, phone } = body

  if (!name || !email || !password) throw createError({ statusCode: 400, message: 'Имя, email и пароль обязательны' })
  if (password.length < 6) throw createError({ statusCode: 400, message: 'Пароль не менее 6 символов' })

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DRIVER']
  if (!allowedRoles.includes(role)) throw createError({ statusCode: 400, message: 'Недопустимая роль' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw createError({ statusCode: 400, message: 'Пользователь с таким email уже существует' })

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: role as any, phone: phone || null }
  })
  const { passwordHash, ...safe } = user
  return safe
})
