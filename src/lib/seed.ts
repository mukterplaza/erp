import {
  db,
  users,
  employees,
  attendances,
  attendanceCorrections,
  leads,
  leadFollowups,
  clients,
  projects,
  sites,
  siteReports,
  quotations,
  tasks,
  taskComments,
  dailyWorks,
  materials,
  stockMovements,
  suppliers,
  purchaseRequests,
  purchaseOrders,
  supplierBills,
  labours,
  contractors,
  expenses,
  accounts,
  journalEntries,
  journalLines,
  invoices,
  payments,
  payrolls,
  leaveRequests,
  performanceReviews,
  documents,
  notifications,
  auditLogs,
  dailyWorkPlans,
  reminderSettings,
  companies,
} from "@/db";
import { hashPassword, ROLE_DEFAULT_PERMISSIONS } from "./auth";
import { CRM_COMPANIES, normalizeIbdcService } from "./crm-constants";
import { sql, eq } from "drizzle-orm";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded() {
  if (seedPromise) {
    return seedPromise;
  }
  seedPromise = runSeedInternal().finally(() => {
    seedPromise = null;
  });
  return seedPromise;
}

async function ensureCompanyRows() {
  const existingCompanies = await db.select().from(companies);
  if (existingCompanies.length === 0) {
    await db.insert(companies).values(
      CRM_COMPANIES.map((c) => ({
        code: c.code,
        name: c.name,
        shortName: c.shortName,
        businessType: c.businessType,
        leadPrefix: c.leadPrefix,
      }))
    );
  }
}

async function ensureCrmCompaniesSeeded() {
  const today = new Date().toISOString().split("T")[0];

  // 1. Ensure both business units exist (IBDC = 1, IREL = 2)
  await ensureCompanyRows();

  const allCompanies = await db.select().from(companies);
  const ibdc = allCompanies.find((c) => c.code === "IBDC");
  const irel = allCompanies.find((c) => c.code === "IREL");
  if (!ibdc || !irel) return;

  // 2. EXCEL MIGRATION: all pre-existing service-based leads belong to IBDC
  const allLeads = await db.select().from(leads);
  for (const lead of allLeads) {
    const needsMigration =
      lead.companyId !== irel.id &&
      (lead.leadCode.startsWith("LEAD-") ||
        !["Hot", "Warm", "Cold"].includes(lead.priority));

    if (needsMigration) {
      const normalizedService = normalizeIbdcService(lead.service);
      const migratedPriority =
        lead.status === "Won" || lead.status === "Quotation"
          ? "Hot"
          : lead.status === "Lost"
          ? "Cold"
          : "Warm";
      const migratedStatus =
        lead.status === "Follow-up" ? "Follow-up Required" : lead.status;

      await db
        .update(leads)
        .set({
          companyId: ibdc.id,
          service: normalizedService,
          priority: migratedPriority,
          status: migratedStatus,
          propertyType: "",
        })
        .where(eq(leads.id, lead.id));
    }
  }

  // 3. Seed reference leads for BOTH business units (only once)
  const ibdcSample = allLeads.find((l) => l.leadCode.startsWith("BDL-"));
  if (!ibdcSample) {
    const ibdcCount = (await db.select().from(leads)).filter(
      (l) => l.companyId === ibdc.id
    ).length;
    await db.insert(leads).values({
      leadCode: `BDL-${String(ibdcCount + 1).padStart(4, "0")}`,
      companyId: ibdc.id,
      name: "Rahim Uddin Ahmed",
      phone: "01712-556677",
      whatsapp: "01712-556677",
      location: "Mirpur DOHS, Road 12, Dhaka",
      source: "Referral",
      priority: "Hot",
      service: "RAJUK Plan Approval",
      landSize: "5 Katha",
      roadWidth: "25 ft",
      requirement:
        "RAJUK plan approval for a G+6 residential building including soil test documentation.",
      budget: "450000.00",
      status: "Follow-up Required",
      nextFollowUpDate: today,
    });
  }

  const irelSample = allLeads.find((l) => l.companyId === irel.id);
  if (!irelSample) {
    await db.insert(leads).values([
      {
        leadCode: "REL-0001",
        companyId: irel.id,
        name: "Karim Hossain",
        phone: "01819-334455",
        whatsapp: "01819-334455",
        location: "Bashundhara R/A, Dhaka",
        source: "Facebook",
        priority: "Hot",
        service: "",
        propertyType: "Flat",
        projectName: "Salsabil",
        unitNo: "Flat B-4",
        preferredLocation: "Bashundhara R/A Block-C",
        propertySize: "1650 sft",
        floor: "4th Floor",
        bedrooms: "3 Bed",
        purpose: "Own Use",
        expectedPurchaseDate: "2026-08-30",
        requirement:
          "South-facing 3 bedroom flat with 2 parking spaces and lift access.",
        budget: "8000000.00",
        status: "Follow-up Required",
        nextFollowUpDate: today,
      },
      {
        leadCode: "REL-0002",
        companyId: irel.id,
        name: "Hasan Mahmud",
        phone: "01911-778899",
        whatsapp: "01911-778899",
        location: "Uttara Sector 7, Dhaka",
        source: "Walk-in",
        priority: "Warm",
        service: "",
        propertyType: "Shop",
        projectName: "Bhai Bhai Tower",
        unitNo: "Shop G-12",
        preferredLocation: "Uttara Sector 7 Main Road",
        propertySize: "420 sft",
        floor: "Ground Floor",
        bedrooms: "",
        purpose: "Investment",
        expectedPurchaseDate: "2026-11-15",
        requirement:
          "Ground floor corner shop facing the main road for rental investment.",
        budget: "12000000.00",
        status: "Contacted",
        nextFollowUpDate: today,
      },
      {
        leadCode: "REL-0003",
        companyId: irel.id,
        name: "Nusrat Jahan",
        phone: "01677-223344",
        whatsapp: "01677-223344",
        location: "Jolshiri Abashon, Dhaka",
        source: "Website",
        priority: "Warm",
        service: "",
        propertyType: "Land/Plot",
        projectName: "Jolshiri Green Valley",
        unitNo: "Plot 22",
        preferredLocation: "Jolshiri Abashon Sector 5",
        propertySize: "5 Katha",
        floor: "",
        bedrooms: "",
        purpose: "Investment",
        expectedPurchaseDate: "2027-01-20",
        requirement: "Corner plot with approved layout for future development.",
        budget: "25000000.00",
        status: "Qualified",
        nextFollowUpDate: today,
      },
    ]);
  }
}

