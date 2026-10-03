import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// 1. USERS & SESSIONS
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    username: text("username"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("Staff"), // Owner, Admin, Manager, HR, Accounts, Sales, Project Manager, Engineer, Staff, Site Staff
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("Active"), // Active, Inactive
    resetToken: text("reset_token"),
    resetTokenExpiry: timestamp("reset_token_expiry"),
    lastLoginAt: timestamp("last_login_at"),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_username_idx").on(table.username),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("sessions_token_idx").on(table.token)]
);

// 2. EMPLOYEES / HR
export const employees = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    empCode: text("emp_code").notNull(), // EMP-0001
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    department: text("department").notNull(), // Engineering, Construction, CRM & Sales, HR & Admin, Accounts & Finance, Procurement
    designation: text("designation").notNull(),
    joiningDate: text("joining_date").notNull(),
    basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull().default("0"),
    allowance: numeric("allowance", { precision: 14, scale: 2 }).notNull().default("0"),
    advanceBalance: numeric("advance_balance", { precision: 14, scale: 2 }).notNull().default("0"),
    deductionDefault: numeric("deduction_default", { precision: 14, scale: 2 }).notNull().default("0"),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    address: text("address").notNull().default(""),
    emergencyContact: text("emergency_contact").notNull().default(""),
    employmentStatus: text("employment_status").notNull().default("Active"), // Active, Probation, On Leave, Inactive, Resigned
    bankName: text("bank_name").notNull().default(""),
    bankAccountNo: text("bank_account_no").notNull().default(""),
    paymentMethod: text("payment_method").notNull().default("Bank"), // Bank, Cash, MFS
    profilePhoto: text("profile_photo"),
    managerId: integer("manager_id"),
    annualLeaveQuota: integer("annual_leave_quota").notNull().default(20),
    casualLeaveQuota: integer("casual_leave_quota").notNull().default(10),
    sickLeaveQuota: integer("sick_leave_quota").notNull().default(14),
    companyId: text("company").notNull().default("INSAF"), // INSAF | IBDC | IREL
    marketingCompany: text("marketing_company"), // IBDC | IREL | BOTH | null
    assignedSite: text("assigned_site").notNull().default(""),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("employees_code_idx").on(table.empCode),
    index("employees_user_idx").on(table.userId),
  ]
);

export interface AttachmentMeta {
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface WorkPlanItem {
  id: string;
  title: string;
  status: "Completed" | "In Progress" | "Pending" | "Blocked";
  completionPercent: number;
  notes?: string;
}

// ============================================================================
// 3. ATTENDANCE & CORRECTIONS
// ⭐ DUAL-SHIFT SYSTEM:
//   Shift-1 (সকাল): checkIn 09:30 → checkOut 13:15
//   Break: 13:15 → 14:30
//   Shift-2 (বিকাল): checkIn2 14:30 → checkOut2 19:30
//   দুই শিফট মিলে = এক দিনের হাজিরা (workingHours = দুই শিফটের যোগফল)
//   🕌 শুক্রবার = সাপ্তাহিক ছুটি
// ============================================================================
export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    // ⭐ Shift-1 (সকাল): 09:30 – 13:15
    checkIn: text("check_in"), // HH:mm — সকাল শিফট IN
    checkOut: text("check_out"), // HH:mm — সকাল শিফট OUT
    // ⭐ NEW Shift-2 (বিকাল): 14:30 – 19:30
    checkIn2: text("check_in2"), // HH:mm — বিকাল শিফট IN
    checkOut2: text("check_out2"), // HH:mm — বিকাল শিফট OUT
    status: text("status").notNull().default("Present"), // Present, Late, Early Leave, Missing Checkout, Absent, Leave, Holiday
    lateMinutes: integer("late_minutes").notNull().default(0),
    earlyLeaveMinutes: integer("early_leave_minutes").notNull().default(0),
    morningHours: numeric("morning_hours", { precision: 6, scale: 2 }).notNull().default("0"), // Shift-1 ঘণ্টা
    afternoonHours: numeric("afternoon_hours", { precision: 6, scale: 2 }).notNull().default("0"), // Shift-2 ঘণ্টা
    workingHours: numeric("working_hours", { precision: 6, scale: 2 }).notNull().default("0"), // দুই শিফটের মোট
    overtimeHours: numeric("overtime_hours", { precision: 6, scale: 2 }).notNull().default("0"),
    isApproved: boolean("is_approved").notNull().default(true),
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attendances_emp_date_idx").on(table.employeeId, table.date),
    index("attendances_date_idx").on(table.date),
  ]
);

