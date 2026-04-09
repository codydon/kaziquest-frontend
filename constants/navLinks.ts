// export const BOTTOM_LINKS = [
//     {
//         label: 'Affiliate',
//         icon: 'i-heroicons-banknotes',
//         to: '/affiliate-program'
//     }, {
//         label: 'Help',
//         icon: 'i-heroicons-question-mark-circle'
//     },
//     {
//         label: 'Logout',
//         icon: 'i-heroicons-arrow-left-start-on-rectangle',
//     }
// ]


// export const NAV_MENUS = [
//     {
//         label: 'Hiring',
//         icon: 'i-heroicons-home',
//         to: ROUTE_LIST.dashboard
//     },
//     {
//         label: 'All Applicants',
//         icon: 'i-heroicons-user-group',
//         to: '/applicants'
//     },
//     {
//         label: 'Job Postings',
//         icon: 'i-heroicons-briefcase',
//         to: '/job-postings'
//     },
//     {
//         label: 'Career Page',
//         icon: 'i-heroicons-map-pin',
//         to: '/career-page'
//     },
//     {
//         label: 'Talent Network',
//         icon: 'i-heroicons-globe-alt',
//         to: '/talent-network'
//     },
//     {
//         label: 'Reports',
//         icon: 'i-heroicons-chart-bar',
//         to: '/reports'
//     },
//     {
//         label: 'Events',
//         icon: 'i-heroicons-calendar-days',
//         to: '/events-schedules'
//     },
//     {
//         label: 'Settings',
//         icon: 'i-heroicons-cog-8-tooth',
//         to: '/settings'
//     },
// ]


// export const TIMEOFF_ATTENDANCE_LINKS = [
//     {
//         label: 'Attendance Log',
//         icon: 'i-heroicons-bookmark-square',
//         to: '/attendance',
//     },
//     {
//         label: 'Absenteeism',
//         icon: 'i-heroicons-bookmark-slash',
//         to: '/attendance/absenteesim',
//     },
//     {
//         label: 'Over Time',
//         icon: 'i-heroicons-clock',
//         to: '/attendance/over-time',
//     },
//     {
//         label: 'Timesheets',
//         icon: 'i-heroicons-table-cells',
//         to: '/attendance/timesheets',
//     },
// ]


// export const TIMEOFF_LEAVE_LINKS = [
//     {
//         label: 'Leave Categories',
//         icon: 'i-heroicons-arrow-left-start-on-rectangle',
//         to: '/timeoff/leave-categories',
//     },
//     {
//         label: 'Applications',
//         icon: 'i-heroicons-user-group',
//         to: '/timeoff/view-applications',
//     },
//     {
//         label: 'Leave Log',
//         icon: 'i-heroicons-table-cells',
//         to: '/timeoff/leave-log',
//     },
//     {
//         label: 'Leave Balance',
//         icon: 'i-heroicons-scale',
//         to: '/timeoff/leave-balance',
//     },
//     {
//         label: 'Leave History',
//         icon: 'i-heroicons-presentation-chart-line',
//         to: '/timeoff/leave-history',
//     }
// ]

// export const PAYROLL_LINKS = [
//     {
//         label: 'Payroll',
//         icon: 'i-heroicons-banknotes',
//         to: '/payroll',
//     },
//     {
//         label: 'Process Payroll',
//         icon: 'i-heroicons-banknotes',
//         to: '/payroll/process-payroll',
//     },
//     {
//         label: 'Payroll Summary',
//         icon: 'i-heroicons-credit-card',
//         to: '/payroll/summary',
//     },
//     {
//         label: 'View Payslips',
//         icon: 'i-heroicons-currency-dollar',
//         to: '/payroll/payslips',
//     }
// ]

// // let peopleChildrenRoutes = [
// export const PEOPLE_CHILD_LINKS = [
//   {
//     label: 'View Employees',
//     icon: 'i-heroicons-user-group',
//     to: ROUTE_LIST.employees.index,
//   },
//   {
//       label: 'Add Employees',
//       icon: 'i-heroicons-user-plus',
//       to: '/employees/add-employee',
//   },
// //   {
// //       label: 'Announcements',
// //       icon: 'i-heroicons-speaker-wave',
// //       to: '/employee/announcements',
// //   }

// ]

// // let reportsChildrenRoutes = [
// export const REPORTS_CHILD_LINKS = [
//     {
//         label: 'Payroll',
//         icon: 'i-heroicons-presentation-chart-bar',
//         to: '/hr-reports/payroll-report',
//     },
//     {
//         label: 'Payment',
//         icon: 'i-heroicons-chart-bar',
//         to: '/hr-reports/payment-report',
//     },
//     {
//         label: 'Statutory',
//         icon: 'i-heroicons-home',
//         to: '/hr-reports/statutory-report',
//     },
//     {
//         label: 'Leave',
//         icon: 'i-heroicons-chart-bar-square',
//         to: '/hr-reports/leave-report',
//     },
//     {
//         label: 'Attendance',
//         icon: 'i-heroicons-chart-pie',
//         to: '/hr-reports/attendance-report',
//     },
//     {
//         label: 'Activity Log ',
//         icon: 'i-heroicons-document-chart-bar',
//         to: '/hr-reports/activity-log',
//     }
// ]

// // let settingsChildrenRoutes = [
// //     {
// //         label: 'Company',
// //         icon: 'i-heroicons-cog-6-tooth',
// //         to: '/company-settings',
// //     },
// //     {
// //         label: 'ATS Settings',
// //         icon: 'i-heroicons-chart-bar-square',
// //         to: '/hr-settings/time-off-settings',
// //     },
// // ]

// // let hrsLinks = [
// export const HIRING_LINKS =[
//     {
//         label: 'People',
//         icon: 'i-heroicons-user-group',
//         children: peopleChildrenRoutes
//     },
//     {
//         label: 'Attendance',
//         icon: 'i-heroicons-clipboard-document-check',
//         children: attendanceChildrenRoutes
//     },
//     {
//         label: 'Time Offs',
//         icon: 'i-heroicons-clock',
//         children: timeoffChildrenRoutes
//     },
//     {
//         label: 'Hiring',
//         icon: 'i-heroicons-clock',
//         children: links
//     },
//     {
//         label: 'Payroll',
//         icon: 'i-heroicons-credit-card',
//         children: payrollChildrenRoutes
//     },
//     {
//         label: 'Reports',
//         icon: 'i-heroicons-chart-bar',
//         children: reportsChildrenRoutes
//     },
//     {
//         label: 'Settings',
//         icon: 'i-heroicons-cog-8-tooth',
//         children: settingsChildrenRoutes
//     },
// ]