async function ensureEnhancementsSeeded() {
  const today = new Date().toISOString().split("T")[0];

  await ensureCrmCompaniesSeeded();

  const remCount = await db.select({ count: sql<number>`count(*)` }).from(reminderSettings);
  if (Number(remCount[0]?.count || 0) === 0) {
    await db.insert(reminderSettings).values({
      lateCheckInAfter: "09:30",
      workPlanReminderTime: "10:00",
      dailySummaryReminderTime: "18:30",
      enableOverdueTaskReminder: true,
      enablePendingTaskReminder: true,
      updatedBy: "Engr. Tariqul Islam (Owner)",
    });
  }

  const planCount = await db.select({ count: sql<number>`count(*)` }).from(dailyWorkPlans);
  if (Number(planCount[0]?.count || 0) === 0) {
    const allEmps = await db.select().from(employees);
    const tanvir = allEmps.find((e) => e.empCode === "EMP-0005") || allEmps[0];
    const mehedi = allEmps.find((e) => e.empCode === "EMP-0006") || allEmps[1];

    if (tanvir) {
      // 5 planned items, 4 completed = 80% automatic progress
      await db.insert(dailyWorkPlans).values({
        employeeId: tanvir.id,
        date: today,
        items: [
          {
            id: "wp-1",
            title: "১. ক্লায়েন্ট ফলো-আপ (Client follow-up - Alhaj Abdul Karim)",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-2",
            title: "২. রাজউক ড্রয়িং আপডেট (Rajuk structural drawing update)",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-3",
            title: "৩. প্রজেক্ট রিপোর্ট প্রস্তুত (INSAF Heights Project Report)",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-4",
            title: "৪. বসুন্ধরা সাইট ভিজিট ও রড বাইন্ডিং চেক (Site-0001 Visit)",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-5",
            title: "৫. ৪র্থ তলার শাটারিং মেটেরিয়াল রিকুইজিশন (4th Floor Requisition)",
            status: "In Progress",
            completionPercent: 50,
          },
        ],
        autoProgressPercent: 80,
      });
    }

    if (mehedi) {
      // 5 planned items, 3 completed = 60% automatic progress
      await db.insert(dailyWorkPlans).values({
        employeeId: mehedi.id,
        date: today,
        items: [
          {
            id: "wp-m1",
            title: "1. Morning labour roll call & safety briefing at Site-0001",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-m2",
            title: "2. সিমেন্ট ও রড স্টক ভেরিফিকেশন (Cement & Rod stock check)",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-m3",
            title: "3. কিউরিং পাম্প তদারকি (Curing water pump supervision)",
            status: "Completed",
            completionPercent: 100,
          },
          {
            id: "wp-m4",
            title: "4. সাব-কন্ট্রাক্টর কাজের মাপ গ্রহণ (Contractor measurement)",
            status: "Pending",
            completionPercent: 0,
          },
          {
            id: "wp-m5",
            title: "5. সন্ধ্যায় ডেইলি সামারি আপডেট (Evening Daily Summary)",
            status: "In Progress",
            completionPercent: 50,
          },
        ],
        autoProgressPercent: 60,
      });
    }

    const allTasks = await db.select().from(tasks);
    if (allTasks.length > 0) {
      await db.insert(notifications).values([
        {
          targetRole: "All",
          type: "Task Assigned",
          title: `Task Assigned: ${allTasks[0].taskCode} — ${allTasks[0].title}`,
          message: allTasks[0].description || "Please complete the structural quality check and attach site evidence.",
          createdBy: "Engr. Rafiqul Alam (Project Manager)",
          priority: allTasks[0].priority,
          assignedPersonOrTeam: "Engr. Tanvir Ahmed (EMP-0005)",
          dueDate: allTasks[0].dueDate,
          relatedTaskId: allTasks[0].id,
          relatedUrl: `/tasks/${allTasks[0].id}`,
          relatedEntityCode: allTasks[0].taskCode,
          isRead: false,
        },
        {
          targetRole: "All",
          type: "Announcement",
          title: "অফিস সময়সূচি ও ডেইলি ওয়ার্ক প্ল্যান নির্দেশনা (Official Working Schedule Notice)",
          message:
            "সকল স্টাফদের সকাল ৯:৩০ মিনিটের মধ্যে IN TIME এবং দিনের শুরুতে Today's Work Plan সাবমিট করার নির্দেশ দেওয়া হলো। (Morning: 9:30 AM–1:15 PM, Break: 1:15 PM–2:30 PM, Afternoon: 2:30 PM–7:30 PM)।",
          createdBy: "Engr. Tariqul Islam (Owner)",
          priority: "High",
          assignedPersonOrTeam: "All Staff",
          dueDate: today,
          relatedUrl: "/my-day",
          relatedEntityCode: "NOTICE-001",
          isRead: false,
        },
      ]);
    }
  }
}

