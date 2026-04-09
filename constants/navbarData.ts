
export const bottomLinks = [
  [{
  label: 'Affiliate Program',
  icon: 'i-heroicons-banknotes',
  to: '/affiliate-program'
}, {
  label: 'Help',
  icon: 'i-heroicons-question-mark-circle'
},
{
  label: 'Logout',
  icon: 'i-heroicons-arrow-right-start-on-rectangle',
  to: ''
}]
]

// export const links = [
  // [
      // {
      //     label: 'Dashboard',
      //     icon: 'i-heroicons-home',
      //     to: '/dashboard'
      // },
//       {
//           label: 'All Applicants',
//           icon: 'i-heroicons-user-group',
//           to: '/applicants'
//       },
//       {
//           label: 'Job Postings',
//           icon: 'i-heroicons-briefcase',
//           to: '/job-postings'
//       },
//       {
//           label: 'Career Page',
//           icon: 'i-heroicons-map-pin',
//           to: '/career-page'
//       },
//       {
//           label: 'Talent Network',
//           icon: 'i-heroicons-globe-alt',
//           to: '/talent-network'
//       },
//       {
//           label: 'Reports',
//           icon: 'i-heroicons-chart-bar',
//           to: '/reports'
//       },
//       {
//           label: 'Events and  Schedules',
//           icon: 'i-heroicons-calendar-days',
//           to: '/events-schedules'
//       },
//       {
//           label: 'Settings',
//           icon: 'i-heroicons-cog-8-tooth',
//           to: '/settings'
//       },
//   ]
// ]


const attendanceChildrenRoutes = [
  {
    label: 'Attendance Log',
    icon: 'i-heroicons-home',
    to: '/attendance',
  },
  {
      label: 'Absenteeism',
      icon: 'i-heroicons-home',
      to: '/attendance/absenteesim',
  },
  {
      label: 'Over Time',
      icon: 'i-heroicons-home',
      to: '/attendance/over-time',
  },
  {
      label: 'Timesheets',
      icon: 'i-heroicons-home',
      to: '/attendance/timesheets',
  },
]

const timeoffChildrenRoutes = [
  {
    label: 'Leave Categories',
    icon: 'i-heroicons-home',
    to: '/timeoff/leave-categories',
  },
  {
      label: 'Leave Requests',
      icon: 'i-heroicons-home',
      to: '/timeoff/leave-requests',
  },
  {
      label: 'Leave Log',
      icon: 'i-heroicons-home',
      to: '/timeoff/leave-log',
  },
  {
      label: 'Leave Balance',
      icon: 'i-heroicons-home',
      to: '/timeoff/leave-balance',
  },
  {
      label: 'Leave History',
      icon: 'i-heroicons-home',
      to: '/timeoff/leave-history',
  }
]

const payrollChildrenRoutes = [
  {
    label: 'Process Payroll',
    icon: 'i-heroicons-home',
    to: '/payroll/process-payroll',
  },
  {
      label: 'Payroll Summary',
      icon: 'i-heroicons-home',
      to: '/payroll/summary',
  },
  {
      label: 'View Payslips',
      icon: 'i-heroicons-home',
      to: '/payroll/payslips',
  },
  {
      label: 'Expense Claims',
      icon: 'i-heroicons-home',
      to: '/payroll/claims',
  },
  {
      label: 'Losses/Damage',
      icon: 'i-heroicons-home',
      to: '/payroll/losses-damage',
  },
  {
      label: 'Deductions',
      icon: 'i-heroicons-home',
      to: '/payroll/deductions',
  },
  {
      label: 'Benefits',
      icon: 'i-heroicons-home',
      to: '/payroll/benefits',
  },
  {
      label: 'Advance Pay',
      icon: 'i-heroicons-home',
      to: '/payroll/advance-pay',
  },
  {
      label: 'Email Payslips',
      icon: 'i-heroicons-home',
      to: '/payroll/email-payslips',
  },
  {
      label: 'Basic Pay',
      icon: 'i-heroicons-home',
      to: '/payroll/basic-pay',
  },
  {
      label: 'Net Pay',
      icon: 'i-heroicons-home',
      to: '/payroll/net-pay',
  },
  {
      label: 'Gross Pay',
      icon: 'i-heroicons-home',
      to: '/payroll/gross-pay',
  },
]

