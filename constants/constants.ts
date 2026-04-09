// NOTE! :: constants here are not for testing purposes

export const salutations = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Miss",
  "Dr.",
  "Prof.",
  "Sir",
  "Madam",
];

export const industries = [
  { name: "Accounting" },
  { name: "Airlines/Aviation" },
  { name: "Alternative Dispute Resolution" },
  { name: "Alternative Medicine" },
  { name: "Animation" },
  { name: "Apparel & Fashion" },
  { name: "Architecture & Planning" },
  { name: "Arts & Crafts" },
  { name: "Automotive" },
  { name: "Aviation & Aerospace" },
  { name: "Banking" },
  { name: "Biotechnology" },
  { name: "Broadcast Media" },
  { name: "Building Materials" },
  { name: "Business Supplies & Equipment" },
  { name: "Capital Markets" },
  { name: "Chemicals" },
  { name: "Civic & Social Organization" },
  { name: "Civil Engineering" },
  { name: "Commercial Real Estate" },
  { name: "Computer & Network Security" },
  { name: "Computer Games" },
  { name: "Computer Hardware" },
  { name: "Computer Networking" },
  { name: "Computer Software" },
  { name: "Construction" },
  { name: "Consumer Electronics" },
  { name: "Consumer Goods" },
  { name: "Consumer Services" },
  { name: "Cosmetics" },
  { name: "Dairy" },
  { name: "Defense & Space" },
  { name: "Design" },
  { name: "Education Management" },
  { name: "E-learning" },
  { name: "Electrical & Electronic Manufacturing" },
  { name: "Entertainment" },
  { name: "Environmental Services" },
  { name: "Events Services" },
  { name: "Executive Office" },
  { name: "Facilities Services" },
  { name: "Farming" },
  { name: "Financial Services" },
  { name: "Fine Art" },
  { name: "Fishery" },
  { name: "Food & Beverages" },
  { name: "Food Production" },
  { name: "Fundraising" },
  { name: "Furniture" },
  { name: "Gambling & Casinos" },
  { name: "Glass, Ceramics & Concrete" },
  { name: "Government Administration" },
];

export const APPLICANT_STATUSES = [
  "new_application",
  "under_review",
  "assessment_testing",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "offer_extended",
  "offer_accepted",
  "background_check",
  "onboarding",
  "offer_declined",
  "rejected",
];

export const status = [
  "taken",
  "pending",
  "approved",
  "rejected",
  "on_leave",
  "cancelled",
];

export const sources = [
  { key: "social_media", value: "Social media" },
  { key: "website", value: "Website" },
];

export const JOB_STATUSES = [
  { 'label': "Open", 'value': "OPEN" },
  { 'label': "Closed", 'value': "CLOSED" },
  { 'label': "Draft", 'value': "DRAFT" },
  { 'label': "Future Opportunity", 'value':"FUTURE OPPORTUNITY" },
];

export const JOB_LEVELS = [
  { 'value': 'ENTRY_LEVEL', 'label': 'Entry Level' },
  { 'value': 'EXPERIENCED', 'label': 'Experienced' },
  { 'value': 'MANAGER', 'label': 'Manager' },
  { 'value': 'DIRECTOR', 'label': 'Director' },
  { 'value': 'EXECUTIVE', 'label': 'Executive' },
  { 'value': 'JOB_LEVEL_UNSPECIFIED', 'label': 'Unspecified' },
]

