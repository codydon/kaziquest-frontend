import { useApi } from "~/composables/useApi"
import type { UseApiOptions } from "~/composables/useApi"
import { asCollectionOptions } from "./service-options"

export const talentNetworkService = {
  getTalentNetwork,
  getTalentNetworkById,
  rateTalentDocuments,
  rateTalentExperience,
  rateTalentEducation,
  sendEmail,
  getCompanyTalentNetwork,
  registerTalentNetwork,
  verify_talentNetwork,
  completeTalentNetworkProfile
};

async function getTalentNetwork(id?: string){
  return await useApi(`/talent-network/records/${id}/`, {
  })
}

function registerTalentNetwork(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/talent-network/records/register/', {
      ...asCollectionOptions(options, {
        handler: '$fetch',
        method:'POST',
      }),
  })
}


function verify_talentNetwork(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/talent-network/records/verify_email/', {
      ...asCollectionOptions(options, {
        handler: '$fetch',
        method:'POST',
      }),
  })
}
function completeTalentNetworkProfile(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/talent-network/records/complete_profile/', {
      ...asCollectionOptions(options, {
        handler: '$fetch',
        method:'POST',
      }),
  })
}

// function getTalentNetwork(){
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/talent-network/`, {
//       method:'GET',
//       headers: useAuthHeader(),
//   })
// }

function getCompanyTalentNetwork(urlParams: Record<string, any>){
  return useApi(`/talent-network/records/${urlParamsExtensionUtil(urlParams)}`, {
    method: "GET",
  })
}

function getTalentNetworkById(id: string){
  return useApi(`/talent-network/${id}/`, {
      handler: '$fetch',
      method:'GET',
  });
} 

function rateTalentDocuments(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method:'PATCH',
  })
  const { id, score} = resolvedOptions.body || {};
  return useApi(`/talent-network/talent-network-documents/${id}/`, {
      ...resolvedOptions,
      body: {
        score: score,
      }
  })
}

function rateTalentExperience(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method:'PATCH',
  })
  const { id, score} = resolvedOptions.body || {};
  return useApi(`/talent-network/talent-network-experiences/${id}/`, {
      ...resolvedOptions,
      body: {
        score: score,
      }
  })
}

function rateTalentEducation(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method:'PATCH',
  })
  const { id, score} = resolvedOptions.body || {};
  return useApi(`/talent-network/talent-network-education/${id}/`, {
      ...resolvedOptions,
      body: {
        score: score,
      }
  })
}

function sendEmail(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/talent-network/records/send_email/', {
      ...asCollectionOptions(options, {
        handler: '$fetch',
        method:'POST',
      }),
  })
}
