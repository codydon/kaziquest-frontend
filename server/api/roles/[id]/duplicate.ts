import { createError } from 'h3'
import { duplicateRole, ensureRoleNameUnique } from '../../../utils/roles'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Role id is required.' })
  }

  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const body = await readBody(event)
  const name = String(body?.name ?? '').trim()
  const description = String(body?.description ?? '').trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'New role name is required.' })
  }

  if (name.length > 60) {
    throw createError({ statusCode: 400, statusMessage: 'Role name cannot exceed 60 characters.' })
  }

  if (!ensureRoleNameUnique(name)) {
    throw createError({ statusCode: 409, statusMessage: 'A role with this name already exists.' })
  }

  const duplicated = duplicateRole(id, { name, description })

  if (!duplicated) {
    throw createError({ statusCode: 404, statusMessage: 'Source role not found.' })
  }

  return duplicated
})
