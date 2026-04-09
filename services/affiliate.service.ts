import { useApi, type UseApiOptions } from "~/composables/useApi";

type ApiOptions = UseApiOptions<Record<string, any>>;
type ApiHandler = "useFetch" | "$fetch" | "useAsyncData";

const withHandler = (options: ApiOptions = {}, handler: ApiHandler) => ({
    ...options,
    handler: options.handler ?? handler,
});

export const affiliateService = {
    updateAffiliateClicks,
    activateAffiliateAccount,
    getAffiliates,
    regesterReferral,
    getRefarrals,
    paymentRequest,
    getTransactions,
    registerAffiliate,
    verify_email,
    login,
    trackAffiliateClick,
    getAffiliate,
    logoutAffiliate,
    getAffiliateCommission,
    maturedCommission,
    requestCommissionPayment,
    forgotPassword,
    resetPassword,
    commissionRequests
}

function forgotPassword(options: ApiOptions | string = {}){
    return useApi('/affiliates/forgot_password/', {
        ...withHandler(typeof options === 'string' ? { body: { email: options } } : options, '$fetch'),
        method: 'POST',
    })
}

function resetPassword(options: ApiOptions | { email: string, verification_code: string, new_password: string } = {}){
    return useApi('/affiliates/reset_password/', {
        ...withHandler('email' in (options as Record<string, any>) ? { body: options as Record<string, any> } : options as ApiOptions, '$fetch'),
        method: 'POST',
    })
}

function requestCommissionPayment(options: ApiOptions | Record<string, any> = {}){
    return useApi('/affiliates/commission-requests/',{
        ...withHandler('body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>) ? options as ApiOptions : { body: options as Record<string, any> }, '$fetch'),
        method: 'POST',
    })
}

function commissionRequests(id: string, options: ApiOptions = {}){
    return useApi(`/affiliates/commission-requests/affiliate/${id}/`,{
        ...withHandler(options, 'useAsyncData'),
        method: 'GET'
    })
}

function getAffiliateCommission(id: string, options: ApiOptions = {}){
    return useApi(`/affiliates/commissions/${id}/`,{
        ...withHandler(options, 'useAsyncData'),
        method: 'GET'
    })
}

function maturedCommission(options: ApiOptions = {}){
    return useApi('/affiliates/commissions/matured',{
        ...withHandler(options, 'useAsyncData'),
        method: 'GET'
    })
}   

function logoutAffiliate(refresh_token: string, options: ApiOptions = {}) {
    return useApi('/affiliates/logout/', {
        ...withHandler(options, '$fetch'),
        method: 'POST',
        body: { refresh_token }
    })
}
function getAffiliate (affiliate_id: string, options: ApiOptions = {}) {
    return useApi(`/affiliates/${affiliate_id}/`, {
        ...withHandler(options, 'useAsyncData'),
        method: 'GET'
    })
} 

function trackAffiliateClick(affiliate_code: string, options: ApiOptions = {}){
    return useApi(`/affiliates/track-click/${affiliate_code}/`, {
        ...withHandler(options, '$fetch'),
        method: 'GET',
        secured: false
    })
}
function registerAffiliate(options: ApiOptions | Record<string, any> = {}){
    return useApi('/affiliates/register/', {
        ...withHandler('body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>) ? options as ApiOptions : { body: options as Record<string, any> }, '$fetch'),
        method: 'POST',
        secured: false
    })
}

function verify_email(options: ApiOptions | Record<string, any> = {}){
    return useApi('/affiliates/verify_email/', {
        ...withHandler('body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>) ? options as ApiOptions : { body: options as Record<string, any> }, '$fetch'),
        method: 'POST',
        secured: false
    })
}
function login(options: ApiOptions | Record<string, any> = {}){
    return useApi('/affiliates/login/', {
        ...withHandler('body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>) ? options as ApiOptions : { body: options as Record<string, any> }, '$fetch'),
        method: 'POST',
        secured: false
    })
}


function getRefarrals(options: ApiOptions = {}){
    return useApi('/affiliates/referral-links/', {
        ...withHandler(options, 'useAsyncData'),
        method: 'GET'
    })
}

function activateAffiliateAccount(uid: string, options: ApiOptions = {}){
    return useApi('/affiliates/', {
        ...withHandler(options, '$fetch'),
        method: 'POST',
        body: {
            payment_details: '',
            user: uid
        }
    })
}

function getAffiliates(options: ApiOptions = {}){
    return useApi('/affiliates/register/', {
        ...withHandler(options, '$fetch'),
        method: 'POST',
        secured: true
    });
}



function updateAffiliateClicks(clicksOrAffiliateId: number | string, affiliateIdOrOptions: string | ApiOptions | Record<string, any> = {}, maybeOptions: ApiOptions = {}){
        const isLegacyCall = typeof clicksOrAffiliateId === 'number' && typeof affiliateIdOrOptions === 'string';
        const affiliateId = isLegacyCall ? affiliateIdOrOptions : String(clicksOrAffiliateId);
        const normalizedOptions = isLegacyCall
            ? { ...maybeOptions, body: { clicks: clicksOrAffiliateId } }
            : ('body' in (affiliateIdOrOptions as Record<string, any>) || 'handler' in (affiliateIdOrOptions as Record<string, any>)
                ? affiliateIdOrOptions as ApiOptions
                : { body: affiliateIdOrOptions as Record<string, any> });
        return useApi(`/affiliates/${affiliateId}/`, {
            ...withHandler(normalizedOptions, '$fetch'),
            method: 'PUT',
    });
}

function getTransactions(options: ApiOptions = {}){
        return useApi('/affiliates/transactions/', {
                ...withHandler(options, 'useAsyncData'),
                method: 'GET'
        })
}

function regesterReferral(options: ApiOptions | { referral_url: string; affiliate: string; company: string } = {}, affiliateId?: string, companyId?: string){
        const normalizedOptions =
            typeof options === 'object' && ('body' in options || 'handler' in options)
                ? options as ApiOptions
                : typeof options === 'object' && 'referral_url' in options
                    ? { body: options as Record<string, any> }
                    : { body: { referral_url: options, affiliate: affiliateId, company: companyId } };
        return useApi('/affiliates/referral-links/', {
            ...withHandler(normalizedOptions, '$fetch'),
            method: 'POST',
    });
}

function paymentRequest(options: ApiOptions | Record<string, any> = {}){
        return useApi('/affiliates/payment-requests/', {
                ...withHandler('body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>) ? options as ApiOptions : { body: options as Record<string, any> }, '$fetch'),
        method: 'POST',
    });
}
