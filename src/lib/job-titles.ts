// Flat list used for the datalist search in the settings form.
// Grouped by sector in source for maintainability.

export const JOB_TITLES: string[] = [
  // Healthcare
  "Doctor", "General Practitioner", "Surgeon", "Specialist Doctor",
  "Nurse", "Registered Nurse", "Midwife",
  "Dentist", "Orthodontist", "Dental Hygienist",
  "Pharmacist", "Pharmacy Technician",
  "Physiotherapist", "Occupational Therapist", "Speech Therapist",
  "Psychologist", "Psychiatrist", "Therapist", "Counsellor",
  "Paramedic", "Emergency Medical Technician",
  "Radiologist", "Laboratory Technician", "Medical Assistant",
  "Veterinarian", "Vet Technician",
  "Optometrist", "Nutritionist", "Dietitian",

  // Education
  "Primary School Teacher", "Secondary School Teacher", "High School Teacher",
  "University Professor", "Lecturer", "Teaching Assistant",
  "School Principal", "Headteacher",
  "Special Needs Teacher", "Language Teacher",
  "Kindergarten Teacher", "Nursery Teacher",
  "Tutor", "Instructor", "Trainer", "Coach",
  "School Counsellor", "Educational Psychologist",

  // Technology & IT
  "Software Developer", "Software Engineer", "Frontend Developer",
  "Backend Developer", "Full-Stack Developer", "Mobile Developer",
  "Web Developer", "Web Designer",
  "Data Scientist", "Data Analyst", "Data Engineer",
  "Machine Learning Engineer", "AI Engineer",
  "DevOps Engineer", "Site Reliability Engineer",
  "Cloud Architect", "Solutions Architect",
  "IT Manager", "IT Support Specialist", "Systems Administrator",
  "Network Engineer", "Cybersecurity Analyst", "Information Security Officer",
  "QA Engineer", "Test Engineer", "Product Manager",
  "UX Designer", "UI Designer", "UX Researcher",
  "Database Administrator", "Business Intelligence Analyst",

  // Business, Finance & HR
  "Accountant", "Senior Accountant", "Financial Analyst",
  "Controller", "CFO", "Finance Manager",
  "Auditor", "Tax Advisor", "Bookkeeper",
  "Investment Banker", "Financial Advisor", "Portfolio Manager",
  "Business Analyst", "Management Consultant", "Strategy Consultant",
  "Project Manager", "Program Manager", "Scrum Master",
  "Operations Manager", "Supply Chain Manager", "Logistics Manager",
  "HR Manager", "HR Specialist", "Recruiter", "Talent Acquisition Manager",
  "Marketing Manager", "Marketing Specialist", "Digital Marketing Manager",
  "SEO Specialist", "Social Media Manager", "Content Manager",
  "Brand Manager", "Market Research Analyst",
  "Sales Manager", "Sales Representative", "Account Manager", "Account Executive",
  "Business Development Manager",
  "Customer Success Manager", "Customer Service Manager",

  // Legal & Government
  "Lawyer", "Solicitor", "Attorney", "Barrister",
  "Judge", "Magistrate", "Notary",
  "Legal Advisor", "Paralegal",
  "Police Officer", "Detective", "Customs Officer",
  "Civil Servant", "Government Official", "Diplomat",
  "Military Officer", "Soldier",
  "Politician", "Mayor", "Member of Parliament",
  "Firefighter", "Border Guard",

  // Engineering
  "Civil Engineer", "Structural Engineer", "Geotechnical Engineer",
  "Mechanical Engineer", "Electrical Engineer", "Electronics Engineer",
  "Chemical Engineer", "Process Engineer",
  "Aerospace Engineer", "Automotive Engineer",
  "Environmental Engineer", "Energy Engineer",
  "Architect", "Urban Planner", "Interior Designer",
  "Industrial Engineer", "Production Engineer",
  "Quality Engineer", "Safety Engineer",

  // Science & Research
  "Biologist", "Biochemist", "Microbiologist",
  "Chemist", "Physicist", "Mathematician",
  "Geologist", "Environmental Scientist",
  "Researcher", "Research Scientist", "Lab Researcher",
  "Economist", "Statistician", "Actuary",
  "Sociologist", "Anthropologist", "Historian",

  // Creative & Media
  "Graphic Designer", "Illustrator", "Animator",
  "Photographer", "Videographer", "Film Director",
  "Video Editor", "Motion Graphics Designer",
  "Journalist", "Reporter", "Editor", "Writer", "Author",
  "Content Creator", "Blogger", "Copywriter",
  "Translator", "Interpreter",
  "Musician", "Singer", "Composer",
  "Actor", "Director", "Producer",
  "Architect of Visual Arts", "Painter", "Sculptor",
  "Fashion Designer", "Stylist",
  "Game Designer", "Game Developer",

  // Construction & Trades
  "Plumber", "Electrician", "Carpenter",
  "Bricklayer", "Mason", "Roofer",
  "Painter and Decorator", "Tiler",
  "HVAC Technician", "Welder", "Machinist",
  "Auto Mechanic", "Vehicle Technician",
  "Construction Manager", "Site Manager", "Foreman",

  // Hospitality & Food
  "Chef", "Head Chef", "Sous Chef", "Pastry Chef",
  "Cook", "Baker",
  "Waiter", "Waitress", "Restaurant Manager",
  "Barista", "Bartender",
  "Hotel Manager", "Receptionist", "Concierge",
  "Event Planner", "Catering Manager",

  // Retail & Service
  "Shop Assistant", "Retail Manager", "Store Manager",
  "Cashier", "Visual Merchandiser",
  "Hairdresser", "Barber", "Beauty Therapist",
  "Nail Technician", "Massage Therapist",
  "Cleaner", "Housekeeper", "Janitor",
  "Security Guard", "Bouncer",
  "Personal Trainer", "Fitness Instructor",

  // Transport & Logistics
  "Truck Driver", "Bus Driver", "Taxi Driver",
  "Delivery Driver", "Courier",
  "Pilot", "Co-pilot", "Flight Attendant",
  "Ship Captain", "Sailor",
  "Train Driver", "Tram Driver",
  "Warehouse Worker", "Forklift Operator",

  // Agriculture & Environment
  "Farmer", "Agricultural Worker",
  "Gardener", "Landscape Architect",
  "Forester", "Environmental Officer",
  "Fisherman",

  // Social & Charity
  "Social Worker", "Child Protection Officer",
  "NGO Worker", "Charity Worker",
  "Community Manager", "Youth Worker",

  // Executive & General
  "CEO", "COO", "CTO", "Managing Director",
  "Director", "Head of Department", "Team Lead",
  "Manager", "Supervisor",
  "Entrepreneur", "Business Owner",
  "Freelancer", "Consultant", "Self-Employed",
]

export const STUDY_LEVELS: { value: string; label: string; sr: string; hr: string }[] = [
  { value: "primary",        label: "Primary school",          sr: "osnovna škola",     hr: "osnovna škola" },
  { value: "high_school",    label: "High school",             sr: "srednja škola",     hr: "srednja škola" },
  { value: "vocational",     label: "Vocational school",       sr: "stručna škola",     hr: "strukovna škola" },
  { value: "higher_ed",      label: "College",                 sr: "viša škola",        hr: "viša škola" },
  { value: "bachelor",       label: "Bachelor's degree",       sr: "fakultet",          hr: "fakultet" },
  { value: "master",         label: "Master's degree",         sr: "master studije",    hr: "diplomski studij" },
  { value: "phd",            label: "PhD / Doctorate",         sr: "doktorat",          hr: "doktorat" },
  { value: "language_course",label: "Language course",         sr: "jezički kurs",      hr: "tečaj jezika" },
]
