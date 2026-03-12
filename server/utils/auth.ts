import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'

export function getJwtSecret(): string {
  return (useRuntimeConfig().jwtSecret as string) || 'fallback-secret'
}

export function signToken(payload: object): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' })
}

export function verifyToken(token: string): any {
  return jwt.verify(token, getJwtSecret())
}

export function hashPassword(p: string) { return bcrypt.hash(p, 10) }
export function comparePassword(p: string, h: string) { return bcrypt.compare(p, h) }

export function getTokenFromEvent(event: H3Event): string | null {
  const cookie = getCookie(event, 'auth_token')
  if (cookie) return cookie
  const auth = getHeader(event, 'authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export function requireAuth(event: H3Event) {
  const token = getTokenFromEvent(event)
  if (!token) throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  try { return verifyToken(token) }
  catch { throw createError({ statusCode: 401, message: 'Недействительный токен' }) }
}

export function requireRole(event: H3Event, roles: string[]) {
  const user = requireAuth(event)
  if (!roles.includes(user.role))
    throw createError({ statusCode: 403, message: 'Недостаточно прав доступа' })
  return user
}

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
} as const

// SUPER_ADMIN + ADMIN: management operations
export const MANAGE_ROLES  = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
// SUPER_ADMIN only: system settings, fuel norms, delete
export const SUPER_ONLY    = [ROLES.SUPER_ADMIN]
// All roles
export const ALL_ROLES     = Object.values(ROLES)

// Legacy alias — no more DISPATCHER, use MANAGE_ROLES
export const DISPATCH_ROLES = MANAGE_ROLES
