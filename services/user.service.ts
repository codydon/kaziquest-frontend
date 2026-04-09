import { useApi, type UseApiOptions } from "~/composables/useApi";

// TODO to be deprecated

export const userService = {
    // google,
    // login,
    // register,
    updateProfile,
    getProfile,
    getCompletionStatus,
    // createCareersite,
    // changePassword,
    // verifyActivationCode,
    // resendActivationCode,
    activateAffiliateAccount,
    recordAffiliateId,
    // googlelogin,
    // check_email
};

function activateAffiliateAccount(uid: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/affiliates/', {
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'POST',
        body: {
            payment_details: "",
            user: uid
        }
    })
}

// function verifyActivationCode(email, code){
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + '/verify/verify_activation_code/', {
//         method: 'POST',
//         body: {email:email, verification_code:code}
//     })
// }
// function resendActivationCode(email){
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + '/verify/resend_activation_code/', {
//         method: 'POST',
//         body: {email:email}
//     })
// }



// function changePassword(current_password, new_password, confirm_password) {
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + "/change-password/", {
//         method: 'POST',
//         headers: useAuthHeader(),
//         body: {current_password:current_password , new_password:new_password, confirm_password:confirm_password}
//     });
// }

// function login(email, password) {
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + "/login/", {
//         method: 'POST',
//         body: {email, password}
//     });
// }

// function google(company_name, auth_token, phone_number) {
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + "/google/", {
//         method: 'POST',
//         body: {company_name, auth_token, phone_number}
//     });
// }

// function googlelogin(company_name, auth_token) {
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + "/google/login/", {
//         method: 'POST',
//         body: {company_name, auth_token}
//     });
// }

// function register(payload) {
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return  $fetch(API_URL + "/register/", {
//         method: 'POST',
//         body: payload
//     });
// }

function getCompletionStatus(options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/accounts/profile_completion/`, {
        ...options,
        method: 'GET',
    });
}

function updateProfile(body: Record<string, any>, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/accounts/users/${body.id}/`, {
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'PATCH',
        body,
    });
}

function recordAffiliateId(code: string, id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/accounts/users/${id}/`, {
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'PATCH',
        body: {
            affiate_code: code
        }
    });
}

function getProfile(options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/accounts/users/profile/`, {
        ...options,
        method:'GET',
    });
}