const peopleChildrenRoutes = [
  {
    label: 'View Employees',
    icon: 'i-heroicons-home',
    to: '/employee/employee',
  },
  {
      label: 'Add Employees',
      icon: 'i-heroicons-home',
      to: '/employee/add-employee',
  },
  {
      label: 'Terminate Employee',
      icon: 'i-heroicons-home',
      to: '/employee/terminate-employee',
  },
  {
      label: 'Documents',
      icon: 'i-heroicons-home',
      to: '/employee/documents',
  },
  {
      label: 'Announcements',
      icon: 'i-heroicons-home',
      to: '/employee/announcements',
  }

]

const reportsChildrenRoutes = [
  {
    label: 'Payroll Reports',
    icon: 'i-heroicons-home',
    to: '/hr-reports/payroll-report',
  },
  {
      label: 'Payment Report',
      icon: 'i-heroicons-home',
      to: '/hr-reports/payment-report',
  },
  {
      label: 'Statutory Reports',
      icon: 'i-heroicons-home',
      to: '/hr-reports/statutory-report',
  },
  {
      label: 'Leave Report',
      icon: 'i-heroicons-home',
      to: '/hr-reports/leave-report',
  },
  {
      label: 'Attendance Report',
      icon: 'i-heroicons-home',
      to: '/hr-reports/attendance-report',
  },
  {
      label: 'Activity Log Report',
      icon: 'i-heroicons-home',
      to: '/hr-reports/activity-log',
  }
]

const settingsChildrenRoutes = [
  {
    label: 'Payroll Settings',
    icon: 'i-heroicons-home',
    to: '/hr-settings/payroll-settings',
  },
  {
      label: 'Time Off Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/time-off-settings',
  },
  {
      label: 'Attendance Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/attendance-settings',
  },
  {
      label: 'People Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/people-settings',
  },
  {
      label: 'Report Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/report-settings',
  },
  {
      label: 'General Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/general-settings',
  },
  {
      label: 'Email Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/email-settings',
  },
  {
      label: 'Notification Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/notification-settings',
  },
  {
      label: 'Security Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/security-settings',
  },
  {
      label: 'Integration Settings',
      icon: 'i-heroicons-home',
      to: '/hr-settings/integration-settings',
  },
  {
      label: 'Custom Fields',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-fields',
  },
  {
      label: 'Custom Forms',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-forms',
  },
  {
      label: 'Custom Reports',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-reports',
  },
  {
      label: 'Custom Workflows',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-workflows',
  },
  {
      label: 'Custom Notifications',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-notifications',
  },
  {
      label: 'Custom Integrations',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-integrations',
  },
  {
      label: 'Custom Security',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-security',
  },
  {
      label: 'Custom Email',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-email',
  },
  {
      label: 'Custom API',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-api',
  },
  {
      label: 'Custom Webhooks',
      icon: 'i-heroicons-home',
      to: '/hr-settings/custom-webhooks',
  }
]

export const hrsLinks = [
      {
          label: 'Attendance',
          icon: 'i-heroicons-clipboard-document-check',
          children: attendanceChildrenRoutes
      },
      {
          label: 'Time Offs',
          icon: 'i-heroicons-clock',
          children: timeoffChildrenRoutes
      },
      {
          label: 'Payroll',
          icon: 'i-heroicons-credit-card',
          children: payrollChildrenRoutes
      },
      {
          label: 'People',
          icon: 'i-heroicons-user-group',
          children: peopleChildrenRoutes
      },
      {
          label: 'Reports',
          icon: 'i-heroicons-chart-bar',
          children: reportsChildrenRoutes
      },
      {
          label: 'Settings',
          icon: 'i-heroicons-cog-8-tooth',
          children: settingsChildrenRoutes
      },
  ]


