import type { UseApiOptions } from "~/composables/useApi"
import { useApi } from "~/composables/useApi"
import { asCollectionOptions, asResourceOptions } from "./service-options"

export const smsService = {
    sendSMS,
    addSmsDriver,
    getSMSDrivers,
    updateSmsDriver,
    getSmsProviders
}

function sendSMS(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
    return useApi('/sms/messages/', asCollectionOptions(options, {
        handler: '$fetch',
        method: 'POST',
    }));
}

function updateSmsDriver(id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi(`/sms/drivers/${id}/`, asResourceOptions(options, {
        handler: '$fetch',
        method: 'PATCH',
    }));
}

function addSmsDriver(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/sms/drivers/', asCollectionOptions(options, {
        handler: '$fetch',
        method: 'POST',
    }));
}

function getSMSDrivers(){
   return useApi('/sms/drivers', {
        handler: '$fetch',
        method: 'GET',
    });
}

function getSmsProviders(){
   return useApi('/sms/providers', {
        handler: '$fetch',
        method: 'GET',
    });
}
