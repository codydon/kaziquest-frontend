import { useApi, type UseApiOptions } from "~/composables/useApi";
import { useAuth } from "~/composables/useAuth";
import type { IRole } from "~/types";
import type { UseFetchOptions } from "#app";

type ApiOptions = UseApiOptions<Record<string, any>>;

export const authService = {
    login,
    logout,
    refreshToken,
    register,
    resendActivationCode,
    verifyActivationCode,
    createCareerSite,
    changePassword,
    passwordResetRequest,
    linkTokenCheck,
    passwordResetComplete,
    verifyUserLink,
    updateUserData,
    fetchAuthUser,
    fetchRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    fetchPermissions,
    assignUsersToRole,
    removeUsersFromRole,
    verifyPassword,
    verifyLoginOTP,
    resendLoginOTP,
    verifyDomain,
    requestOTP,
    verifyOTP,
    whmcsSSO,
    // loginRequest,
    // verifyLoginOTPRequest,
}

function verifyOTP(options: ApiOptions = {}) {
    return useApi(`/accounts/otp/`, {
        ...options,
        method: 'PATCH',
    })
}

function requestOTP(options: ApiOptions = {}) {
    return useApi(`/accounts/otp/`, {
        ...options,
        method: 'POST'
    })
}

function verifyLoginOTP(options: ApiOptions) {
    return useApi('accounts/verify-login-otp/', {
        ...options,
        method: 'POST',
        secured: false
    })
}

function resendLoginOTP(options: ApiOptions) {
    return useApi('accounts/login/otp/resend/', {
        ...options,
        method: 'POST',
        secured: false
    })
}

function updateUserData(id: string, options: ApiOptions = {}) {
    if (!id) return;
    return useApi(`/accounts/users/${id}/`, {
        method: 'PATCH',
        ...options,
    });
}

function login(options: ApiOptions) {
    return useApi(`/accounts/login/`, {
        ...options,
        method: 'POST',
        secured: false
    })
}

function logout(options: ApiOptions = {}) {
    const { refreshToken } = useAuth();
    return useApi(`/accounts/logout/`, {
        ...options,
        method: 'POST',
        body: { refresh_token: refreshToken.value }
    })
}

function whmcsSSO(options: UseFetchOptions<Record<string, any>>) {
    return useApi(`/accounts/whmcs-sso/`, {
        method: 'POST',
        secured: false,
        ...options
    })
}

// /**
//  * Event-safe (non-cached) login request.
//  * Use this in submit/click handlers instead of `useFetch` to avoid stale AsyncData.
//  */
// async function loginRequest(body: Record<string, any>) {
//     return await $fetch(`${useBaseUrl()}/accounts/login/`, {
//         method: 'POST',
//         body,
//     })
// }

// /**
//  * Event-safe (non-cached) login OTP verification request.
//  */
// async function verifyLoginOTPRequest(body: Record<string, any>) {
//     return await $fetch(`${useBaseUrl()}/accounts/verify-login-otp/`, {
//         method: 'POST',
//         body,
//     })
// }

function refreshToken(options: ApiOptions = {}) {
    const { refreshToken: refreshTokenCookie } = useAuth();
    if (!refreshTokenCookie.value) {
        return Promise.reject(new Error('No refresh token available'));
    }
    return useApi(`/accounts/token/refresh/`, {
        ...options,
        method: 'POST',
        body: { refresh: refreshTokenCookie.value },
        secured: false
    })
}

function register(options: ApiOptions) {
    return useApi('/accounts/users/', {
        ...options,
        method: 'POST',
        secured: false
    });
}

function passwordResetRequest(options: ApiOptions = {}) {
    return useApi(`/accounts/password-reset-request/`, {
        ...options,
        method: 'POST',
        secured: false
    });
}

function linkTokenCheck(options: ApiOptions = {}) {
    return useApi(`/accounts/link-token-check/`, {
        ...options,
        method: 'POST',
        secured: false
    });
}

function passwordResetComplete(options: ApiOptions = {}) {
    return useApi('/accounts/password-reset-complete/', {
        ...options,
        method: 'PATCH',
        secured: false
    });
}

function changePassword(options: ApiOptions = {}) {
    return useApi(`/accounts/change-password/`, {
        ...options,
        method: 'POST',
    });
}

function resendActivationCode(options: ApiOptions = {}) {
    return useApi(`/accounts/verify/resend_activation_code/`, {
        ...options,
        method: 'POST',
        secured: false
    })
}

function verifyActivationCode(options: ApiOptions = {}) {
    return useApi(`/accounts/verify/verify_activation_code/`, {
        ...options,
        method: 'POST',
        secured: false
    })
}

function createCareerSite(options: ApiOptions = {}) {
    return useApi(`/companies/create-subdomain/`, {
        ...options,
        method: 'POST',
    });
}

function verifyUserLink(options: ApiOptions = {}) {
    return useApi(`/accounts/link-token-check/`, {
        ...options,
        method: 'POST',
        secured: false
    })
}

async function fetchAuthUser(options: ApiOptions = {}) {
    const result: any = await useApi(`/accounts/users/auth-user/`, {
        ...options,
    });
    const { setUser } = useAuthSession();

    if (options.handler === '$fetch') {
        if (result?.data) setUser(result.data as Record<string, any>);
        return result;
    }

    if (result?.data?.value) setUser((result.data.value?.data ?? null) as Record<string, any> | null);
    return result;
}

function fetchRoles(options: ApiOptions = {}) {
    return useApi(`/accounts/roles/`, {...options})
}

function getRole(role_id: number, options: ApiOptions = {}) {
    return useApi(`/accounts/roles/${role_id}`, {...options})
}

function createRole(options: ApiOptions = {}) {
    return useApi(`/accounts/roles/`, {
        ...options,
        method: 'POST',
    })
}

function updateRole(role_id: number, options: ApiOptions = {}) {
    return useApi(`/accounts/roles/${role_id}/`, {
        ...options,
        method: 'PATCH',
    })
}

function deleteRole(role_id: number, options: ApiOptions = {}) {
    return useApi(`/accounts/roles/${role_id}/`, {
        ...options,
        method: 'DELETE',
    })
}

function fetchPermissions(options: ApiOptions = {}) {
    return useApi(`/accounts/permissions/`, {...options})
}

function assignUsersToRole(role_id: number, options: ApiOptions = {}) {
    return useApi(`/accounts/roles/${role_id}/assign_users_to_group/`, {
        ...options,
        method: 'POST',
    })
}

function removeUsersFromRole(role_id: number, options: ApiOptions = {}) {
    return useApi(`/accounts/roles/${role_id}/remove_users_from_group/`, {
        ...options,
        method: 'POST',
    })
}

function verifyPassword(options: ApiOptions = {}) {
    return useApi(`/accounts/verify-password/`, {
        ...options,
        method: 'POST'
    })
}

function verifyDomain(options: ApiOptions = {}) {
    return useApi(`/accounts/verify-domain/`, {
        ...options,
        method: 'POST',
        secured: false
    })
}