async function runSeedInternal() {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (Number(existing[0]?.count || 0) > 0) {
      await ensureEnhancementsSeeded();
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const defaultPass = hashPassword("insaf123");

    // 0. CRM BUSINESS UNITS (required before leads can be inserted)
    await ensureCompanyRows();

    // 1. CHART OF ACCOUNTS
    const insertedAccounts = await db
      .insert(accounts)
      .values([
        { code: "1010", name: "Cash in Hand", type: "Asset", subType: "Cash", balance: "450000.00" },
        { code: "1020", name: "City Bank Corporate A/C", type: "Asset", subType: "Bank", balance: "1850000.00" },
        { code: "1100", name: "Accounts Receivable", type: "Asset", subType: "Accounts Receivable", balance: "200000.00" },
        { code: "1200", name: "Construction Material Inventory", type: "Asset", subType: "Inventory", balance: "545000.00" },
        { code: "1300", name: "Site Equipment & Machinery", type: "Asset", subType: "Fixed Asset", balance: "1200000.00" },
        { code: "2010", name: "Accounts Payable (Suppliers)", type: "Liability", subType: "Accounts Payable", balance: "200000.00" },
        { code: "2020", name: "Contractor Payable", type: "Liability", subType: "Accounts Payable", balance: "250000.00" },
        { code: "3010", name: "Owner Equity & Capital", type: "Equity", subType: "Equity", balance: "3493000.00" },
        { code: "4010", name: "Project Construction Revenue", type: "Revenue", subType: "Revenue", balance: "500000.00" },
        { code: "5010", name: "Project Direct Expense", type: "Expense", subType: "Expense", balance: "165000.00" },
        { code: "5020", name: "Employee Salary Expense", type: "Expense", subType: "Salary Expense", balance: "33000.00" },
      ])
      .returning();

    const accMap = new Map(insertedAccounts.map((a) => [a.code, a]));

    // 2. USERS (All Roles)
    const insertedUsers = await db
      .insert(users)
      .values([
        {
          name: "Engr. Muhammad Sheik Rakibul Hasan",
          email: "rakibul@insaferp.com",
          username: "rakibul.hasan",
          passwordHash: defaultPass,
          role: "Owner",
          permissions: ROLE_DEFAULT_PERMISSIONS["Owner"],
          status: "Active",
        },
        {
          name: "Asifur Rahman Fahim",
          email: "fahim@insaferp.com",
          username: "asifur.fahim",
          passwordHash: defaultPass,
          role: "Manager",
          permissions: ROLE_DEFAULT_PERMISSIONS["Manager"],
          status: "Active",
        },
        {
          name: "Md Harizul Islam",
          email: "harizul@insaferp.com",
          username: "harizul.islam",
          passwordHash: defaultPass,
          role: "Chairman",
          permissions: ROLE_DEFAULT_PERMISSIONS["Chairman"],
          status: "Active",
        },
        {
          name: "Md Mahdi Hasan",
          email: "mahdi@insaferp.com",
          username: "mahdi.hasan",
          passwordHash: defaultPass,
          role: "Project Manager",
          permissions: ROLE_DEFAULT_PERMISSIONS["Project Manager"],
          status: "Active",
        },
        {
          name: "Engr. Rakib Hossain",
          email: "rakib@insaferp.com",
          username: "rakib.hossain",
          passwordHash: defaultPass,
          role: "Engineer",
          permissions: ROLE_DEFAULT_PERMISSIONS["Engineer"],
          status: "Active",
        },
        {
          name: "Azharul Haq Asif",
          email: "asif@insaferp.com",
          username: "azharul.asif",
          passwordHash: defaultPass,
          role: "Engineer",
          permissions: ROLE_DEFAULT_PERMISSIONS["Engineer"],
          status: "Active",
        },
        {
          name: "Md Talha",
          email: "talha@insaferp.com",
          username: "md.talha",
          marketingScope: "IBDC",
          passwordHash: defaultPass,
          role: "Marketing",
          permissions: ROLE_DEFAULT_PERMISSIONS["Marketing"],
          status: "Active",
        },
        {
          name: "Md Jahid Hasan",
          email: "jahid@insaferp.com",
          username: "jahid.hasan",
          marketingScope: "IREL",
          passwordHash: defaultPass,
          role: "Marketing",
          permissions: ROLE_DEFAULT_PERMISSIONS["Marketing"],
          status: "Active",
        },
        {
          name: "Md Abdus Salam",
          email: "salam@insaferp.com",
          username: "abdus.salam",
          passwordHash: defaultPass,
          role: "Site Staff",
          permissions: ROLE_DEFAULT_PERMISSIONS["Site Staff"],
          status: "Active",
        },
        {
          name: "Md Yasin",
          email: "yasin@insaferp.com",
          username: "md.yasin",
          passwordHash: defaultPass,
          role: "Staff",
          permissions: ROLE_DEFAULT_PERMISSIONS["Staff"],
          status: "Active",
        },
        {
          name: "Md Israfil",
          email: "israfil@insaferp.com",
          username: "md.israfil",
          passwordHash: defaultPass,
          role: "Staff",
          permissions: ROLE_DEFAULT_PERMISSIONS["Staff"],
          status: "Active",
        },
      ])
      .returning();

    // 3. EMPLOYEES (EMP-0001 to EMP-0008)
    const insertedEmployees = await db
      .insert(employees)
      .values([
        {
          empCode: "EMP-0001",
          userId: insertedUsers[0].id,
          name: "Engr. Tariqul Islam",
          department: "Management",
          designation: "Managing Director & Owner",
          joiningDate: "2020-01-01",
          basicSalary: "120000.00",
          allowance: "30000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000001",
          email: "owner@insaferp.com",
          address: "Gulshan-2, Dhaka",
          emergencyContact: "01711-999991",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475001",
          paymentMethod: "Bank",
        },
        {
          empCode: "EMP-0002",
          userId: insertedUsers[1].id,
          name: "Mahmudul Hasan",
          department: "Operations",
          designation: "General Manager",
          joiningDate: "2021-03-15",
          basicSalary: "75000.00",
          allowance: "15000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000002",
          email: "manager@insaferp.com",
          address: "Banani, Dhaka",
          emergencyContact: "01711-999992",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475002",
          paymentMethod: "Bank",
          managerId: 1,
        },
        {
          empCode: "EMP-0003",
          userId: insertedUsers[2].id,
          name: "Farhana Yeasmin",
          department: "HR & Admin",
          designation: "Head of HR",
          joiningDate: "2021-06-01",
          basicSalary: "55000.00",
          allowance: "10000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000003",
          email: "hr@insaferp.com",
          address: "Dhanmondi, Dhaka",
          emergencyContact: "01711-999993",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475003",
          paymentMethod: "Bank",
          managerId: 2,
        },
        {
          empCode: "EMP-0004",
          userId: insertedUsers[3].id,
          name: "Kamrul Hasan",
          department: "Accounts & Finance",
          designation: "Chief Accountant",
          joiningDate: "2021-08-10",
          basicSalary: "60000.00",
          allowance: "12000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000004",
          email: "accounts@insaferp.com",
          address: "Uttara Sector 7, Dhaka",
          emergencyContact: "01711-999994",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475004",
          paymentMethod: "Bank",
          managerId: 2,
        },
        {
          empCode: "EMP-0005",
          userId: insertedUsers[6].id,
          name: "Engr. Tanvir Ahmed",
          department: "Engineering",
          designation: "Senior Site Engineer",
          joiningDate: "2022-02-01",
          basicSalary: "30000.00",
          allowance: "5000.00",
          advanceBalance: "3000.00",
          deductionDefault: "1000.00",
          phone: "01711-000005",
          email: "engineer@insaferp.com",
          address: "Mirpur DOHS, Dhaka",
          emergencyContact: "01711-999995",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475005",
          paymentMethod: "Bank",
          managerId: 2,
        },
        {
          empCode: "EMP-0006",
          userId: insertedUsers[7].id,
          name: "Mehedi Hasan",
          department: "Construction",
          designation: "Site Supervisor",
          joiningDate: "2023-01-15",
          basicSalary: "25000.00",
          allowance: "4000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000006",
          email: "staff@insaferp.com",
          address: "Bashundhara R/A, Dhaka",
          emergencyContact: "01711-999996",
          employmentStatus: "Active",
          bankName: "Dutch-Bangla Bank",
          bankAccountNo: "192837465006",
          paymentMethod: "Bank",
          managerId: 5,
        },
        {
          empCode: "EMP-0007",
          userId: insertedUsers[4].id,
          name: "Engr. Rafiqul Alam",
          department: "Engineering",
          designation: "Project Manager",
          joiningDate: "2021-11-01",
          basicSalary: "70000.00",
          allowance: "15000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000007",
          email: "pm@insaferp.com",
          address: "Mohakhali DOHS, Dhaka",
          emergencyContact: "01711-999997",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475007",
          paymentMethod: "Bank",
          managerId: 2,
        },
        {
          empCode: "EMP-0008",
          userId: insertedUsers[5].id,
          name: "Sadia Afrin",
          department: "CRM & Sales",
          designation: "Senior CRM Executive",
          joiningDate: "2022-07-01",
          basicSalary: "38000.00",
          allowance: "7000.00",
          advanceBalance: "0.00",
          deductionDefault: "0.00",
          phone: "01711-000008",
          email: "sales@insaferp.com",
          address: "Banasree, Dhaka",
          emergencyContact: "01711-999998",
          employmentStatus: "Active",
          bankName: "City Bank PLC",
          bankAccountNo: "1402938475008",
          paymentMethod: "Bank",
          managerId: 2,
        },
      ])
      .returning();

    // 4. ATTENDANCE TODAY + CORRECTIONS
    await db.insert(attendances).values([
      {
        employeeId: insertedEmployees[0].id,
        date: today,
        checkIn: "08:55",
        checkOut: "18:30",
        status: "Present",
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workingHours: "9.58",
        overtimeHours: "0.58",
        isApproved: true,
        notes: "Office HQ",
      },
      {
        employeeId: insertedEmployees[1].id,
        date: today,
        checkIn: "09:05",
        checkOut: "18:15",
        status: "Present",
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workingHours: "9.17",
        overtimeHours: "0.17",
        isApproved: true,
        notes: "HQ Operations Review",
      },
      {
        employeeId: insertedEmployees[4].id, // Engr. Tanvir
        date: today,
        checkIn: "09:35",
        checkOut: "20:35",
        status: "Late",
        lateMinutes: 35,
        earlyLeaveMinutes: 0,
        workingHours: "11.00",
        overtimeHours: "2.00",
        isApproved: true,
        notes: "Traffic delay at Mirpur, worked 2h overtime on casting",
      },
      {
        employeeId: insertedEmployees[5].id, // Mehedi Hasan
        date: today,
        checkIn: "08:50",
        checkOut: null,
        status: "Missing Checkout",
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workingHours: "0.00",
        overtimeHours: "0.00",
        isApproved: true,
        notes: "Still at Site-0001",
      },
      {
        employeeId: insertedEmployees[6].id, // PM Rafiqul
        date: today,
        checkIn: "09:00",
        checkOut: "18:00",
        status: "Present",
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workingHours: "9.00",
        overtimeHours: "0.00",
        isApproved: true,
        notes: "Site inspection",
      },
      {
        employeeId: insertedEmployees[7].id, // Sadia Afrin
        date: today,
        checkIn: null,
        checkOut: null,
        status: "Leave",
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        workingHours: "0.00",
        overtimeHours: "0.00",
        isApproved: true,
        notes: "Approved Casual Leave",
      },
    ]);

    await db.insert(attendanceCorrections).values([
      {
        employeeId: insertedEmployees[5].id,
        date: today,
        requestedCheckIn: "08:50",
        requestedCheckOut: "18:40",
        reason: "Forgot mobile check-out while supervising concrete curing at Site-0001",
        status: "Pending",
      },
    ]);

    // 5. LEADS & FOLLOW-UPS & CLIENTS
    const insertedLeads = await db
      .insert(leads)
      .values([
        {
          leadCode: "LEAD-0001",
          name: "Alhaj Abdul Karim",
          phone: "01819-223344",
          whatsapp: "01819-223344",
          location: "Plot 14, Road 7, Bashundhara Block-D, Dhaka",
          source: "Referral",
          service: "Full Construction",
          requirement: "G+9 Residential Apartment Building with Basement Parking",
          landSize: "10 Katha",
          roadWidth: "40 ft",
          budget: "45000000.00",
          status: "Won",
          assignedStaffId: insertedEmployees[7].id,
          nextFollowUpDate: today,
        },
        {
          leadCode: "LEAD-0002",
          name: "Dr. Shafiqur Rahman",
          phone: "01713-556677",
          whatsapp: "01713-556677",
          location: "Sector 13, Uttara, Dhaka",
          source: "Facebook",
          service: "Architectural & Structural Design",
          requirement: "Duplex Villa + Diagnostic Center Commercial Floor",
          landSize: "6 Katha",
          roadWidth: "30 ft",
          budget: "18000000.00",
          status: "Quotation",
          assignedStaffId: insertedEmployees[7].id,
          nextFollowUpDate: today,
        },
        {
          leadCode: "LEAD-0003",
          name: "Syed Monirul Islam",
          phone: "01911-889900",
          whatsapp: "01911-889900",
          location: "Jolshiri Abashon, Sector 12",
          source: "Website",
          service: "Full Construction",
          requirement: "G+8 Luxury Condominium",
          landSize: "8 Katha",
          roadWidth: "50 ft",
          budget: "32000000.00",
          status: "Follow-up",
          assignedStaffId: insertedEmployees[7].id,
          nextFollowUpDate: today,
        },
      ])
      .returning();

    await db.insert(leadFollowups).values([
      {
        leadId: insertedLeads[0].id,
        staffId: insertedEmployees[7].id,
        staffName: "Sadia Afrin",
        date: "2026-03-10",
        discussion: "Initial site visit completed at Bashundhara Block-D. Soil test report reviewed.",
        nextAction: "Send detailed BOQ & Quotation",
        nextFollowUpDate: "2026-03-15",
        result: "Qualified",
      },
      {
        leadId: insertedLeads[0].id,
        staffId: insertedEmployees[7].id,
        staffName: "Sadia Afrin",
        date: "2026-03-15",
        discussion: "Client accepted quotation QUO-0001 and signed construction agreement.",
        nextAction: "Convert to Client CLI-0001 and initiate Project PRJ-0001",
        nextFollowUpDate: today,
        result: "Won",
      },
      {
        leadId: insertedLeads[1].id,
        staffId: insertedEmployees[7].id,
        staffName: "Sadia Afrin",
        date: today,
        discussion: "Sent revised structural & architectural design quotation QUO-0002.",
        nextAction: "Follow up on quotation approval",
        nextFollowUpDate: today,
        result: "Quotation Sent",
      },
    ]);

    const insertedClients = await db
      .insert(clients)
      .values([
        {
          clientCode: "CLI-0001",
          leadId: insertedLeads[0].id,
          name: "Alhaj Abdul Karim",
          companyName: "Karim Properties Ltd.",
          phone: "01819-223344",
          whatsapp: "01819-223344",
          email: "karim@karimproperties.com",
          address: "Plot 14, Road 7, Bashundhara Block-D, Dhaka",
          assignedStaffId: insertedEmployees[7].id,
          totalInvoiced: "500000.00",
          totalPaid: "300000.00",
          outstandingBalance: "200000.00",
        },
        {
          clientCode: "CLI-0002",
          name: "Apex Garments & Holdings",
          companyName: "Apex Group BD",
          phone: "01711-445566",
          whatsapp: "01711-445566",
          email: "projects@apexholdings.com",
          address: "Tejgaon Industrial Area, Dhaka",
          assignedStaffId: insertedEmployees[7].id,
          totalInvoiced: "0.00",
          totalPaid: "0.00",
          outstandingBalance: "0.00",
        },
      ])
      .returning();

    // 6. PROJECTS & SITES
    const insertedProjects = await db
      .insert(projects)
      .values([
        {
          projectCode: "PRJ-0001",
          clientId: insertedClients[0].id,
          name: "INSAF Heights (G+9 Residential Tower)",
          location: "Bashundhara Block-D, Plot 14, Dhaka",
          landSize: "10 Katha",
          roadWidth: "40 ft",
          projectType: "Residential Building",
          startDate: "2026-01-15",
          expectedCompletion: "2027-06-30",
          budget: "1500000.00",
          managerId: insertedEmployees[6].id, // PM Rafiqul
          engineerId: insertedEmployees[4].id, // Engr Tanvir
          assignedStaffIds: [insertedEmployees[4].id, insertedEmployees[5].id, insertedEmployees[6].id],
          progressPercent: 62,
          status: "Active",
        },
        {
          projectCode: "PRJ-0002",
          clientId: insertedClients[1].id,
          name: "Apex Corporate Annex Building",
          location: "Tejgaon I/A, Dhaka",
          landSize: "15 Katha",
          roadWidth: "60 ft",
          projectType: "Commercial Building",
          startDate: "2026-02-10",
          expectedCompletion: "2027-12-31",
          budget: "3500000.00",
          managerId: insertedEmployees[6].id,
          engineerId: insertedEmployees[4].id,
          assignedStaffIds: [insertedEmployees[4].id, insertedEmployees[6].id],
          progressPercent: 35,
          status: "Active",
        },
      ])
      .returning();

    const insertedSites = await db
      .insert(sites)
      .values([
        {
          siteCode: "SITE-0001",
          projectId: insertedProjects[0].id,
          name: "Bashundhara Block-D Main Tower Site",
          location: "Plot 14, Road 7, Bashundhara R/A",
          siteManagerId: insertedEmployees[6].id,
          engineerId: insertedEmployees[4].id,
          workersCount: 28,
          progressPercent: 65,
          status: "Active",
          problems: "Minor crane scheduling delay resolved",
        },
        {
          siteCode: "SITE-0002",
          projectId: insertedProjects[1].id,
          name: "Tejgaon Commercial Piling & Basement Site",
          location: "Plot 88, Tejgaon I/A, Dhaka",
          siteManagerId: insertedEmployees[6].id,
          engineerId: insertedEmployees[4].id,
          workersCount: 18,
          progressPercent: 35,
          status: "Active",
          problems: "Waterlogging pump needed during night shift",
        },
      ])
      .returning();

    await db.insert(siteReports).values([
      {
        reportCode: "SR-0001",
        siteId: insertedSites[0].id,
        projectId: insertedProjects[0].id,
        reportedById: insertedEmployees[4].id,
        date: today,
        workDone: "Completed 3rd floor slab shuttering and rebar binding inspection.",
        progressPercent: 65,
        labourCount: 28,
        materialsUsedSummary: "15 Bags Crown Cement, 1.5 Ton 16mm BSRM Rod",
        siteExpenseAmount: "5000.00",
        problems: "None today",
        tomorrowPlan: "Start 3rd floor slab ready-mix concrete casting at 7:00 AM",
        photoUrls: ["https://images.unsplash.com/photo-1541888946425-d09bb18086f6?w=600"],
      },
    ]);

    // 7. QUOTATIONS
    const insertedQuotations = await db
      .insert(quotations)
      .values([
        {
          quotationNumber: "QUO-0001",
          leadId: insertedLeads[0].id,
          clientId: insertedClients[0].id,
          projectId: insertedProjects[0].id,
          service: "Phase-1 Foundation & Structural Works",
          items: [
            {
              description: "Shore Piling & Earth Excavation Works",
              unit: "LS",
              quantity: 1,
              rate: 300000,
              amount: 300000,
            },
            {
              description: "Pile Cap & Grade Beam RCC Casting",
              unit: "CFT",
              quantity: 500,
              rate: 440,
              amount: 220000,
            },
          ],
          subtotal: "520000.00",
          discount: "20000.00",
          tax: "0.00",
          totalAmount: "500000.00",
          terms: "40% mobilization advance, balance on running bill.",
          validUntil: "2026-12-31",
          status: "Accepted",
          createdBy: "Sadia Afrin",
        },
        {
          quotationNumber: "QUO-0002",
          leadId: insertedLeads[1].id,
          service: "Architectural & Structural Design Package",
          items: [
            {
              description: "3D Architectural & RAJUK Approval Plan",
              unit: "SqFt",
              quantity: 12000,
              rate: 25,
              amount: 300000,
            },
          ],
          subtotal: "300000.00",
          discount: "0.00",
          tax: "15000.00",
          totalAmount: "315000.00",
          terms: "50% upon work order, 50% upon final blueprint handover.",
          validUntil: "2026-06-30",
          status: "Sent",
          createdBy: "Sadia Afrin",
        },
      ])
      .returning();

    // 8. TASKS & DAILY WORKS
    const insertedTasks = await db
      .insert(tasks)
      .values([
        {
          taskCode: "TSK-0001",
          title: "3rd Floor Slab Rebar & Shuttering Quality Check",
          description: "Verify 16mm & 20mm BSRM lapping zones and cover blocks before casting.",
          assignedTo: insertedEmployees[4].id, // Engr Tanvir
          managerId: insertedEmployees[6].id, // PM Rafiqul
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          clientId: insertedClients[0].id,
          priority: "High",
          dueDate: today,
          status: "In Progress",
          progressPercent: 75,
          requiresReview: true,
        },
        {
          taskCode: "TSK-0002",
          title: "Verify Cement & Steel Stock Delivery at Site-0001",
          description: "Cross-check delivery challan with PO-0001 and update warehouse ledger.",
          assignedTo: insertedEmployees[5].id, // Mehedi
          managerId: insertedEmployees[6].id,
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          clientId: insertedClients[0].id,
          priority: "Critical",
          dueDate: today,
          status: "Review",
          progressPercent: 90,
          requiresReview: true,
        },
        {
          taskCode: "TSK-0003",
          title: "Prepare Basement Dewatering Layout for Tejgaon Site",
          description: "Install 2 submersible pumps and inspect shoring wall deflection.",
          assignedTo: insertedEmployees[4].id,
          managerId: insertedEmployees[6].id,
          projectId: insertedProjects[1].id,
          siteId: insertedSites[1].id,
          clientId: insertedClients[1].id,
          priority: "Medium",
          dueDate: "2026-03-01", // Overdue task for alert verification
          status: "In Progress",
          progressPercent: 45,
          requiresReview: true,
        },
      ])
      .returning();

    await db.insert(taskComments).values([
      {
        taskId: insertedTasks[0].id,
        userId: insertedUsers[6].id,
        authorName: "Engr. Tanvir Ahmed",
        comment: "Beam stirrup spacing checked and approved on North wing.",
        actionType: "ProgressUpdate",
      },
    ]);

    await db.insert(dailyWorks).values([
      {
        employeeId: insertedEmployees[4].id,
        date: today,
        arrivalTime: "09:35",
        workSummary: "Inspected 3rd floor beam reinforcement and supervised 28 workers at Site-0001.",
        taskId: insertedTasks[0].id,
        clientId: insertedClients[0].id,
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        progressPercent: 75,
        problems: "Electrical conduit pipe delivery was 1 hour late",
        pendingWork: "South balcony cantilever rebar check",
        tomorrowPlan: "Supervise ready-mix concrete pouring from 7:00 AM",
        notes: "Slump test apparatus ready at site",
      },
    ]);

    // 9. INVENTORY & EXACT CALCULATION TEST (SECTION 36)
    // MAT-0001: Opening 100 + Purchase 50 - Issue 20 - Transfer Out 10 + Transfer In 5 - Consumption 15 = 110
    const insertedMaterials = await db
      .insert(materials)
      .values([
        {
          materialCode: "MAT-0001",
          name: "Crown Cement (PCC 50kg Bag)",
          category: "Cement",
          unit: "Bag",
          warehouse: "Central Warehouse",
          openingStock: "100.00",
          purchaseReceived: "50.00",
          transferIn: "5.00",
          returnQty: "0.00",
          issueQty: "20.00",
          transferOut: "10.00",
          consumptionQty: "15.00",
          adjustmentQty: "0.00",
          currentStock: "110.00", // 100 + 50 - 20 - 10 + 5 - 15 = 110
          unitCost: "550.00",
          reorderLevel: "50.00",
        },
        {
          materialCode: "MAT-0002",
          name: "BSRM Xtreme 500W Deformed Bar (16mm)",
          category: "Steel/Rod",
          unit: "Ton",
          warehouse: "Central Warehouse",
          openingStock: "10.00",
          purchaseReceived: "5.00",
          transferIn: "0.00",
          returnQty: "0.00",
          issueQty: "2.00",
          transferOut: "0.00",
          consumptionQty: "1.00",
          adjustmentQty: "0.00",
          currentStock: "12.00",
          unitCost: "95000.00",
          reorderLevel: "5.00",
        },
        {
          materialCode: "MAT-0003",
          name: "Sylhet Coarse Sand (FM 2.5)",
          category: "Brick/Sand",
          unit: "CFT",
          warehouse: "Site-0001 Yard",
          openingStock: "500.00",
          purchaseReceived: "0.00",
          transferIn: "0.00",
          returnQty: "0.00",
          issueQty: "0.00",
          transferOut: "0.00",
          consumptionQty: "485.00",
          adjustmentQty: "0.00",
          currentStock: "15.00", // Low stock alert (<= 100)
          unitCost: "65.00",
          reorderLevel: "100.00",
        },
      ])
      .returning();

    await db.insert(stockMovements).values([
      {
        materialId: insertedMaterials[0].id,
        movementType: "Opening",
        quantity: "100.00",
        unitCost: "550.00",
        totalValue: "55000.00",
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        referenceCode: "OPEN-001",
        notes: "Initial warehouse opening stock",
        createdBy: "System",
        date: "2026-01-15",
      },
      {
        materialId: insertedMaterials[0].id,
        movementType: "Purchase",
        quantity: "50.00",
        unitCost: "550.00",
        totalValue: "27500.00",
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        referenceCode: "PO-0001",
        notes: "Received against PO-0001",
        createdBy: "Engr. Rafiqul Alam",
        date: "2026-02-01",
      },
      {
        materialId: insertedMaterials[0].id,
        movementType: "Issue",
        quantity: "20.00",
        unitCost: "550.00",
        totalValue: "11000.00",
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        referenceCode: "ISS-001",
        notes: "Issued to Site-0001 casting team",
        createdBy: "Engr. Tanvir Ahmed",
        date: "2026-02-10",
      },
      {
        materialId: insertedMaterials[0].id,
        movementType: "Transfer Out",
        quantity: "10.00",
        unitCost: "550.00",
        totalValue: "5500.00",
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        warehouseFrom: "Central Warehouse",
        warehouseTo: "Site-0002 Yard",
        referenceCode: "TRF-OUT-001",
        notes: "Transferred to Tejgaon site",
        createdBy: "Engr. Tanvir Ahmed",
        date: "2026-02-14",
      },
      {
        materialId: insertedMaterials[0].id,
        movementType: "Transfer In",
        quantity: "5.00",
        unitCost: "550.00",
        totalValue: "2750.00",
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        warehouseFrom: "Site-0002 Yard",
        warehouseTo: "Central Warehouse",
        referenceCode: "TRF-IN-001",
        notes: "Surplus returned from Tejgaon site",
        createdBy: "Engr. Tanvir Ahmed",
        date: "2026-02-18",
      },
      {
        materialId: insertedMaterials[0].id,
        movementType: "Consumption",
        quantity: "15.00",
        unitCost: "550.00",
        totalValue: "8250.00",
        projectId: insertedProjects[0].id,
        siteId: insertedSites[0].id,
        referenceCode: "CON-001",
        notes: "Consumed in 3rd floor beam & column casting",
        createdBy: "Engr. Tanvir Ahmed",
        date: today,
      },
    ]);

    // 10. SUPPLIERS & PROCUREMENT (Exact Test: Bill 300,000 - Paid 100,000 = 200,000)
    const insertedSuppliers = await db
      .insert(suppliers)
      .values([
        {
          supplierCode: "SUP-0001",
          name: "BSRM & Crown Building Materials Ltd.",
          phone: "01711-800900",
          email: "sales@bsrm-crown-supply.com",
          address: "hatkhola Road, Dhaka",
          contactPerson: "Mr. Zahirul Haque",
          productsProvided: "500W Steel Rod, PCC Cement, Binding Wire",
          totalBilled: "300000.00",
          totalPaid: "100000.00",
          outstandingPayable: "200000.00",
        },
        {
          supplierCode: "SUP-0002",
          name: "Sylhet Aggregates & Sand Traders",
          phone: "01819-334455",
          email: "info@sylhetsand.com",
          address: "Gabtoli Wharf, Dhaka",
          contactPerson: "Haji Mokbul Hossain",
          productsProvided: "Sylhet Sand, Stone Chips, 1st Class Bricks",
          totalBilled: "0.00",
          totalPaid: "0.00",
          outstandingPayable: "0.00",
        },
      ])
      .returning();

    const insertedPRs = await db
      .insert(purchaseRequests)
      .values([
        {
          prCode: "PR-0001",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          requestedById: insertedEmployees[4].id,
          items: [
            {
              materialId: insertedMaterials[0].id,
              materialName: "Crown Cement (PCC 50kg Bag)",
              quantity: 50,
              unit: "Bag",
              estimatedRate: 550,
            },
            {
              materialId: insertedMaterials[1].id,
              materialName: "BSRM Xtreme 500W Deformed Bar (16mm)",
              quantity: 2.8684,
              unit: "Ton",
              estimatedRate: 95000,
            },
          ],
          totalEstimated: "300000.00",
          status: "Converted to PO",
          approvedBy: "Mahmudul Hasan",
          notes: "Urgent requirement for 3rd floor slab casting",
          date: "2026-01-28",
        },
      ])
      .returning();

    const insertedPOs = await db
      .insert(purchaseOrders)
      .values([
        {
          poCode: "PO-0001",
          prId: insertedPRs[0].id,
          supplierId: insertedSuppliers[0].id,
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          items: [
            {
              materialId: insertedMaterials[0].id,
              materialName: "Crown Cement (PCC 50kg Bag)",
              orderedQty: 50,
              receivedQty: 50,
              unit: "Bag",
              rate: 550,
              total: 27500,
            },
            {
              materialId: insertedMaterials[1].id,
              materialName: "BSRM Xtreme 500W Deformed Bar (16mm)",
              orderedQty: 3,
              receivedQty: 3,
              unit: "Ton",
              rate: 90833.33,
              total: 272500,
            },
          ],
          totalAmount: "300000.00",
          receivedAmount: "300000.00",
          status: "Received",
          supplierQuotationRef: "SUP-Q-2026-88",
          approvedBy: "Engr. Tariqul Islam (Owner)",
          date: "2026-02-01",
        },
      ])
      .returning();

    const insertedSupplierBills = await db
      .insert(supplierBills)
      .values([
        {
          billCode: "BILL-0001",
          poId: insertedPOs[0].id,
          supplierId: insertedSuppliers[0].id,
          projectId: insertedProjects[0].id,
          totalAmount: "300000.00",
          paidAmount: "100000.00",
          outstandingAmount: "200000.00",
          status: "Partial",
          date: "2026-02-01",
          dueDate: "2026-04-30",
        },
      ])
      .returning();

    // 11. LABOUR & CONTRACTOR (Exact Test: Contractor Approved 400,000 - Paid 150,000 = Due 250,000)
    const insertedLabours = await db
      .insert(labours)
      .values([
        {
          labourCode: "LAB-0001",
          name: "Ustad Abdul Malek (Head Mason)",
          category: "Head Mason",
          dailyRate: "1200.00",
          phone: "01922-112233",
          projectId: insertedProjects[0].id,
          assignedSiteId: insertedSites[0].id,
          totalWorkDays: "25.00",
          totalEarned: "30000.00",
          totalPaid: "30000.00",
          dueAmount: "0.00",
        },
        {
          labourCode: "LAB-0002",
          name: "Rafiq Mia (Senior Bar Binder)",
          category: "Mason",
          dailyRate: "1000.00",
          phone: "01922-445566",
          projectId: insertedProjects[0].id,
          assignedSiteId: insertedSites[0].id,
          totalWorkDays: "20.00",
          totalEarned: "20000.00",
          totalPaid: "12000.00",
          dueAmount: "8000.00",
        },
      ])
      .returning();

    const insertedContractors = await db
      .insert(contractors)
      .values([
        {
          contractorCode: "CON-0001",
          name: "Padma Piling & Structural Engineering Co.",
          phone: "01715-667788",
          specialty: "Piling & RCC Structural Framing",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          workOrderRef: "WO-2026-001",
          contractAmount: "600000.00",
          approvedBillAmount: "400000.00",
          paidAmount: "150000.00",
          outstandingDue: "250000.00",
        },
      ])
      .returning();

    // 12. PROJECT COST EXPENSES (Exact Test Section 36:
    // Material 100,000 + Labour 30,000 + Contractor 20,000 + Transport 10,000 + Site Expense 5,000 = 165,000)
    const insertedExpenses = await db
      .insert(expenses)
      .values([
        {
          expenseCode: "EXP-0001",
          date: "2026-02-05",
          category: "Material",
          amount: "100000.00",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          employeeId: insertedEmployees[4].id,
          vendorName: "BSRM & Crown Building Materials Ltd.",
          paymentMethod: "Bank",
          accountId: accMap.get("1020")?.id,
          description: "Direct site material procurement & ready-mix concrete batch",
          approvalStatus: "Approved",
          approvedBy: "Kamrul Hasan",
        },
        {
          expenseCode: "EXP-0002",
          date: "2026-02-12",
          category: "Labour",
          amount: "30000.00",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          employeeId: insertedEmployees[4].id,
          vendorName: "Ustad Abdul Malek Mason Team",
          paymentMethod: "Cash",
          accountId: accMap.get("1010")?.id,
          description: "Masonry & bar binding weekly muster roll payment",
          approvalStatus: "Approved",
          approvedBy: "Kamrul Hasan",
        },
        {
          expenseCode: "EXP-0003",
          date: "2026-02-18",
          category: "Contractor",
          amount: "20000.00",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          employeeId: insertedEmployees[6].id,
          vendorName: "Padma Piling & Structural Engineering Co.",
          paymentMethod: "Bank",
          accountId: accMap.get("1020")?.id,
          description: "Formwork & shuttering contractor mobilization charge",
          approvalStatus: "Approved",
          approvedBy: "Kamrul Hasan",
        },
        {
          expenseCode: "EXP-0004",
          date: "2026-02-22",
          category: "Transport",
          amount: "10000.00",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          employeeId: insertedEmployees[5].id,
          vendorName: "Dhaka Metro Crane & Truck Logistics",
          paymentMethod: "Cash",
          accountId: accMap.get("1010")?.id,
          description: "5-Ton truck steel bar & shuttering transport to Site-0001",
          approvalStatus: "Approved",
          approvedBy: "Kamrul Hasan",
        },
        {
          expenseCode: "EXP-0005",
          date: today,
          category: "Site Expense",
          amount: "5000.00",
          projectId: insertedProjects[0].id,
          siteId: insertedSites[0].id,
          employeeId: insertedEmployees[4].id,
          vendorName: "Site Petty Cash",
          paymentMethod: "Cash",
          accountId: accMap.get("1010")?.id,
          description: "Site generator fuel, safety helmets & curing water pump expense",
          approvalStatus: "Approved",
          approvedBy: "Kamrul Hasan",
        },
      ])
      .returning();

    // 13. ACCOUNTS RECEIVABLE INVOICE (Exact Test Section 36:
    // Invoice 500,000 - Payment 200,000 = 300,000, then Payment 100,000 => Expected Outstanding = 200,000)
    const insertedInvoices = await db
      .insert(invoices)
      .values([
        {
          invoiceCode: "INV-0001",
          clientId: insertedClients[0].id,
          projectId: insertedProjects[0].id,
          quotationId: insertedQuotations[0].id,
          items: insertedQuotations[0].items,
          totalAmount: "500000.00",
          paidAmount: "300000.00",
          outstandingAmount: "200000.00",
          date: "2026-02-01",
          dueDate: "2026-04-30",
          status: "Partial",
          notes: "1st Running Bill (RA-01) for INSAF Heights Foundation & Piling",
        },
      ])
      .returning();

    // 14. PAYROLL (Exact Test Section 36:
    // Basic 30,000 + Allowance 5,000 + Overtime 2,000 - Advance 3,000 - Deduction 1,000 = Net Salary 33,000)
    const insertedPayrolls = await db
      .insert(payrolls)
      .values([
        {
          payrollCode: "PAYR-0001",
          employeeId: insertedEmployees[4].id, // Engr. Tanvir Ahmed
          salaryMonth: "2026-03",
          workingDays: 26,
          presentDays: 25,
          lateDays: 1,
          leaveDays: 1,
          overtimeHours: "10.00",
          basicSalary: "30000.00",
          allowance: "5000.00",
          overtimePay: "2000.00",
          bonus: "0.00",
          advanceDeduction: "3000.00",
          otherDeduction: "1000.00",
          taxDeduction: "0.00",
          netSalary: "33000.00",
          status: "Paid",
          approvedBy: "Farhana Yeasmin",
          paidAt: new Date(),
        },
      ])
      .returning();

    // 15. PAYMENTS (Client Receipts 200k + 100k, Supplier Payment 100k, Contractor Payment 150k, Salary Payment 33k)
    await db.insert(payments).values([
      {
        paymentCode: "PAY-0001",
        paymentType: "Client Receipt",
        amount: "200000.00",
        date: "2026-02-05",
        method: "Bank",
        accountId: accMap.get("1020")?.id,
        referenceCode: "CHQ-88901",
        clientId: insertedClients[0].id,
        invoiceId: insertedInvoices[0].id,
        projectId: insertedProjects[0].id,
        createdBy: "Kamrul Hasan",
        notes: "1st installment against INV-0001 (Remaining was 300,000)",
      },
      {
        paymentCode: "PAY-0002",
        paymentType: "Client Receipt",
        amount: "100000.00",
        date: "2026-02-20",
        method: "Bank",
        accountId: accMap.get("1020")?.id,
        referenceCode: "CHQ-88945",
        clientId: insertedClients[0].id,
        invoiceId: insertedInvoices[0].id,
        projectId: insertedProjects[0].id,
        createdBy: "Kamrul Hasan",
        notes: "2nd installment against INV-0001 (Remaining now 200,000)",
      },
      {
        paymentCode: "PAY-0003",
        paymentType: "Supplier Payment",
        amount: "100000.00",
        date: "2026-02-10",
        method: "Bank",
        accountId: accMap.get("1020")?.id,
        referenceCode: "RTGS-10023",
        supplierId: insertedSuppliers[0].id,
        supplierBillId: insertedSupplierBills[0].id,
        projectId: insertedProjects[0].id,
        createdBy: "Kamrul Hasan",
        notes: "Partial payment against BILL-0001 (300k bill - 100k paid = 200k payable)",
      },
      {
        paymentCode: "PAY-0004",
        paymentType: "Contractor Payment",
        amount: "150000.00",
        date: "2026-02-15",
        method: "Bank",
        accountId: accMap.get("1020")?.id,
        referenceCode: "BEFTN-4451",
        contractorId: insertedContractors[0].id,
        projectId: insertedProjects[0].id,
        createdBy: "Kamrul Hasan",
        notes: "Partial payment to Padma Piling (400k approved - 150k paid = 250k due)",
      },
      {
        paymentCode: "PAY-0005",
        paymentType: "Salary Payment",
        amount: "33000.00",
        date: today,
        method: "Bank",
        accountId: accMap.get("1020")?.id,
        referenceCode: "SAL-2026-03",
        employeeId: insertedEmployees[4].id,
        payrollId: insertedPayrolls[0].id,
        createdBy: "Kamrul Hasan",
        notes: "Disbursed Net Salary 33,000 for PAYR-0001",
      },
    ]);

    // 16. DOUBLE-ENTRY JOURNAL ENTRIES
    const jv1 = await db
      .insert(journalEntries)
      .values({
        voucherNo: "JV-0001",
        date: "2026-02-01",
        referenceType: "Invoice",
        referenceCode: "INV-0001",
        description: "Client Invoice INV-0001 billed to Alhaj Abdul Karim",
        totalDebit: "500000.00",
        totalCredit: "500000.00",
        createdBy: "Kamrul Hasan",
      })
      .returning();

    await db.insert(journalLines).values([
      {
        journalEntryId: jv1[0].id,
        accountId: accMap.get("1100")!.id,
        accountName: "Accounts Receivable",
        debit: "500000.00",
        credit: "0.00",
        description: "Debit AR for INV-0001",
      },
      {
        journalEntryId: jv1[0].id,
        accountId: accMap.get("4010")!.id,
        accountName: "Project Construction Revenue",
        debit: "0.00",
        credit: "500000.00",
        description: "Credit Revenue for INV-0001",
      },
    ]);

    const jv2 = await db
      .insert(journalEntries)
      .values({
        voucherNo: "JV-0002",
        date: "2026-02-20",
        referenceType: "Payment",
        referenceCode: "PAY-0001 & PAY-0002",
        description: "Client Payment received (200,000 + 100,000) against INV-0001",
        totalDebit: "300000.00",
        totalCredit: "300000.00",
        createdBy: "Kamrul Hasan",
      })
      .returning();

    await db.insert(journalLines).values([
      {
        journalEntryId: jv2[0].id,
        accountId: accMap.get("1020")!.id,
        accountName: "City Bank Corporate A/C",
        debit: "300000.00",
        credit: "0.00",
        description: "Debit Bank for Client Receipts",
      },
      {
        journalEntryId: jv2[0].id,
        accountId: accMap.get("1100")!.id,
        accountName: "Accounts Receivable",
        debit: "0.00",
        credit: "300000.00",
        description: "Credit AR for INV-0001",
      },
    ]);

    const jv3 = await db
      .insert(journalEntries)
      .values({
        voucherNo: "JV-0003",
        date: "2026-02-01",
        referenceType: "Purchase",
        referenceCode: "PO-0001 / BILL-0001",
        description: "Credit Purchase of Cement & Rod from BSRM & Crown",
        totalDebit: "300000.00",
        totalCredit: "300000.00",
        createdBy: "Kamrul Hasan",
      })
      .returning();

    await db.insert(journalLines).values([
      {
        journalEntryId: jv3[0].id,
        accountId: accMap.get("1200")!.id,
        accountName: "Construction Material Inventory",
        debit: "300000.00",
        credit: "0.00",
        description: "Debit Inventory on GRN PO-0001",
      },
      {
        journalEntryId: jv3[0].id,
        accountId: accMap.get("2010")!.id,
        accountName: "Accounts Payable (Suppliers)",
        debit: "0.00",
        credit: "300000.00",
        description: "Credit Supplier Payable BILL-0001",
      },
    ]);

    const jv4 = await db
      .insert(journalEntries)
      .values({
        voucherNo: "JV-0004",
        date: today,
        referenceType: "Payroll",
        referenceCode: "PAYR-0001",
        description: "Salary Payment to Engr. Tanvir Ahmed (PAYR-0001)",
        totalDebit: "33000.00",
        totalCredit: "33000.00",
        createdBy: "Kamrul Hasan",
      })
      .returning();

    await db.insert(journalLines).values([
      {
        journalEntryId: jv4[0].id,
        accountId: accMap.get("5020")!.id,
        accountName: "Employee Salary Expense",
        debit: "33000.00",
        credit: "0.00",
        description: "Debit Salary Expense PAYR-0001",
      },
      {
        journalEntryId: jv4[0].id,
        accountId: accMap.get("1020")!.id,
        accountName: "City Bank Corporate A/C",
        debit: "0.00",
        credit: "33000.00",
        description: "Credit Bank for Salary Disbursement",
      },
    ]);

    // 17. LEAVE REQUESTS
    await db.insert(leaveRequests).values([
      {
        leaveCode: "LV-0001",
        employeeId: insertedEmployees[7].id, // Sadia Afrin
        leaveType: "Casual",
        startDate: today,
        endDate: today,
        totalDays: 1,
        reason: "Family medical appointment in Dhaka",
        status: "Approved",
        managerApprovedBy: "Mahmudul Hasan",
        hrApprovedBy: "Farhana Yeasmin",
      },
      {
        leaveCode: "LV-0002",
        employeeId: insertedEmployees[5].id, // Mehedi Hasan
        leaveType: "Sick",
        startDate: "2026-04-20",
        endDate: "2026-04-21",
        totalDays: 2,
        reason: "Dental surgery & recovery",
        status: "Pending",
      },
    ]);

    // 18. PERFORMANCE REVIEWS
    await db.insert(performanceReviews).values([
      {
        employeeId: insertedEmployees[4].id, // Engr Tanvir
        period: "2026-03",
        attendanceScore: 22,
        taskScore: 24,
        dailyUpdateScore: 19,
        followUpScore: 15,
        projectContributionScore: 14,
        managerReviewPoints: 9,
        totalPoints: 94,
        managerComments: "Outstanding structural supervision at INSAF Heights Site-0001.",
        reviewedBy: "Engr. Rafiqul Alam",
      },
      {
        employeeId: insertedEmployees[7].id, // Sadia Afrin
        period: "2026-03",
        attendanceScore: 24,
        taskScore: 22,
        dailyUpdateScore: 18,
        followUpScore: 20,
        projectContributionScore: 12,
        managerReviewPoints: 8,
        totalPoints: 96,
        managerComments: "Converted Alhaj Abdul Karim (4.5 Cr project) and maintained 100% follow-up discipline.",
        reviewedBy: "Mahmudul Hasan",
      },
    ]);

    // 19. DOCUMENTS
    await db.insert(documents).values([
      {
        docCode: "DOC-0001",
        name: "INSAF_Heights_RAJUK_Approved_Plan.pdf",
        category: "Project",
        fileType: "PDF",
        fileSize: "2.4 MB",
        fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLUAA5AIAVj4EagplbmRzdHJlYW0KZW5kb2JqCg==",
        relatedEntityId: insertedProjects[0].id,
        relatedEntityCode: "PRJ-0001",
        uploadedBy: "Engr. Rafiqul Alam",
        minRoleRequired: "Engineer",
      },
      {
        docCode: "DOC-0002",
        name: "BSRM_Test_Certificate_PO_0001.pdf",
        category: "PO",
        fileType: "PDF",
        fileSize: "840 KB",
        fileDataUrl: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLUAA5AIAVj4EagplbmRzdHJlYW0KZW5kb2JqCg==",
        relatedEntityId: insertedPOs[0].id,
        relatedEntityCode: "PO-0001",
        uploadedBy: "Kamrul Hasan",
        minRoleRequired: "Staff",
      },
    ]);

    // 20. NOTIFICATIONS (Covering all key operational alerts)
    await db.insert(notifications).values([
      {
        targetRole: "All",
        type: "Missing Checkout",
        title: "Missing Checkout Alert: Mehedi Hasan",
        message: "EMP-0006 (Mehedi Hasan) checked in at 08:50 AM at Site-0001 and has not checked out yet.",
        relatedUrl: "/attendance",
        relatedEntityCode: "EMP-0006",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Late Attendance",
        title: "Late Check-in: Engr. Tanvir Ahmed",
        message: "EMP-0005 checked in at 09:35 AM (35 mins late) due to Mirpur traffic.",
        relatedUrl: "/attendance",
        relatedEntityCode: "EMP-0005",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Low Stock",
        title: "Low Stock Alert: Sylhet Coarse Sand",
        message: "MAT-0003 stock at Site-0001 Yard is 15 CFT (below reorder level of 100 CFT).",
        relatedUrl: "/inventory",
        relatedEntityCode: "MAT-0003",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Task Overdue",
        title: "Overdue Task: TSK-0003 Basement Dewatering",
        message: "Task TSK-0003 at Tejgaon Site-0002 is overdue and at 45% progress.",
        relatedUrl: `/tasks/${insertedTasks[2].id}`,
        relatedEntityCode: "TSK-0003",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Task Review",
        title: "Task Ready for Review: TSK-0002",
        message: "Mehedi Hasan submitted TSK-0002 (Cement & Steel Stock Verification) for manager approval.",
        relatedUrl: `/tasks/${insertedTasks[1].id}`,
        relatedEntityCode: "TSK-0002",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Follow-up Due",
        title: "CRM Follow-up Due Today: LEAD-0002 & LEAD-0003",
        message: "Dr. Shafiqur Rahman (QUO-0002) and Syed Monirul Islam are scheduled for follow-up today.",
        relatedUrl: "/leads",
        relatedEntityCode: "LEAD-0002",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Leave Request",
        title: "Pending Leave Request: LV-0002",
        message: "Mehedi Hasan applied for 2 days Sick Leave (2026-04-20 to 2026-04-21).",
        relatedUrl: "/leave",
        relatedEntityCode: "LV-0002",
        isRead: false,
      },
      {
        targetRole: "All",
        type: "Payment Due",
        title: "Supplier Payable Outstanding: ৳200,000",
        message: "BILL-0001 from BSRM & Crown Building Materials has ৳200,000 balance due.",
        relatedUrl: "/suppliers",
        relatedEntityCode: "BILL-0001",
        isRead: false,
      },
    ]);

    // 21. AUDIT LOGS
    await db.insert(auditLogs).values([
      {
        userId: insertedUsers[0].id,
        userName: "Engr. Tariqul Islam (Owner)",
        userRole: "Owner",
        action: "APPROVE",
        entity: "PurchaseOrder",
        recordId: "PO-0001",
        beforeData: { status: "Draft" },
        afterData: { status: "Received", totalAmount: "300000.00" },
      },
      {
        userId: insertedUsers[3].id,
        userName: "Kamrul Hasan (Chief Accountant)",
        userRole: "Accounts",
        action: "PAYMENT",
        entity: "Invoice",
        recordId: "INV-0001",
        beforeData: { paidAmount: "200000.00", outstandingAmount: "300000.00" },
        afterData: { paidAmount: "300000.00", outstandingAmount: "200000.00" },
      },
      {
        userId: insertedUsers[3].id,
        userName: "Kamrul Hasan (Chief Accountant)",
        userRole: "Accounts",
        action: "PAYROLL_DISBURSE",
        entity: "Payroll",
        recordId: "PAYR-0001",
        beforeData: { status: "Approved" },
        afterData: { status: "Paid", netSalary: "33000.00" },
      },
    ]);

    // Unused variable guard
    void insertedLabours;
    void insertedExpenses;

    await ensureEnhancementsSeeded();
  } catch (err) {
    console.error("Seed initialization error:", err);
  }
}
