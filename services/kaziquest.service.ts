import { useApi, type UseApiOptions } from "~/composables/useApi";

type ApiOptions = UseApiOptions<Record<string, any>>;

const kaziquestService = {
    sendEmail: function(options: ApiOptions = {}){
        return useApi(`/kaziquest/send-email/`,{
            method: 'POST',
            ...options,
        })
    }
}

export { kaziquestService }
