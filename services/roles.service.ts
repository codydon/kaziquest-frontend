import { useApi, type UseApiOptions } from "~/composables/useApi";
import { asCollectionOptions, asResourceOptions } from "./service-options";

export const groupService = {
  getGroup,
  addGroup,
  editGroup,
  deleteGroup,
  asignRoleToUsers
}

function getGroup(slug: string, options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/roles/${slug}`, {
      ...options,
      handler: options.handler ?? '$fetch',
      method: 'GET',
  });
}

function addGroup(options: UseApiOptions<Record<string, any>> | { name: string; permissions: string[] } = {}) {
  return useApi("/roles/", {
      ...asCollectionOptions(
        'name' in (options as Record<string, any>) ? { body: options } : options,
        {
          handler: '$fetch',
          method: 'POST',
        },
      ),
  });
}

function editGroup(id: string, options: UseApiOptions<Record<string, any>> | { name: string; permissions: string[] } = {}) {
  return useApi(`/roles/${id}`, {
      ...asResourceOptions(
        'name' in (options as Record<string, any>) ? { body: options } : options,
        {
          handler: '$fetch',
          method: 'PATCH',
        },
      ),
  });
}

function deleteGroup(group_id: string, options: UseApiOptions<Record<string, any>> = {}) {
  return useApi(`/roles/${group_id}`, {
      ...options,
      handler: options.handler ?? '$fetch',
      method: 'DELETE',
  });
}

function asignRoleToUsers(id: string, options: UseApiOptions<Record<string, any>> | { users: string[] } | string[] = {}){
  return useApi(`/roles/${id}/asign_role_to_users/`, {
      ...asResourceOptions(
        Array.isArray(options) ? { body: { id, users: options } } : ('users' in (options as Record<string, any>) ? { body: { id, ...(options as Record<string, any>) } } : options),
        {
          handler: '$fetch',
          method: 'POST',
        },
      ),
  });
}
