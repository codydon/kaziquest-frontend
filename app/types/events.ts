import type { Employee } from '~/types/employee'

export enum EventFrequency {
  Once = 'once',
  Daily = 'daily',
  Weekly = 'weekly',
  Annual = 'annual',
  Custom = 'custom'
}

export interface EventHost extends Employee {
  full_name?: string
}

export interface EventRecord {
  id?: string | number
  status?: string | null
  name: string
  hosts?: EventHost[]
  cohosts: string[]
  link?: string | null
  location?: string | null
  text?: string | null
  start_date_time: string
  end_date_time: string
  frequency?: EventFrequency | null
}