export const attendanceCorrections = pgTable("attendance_corrections", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id").references(() => attendances.id, { onDelete: "set null" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // Shift-1 correction
  requestedCheckIn: text("requested_check_in").notNull(),
  requestedCheckOut: text("requested_check_out").notNull(),
  // ⭐ NEW Shift-2 correction (optional)
  requestedCheckIn2: text("requested_check_in2"),
  requestedCheckOut2: text("requested_check_out2"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. LEADS & CLIENTS (CRM)
// COMPANY / BUSINESS-UNIT SEPARATION:
//   IBDC = INSAF BUILDING DESIGN & CONSULTANT LTD.  (building design, approval, engineering & construction services)
//   IREL = INSAF REAL ESTATE LTD.                   (real-estate / property enquiries)
export const COMPANY_OPTIONS = [
  {
    id: "IBDC",
    label: "INSAF BUILDING DESIGN & CONSULTANT LTD.",
    shortLabel: "Insaf Building Design",
    categoryLabel: "Service Type",
    categoryField: "service",
    categories: [
      "Architectural Design",
      "Structural Design",
      "Electrical Design",
      "Plumbing Design",
      "Costing & Estimating",
      "RAJUK Plan Approval",
      "Plan Design + RAJUK Approval",
      "Interior Design",
      "3D Visualization & VR",
      "3D View",
      "Construction Management",
      "Package Building Work",
      "Documents",
      "Other",
    ],
  },
  {
    id: "IREL",
    label: "INSAF REAL ESTATE LTD.",
    shortLabel: "Insaf Real Estate",
    categoryLabel: "Property Interest / Property Type",
    categoryField: "propertyType",
    categories: [
      "Flat",
      "Shop",
      "Office Space",
      "Commercial Space",
      "Apartment",
      "Land/Plot",
      "Investment",
      "Project",
      "Other",
    ],
  },
] as const;

export const PROPERTY_TYPES = [
  "Flat",
  "Shop",
  "Office Space",
  "Commercial Space",
  "Apartment",
  "Land/Plot",
  "Investment",
  "Project",
  "Other",
] as const;

export const DESIGN_SERVICES = [
  "Architectural Design",
  "Structural Design",
  "Electrical Design",
  "Plumbing Design",
  "Costing & Estimating",
  "RAJUK Plan Approval",
  "Plan Design + RAJUK Approval",
  "Interior Design",
  "3D Visualization & VR",
  "3D View",
  "Construction Management",
  "Package Building Work",
  "Documents",
  "Other",
] as const;

export const LEAD_PRIORITIES = ["Hot", "Warm", "Cold"] as const;

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    leadCode: text("lead_code").notNull(), // LEAD-0001
    companyId: integer("company_id").notNull().default(1), // DB: 1=IBDC, 2=IREL
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp").notNull().default(""),
    location: text("location").notNull().default(""),
    source: text("source").notNull().default("Direct"), // Facebook, Referral, Website, Direct, Walk-in
    // IBDC: Building Design / Engineering Service Type
    service: text("service").notNull().default("Other"),
    // IREL: Real-Estate Property Interest
    propertyType: text("property_type").notNull().default("Other"),
    projectName: text("project_name").notNull().default(""), // e.g. Salsabil, Bhai Bhai Tower
    unitFlatShop: text("unit_flat_shop").notNull().default(""), // e.g. B-4, Shop 12
    preferredLocation: text("preferred_location").notNull().default(""),
    size: text("size").notNull().default(""), // e.g. 1450 sft
    floor: text("floor").notNull().default(""), // e.g. 5th Floor
    bedrooms: text("bedrooms").notNull().default(""), // e.g. 3
    purpose: text("purpose").notNull().default(""), // Own Use | Investment
    expectedPurchaseDate: text("expected_purchase_date").notNull().default(""),
    clientRequirement: text("client_requirement").notNull().default(""),
    requirement: text("requirement").notNull().default(""),
    landSize: text("land_size").notNull().default(""),
    roadWidth: text("road_width").notNull().default(""),
    budget: numeric("budget", { precision: 14, scale: 2 }).notNull().default("0"),
    priority: text("priority").notNull().default("Warm"), // Hot, Warm, Cold
    status: text("status").notNull().default("New"), // New, Contacted, Follow-up, Qualified, Quotation, Negotiating, Won, Lost, On Hold
    lastContactDate: text("last_contact_date"),
    nextFollowUpTime: text("next_follow_up_time").notNull().default("10:00"),
    assignedStaffId: integer("assigned_staff_id").references(() => employees.id, { onDelete: "set null" }),
    nextFollowUpDate: text("next_follow_up_date"),
    convertedClientId: integer("converted_client_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("leads_code_idx").on(table.leadCode),
    index("leads_company_idx").on(table.companyId),
  ]
);

// ============================================================================
// FOLLOW-UP CONTACT METHODS & OUTCOMES (UNLIMITED FOLLOW-UPS PER LEAD)
// ============================================================================
export const FOLLOW_UP_METHODS = [
  "Phone Call",
  "WhatsApp",
  "Facebook",
  "SMS",
  "Email",
  "Meeting",
  "Office Visit",
  "Site Visit",
  "Other",
] as const;

export const FOLLOW_UP_OUTCOMES = [
  "No Response",
  "Contacted",
  "Interested",
  "Qualified",
  "Need More Information",
  "Quotation Sent",
  "Negotiating",
  "Call Back Later",
  "Not Interested",
  "Won",
  "Lost",
  "Other",
] as const;

// Outcomes that do NOT close a lead — a new follow-up must be scheduled.
export const OPEN_OUTCOMES = [
  "No Response",
  "Contacted",
  "Interested",
  "Qualified",
  "Need More Information",
  "Quotation Sent",
  "Negotiating",
  "Call Back Later",
  "Other",
] as const;

// Outcomes that close/hold a lead (no further follow-up required).
export const CLOSED_OUTCOMES = ["Won", "Lost", "Not Interested"] as const;

export const leadFollowups = pgTable(
  "lead_followups",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    // Follow-up Number (1, 2, 3 ... unlimited) — never reused or overwritten
    followUpNumber: integer("follow_up_number").notNull().default(1),
    staffId: integer("staff_id").references(() => employees.id, { onDelete: "set null" }),
    staffName: text("staff_name").notNull(),
    // Date & Time of the actual follow-up
    date: text("date").notNull(), // YYYY-MM-DD
    time: text("time").notNull().default("10:00"), // HH:mm
    contactMethod: text("contact_method").notNull().default("Phone Call"),
    outcome: text("outcome").notNull().default("Contacted"),
    clientResponse: text("client_response").notNull().default(""),
    // Staff note (kept legacy `discussion` field in sync for backward compatibility)
    discussion: text("discussion").notNull(),
    nextAction: text("next_action").notNull().default(""),
    nextFollowUpDate: text("next_follow_up_date"),
    nextFollowUpTime: text("next_follow_up_time").notNull().default("10:00"),
    attachmentName: text("attachment_name"),
    attachmentType: text("attachment_type"),
    attachmentSize: text("attachment_size"),
    attachmentUrl: text("attachment_url"),
    // Idempotent reminder key so we never spam duplicate notifications
    reminderKey: text("reminder_key"),
    reminderNotified: boolean("reminder_notified").notNull().default(false),
    result: text("result").notNull().default("Contacted"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("lead_followups_lead_idx").on(table.leadId),
    index("lead_followups_next_date_idx").on(table.nextFollowUpDate),
  ]
);

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    clientCode: text("client_code").notNull(), // CLI-0001
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    companyName: text("company_name").default(""),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp").default(""),
    email: text("email").default(""),
    address: text("address").default(""),
    assignedStaffId: integer("assigned_staff_id").references(() => employees.id, { onDelete: "set null" }),
    totalInvoiced: numeric("total_invoiced", { precision: 14, scale: 2 }).notNull().default("0"),
    totalPaid: numeric("total_paid", { precision: 14, scale: 2 }).notNull().default("0"),
    outstandingBalance: numeric("outstanding_balance", { precision: 14, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("clients_code_idx").on(table.clientCode)]
);

// 5. PROJECTS & SITES
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    projectCode: text("project_code").notNull(), // PRJ-0001
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    quotationId: integer("quotation_id"),
    name: text("name").notNull(),
    location: text("location").notNull(),
    landSize: text("land_size").notNull().default(""),
    roadWidth: text("road_width").notNull().default(""),
    projectType: text("project_type").notNull().default("Residential Building"), // Residential, Commercial, Industrial, Interior
    startDate: text("start_date").notNull(),
    expectedCompletion: text("expected_completion").notNull(),
    budget: numeric("budget", { precision: 14, scale: 2 }).notNull().default("0"),
    managerId: integer("manager_id").references(() => employees.id, { onDelete: "set null" }),
    engineerId: integer("engineer_id").references(() => employees.id, { onDelete: "set null" }),
    assignedStaffIds: jsonb("assigned_staff_ids").$type<number[]>().notNull().default([]),
    progressPercent: integer("progress_percent").notNull().default(0),
    status: text("status").notNull().default("Active"), // Planning, Active, On Hold, Completed, Cancelled
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("projects_code_idx").on(table.projectCode)]
);

