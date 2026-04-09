import { createError } from 'h3'
import { createRole, ensureRoleNameUnique, listRoles } from '../utils/roles'

export default eventHandler(async (event) => {
  if (event.method === 'GET') {
    return listRoles()
  }

  if (event.method === 'POST') {
    const body = await readBody(event)

    const name = String(body?.name ?? '').trim()
    const description = String(body?.description ?? '').trim()
    const permissions = body?.permissions

    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Role name is required.' })
    }

    if (name.length > 60) {
      throw createError({ statusCode: 400, statusMessage: 'Role name cannot exceed 60 characters.' })
    }

    if (!ensureRoleNameUnique(name)) {
      throw createError({ statusCode: 409, statusMessage: 'A role with this name already exists.' })
    }

    const created = createRole({ name, description, permissions })
    return created
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