export const INDUSTRY_CATEGORIES = [
  { 'value': 'JOB_CATEGORY_UNSPECIFIED', 'label': 'Select Industry Category' },
  { 'value': 'ACCOUNTING_AND_FINANCE', 'label': 'Accounting and Finance' },
  { 'value': 'ADMINISTRATIVE_AND_OFFICE', 'label': 'Administrative and Office' },
  { 'value': 'ADVERTISING_AND_MARKETING', 'label': 'Advertising and Marketing' },
  { 'value': 'ANIMAL_CARE', 'label': 'Animal Care' },
  { 'value': 'ART_FASHION_AND_DESIGN', 'label': 'Art Fashion and Design' },
  { 'value': 'BUSINESS_OPERATIONS', 'label': 'Business Operations' },
  { 'value': 'CLEANING_AND_FACILITIES', 'label': 'Cleaning and Facilities' },
  { 'value': 'COMPUTER_AND_IT', 'label': 'Computer and IT' },
  { 'value': 'CONSTRUCTION', 'label': 'Construction' },
  { 'value': 'CUSTOMER_SERVICE', 'label': 'Customer Service' },
  { 'value': 'EDUCATION', 'label': 'Education' },
  { 'value': 'ENTERTAINMENT_AND_TRAVEL', 'label': 'Entertainment and Travel' },
  { 'value': 'FARMING_AND_OUTDOORS', 'label': 'Farming and Outdoors' },
  { 'value': 'HEALTHCARE', 'label': 'Healthcare' },
  { 'value': 'HUMAN_RESOURCES', 'label': 'Human Resources' },
  { 'value': 'INSTALLATION_MAINTENANCE_AND_REPAIR', 'label': 'Installation Maintenance and Repair' },
  { 'value': 'LEGAL', 'label': 'Legal' },
  { 'value': 'MANAGEMENT', 'label': 'Management' },
  { 'value': 'MANUFACTURING_AND_WAREHOUSE', 'label': 'Manufacturing and Warehouse' },
  { 'value': 'MEDIA_COMMUNICATIONS_AND_WRITING', 'label': 'Media Communications and Writing' },
  { 'value': 'OIL_GAS_AND_MINING', 'label': 'Oil Gas and Mining' },
  { 'value': 'PERSONAL_CARE_AND_SERVICES', 'label': 'Personal Care and Services' },
  { 'value': 'PROTECTIVE_SERVICES', 'label': 'Protective Services' },
  { 'value': 'REAL_ESTATE', 'label': 'Real Estate' },
  { 'value': 'RESTAURANT_AND_HOSPITALITY', 'label': 'Restaurant and Hospitality' },
  { 'value': 'SALES_AND_RETAIL', 'label': 'Sales and Retail' },
  { 'value': 'SCIENCE_AND_ENGINEERING', 'label': 'Science and Engineering' },
  { 'value': 'SOCIAL_SERVICES_AND_NON_PROFIT', 'label': 'Social Services and Non Profit' },
  { 'value': 'SPORTS_FITNESS_AND_RECREATION', 'label': 'Sports Fitness and Recreation' },
  { 'value': 'TRANSPORTATION_AND_LOGISTICS', 'label': 'Transportation and Logistics' },
  { 'value': 'OTHER', 'label': 'Other' }
]

export const EDUCATION_LEVELS = [
  { 'value': 'PRIMARY_EDUCATION', 'label': 'Primary Education' },
  { 'value': 'LOWER_SECONDARY_EDUCATION', 'label': 'Lower Secondary Education' },
  { 'value': 'UPPER_SECONDARY_EDUCATION', 'label': 'Upper Secondary Education' },
  { 'value': 'ADULT_REMEDIAL_EDUCATION', 'label': 'Adult Remedial Education' },
  { 'value': 'ASSOCIATES_OR_EQUIVALENT', 'label': 'Associates or Equivalent' },
  { 'value': 'BACHELORS_OR_EQUIVALENT', 'label': 'Bachelors or Equivalent' },
  { 'value': 'MASTERS_OR_EQUIVALENT', 'label': 'Masters or Equivalent' },
  { 'value': 'DOCTORAL_OR_EQUIVALENT', 'label': 'Doctoral or Equivalent' },
  { 'value': 'DEGREE_TYPE_UNSPECIFIED', 'label': 'Unspecified' }
]

export const EMPLOYMENT_TYPES = [
  { 'value': "FULL_TIME", 'label': "Full Time" },
  { 'value': "PART_TIME", 'label': "Part Time" },
  { 'value': "CONTRACTOR", 'label': "Contractor" },
  { 'value': "TEMPORARY", 'label': "Temporary" },
  { 'value': "INTERN", 'label': "Intern" },
  { 'value': "VOLUNTEER", 'label': "Volunteer" },
  { 'value': "PER_DIEM", 'label': "Per Diem" },
]
