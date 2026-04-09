import { useApi, type UseApiOptions } from "~/composables/useApi";

type ApiOptions = UseApiOptions<Record<string, any>>;

function getPermissions(options: ApiOptions = {}) {
    return useApi("/accounts/permissions/", {
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'GET',
    });
}

function getPermission(slug: string, options: ApiOptions = {}) {
    return useApi(`/accounts/permissions/${slug}`, {
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'GET',
    });
}

function editPermission(permission: Record<string, any>, options: ApiOptions = {}) {
    return useApi(`/accounts/permissions/${permission.id}`, {
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'PATCH',
        body: permission,
    });
}

export const permissionService = {
    getPermissions,
    getPermission,
    editPermission,
};
