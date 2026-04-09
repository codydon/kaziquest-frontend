import { useApi } from "~/composables/useApi"

export const planService = {
  getPlans,
  getPlan,
};

function getPlans(){
  return useApi(
  "/packages/plans",
  {
    handler: '$fetch',
    method: 'GET',
  })
}

function getPlan(plan_id: string){
  return useApi(
  `/packages/plans/${plan_id}/`,
  {
    handler: '$fetch',
    method: 'GET',
  })
}
