// DATA HERE IS ONLY FOR TESTING PURPOSES

export const employeesData = [
    {
      id: 1,
      name: "John Doe",
      position: "Software Engineer",
      department: "IT",
      status: "Active",
      email: "john@gmail.com",
      phone: "09123456789",
      address: "Manila, Philippines",
      office: "Manila",
      age: 25,
      salary: 25000,
      startDate: "2021-01-01",
      employementType: "Full Time",
    },
    {
      id: 2,
      name: "Jane Doe",
      position: "Software Engineer",
      department: "IT",
      status: "Active",
      email: "jane@gmail.com",
      phone: "09123456789",
      address: "Manila, Philippines",
      office: "Manila",
      age: 25,
      salary: 25000,
      startDate: "2021-01-01",
      employementType: "Full Time",
    },
    {
      id: 3,
      name: "Juan Dela Cruz",
      position: "Software Engineer",
      department: "IT",
      status: "Active",
      email: "juan@gmail.com",
      phone: "09123456789",
      address: "Manila, Philippines",
      office: "Manila",
      age: 25,
      salary: 25000,
      startDate: "2021-01-01",
      employementType: "Full Time",
    },
    {
      id: 4,
      name: "Juan Dela Cruz",
      position: "Software Engineer",
      department: "IT",
      status: "Active",
      email: "juan@gmail.com",
      phone: "09123456789",
      address: "Machakos, kenya",
      office: "Manila",
      age: 25,
      salary: 25000,
      startDate: "2021-01-01",
      employementType: "Full Time",
    },
    {
      id: 5,
      name: "Kelvin Mwenda",
      position: "Software Engineer",
      department: "IT",
      status: "Active",
      email: "kelvin@gmail.com",
      phone: "09123456789",
      address: "Machakos, kenya",
      office: "Manila",
      age: 25,
      salary: 25000,
      startDate: "2021-01-01",
      employementType: "Full Time",
    },
  ];
  
  export const LeaveCategoryData = [
    {
      id: 1,
      name: "Vacation",
      description: " Annual vacation leave",
      max_days: "20",
    },
    {
      id: 2,
      name: "Sick Leave",
      description: "Leave for illness ",
      max_days: "15",
    },
    {
      id: 3,
      name: "Martenity Leave",
      description: "martenity leave ",
      max_days: "90",
    },
    {
      id: 4,
      name: "Pertanity Leave",
      description: "pertanity leave ",
      max_days: "15",
    },
    {
      id: 5,
      name: "Study Leave",
      description: " leave for educational purposes",
      max_days: "1",
    },
    {
      id: 6,
      name: "Unpaid Leave",
      description: "unpaid leave",
      max_days: "1",
    },
    {
      id: 7,
      name: " Bereavement Leave",
      description: "leave for family bereavement ",
      max_days: "5",
    },
  ];
  
  export const LeaveBalanceData = [
    {
      id: 1,
      employee_name: "Edwin Simiyu",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      total_entitled: "25 ",
      used: "10",
      remaining: "15",
      date: "2024-3-1",
      activity: "Vacation Leave Approved",
    },
    {
      id: 2,
      employee_name: "Samuel Chukweze",
      job_title: "HR Manager",
      department: "HR",
      leave_type: "Sick Leave",
      total_entitled: "25 ",
      used: "10",
      remaining: "15",
      date: "2023-8-12",
      activity: "Unpaid Leave Approved",
    },
    {
      id: 3,
      employee_name: "Emmanuel Wangila",
      job_title: "Marketalist",
      department: "IT",
      leave_type: "Maternity",
      total_entitled: "25 ",
      used: "10",
      remaining: "15",
      date: "2023-9-11",
      activity: "Study leave requested",
    },
  ];
  
  export const LeaveRequestData = [
    {
      id: 1,
      employee_name: "Edwin Simiyu",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      request_start: "2023-4-12 ",
      request_end: "2023-4-12 ",
      status: "Pending",
      time_off: "5 ",
    },
    {
      id: 2,
      employee_name: "Otiende Amollo",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      request_start: "2023-4-12 ",
      request_end: "2023-4-12 ",
      status: "Approved",
      time_off: "5 ",
    },
    {
      id: 3,
      employee_name: "Jemimah Muthau",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      request_start: "2023-4-12 ",
      request_end: "2023-4-12 ",
      status: "Taken",
      time_off: "5 ",
    },
  ];
  
  export const LeaveHistoryData = [
    {
      id: 1,
      employee_name: "Edwin Simiyu",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      start_date: "2023-4-4 ",
      end_date: "2023-4-4 ",
      status: "Taken",
      timeoff: "5 days",
    },
    {
      id: 1,
      employee_name: "Sam Simiyu",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      start_date: "2023-4-4 ",
      end_date: "2023-4-4 ",
      status: "Pending",
      timeoff: "5 days",
    },
    {
      id: 1,
      employee_name: "Sam Simiyu",
      job_title: "Software Developer",
      department: "Marketing",
      leave_type: "Vacation",
      start_date: "2023-4-4 ",
      end_date: "2023-4-4 ",
      status: "Pending",
      timeoff: "5 days",
    },
  ];
  
  export const year_starts = {
    StartofContarct: "Start of Contract",
    CalendarYear: "Calendar Year",
  };
  
  export const registered = {
    EndofMonth: "End of Month",
    EndofYear: "End of Year",
  };
  
  export const day_accrued = {
    MOnthly: "Monthly",
    Quarterly: "Quarterly",
    Annually: "Annually",
    None: "None",
  };
  
  export const days_accrued = {
    Monthly: "Monthly",
    Annually: "Annually",
  };
  
  export const employment_types = {
    FullTime: "Full Time",
    PartTime: " Part Time",
    Contact: "Contract",
  };
  
  export const LeaveLogData = [
    {
      id: 1,
      employee_name: "Kijana Wamalwa",
      date: "2023-10-4",
      activity: "Unpaid Leave Started",
    },
    {
      id: 2,
      employee_name: "Samson Situma",
      date: "2023-10-4",
      activity: "Unpaid Leave Started",
    },
    {
      id: 3,
      employee_name: "Dennis Onyango",
      date: "2023-10-4",
      activity: "Unpaid Leave Started",
    },
  ];
  
  export const LeaveEntitlementData = [
    {
      id: 1,
      employee_name: "Kijana Wamalwa",
      leave_type: "Vacation",
      year: "2023",
      entitled_days: "20",
    },
    {
      id: 2,
      employee_name: "Simon Kenay",
      leave_type: "Sick Leave",
      year: "2023",
      entitled_days: "20",
    },
    {
      id: 3,
      employee_name: "Liz Tanya",
      leave_type: "Mertanity Leave",
      year: "2023",
      entitled_days: "90",
    },
  ];