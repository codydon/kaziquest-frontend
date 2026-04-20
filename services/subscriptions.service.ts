import { unref } from "vue"
import { useApi } from "~/composables/useApi"
import type { UseApiOptions } from "~/composables/useApi"
import { asCollectionOptions } from "./service-options"

export const subscriptionService = {
  getSubscriptions,
  getSubscription,
  getInvoicePdf,
  addSubscription,
  applyCoupon,
  removeCoupon,
  finalizeZeroDue,
  setSubscriptionTrial,
  completePayment,
  addBilling,
  removeFreeTrial,
  reduceJobLimit,
  getCurrentBilling,
};

function recordBody(resolved: ReturnType<typeof asCollectionOptions>) {
  const rawBody = unref(resolved.body)
  if (rawBody && typeof rawBody === 'object' && !(rawBody instanceof FormData) && !Array.isArray(rawBody)) {
    return rawBody as Record<string, unknown>
  }
  return {}
}

function reduceJobLimit(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method: 'PATCH',
  })
  const { id, job_limit } = recordBody(resolvedOptions)
  return useApi(`/packages/subscriptions/${id}/`, {
      ...resolvedOptions,
      body: {
        "job_limit": job_limit,
      }
  });
}

function removeFreeTrial(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method: 'PATCH',
  })
  const { id, free_trial } = recordBody(resolvedOptions)
  
  return useApi(`/companies/${id}/`, {
      ...resolvedOptions,
      body: {
        "free_trial": free_trial,
      }
  });
}

function getSubscriptions() {
  return useApi('/packages/subscriptions/', {
    method: 'GET',
  });
}

function addSubscription(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/packages/subscriptions/', {
    ...asCollectionOptions(options, {
      handler: '$fetch',
      method: 'POST',
    }),
  });
}

function applyCoupon(subscriptionId: string, code: string) {
  return useApi(`/packages/subscriptions/${subscriptionId}/apply-coupon/`, {
    handler: '$fetch',
    method: 'POST',
    body: { code }
  });
}

function removeCoupon(subscriptionId: string) {
  return useApi(`/packages/subscriptions/${subscriptionId}/remove-coupon/`, {
    handler: '$fetch',
    method: 'POST',
  });
}

function finalizeZeroDue(subscriptionId: string, currency: 'KES' | 'USD') {
  return useApi(`/packages/subscriptions/${subscriptionId}/finalize-zero-due/`, {
    handler: '$fetch',
    method: 'POST',
    body: { currency }
  });
}

function addBilling(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/packages/billing/', {
    ...asCollectionOptions(options, {
      handler: '$fetch',
      method: 'POST',
    }),
  });
}

function getCurrentBilling(params: { plan?: string }) {
  const searchParams = new URLSearchParams();
  if (params.plan) searchParams.set('plan', params.plan);
  const query = searchParams.toString();
  const url = query ? `/packages/billing/current/?${query}` : `/packages/billing/current/`;
  return useApi(url, {
    handler: '$fetch',
    method: 'GET',
  });
}

function getSubscription(s_id: string) {
  return useApi(`/packages/subscriptions/${s_id}`, {
    handler: '$fetch',
    method: 'GET',
  });
}

function getInvoicePdf(s_id: string) {
  return useApi(`/packages/subscriptions/${s_id}/invoice-pdf/`, {
    handler: '$fetch',
    method: 'GET',
    responseType: 'blob'
  });
}

function setSubscriptionTrial(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method: 'PATCH',
  })
  const { id, active, status } = recordBody(resolvedOptions)
  return useApi(`/packages/subscriptions/${id}/`, {
    ...resolvedOptions,
    body: {
      is_trial: active,
      status: status,
    }
  });
}

function completePayment(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method: 'PATCH',
  })
  const { id, expiry_date } = recordBody(resolvedOptions)
  return useApi(`/packages/subscriptions/${id}/`, {
    ...resolvedOptions,
    body: {
      is_trial: false,
      expiry_date: expiry_date,
    }
  })
}

// function editSubscription(subscription) {
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `subscriptions/${subscription.id}/?dashboard=true`, {
//       method: 'PUT',
//       headers: useAuthHeader(),
//       body: subscription
//   });       
// }


// function deleteSubscription(subscription_id) {
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `subscriptions/${subscription_id}/?dashboard=true`, {
//       method: 'DELETE',
//       headers: useAuthHeader(),
//       body: job
//   });      
// }
