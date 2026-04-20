export const ROUTE_LIST = {
  home: '/home',
  profile: '/my-profile',
  inactivity: '/inactivity',
  timeOff: {
    applications: '/time-off/requests',
    leaveBalances: '/time-off/balances',
    /** Company time-off config (legacy employer: `settings#timeoffs`). */
    settings: '/settings#timeoffs',
  },
  settings: {
    index: '/settings',
    rolesPerms: {
      tab: '/settings#:tab',
      createRole: '/settings/roles-permissions/create-role',
      editRole: '/settings/roles-permissions/edit-role'
    },
    billing: '/settings#billing',
    /** Legacy employer settings hash for Hiring module entry. */
    hiring: '/settings#hiring'
  },
  reports: '/reports',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    emailVerification: '/auth/email-verification',
    teamMemberVerfication: '/auth/team-member-verification',
    otpVerification: '/auth/otp-verification',
    employeeActivation: '/auth/employee-activation',
    adminImpersonate: '/auth/admin-impersonate',
    whmcsSso: '/auth/whmcs-sso'
  },
  calculator: {
    index: '/calculator',
    gross: '/calculator/grosspay',
    paye: '/calculator/paye'
  },
  employees: {
    index: '/employees',
    add: '/employees/add',
    import: '/employees/import',
    detail: '/employees/:uuid',
    payslip: '/employees/:uuid/payslip',
    benefits: {
      all: '/employees/benefits',
      employee: '/employees/:uuid/benefits'
    }
  },
  payroll: {
    index: '/payroll',
    history: '/payroll/history',
    wallet: '/payroll/wallet-balance',
    offCycle: '/payroll/off-cycle',
    review: '/payroll/:payrollId/review'
  },
  events: {
    index: '/events'
  },
  hiring: {
    index: '/hiring',
    settings: '/hiring/settings',
    jobPostings: '/job-postings',
    createJobPosting: '/job-postings/new',
    applicants: '/applicants',
    applicantDetail: '/applicants/:uuid',
    jobs: '/jobs'
  },
  checkoutPlan: '/checkout/plan/:plan_id',
  checkoutSubscription: '/checkout/subscription/:subscription_id',
  paymentSuccess: '/payment-success',
  careerSite: '/',
  careerTableIframe: '/careerTableIframe',
  affiliates: {
    index: '/affiliate-program',
    dashboard: '/affiliate-program/dashboard'
  },
  talentNetwork: {
    index: '/talent-network',
    joinTalentNetwork: '/talent-network/join-talent-network',
    detail: '/talent-network/:uuid'
  },
  applicants: {
    index: '/applicants'
  }
} as const