export const sites = pgTable(
  "sites",
  {
    id: serial("id").primaryKey(),
    siteCode: text("site_code").notNull(), // SITE-0001
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    location: text("location").notNull(),
    siteManagerId: integer("site_manager_id").references(() => employees.id, { onDelete: "set null" }),
    engineerId: integer("engineer_id").references(() => employees.id, { onDelete: "set null" }),
    workersCount: integer("workers_count").notNull().default(0),
    progressPercent: integer("progress_percent").notNull().default(0),
    status: text("status").notNull().default("Active"), // Active, Paused, Completed
    problems: text("problems").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("sites_code_idx").on(table.siteCode)]
);

export const siteReports = pgTable("site_reports", {
  id: serial("id").primaryKey(),
  reportCode: text("report_code").notNull(), // SR-0001
  siteId: integer("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  reportedById: integer("reported_by_id").references(() => employees.id, { onDelete: "set null" }),
  date: text("date").notNull(),
  workDone: text("work_done").notNull(),
  progressPercent: integer("progress_percent").notNull().default(0),
  labourCount: integer("labour_count").notNull().default(0),
  materialsUsedSummary: text("materials_used_summary").default(""),
  siteExpenseAmount: numeric("site_expense_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  problems: text("problems").default(""),
  tomorrowPlan: text("tomorrow_plan").default(""),
  photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. QUOTATIONS
export interface QuotationItem {
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const quotations = pgTable(
  "quotations",
  {
    id: serial("id").primaryKey(),
    quotationNumber: text("quotation_number").notNull(), // QUO-0001
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    service: text("service").notNull(),
    items: jsonb("items").$type<QuotationItem[]>().notNull().default([]),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
    tax: numeric("tax", { precision: 14, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    terms: text("terms").default("50% advance, 50% upon milestone completion."),
    validUntil: text("valid_until").notNull(),
    status: text("status").notNull().default("Draft"), // Draft, Sent, Accepted, Rejected, Expired
    createdBy: text("created_by").notNull().default("Admin"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("quotations_num_idx").on(table.quotationNumber)]
);

// 7. TASKS & DAILY OPERATIONS
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    taskCode: text("task_code").notNull(), // TSK-0001
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    assignedTo: integer("assigned_to")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    managerId: integer("manager_id").references(() => employees.id, { onDelete: "set null" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    priority: text("priority").notNull().default("Medium"), // Low, Medium, High, Critical
    dueDate: text("due_date").notNull(),
    status: text("status").notNull().default("Todo"), // Todo, Accepted, In Progress, Blocked, Review, Reopened, Completed, Cancelled
    progressPercent: integer("progress_percent").notNull().default(0),
    requiresReview: boolean("requires_review").notNull().default(false),
    createdBy: text("created_by").notNull().default("Manager"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    completedBy: text("completed_by"),
    completedAt: timestamp("completed_at"),
    completionNote: text("completion_note").default(""),
    attachmentUrl: text("attachment_url"),
    evidenceAttachments: jsonb("evidence_attachments").$type<AttachmentMeta[]>().notNull().default([]),
    isCompanyWide: boolean("is_company_wide").notNull().default(false),
    visibility: text("visibility").notNull().default("Assigned"), // Everyone, Assigned, Management
    // Assignment tracking (who gave → whom, when)
    assignedByUserId: integer("assigned_by_user_id"),
    assignedByEmployeeId: integer("assigned_by_employee_id"),
    assignedByName: text("assigned_by_name"),
    assignedByDesignation: text("assigned_by_designation"),
    assignedToName: text("assigned_to_name"),
    assignedToDesignation: text("assigned_to_designation"),
    dueTime: text("due_time"), // HH:mm (optional)
    viewedAt: timestamp("viewed_at"),
    deadlineReminderSentAt: timestamp("deadline_reminder_sent_at"),
    overdueNotifiedAt: timestamp("overdue_notified_at"),
    // Work-tracking extensions (Option B)
    category: text("category").notNull().default("General"),
    startDate: text("start_date"),
    nextAction: text("next_action").notNull().default(""),
    delayReason: text("delay_reason").notNull().default(""),
    reviewStatus: text("review_status").notNull().default("None"), // None, Pending Review, Approved, Correction Required
    reviewNote: text("review_note").notNull().default(""),
    correctionCount: integer("correction_count").notNull().default(0),
    lastUpdateAt: timestamp("last_update_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tasks_code_idx").on(table.taskCode),
    index("tasks_assigned_idx").on(table.assignedTo),
  ]
);

// Secure task/daily-work evidence files (bytes stored server-side, served only via authorised API)
export const workFiles = pgTable(
  "work_files",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
    dailyWorkId: integer("daily_work_id"),
    employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
    uploadedByUserId: integer("uploaded_by_user_id").references(() => users.id, { onDelete: "set null" }),
    uploadedByName: text("uploaded_by_name").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    dataBase64: text("data_base64").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("work_files_task_idx").on(table.taskId),
    index("work_files_emp_idx").on(table.employeeId),
  ]
);

export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  comment: text("comment").notNull(),
  actionType: text("action_type").notNull().default("Comment"), // Assigned, Accepted, Started, ProgressUpdate, ProofSubmitted, SubmittedForReview, ReviewApproved, CorrectionRequired, StatusChange, Reassigned, DeadlineChanged, Comment
  progressPercent: integer("progress_percent"),
  fileIds: jsonb("file_ids").$type<number[]>().notNull().default([]),
  // Canonical lifecycle event (TASK_ASSIGNED, TASK_ACCEPTED, TASK_STARTED, TASK_PROGRESS_UPDATED, DAILY_WORK_SUBMITTED,
  // TASK_PROBLEM_REPORTED, TASK_ATTACHMENT_ADDED, TASK_COMPLETED, TASK_CORRECTION_REQUIRED, TASK_RESUBMITTED, TASK_APPROVED, ...)
  eventType: text("event_type"),
  oldStatus: text("old_status"),
  newStatus: text("new_status"),
  actorEmployeeId: integer("actor_employee_id"),
  actorDesignation: text("actor_designation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyWorks = pgTable(
  "daily_works",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    arrivalTime: text("arrival_time").notNull().default("09:30"),
    startTime: text("start_time").notNull().default("09:30"),
    endTime: text("end_time").notNull().default("19:30"),
    status: text("status").notNull().default("Completed"), // Completed, In Progress, Pending, Blocked
    workSummary: text("work_summary").notNull(),
    taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    problems: text("problems").default(""),
    pendingWork: text("pending_work").default(""),
    tomorrowPlan: text("tomorrow_plan").notNull().default(""),
    notes: text("notes").default(""),
    attachments: jsonb("attachments").$type<AttachmentMeta[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("daily_works_emp_date_idx").on(table.employeeId, table.date)]
);

export const dailyWorkPlans = pgTable(
  "daily_work_plans",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    items: jsonb("items").$type<WorkPlanItem[]>().notNull().default([]),
    autoProgressPercent: integer("auto_progress_percent").notNull().default(0),
    manualOverridePercent: integer("manual_override_percent"),
    overrideReason: text("override_reason").default(""),
    overriddenBy: text("overridden_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("daily_work_plans_emp_date_idx").on(table.employeeId, table.date)]
);

// 8. MATERIAL & INVENTORY
export const materials = pgTable(
  "materials",
  {
    id: serial("id").primaryKey(),
    materialCode: text("material_code").notNull(), // MAT-0001
    name: text("name").notNull(),
    category: text("category").notNull(), // Cement, Steel/Rod, Brick/Sand, Electrical, Plumbing, Finishing, Hardware
    unit: text("unit").notNull(), // Bag, Ton, CFT, Pcs, Kg, Liter
    warehouse: text("warehouse").notNull().default("Central Warehouse"),
    openingStock: numeric("opening_stock", { precision: 14, scale: 2 }).notNull().default("0"),
    purchaseReceived: numeric("purchase_received", { precision: 14, scale: 2 }).notNull().default("0"),
    transferIn: numeric("transfer_in", { precision: 14, scale: 2 }).notNull().default("0"),
    returnQty: numeric("return_qty", { precision: 14, scale: 2 }).notNull().default("0"),
    issueQty: numeric("issue_qty", { precision: 14, scale: 2 }).notNull().default("0"),
    transferOut: numeric("transfer_out", { precision: 14, scale: 2 }).notNull().default("0"),
    consumptionQty: numeric("consumption_qty", { precision: 14, scale: 2 }).notNull().default("0"),
    adjustmentQty: numeric("adjustment_qty", { precision: 14, scale: 2 }).notNull().default("0"),
    currentStock: numeric("current_stock", { precision: 14, scale: 2 }).notNull().default("0"),
    unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
    reorderLevel: numeric("reorder_level", { precision: 14, scale: 2 }).notNull().default("20"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("materials_code_idx").on(table.materialCode)]
);

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  movementType: text("movement_type").notNull(), // Opening, Purchase, Issue, Consumption, Transfer In, Transfer Out, Return, Adjustment
  quantity: numeric("quantity", { precision: 14, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  totalValue: numeric("total_value", { precision: 14, scale: 2 }).notNull().default("0"),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
  warehouseFrom: text("warehouse_from").default("Central Warehouse"),
  warehouseTo: text("warehouse_to").default(""),
  referenceCode: text("reference_code").default(""),
  notes: text("notes").default(""),
  createdBy: text("created_by").notNull().default("System"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. SUPPLIER & PROCUREMENT
export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    supplierCode: text("supplier_code").notNull(), // SUP-0001
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").default(""),
    address: text("address").notNull().default(""),
    contactPerson: text("contact_person").notNull().default(""),
    productsProvided: text("products_provided").notNull().default(""),
    totalBilled: numeric("total_billed", { precision: 14, scale: 2 }).notNull().default("0"),
    totalPaid: numeric("total_paid", { precision: 14, scale: 2 }).notNull().default("0"),
    outstandingPayable: numeric("outstanding_payable", { precision: 14, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("suppliers_code_idx").on(table.supplierCode)]
);

export interface PRItem {
  materialId: number;
  materialName: string;
  quantity: number;
  unit: string;
  estimatedRate: number;
}

export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  prCode: text("pr_code").notNull(), // PR-0001
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
  requestedById: integer("requested_by_id").references(() => employees.id, { onDelete: "set null" }),
  items: jsonb("items").$type<PRItem[]>().notNull().default([]),
  totalEstimated: numeric("total_estimated", { precision: 14, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected, Converted to PO
  approvedBy: text("approved_by"),
  notes: text("notes").default(""),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface POItem {
  materialId: number;
  materialName: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  rate: number;
  total: number;
}

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: serial("id").primaryKey(),
    poCode: text("po_code").notNull(), // PO-0001
    prId: integer("pr_id").references(() => purchaseRequests.id, { onDelete: "set null" }),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    items: jsonb("items").$type<POItem[]>().notNull().default([]),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    receivedAmount: numeric("received_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("Approved"), // Draft, Approved, Partially Received, Received, Cancelled
    supplierQuotationRef: text("supplier_quotation_ref").default(""),
    approvedBy: text("approved_by"),
    date: text("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("po_code_idx").on(table.poCode)]
);

export const supplierBills = pgTable("supplier_bills", {
  id: serial("id").primaryKey(),
  billCode: text("bill_code").notNull(), // BILL-0001
  poId: integer("po_id").references(() => purchaseOrders.id, { onDelete: "set null" }),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  outstandingAmount: numeric("outstanding_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("Unpaid"), // Unpaid, Partial, Paid, Void
  date: text("date").notNull(),
  dueDate: text("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. LABOUR & CONTRACTOR
export const labours = pgTable("labours", {
  id: serial("id").primaryKey(),
  labourCode: text("labour_code").notNull(), // LAB-0001
  name: text("name").notNull(),
  category: text("category").notNull(), // Head Mason, Mason, Helper, Electrician, Plumber, Painter, Welder
  dailyRate: numeric("daily_rate", { precision: 14, scale: 2 }).notNull(),
  phone: text("phone").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  assignedSiteId: integer("assigned_site_id").references(() => sites.id, { onDelete: "set null" }),
  totalWorkDays: numeric("total_work_days", { precision: 10, scale: 2 }).notNull().default("0"),
  totalEarned: numeric("total_earned", { precision: 14, scale: 2 }).notNull().default("0"),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  dueAmount: numeric("due_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  contractorCode: text("contractor_code").notNull(), // CON-0001
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  specialty: text("specialty").notNull(), // Piling, RCC Work, Brickwork & Plaster, Electrical, Tiles & Sanitary
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
  workOrderRef: text("work_order_ref").notNull().default(""),
  contractAmount: numeric("contract_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  approvedBillAmount: numeric("approved_bill_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  outstandingDue: numeric("outstanding_due", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. EXPENSES
export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    expenseCode: text("expense_code").notNull(), // EXP-0001
    date: text("date").notNull(),
    category: text("category").notNull(), // Material, Labour, Contractor, Transport, Site Expense, Office, Utilities, Equipment
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
    vendorName: text("vendor_name").default(""),
    paymentMethod: text("payment_method").notNull().default("Cash"), // Cash, Bank, Payable
    accountId: integer("account_id"),
    description: text("description").notNull(),
    attachmentUrl: text("attachment_url"),
    approvalStatus: text("approval_status").notNull().default("Approved"), // Pending, Approved, Rejected, Void
    approvedBy: text("approved_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("expenses_code_idx").on(table.expenseCode)]
);

// 12. ACCOUNTING (CHART OF ACCOUNTS & DOUBLE ENTRY JOURNAL)
export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(), // 1010, 1020, 1100, 1200, 2010, 3010, 4010, 5010, 5020
    name: text("name").notNull(),
    type: text("type").notNull(), // Asset, Liability, Equity, Revenue, Expense
    subType: text("sub_type").notNull(), // Cash, Bank, Accounts Receivable, Inventory, Accounts Payable, Equity, Revenue, Expense, Salary Expense
    balance: numeric("balance", { precision: 16, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("accounts_code_idx").on(table.code)]
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    voucherNo: text("voucher_no").notNull(), // JV-0001
    date: text("date").notNull(),
    referenceType: text("reference_type").notNull(), // Invoice, Payment, Purchase, Expense, Payroll, Transfer, Contractor, Manual
    referenceCode: text("reference_code").notNull(),
    description: text("description").notNull(),
    totalDebit: numeric("total_debit", { precision: 16, scale: 2 }).notNull(),
    totalCredit: numeric("total_credit", { precision: 16, scale: 2 }).notNull(),
    isVoid: boolean("is_void").notNull().default(false),
    createdBy: text("created_by").notNull().default("System"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("journal_voucher_idx").on(table.voucherNo)]
);

export const journalLines = pgTable("journal_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  accountName: text("account_name").notNull(),
  debit: numeric("debit", { precision: 16, scale: 2 }).notNull().default("0"),
  credit: numeric("credit", { precision: 16, scale: 2 }).notNull().default("0"),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. ACCOUNTS RECEIVABLE (INVOICES)
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    invoiceCode: text("invoice_code").notNull(), // INV-0001
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    quotationId: integer("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
    items: jsonb("items").$type<QuotationItem[]>().notNull().default([]),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    outstandingAmount: numeric("outstanding_amount", { precision: 14, scale: 2 }).notNull(),
    date: text("date").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull().default("Unpaid"), // Unpaid, Partial, Paid, Overdue, Void
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("invoices_code_idx").on(table.invoiceCode)]
);

// 14. PAYMENTS
export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    paymentCode: text("payment_code").notNull(), // PAY-0001
    paymentType: text("payment_type").notNull(), // Client Receipt, Supplier Payment, Contractor Payment, Salary Payment, Expense Payment, Labour Payment
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    date: text("date").notNull(),
    method: text("method").notNull().default("Bank"), // Cash, Bank
    accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
    referenceCode: text("reference_code").default(""),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    supplierBillId: integer("supplier_bill_id").references(() => supplierBills.id, { onDelete: "set null" }),
    contractorId: integer("contractor_id").references(() => contractors.id, { onDelete: "set null" }),
    employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
    payrollId: integer("payroll_id"),
    expenseId: integer("expense_id").references(() => expenses.id, { onDelete: "set null" }),
    labourId: integer("labour_id").references(() => labours.id, { onDelete: "set null" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    isVoid: boolean("is_void").notNull().default(false),
    createdBy: text("created_by").notNull().default("Admin"),
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("payments_code_idx").on(table.paymentCode)]
);

// 15. PAYROLL
export const payrolls = pgTable(
  "payrolls",
  {
    id: serial("id").primaryKey(),
    payrollCode: text("payroll_code").notNull(), // PAYR-0001
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    salaryMonth: text("salary_month").notNull(), // YYYY-MM
    workingDays: integer("working_days").notNull().default(26),
    presentDays: integer("present_days").notNull().default(26),
    lateDays: integer("late_days").notNull().default(0),
    leaveDays: integer("leave_days").notNull().default(0),
    overtimeHours: numeric("overtime_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
    allowance: numeric("allowance", { precision: 14, scale: 2 }).notNull().default("0"),
    overtimePay: numeric("overtime_pay", { precision: 14, scale: 2 }).notNull().default("0"),
    bonus: numeric("bonus", { precision: 14, scale: 2 }).notNull().default("0"),
    advanceDeduction: numeric("advance_deduction", { precision: 14, scale: 2 }).notNull().default("0"),
    otherDeduction: numeric("other_deduction", { precision: 14, scale: 2 }).notNull().default("0"),
    taxDeduction: numeric("tax_deduction", { precision: 14, scale: 2 }).notNull().default("0"),
    netSalary: numeric("net_salary", { precision: 14, scale: 2 }).notNull(),
    status: text("status").notNull().default("Draft"), // Draft, Approved, Paid
    approvedBy: text("approved_by"),
    paidAt: timestamp("paid_at"),
    paymentId: integer("payment_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("payrolls_code_idx").on(table.payrollCode)]
);

// 16. LEAVE MANAGEMENT
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  leaveCode: text("leave_code").notNull(), // LV-0001
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveType: text("leave_type").notNull(), // Casual, Sick, Annual, Unpaid
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDays: integer("total_days").notNull().default(1),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("Pending"), // Pending, Manager Approved, Approved, Rejected, Cancelled
  managerApprovedBy: text("manager_approved_by"),
  hrApprovedBy: text("hr_approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. PERFORMANCE REVIEWS
export const performanceReviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // 2026-04
  attendanceScore: integer("attendance_score").notNull().default(0),
  taskScore: integer("task_score").notNull().default(0),
  dailyUpdateScore: integer("daily_update_score").notNull().default(0),
  followUpScore: integer("follow_up_score").notNull().default(0),
  projectContributionScore: integer("project_contribution_score").notNull().default(0),
  managerReviewPoints: integer("manager_review_points").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  managerComments: text("manager_comments").default(""),
  reviewedBy: text("reviewed_by").notNull().default("Manager"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. DOCUMENTS
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  docCode: text("doc_code").notNull(), // DOC-0001
  name: text("name").notNull(),
  category: text("category").notNull(), // Employee, Client, Project, Site, Supplier, Contractor, Invoice, PO, Payment, Other
  fileType: text("file_type").notNull(), // PDF, JPG, PNG, DOCX, XLSX
  fileSize: text("file_size").notNull(),
  fileDataUrl: text("file_data_url").notNull(),
  relatedEntityId: integer("related_entity_id"),
  relatedEntityCode: text("related_entity_code").default(""),
  uploadedBy: text("uploaded_by").notNull(),
  minRoleRequired: text("min_role_required").notNull().default("Staff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 19. NOTIFICATIONS
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  targetRole: text("target_role").default("All"),
  type: text("type").notNull(), // Task Assigned, Task Completed, Task Overdue, Announcement, Daily Work Reminder, Work Plan Reminder, Leave Approved/Rejected, Attendance Correction, Project Update, Material Request, Approval Required, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdBy: text("created_by").default("System"),
  priority: text("priority").default("Medium"),
  assignedPersonOrTeam: text("assigned_person_or_team").default("All Staff"),
  dueDate: text("due_date"),
  attachmentUrl: text("attachment_url"),
  relatedTaskId: integer("related_task_id"),
  category: text("category"), // Announcement, Task Assigned, Task Update, Daily Work, Approval, Correction, Deadline, Overdue, Leave, Attendance
  senderUserId: integer("sender_user_id"),
  recipientEmployeeId: integer("recipient_employee_id"),
  recipientName: text("recipient_name"),
  relatedEmployeeId: integer("related_employee_id"),
  relatedUrl: text("related_url").notNull().default("/dashboard"),
  relatedEntityCode: text("related_entity_code").default(""),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 19b. COMPANY ANNOUNCEMENTS
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdBy: text("created_by").notNull(),
  createdByUserId: integer("created_by_user_id"),
  published: boolean("published").notNull().default(true),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcementReads = pgTable("announcement_reads", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id")
    .notNull()
    .references(() => announcements.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

// 20. REMINDER AUTOMATION SETTINGS
export const reminderSettings = pgTable("reminder_settings", {
  id: serial("id").primaryKey(),
  lateCheckInAfter: text("late_check_in_after").notNull().default("09:30"),
  workPlanReminderTime: text("work_plan_reminder_time").notNull().default("10:00"),
  dailySummaryReminderTime: text("daily_summary_reminder_time").notNull().default("18:30"),
  enableOverdueTaskReminder: boolean("enable_overdue_task_reminder").notNull().default(true),
  enablePendingTaskReminder: boolean("enable_pending_task_reminder").notNull().default(true),
  updatedBy: text("updated_by").notNull().default("Owner"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 21. AUDIT LOGS
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, APPROVE, REJECT, PAYMENT, JOURNAL, VOID, LOGIN, PERMISSION_CHANGE
  entity: text("entity").notNull(),
  recordId: text("record_id").notNull(),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  ipAddress: text("ip_address").default("127.0.0.1"),
  userAgent: text("user_agent").default("INSAF-ERP-Client"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});