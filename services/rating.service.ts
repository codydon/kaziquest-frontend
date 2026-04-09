import { useApi, type UseApiOptions } from "~/composables/useApi";

export const ratingService = {
    updateQuestion,
    updateDocument,
    rateDocument,
    rateScores,
}

function updateQuestion(question_data: Record<string, any>, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/jobs/answers/${question_data.id}/`,{
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'PATCH',
        body:{ rating: question_data.rating}
    });
}

function updateDocument(data: Record<string, any>, options: UseApiOptions<Record<string, any>> = {}) {
    const { id, name, rating } = data;
    return useApi(`/jobs/job-documents-answers/${id}/`,{
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'PATCH',
        body:
        {
            name: name,
            rating: rating
        }
    })
}

function rateDocument(data: Record<string, any>, options: UseApiOptions<Record<string, any>> = {}) {
    if(data.cv_score){
        return useApi(`/jobseekers/job-applications/${data.id}/`,{
            ...options,
            handler: options.handler ?? '$fetch',
            method: 'PATCH',
            body:
            {
                cv_score: data.cv_score
            }
        })
    }
    else if(data.cover_letter_score){
        return useApi(`/jobseekers/job-applications/${data.id}/`,{
            ...options,
            handler: options.handler ?? '$fetch',
            method: 'PATCH',
            body:
            {
                cover_letter_score: data.cover_letter_score
            }
        })
    }

}
function rateScores(data: Record<string, any>, options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/jobseekers/job-applications/${data.id}/`,{
        ...options,
        handler: options.handler ?? '$fetch',
        method: 'PATCH',
        body:
        {
            score: data.score
        }
    })
}

