import { createError } from 'h3'
import { ensureRoleNameUnique, getRole, updateRole, deleteRole } from '../../utils/roles'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Role id is required.' })
  }

  if (event.method === 'GET') {
    const role = getRole(id)
    if (!role) {
      throw createError({ statusCode: 404, statusMessage: 'Role not found.' })
    }
    return role
  }

  if (event.method === 'PATCH') {
    const role = getRole(id)
    if (!role) {
      throw createError({ statusCode: 404, statusMessage: 'Role not found.' })
    }

    if (!role.canEdit) {
      throw createError({ statusCode: 403, statusMessage: 'This role cannot be edited.' })
    }

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

    if (!ensureRoleNameUnique(name, id)) {
      throw createError({ statusCode: 409, statusMessage: 'A role with this name already exists.' })
    }

    const updated = updateRole(id, { name, description, permissions })

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'Role not found.' })
    }

    return updated
  }

  if (event.method === 'DELETE') {
    const result = deleteRole(id)

    if (!result.deleted) {
      if (result.reason === 'NOT_FOUND') {
        throw createError({ statusCode: 404, statusMessage: 'Role not found.' })
      }
      if (result.reason === 'SYSTEM_ROLE_NOT_DELETABLE') {
        throw createError({ statusCode: 403, statusMessage: 'System roles cannot be deleted.' })
      }
      if (result.reason === 'ROLE_HAS_ASSIGNED_USERS') {
        throw createError({ statusCode: 409, statusMessage: 'This role is assigned to users and cannot be deleted.' })
      }
    }

    return { deleted: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
