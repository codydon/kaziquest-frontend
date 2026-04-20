export interface HiringCompanyLite {
  id?: string
  name?: string
  logo?: string | null
  subdomain_name?: string | null
}

export interface HiringQuestionChoice {
  id?: number | string
  name?: string
}

export interface HiringJobQuestion {
  id?: number | string
  question?: string
  type?: string
  choice_question?: boolean
  multiple_choice?: boolean
  choices?: HiringQuestionChoice[]
}

export interface HiringJobDocument {
  id?: number | string
  name?: string
}

export interface HiringJobPosting {
  id?: string
  title?: string
  slug?: string
  description?: string
  employment_type?: string
  experience?: string | number | null
  job_level?: string
  education_level?: string
  currency?: string
  min_salary?: number | null
  max_salary?: number | null
  category?: string
  country?: string
  job_location?: string
  valid_through?: string
  status?: string
  date_posted?: string
  applications_count?: number
  posted_by?: string
  published?: boolean
  company?: HiringCompanyLite
  questions?: HiringJobQuestion[]
  documents?: HiringJobDocument[]
  prev_job?: string | null
  next_job?: string | null
}

export interface HiringPagination<T> {
  count?: number
  next?: string | null
  previous?: string | null
  current_page?: number
  current_page_count?: number
  total_pages?: number
  results?: T[]
}

export interface HiringApplicationComment {
  id?: string
  comment?: string
  timestamp?: string
  user_info?: {
    profile_pic?: string | null
    employee?: {
      user?: {
        full_name?: string
      }
    }
  }
}

export interface HiringApplicationEmail {
  id?: string
  subject?: string
  message?: string
  timestamp?: string
  sender_info?: {
    role?: string
  }
}

export interface HiringApplicationDocumentAnswer {
  id?: string | number
  document_name?: string
  file?: string
}

export interface HiringApplicationAnswer {
  id?: string | number
  answer?: string
  rating?: string | number | null
  selected_choices?: Array<number | string>
  chosen_choices?: string
  question_data?: HiringJobQuestion
}

export interface HiringApplication {
  id?: string
  job?: string
  job_title?: string
  job_seeker_name?: string
  job_seeker_email?: string
  phone?: string
  status?: string
  source?: string
  seen?: boolean
  score?: string | number | null
  cv?: string | null
  cv_score?: string | number | null
  cover_letter?: string | null
  cover_letter_score?: string | number | null
  created_at?: string
  updated_at?: string
  answers?: HiringApplicationAnswer[]
  documents?: HiringApplicationDocumentAnswer[]
  questions?: HiringJobQuestion[]
  app_comments?: HiringApplicationComment[]
  app_emails?: HiringApplicationEmail[]
  job_data?: HiringJobPosting
  job_seeker_info?: {
    id?: string
    email?: string
    name?: string
    yob?: string
    gender?: string
    linkedin_url?: string | null
  }
  prev_appl?: string | null
  next_appl?: string | null
  position_and_count?: {
    position?: number
    total_count?: number
  }
}

export interface HiringTalentDocument {
  id?: string | number
  name?: string
  document?: string
  score?: number | string | null
}

export interface HiringTalentExperience {
  id?: string | number
  company_name?: string
  job_title?: string
  location?: string
  start_date?: string
  end_date?: string
  score?: number | string | null
}

export interface HiringTalentEducation {
  id?: string | number
  school_name?: string
  degree_level?: string
  major?: string
  start_date?: string
  end_date?: string
  score?: number | string | null
}

export interface HiringTalentRecord {
  id?: string
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  gender?: string
  salutation?: string
  industry?: string
  linkedin_url?: string | null
  documents?: HiringTalentDocument[]
  experiences?: HiringTalentExperience[]
  education?: HiringTalentEducation[]
  prev_record?: string | null
  next_record?: string | null
}

export interface HiringDashboardStatistics {
  applications?: {
    years?: number[]
    months?: Array<{ name?: string, value?: string | number }>
    current_month?: string | number
    current_year?: string | number
    data?: number[]
  }
  genderStats?: Record<string, number>
  statusStats?: Array<{ status?: string, count?: number }>
  jobStats?: Record<string, number>
}

export interface HiringActivityItem {
  id?: string | number
  action?: string
  message?: string
  created_at?: string
  timestamp?: string
  actor?: {
    full_name?: string
  }
}

export interface HiringJobFormState {
  title: string
  description: string
  employment_type: string
  experience: string
  job_level: string
  education_level: string
  currency: string
  min_salary: number | null
  max_salary: number | null
  category: string
  other_category: string
  country: string
  job_location: string
  valid_through: string
  status: string
  published: boolean
  questions: HiringJobQuestion[]
  documents: HiringJobDocument[]
}