export const subNavHrConfig = ref([
    //hr config sub menus
    {
      id: 1,
      name: "Hiring Timeline",
      url: "/hr-config#hiring-timeline",
      icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "hiring timeline",
      section: "hiring-timeline",
    },
    {
      id: 2,
      name: " Interview Schedule",
      url: "/hr-config#interview-schedule",
      icon: {
        type: "mdi:invoice-schedule-outline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "interview schedule",
      section: "interview-schedule",
    },
    {
      id: 3,
      name: "Interview Q&A ",
      url: "/hr-config#interview-qa",
      icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "interview Q&A",
      section: "interview-qa",
    },
  ]);
  
// export const navData = ref([
//     {
//       id: 0,
//       name: "Dashboard",
//       url: "/dashboard",
//       icon: {
//         type: "ph:house-line",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Home",
//     },
//     {
//       id: 1,
//       name: "All Applicants",
//       url: "/applicants",
//       icon: {
//         type: "material-symbols:supervisor-account-outline",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "All Applicants",
//     },
//     {
//       id: 2,
//       name: "Job Postings",
//       url: "/job-postings",
//       icon: {
//         type: "uil:bag",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Job Posting",
//     },
//     {
//       id: 3,
//       name: "Career Page",
//       url: "/career-page",
//       icon: {
//         type: "clarity:building-line",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Career Page",
//     },
//     {
//       id: 4,
//       name: "Talent Network",
//       url: "/talent-network",
//       icon: {
//         type: "ic:round-star-outline",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Talent Network",
//     },
//     //IN DEVELOPMENT
//     // {
//     //   id: 5,
//     //   name: "KaziQuest Talent",
//     //   url: "/talent",
//     //   icon: {
//     //     type: "mdi:accounts-group-outline",
//     //     color: "#0d6efd",
//     //     width: "20",
//     //     height: "20",
//     //   },
//     //   content: "Kaziquest Talent",
//     // },
//     {
//       id: 6,
//       name: "Reports",
//       url: "/reports",
//       icon: {
//         type: "mdi:report-finance",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Reports",
//     },
//     //IN DEVELOPMENT
//     // {
//     //   id: 7,
//     //   name: "HR Config",
//     //   url: "/hr-config",
//     //   icon: {
//     //     type: "solar:clipboard-list-outline",
//     //     color: "#0d6efd",
//     //     width: "20",
//     //     height: "20",
//     //   },
//     //   content: "HR Config",
//     // },
//     {
//       id: 7,
//       name: "Events and  Schedules",
//       url: "/events-schedules",
//       icon: {
//         type: "uis:schedule",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Events & schedules",
//     },
//     {
//       id: 8,
//       name: "Settings",
//       url: "/settings",
//       icon: {
//         type: "ant-design:setting-twotone",
//         color: "#0d6efd",
//         width: "20",
//         height: "20",
//       },
//       content: "Settings",
//     },
//   ]);
  
export const affData = ref([
    {
      id: 0,
      name: "Home",
      url: "/affiliate",
      icon: {
        type: "la:users",
        color: "#0d6efd",
        width: "24",
        height: "24",
      },
      content: "afiliate",
    },
  ]);


  
export const hrsNav = ref([
    {
      id: 0,
      name: "My Profile",
      url: "/profile",
      icon: {
        type: "material-symbols-light:dashboard-outline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "My-Profile",
    },
    {
      id: 1,
      name: "Attendance",
      url: "/attendance",
      icon: {
        type: "clarity:employee-line",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "attendance",
    },
    {
      id: 2,
      name: "Time Off",
      url: "/time-off",
      icon: {
        type: "mdi:report-finance",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    },
    {
      id: 3,
      name: "Payroll Management",
      url: "/payroll-management",
      icon: {
        type: "uiw:pay",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Payroll",
    },
    {
      id: 4,
      name: "People",
      url: "/people",
      icon: {
        type: "fluent:people-community-32-regular",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "People",
    },
    {
      id: 5,
      name: "Reports",
      url: "/reports",
      icon: {
        type: "mdi:report-finance",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Reports",
    },
    {
      id: 6,
      name: "Settings",
      url: "/settings",
      icon: {
        type: "solar:settings-broken",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Settings",
    },
  ])
  
export const ProfileConfigs = ref([
    //hr config sub menus
    {
      id: 1,
      name: "Personal Information",
      url: "/personal-info",
      icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Personal Information",
      section: "Personal Information",
    },
    {
      id: 2,
      name: "Job",
      url: "/job",
      icon: {
        type: "mdi:invoice-schedule-outline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Job",
      section: "Job",
    },
    {
      id: 3,
      name: "Time Off",
      url: "/time-off",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Time Off",
      section: "Time Off",
    },{
      id: 4,
      name: "My Applications",
      url: "/my-applications",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "My Applications",
      section: "My Applications",
    },{
      id: 5,
      name: "Payslip",
      url: "/payslip",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "payslip",
      section: "Payslip",
    },{
      id: 6,
      name: "Documents",
      url: "/documents",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Documents",
      section: "Documents",
    },{
      id: 7,
      name: "Assets",
      url: "/assets",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Assets",
      section: "Assets",
    },{
      id: 8,
      name: "Next of Kin",
      url: "/next-kin",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Next of Kin",
      section: "Next of Kin",
    },
  
  ])
  
export const AttendanceConfigs = ref([
    {
      id: 1,
      name: "Attendance Log",
      url: "",
      icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Attendance log",
      section: "Attendance log",
    },
    {
      id: 2,
      name: "Absenteeism",
      url: "/absenteesim",
      icon: {
        type: "mdi:invoice-schedule-outline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "Absenteeism",
      section: "Absenteeism",
    },
    {
      id: 3,
      name: "Over Time",
      url: "/over-time",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "overtime",
      section: "overtime",
    },{
      id: 4,
      name: "timesheets",
      url: "/timesheets",
     icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
      content: "timesheets",
      section: "timesheets",
    }
  ])
  
export const TimeOffConfigs = ref([
    {
      "id": 6,
      "name": "Leave Categories",
      "url": "leave-categories",
      "icon": {
        "type": "icon-park-outline:timeline",
        "color": "#0d6efd",
        "width": "20",
        "height": "20"
      },
      "content": "Leave Categories",
      "section": "Attendance log"
    },
    {
      "id": 7,
      "name": "Leave Requests",
      "url": "leave-requests",
      "icon": {
        "type": "icon-park-outline:timeline",
        "color": "#0d6efd",
        "width": "20",
        "height": "20"
      },
      "content": "Leave Requests",
      "section": "Attendance log"
    },
    {
      "id": 8,
      "name": "Leave Log",
      "url": "leave-log",
      "icon": {
        "type": "icon-park-outline:timeline",
        "color": "#0d6efd",
        "width": "20",
        "height": "20"
      },
      "content": "Leave Log",
      "section": "Attendance log"
    },
    {
      "id": 9,
      "name": "Leave Balance",
      "url": "leave-balance",
      "icon": {
        "type": "icon-park-outline:timeline",
        "color": "#0d6efd",
        "width": "20",
        "height": "20"
      },
      "content": "Leave Balance",
      "section": "Attendance log"
    },
    {
      "id": 10,
      "name": "Leave History",
      "url": "leave-history",
      "icon": {
        "type": "icon-park-outline:timeline",
        "color": "#0d6efd",
        "width": "20",
        "height": "20"
      },
      "content": "Leave History",
      "section": "Attendance log"
    }
  
  ])
  
export const PayrollConfigs = ref([
  {
        "id": 13,
        "name": "Process Payroll",
        "url": "process-payroll",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Process Payroll",
        "section": "Payroll"
      },
      {
        "id": 14,
        "name": "Payroll Summary",
        "url": "summary",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Payroll Summary",
        "section": "Payroll"
      },
      {
        "id": 15,
        "name": "View Payslips",
        "url": "payslips",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "View Payslips",
        "section": "Payroll"
      },
      {
        "id": 16,
        "name": "Expense Claims",
        "url": "claims",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Expense Claims",
        "section": "Payroll"
      },
      {
        "id": 17,
        "name": "Losses/Damage",
        "url": "losses-damage",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Losses/Damage",
        "section": "Payroll"
      },
      {
        "id": 18,
        "name": "Deductions",
        "url": "deductions",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Deductions",
        "section": "Payroll"
      },
      {
        "id": 19,
        "name": "Benefits",
        "url": "benefits",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Benefits",
        "section": "Payroll"
      },
      {
        "id": 20,
        "name": "Advance Pay",
        "url": "advance-pay",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Advance Pay",
        "section": "Payroll"
      },
      {
        "id": 21,
        "name": "Email Payslips",
        "url": "email-payslips",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Email Payslips",
        "section": "Payroll"
      },
      {
        "id": 22,
        "name": "Basic Pay",
        "url": "basic-pay",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Basic Pay",
        "section": "Payroll"
      },
      {
        "id": 23,
        "name": "Net Pay",
        "url": "net-pay",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Net Pay",
        "section": "Payroll"
      },
      {
        "id": 24,
        "name": "Gross Pay",
        "url": "gross-pay",
        "icon": {
          "type": "icon-park-outline:timeline",
          "color": "#0d6efd",
          "width": "20",
          "height": "20"
        },
        "content": "Gross Pay",
        "section": "Payroll"
      }
  
  ])
  
export  const PeopleConfigs = ref([
    
    {
        "id": 52,
        "name": "View Employees",
        "url": "/employee",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "View Employees",
        "section": "Compensation Data"
      },
      {
        "id": 53,
        "name": "Add Employees",
        "url": "/add-employee",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "View Employees",
        "section": "Compensation Data"
      },
      {
        "id": 54,
        "name": "Terminate Employee",
        "url": "/terminate-employee",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Terminate Employees",
        "section": "Compensation Data"
      },
      {
        "id": 55,
        "name": "Documents",
        "url": "/documents",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Documents",
        "section": "Compensation Data"
      },
      {
        "id": 56,
        "name": "Announcements",
        "url": "/announcements",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Announcements",
        "section": "Compensation Data"
      }
  
  ])
  
export const ReportConfigs = ref([
  {
    "id": 13,
    "name": "Payroll Reports",
    "url": "/payroll-report",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Payroll Reports",
    "section": "Payroll Reports",
    "subsubmenu": [
      {
        "id": 14,
        "name": "Payroll Summary",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Payroll Summary",
        "section": "Payroll Reports"
      },
      {
        "id": 15,
        "name": "Custom Payroll Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Custom Payroll Reports",
        "section": "Payroll Reports"
      },
      {
        "id": 16,
        "name": "Expense Reinbursement Report",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Expense Reinbursement Report",
        "section": "Payroll Reports"
      },
      {
        "id": 17,
        "name": "Tax Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Tax Reports",
        "section": "Payroll Reports"
      },
      {
        "id": 18,
        "name": "Year-to-Date Payroll Report",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Year-to-Date Payroll Report",
        "section": "Payroll Reports"
      },
      {
        "id": 19,
        "name": "Payroll Analysis Report",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Payroll Analysis Report",
        "section": "Payroll Reports"
      }
    ]
  },
  {
    "id": 20,
    "name": "Payment Report",
    "url": "/payment-report",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Payment Report",
    "section": "Payment Report",
    "subsubmenu": [
      {
        "id": 21,
        "name": "Net Pay Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Net Pay Reports",
        "section": "Payment Report"
      },
      {
        "id": 22,
        "name": "Advance Payments",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Advance Payments",
        "section": "Payment Report"
      },
      {
        "id": 23,
        "name": "Expense Claims Payments",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Expense Claims Payments",
        "section": "Payment Report"
      }
    ]
  },
  {
    "id": 24,
    "name": "Statutory Reports",
    "url": "/statutory-report",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Statutory Reports",
    "section": "Statutory Reports",
    "subsubmenu": [
      {
        "id": 25,
        "name": "KRA Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "KRA Reports",
        "section": "Statutory Reports"
      },
      {
        "id": 26,
        "name": "NHIF Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "NHIF Reports",
        "section": "Statutory Reports"
      },
      {
        "id": 27,
        "name": "NSSF Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "NSSF Reports",
        "section": "Statutory Reports"
      },
      {
        "id": 28,
        "name": "NITA Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "NITA Reports",
        "section": "Statutory Reports"
      },
      {
        "id": 29,
        "name": "Garnish/Court Reports",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Garnish/Court Reports",
        "section": "Statutory Reports"
      }
    ]
  },
  {
    "id": 30,
    "name": "Leave Report",
    "url": "/leave-report",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Leave Report",
    "section": "Leave Report"
  },
  {
    "id": 31,
    "name": "Attendance Report",
    "url": "/attendance-report",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Attendance Report",
    "section": "Attendance Report"
  },
  {
    "id": 32,
    "name": "Activity Log Report",
    "url": "/activity-log",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Activity Log Report",
    "section": "Activity Log Report"
  }
  
  
  
  
  
  
  ])
  
export const SettingsConfig = ref([
  // payroll-settings
  {
    "id": 33,
    "name": "Payroll Settings",
    "url": "/payroll-settings",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Payroll Settings",
    "section": "Payroll Settings",
    "subsubmenu": [
      {
        "id": 34,
        "name": "Import Payroll Data",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Import Payroll Data",
        "section": "Payroll Settings"
      },
      {
        "id": 35,
        "name": "Deductions",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Deductions",
        "section": "Payroll Settings"
      },
      {
        "id": 36,
        "name": "Loans",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Loans",
        "section": "Payroll Settings"
      },
      {
        "id": 37,
        "name": "Benefits",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Benefits",
        "section": "Payroll Settings"
      },
      {
        "id": 38,
        "name": "Approvals",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Approvals",
        "section": "Payroll Settings"
      },
      {
        "id": 39,
        "name": "Earnings",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Earnings",
        "section": "Payroll Settings"
      },
      {
        "id": 40,
        "name": "Overtime",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Overtime",
        "section": "Payroll Settings"
      },
      {
        "id": 41,
        "name": "Integrations",
        "url": "#",
        icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
        "content": "Integrations",
        "section": "Payroll Settings"
      }
    ]
  },
  // people-settings
  {
    "id": 42,
    "name": "People Settings",
    "url": "/people-settings",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "People Settings",
    "section": "People Settings",
    "subsubmenu": [
      {
        "id": 43,
        "name": "Import Employees",
        "url": "#",
        "icon": {
          "type": "",
          "color": "",
          "width": "",
          "height": ""
        },
        "content": "Import Employees",
        "section": "People Settings"
      },
      {
        "id": 44,
        "name": "Departments",
        "url": "#",
        "icon": {
          "type": "",
          "color": "",
          "width": "",
          "height": ""
        },
        "content": "Departments",
        "section": "People Settings"
      },
      {
        "id": 45,
        "name": "Division",
        "url": "#",
        "icon": {
          "type": "",
          "color": "",
          "width": "",
          "height": ""
        },
        "content": "Division",
        "section": "People Settings"
      },
      {
        "id": 46,
        "name": "Location",
        "url": "#",
        "icon": {
          "type": "",
          "color": "",
          "width": "",
          "height": ""
        },
        "content": "location",
        "section": "People Settings"
      },
      {
        "id": 47,
        "name": "Employee Self Service Settings",
        "url": "#",
        "icon": {
          "type": "",
          "color": "",
          "width": "",
          "height": ""
        },
        "content": "Employee Self Service Settings",
        "section": "People Settings"
      }
  ]},
  // company-directory
  {
    "id": 48,
    "name": "Company Directory",
    "url": "/company-directory",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Company Directory",
    "section": "Company Directory"
  },
  // holidays
  {
    "id": 49,
    "name": "Holidays",
    "url": "/holidays",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Holidays",
    "section": "Holidays"
  },
  // logo-colour
  {
    "id": 50,
    "name": "Logo and Colour",
    "url": "/logo-colour",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Logo and Colour",
    "section": "Logo and Colour"
  },
  // employee-satisfaction
  {
    "id": 51,
    "name": "Employee Satisfaction",
    "url": "/employee-satisfaction",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Employee Satisfaction",
    "section": "Employee Satisfaction"
  },
  // users
  {
    "id": 52,
    "name": "Users",
    "url": "/users",
    icon: {
        type: "icon-park-outline:timeline",
        color: "#0d6efd",
        width: "20",
        height: "20",
      },
    "content": "Users",
    "section": "Users"
  }
  
  
  ])
