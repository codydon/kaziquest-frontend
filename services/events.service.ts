import type { UseApiOptions } from "~/composables/useApi"
import { useApi } from "~/composables/useApi"
import { asCollectionOptions, asResourceOptions } from "./service-options"

export const eventService = {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  deleteCohost
}

async function getEvents(urlParams?: string) {
    return await useApi(`/events/${urlParams ?? ''}`, {
      handler: '$fetch',
      method: 'GET',
  });
}

function addEvent(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/events/', asCollectionOptions(options, {
      handler: '$fetch',
      method: 'POST',
    }));
}

function deleteEvent(id: string){
    return useApi(`/events/${id}/`, {
      handler: '$fetch',
      method: 'DELETE',
    });
}

function deleteCohost(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/events/cohosts/delete-cohost/', asCollectionOptions(options, {
      handler: '$fetch',
      method: 'POST',
    }));
}

function updateEvent(id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi(`/events/${id}/`, asResourceOptions(options, {
      handler: '$fetch',
      method: 'PATCH',
    }));
}
