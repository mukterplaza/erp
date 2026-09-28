import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  sessions,
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
  announcements,
} from "@/db";
import {
  COMPANY_IBDC,
  COMPANY_IREL,
  IBDC_SERVICE_TYPES,
  IREL_PROPERTY_TYPES,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  LEAD_CLOSED_STATUSES,
  FOLLOWUP_METHODS,
  FOLLOWUP_OUTCOMES,
  OUTCOME_TO_STATUS,
  daysBetween,
} from "@/lib/crm-constants";
import { eq, desc } from "drizzle-orm";
import {
  getCurrentUser,
  hasPermission,
  hashPassword,
  ROLE_DEFAULT_PERMISSIONS,
  canViewAllEmployeeProfiles,
  isSuperAdminRole,
  isChairman,
  isManagementRole,
  canCreateAnnouncements,
  canAccessMarketingLeads,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import {
  logAudit,
  createNotification,
  calculateAttendanceMetrics,
  calculateWorkPlanProgress,
  recordStockMovementTx,
  postDoubleEntryJournalTx,
  computeExactMaterialStock,
} from "@/lib/erp-engine";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const section = req.nextUrl.searchParams.get("section") || "all";
  const requestedEmpId = req.nextUrl.searchParams.get("employeeId");
  const canSeeAllEmployees = canViewAllEmployeeProfiles(currentUser.role);
  const isManagement = isManagementRole(currentUser.role);

  // Security Test 1 & 2: Staff cannot view other employees' profiles/attendance/etc.
  if (
    requestedEmpId &&
    !canSeeAllEmployees &&
    Number(requestedEmpId) !== currentUser.employeeId
  ) {
    return NextResponse.json(
      {
        error:
          "403 Forbidden: অন্য কর্মকর্তার ব্যক্তিগত প্রোফাইল বা ডাটা দেখার অনুমতি আপনার নেই।",
      },
      { status: 403 }
    );
  }

  // Security Test 3 & 4: Staff cannot access Leads through query parameters or direct API
  const requestedCompanyId = req.nextUrl.searchParams.get("companyId");
  const requestedLeadId = req.nextUrl.searchParams.get("leadId");
  if (requestedCompanyId || requestedLeadId) {
    const compCode = requestedCompanyId === "2" ? "IREL" : "IBDC";
    if (!canAccessMarketingLeads(currentUser, compCode)) {
      return NextResponse.json(
        {
          error:
            "403 Forbidden: লিড বা গ্রাহক ডাটাবেজ অ্যাক্সেস করার অনুমতি আপনার নেই।",
        },
        { status: 403 }
      );
    }
  }

  const [
    allUsers,
    allEmployees,
    allAttendances,
    allCorrections,
    allLeads,
    allFollowups,
    allClients,
    allProjects,
    allSites,
    allSiteReports,
    allQuotations,
    allTasks,
    allTaskComments,
    allDailyWorks,
    allMaterials,
    allStockMovements,
    allSuppliers,
    allPRs,
    allPOs,
    allSupplierBills,
    allLabours,
    allContractors,
    allExpenses,
    allAccounts,
    allJournals,
    allJournalLines,
    allInvoices,
    allPayments,
    allPayrolls,
    allLeaves,
    allPerformance,
    allDocuments,
    allNotifications,
    allAuditLogs,
    allDailyWorkPlans,
    allReminderSettings,
    allCompanies,
    allAnnouncements,
  ] = await Promise.all([
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      permissions: users.permissions,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.id),
    db.select().from(employees).orderBy(employees.id),
    db.select().from(attendances).orderBy(desc(attendances.date), desc(attendances.id)),
    db.select().from(attendanceCorrections).orderBy(desc(attendanceCorrections.id)),
    db.select().from(leads).orderBy(desc(leads.id)),
    db.select().from(leadFollowups).orderBy(desc(leadFollowups.id)),
    db.select().from(clients).orderBy(desc(clients.id)),
    db.select().from(projects).orderBy(projects.id),
    db.select().from(sites).orderBy(sites.id),
    db.select().from(siteReports).orderBy(desc(siteReports.id)),
    db.select().from(quotations).orderBy(desc(quotations.id)),
    db.select().from(tasks).orderBy(desc(tasks.id)),
    db.select().from(taskComments).orderBy(desc(taskComments.id)),
    db.select().from(dailyWorks).orderBy(desc(dailyWorks.date), desc(dailyWorks.id)),
    db.select().from(materials).orderBy(materials.id),
    db.select().from(stockMovements).orderBy(desc(stockMovements.id)),
    db.select().from(suppliers).orderBy(suppliers.id),
    db.select().from(purchaseRequests).orderBy(desc(purchaseRequests.id)),
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.id)),
    db.select().from(supplierBills).orderBy(desc(supplierBills.id)),
    db.select().from(labours).orderBy(labours.id),
    db.select().from(contractors).orderBy(contractors.id),
    db.select().from(expenses).orderBy(desc(expenses.id)),
    db.select().from(accounts).orderBy(accounts.code),
    db.select().from(journalEntries).orderBy(desc(journalEntries.id)),
    db.select().from(journalLines).orderBy(journalLines.id),
    db.select().from(invoices).orderBy(desc(invoices.id)),
    db.select().from(payments).orderBy(desc(payments.id)),
    db.select().from(payrolls).orderBy(desc(payrolls.id)),
    db.select().from(leaveRequests).orderBy(desc(leaveRequests.id)),
    db.select().from(performanceReviews).orderBy(desc(performanceReviews.id)),
    db.select().from(documents).orderBy(desc(documents.id)),
    db.select().from(notifications).orderBy(desc(notifications.id)),
    db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(150),
    db.select().from(dailyWorkPlans).orderBy(desc(dailyWorkPlans.date), desc(dailyWorkPlans.id)),
    db.select().from(reminderSettings).orderBy(reminderSettings.id),
    db.select().from(companies).orderBy(companies.id),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
  ]);

  // GRANULAR SERVER-SIDE DATA SCOPING & STAFF PRIVACY ENFORCEMENT
  const isFullAccess = isManagement;
  const isHR = currentUser.role === "HR";
  const isAccounts = currentUser.role === "Accounts";
  const isPM = currentUser.role === "Project Manager";
  const isStaffOnly =
    currentUser.role === "Staff" ||
    currentUser.role === "Site Staff" ||
    currentUser.role === "Engineer" ||
    currentUser.role === "Marketing" ||
    currentUser.role === "Sales";

  const myEmpId = currentUser.employeeId;

  const scopedAttendances =
    isFullAccess || isHR
      ? allAttendances
      : allAttendances.filter((a) => a.employeeId === myEmpId);

  const scopedDailyWorks =
    isFullAccess || isHR
      ? allDailyWorks
      : allDailyWorks.filter((d) => d.employeeId === myEmpId);

  const scopedDailyWorkPlans =
    isFullAccess || isHR
      ? allDailyWorkPlans
      : allDailyWorkPlans.filter((p) => p.employeeId === myEmpId);

  // Task Visibility Scoping (Part 13):
  // 1. Everyone / isCompanyWide -> visible to all
  // 2. Assigned Staff -> assigned staff + manager + management
  // 3. Management Only -> only Owner, Chairman, Manager, Admin
  const scopedTasks = allTasks.filter((t) => {
    if (t.visibility === "Management Only") {
      return isManagement;
    }
    if (t.visibility === "Everyone" || t.isCompanyWide) {
      return true;
    }
    if (isManagement || isPM) return true;
    return t.assignedTo === myEmpId || t.managerId === myEmpId;
  });

  const scopedProjects =
    isFullAccess || isAccounts || isHR || currentUser.role === "Sales"
      ? allProjects
      : allProjects.filter(
          (p) =>
            p.managerId === myEmpId ||
            p.engineerId === myEmpId ||
            (p.assignedStaffIds || []).includes(myEmpId || -1)
        );

  const scopedProjectIds = new Set(scopedProjects.map((p) => p.id));

  const scopedSites =
    isFullAccess || isAccounts || isHR
      ? allSites
      : allSites.filter(
          (s) =>
            scopedProjectIds.has(s.projectId) ||
            s.siteManagerId === myEmpId ||
            s.engineerId === myEmpId
        );

  const scopedPayrolls =
    isFullAccess || isHR || isAccounts
      ? allPayrolls
      : allPayrolls.filter((p) => p.employeeId === myEmpId);

  const scopedLeaves =
    isFullAccess || isHR
      ? allLeaves
      : allLeaves.filter((l) => l.employeeId === myEmpId);

  const scopedPerformance =
    isFullAccess || isHR
      ? allPerformance
      : allPerformance.filter((p) => p.employeeId === myEmpId);

  const scopedDocuments = allDocuments.filter((doc) => {
    if (isFullAccess || isHR) return true;
    if (doc.category === "Employee") {
      return (
        doc.relatedEntityId === myEmpId ||
        doc.relatedEntityCode === currentUser.empCode
      );
    }
    if (isStaffOnly && doc.minRoleRequired === "Accounts") return false;
    return true;
  });

  const scopedDirectory =
    isFullAccess || isHR || isPM || isAccounts
      ? allEmployees.map((e) => ({
          id: e.id,
          empCode: e.empCode,
          name: e.name,
          department: e.department,
          designation: e.designation,
        }))
      : allEmployees
          .filter((e) => e.id === myEmpId)
          .map((e) => ({
            id: e.id,
            empCode: e.empCode,
            name: e.name,
            department: e.department,
            designation: e.designation,
          }));

  // Enrich Projects with Real Dynamic Calculations (Budget vs Actual Cost vs Revenue vs Profit/Loss)
  const enrichedProjects = scopedProjects.map((proj) => {
    const projExpenses = allExpenses.filter(
      (e) =>
        e.projectId === proj.id &&
        e.approvalStatus === "Approved"
    );
    const actualCost = projExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
    const materialCost = projExpenses
      .filter((e) => e.category === "Material")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const labourCost = projExpenses
      .filter((e) => e.category === "Labour")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const contractorCost = projExpenses
      .filter((e) => e.category === "Contractor")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const transportCost = projExpenses
      .filter((e) => e.category === "Transport")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const siteExpenseCost = projExpenses
      .filter((e) => e.category === "Site Expense")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const projInvoices = allInvoices.filter(
      (inv) => inv.projectId === proj.id && inv.status !== "Void"
    );
    const totalRevenue = projInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount || 0),
      0
    );
    const collectedRevenue = projInvoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount || 0),
      0
    );
    const profitLoss = totalRevenue - actualCost;

    return {
      ...proj,
      actualCost: Number(actualCost.toFixed(2)),
      materialCost: Number(materialCost.toFixed(2)),
      labourCost: Number(labourCost.toFixed(2)),
      contractorCost: Number(contractorCost.toFixed(2)),
      transportCost: Number(transportCost.toFixed(2)),
      siteExpenseCost: Number(siteExpenseCost.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      collectedRevenue: Number(collectedRevenue.toFixed(2)),
      profitLoss: Number(profitLoss.toFixed(2)),
    };
  });

  // ---------------------------------------------------------------------------
  // CRM FOLLOW-UP ENRICHMENT (Today / Overdue / Upcoming / Never Followed Up)
  // ---------------------------------------------------------------------------
  const crmToday = new Date().toISOString().split("T")[0];
  const followupsByLead = new Map<number, typeof allFollowups>();
  for (const f of allFollowups) {
    const arr = followupsByLead.get(f.leadId) || [];
    arr.push(f);
    followupsByLead.set(f.leadId, arr);
  }

  const enrichedLeads = allLeads.map((l) => {
    const history = (followupsByLead.get(l.id) || []).slice().sort((a, b) => {
      if (a.date === b.date) return a.followupNumber - b.followupNumber;
      return a.date < b.date ? -1 : 1;
    });
    const lastFollowup = history[history.length - 1] || null;
    const lastContactDate = l.lastContactDate || lastFollowup?.date || null;
    const followUpCount = history.length;
    const isClosed = LEAD_CLOSED_STATUSES.includes(l.status);

    const daysSinceLastContact = lastContactDate
      ? daysBetween(lastContactDate, crmToday)
      : null;

    let followUpBucket: "Overdue" | "Today" | "Upcoming" | "Unscheduled" | "Closed" =
      "Unscheduled";
    let daysOverdue = 0;
    let daysUntil = 0;

    if (isClosed) {
      followUpBucket = "Closed";
    } else if (l.nextFollowUpDate) {
      if (l.nextFollowUpDate < crmToday) {
        followUpBucket = "Overdue";
        daysOverdue = daysBetween(l.nextFollowUpDate, crmToday);
      } else if (l.nextFollowUpDate === crmToday) {
        followUpBucket = "Today";
      } else {
        followUpBucket = "Upcoming";
        daysUntil = daysBetween(crmToday, l.nextFollowUpDate);
      }
    }

    return {
      ...l,
      followUpCount,
      lastContactDate,
      lastOutcome: l.lastOutcome || lastFollowup?.outcome || "",
      lastMethod: lastFollowup?.method || "",
      daysSinceLastContact,
      followUpBucket,
      daysOverdue,
      daysUntil,
      isOverdue: followUpBucket === "Overdue",
      isDueToday: followUpBucket === "Today",
      neverFollowedUp: followUpCount === 0,
      awaitingClientResponse:
        lastFollowup?.outcome === "No Response" ||
        lastFollowup?.outcome === "Call Back Later",
    };
  });

  const followUpsCompletedToday = allFollowups.filter(
    (f) => f.date === crmToday
  ).length;

  const crmFollowUpStats = {
    today: crmToday,
    dueToday: enrichedLeads.filter((l) => l.isDueToday).length,
    overdue: enrichedLeads.filter((l) => l.isOverdue).length,
    upcoming: enrichedLeads.filter((l) => l.followUpBucket === "Upcoming").length,
    upcomingTomorrow: enrichedLeads.filter((l) => l.daysUntil === 1).length,
    upcoming3Days: enrichedLeads.filter(
      (l) => l.daysUntil >= 1 && l.daysUntil <= 3
    ).length,
    upcoming7Days: enrichedLeads.filter(
      (l) => l.daysUntil >= 1 && l.daysUntil <= 7
    ).length,
    completedToday: followUpsCompletedToday,
    withoutNextFollowUp: enrichedLeads.filter(
      (l) => l.followUpBucket === "Unscheduled"
    ).length,
    neverFollowedUp: enrichedLeads.filter((l) => l.neverFollowedUp).length,
    noResponse: enrichedLeads.filter((l) => l.lastOutcome === "No Response").length,
    awaitingResponse: enrichedLeads.filter((l) => l.awaitingClientResponse).length,
    multipleFollowUps: enrichedLeads.filter((l) => l.followUpCount > 1).length,
    activeLeads: enrichedLeads.filter(
      (l) => !LEAD_CLOSED_STATUSES.includes(l.status)
    ).length,
  };

  // Per-staff follow-up performance (Management View)
  const staffFollowUpStats = allEmployees.map((emp) => {
    const myLeads = enrichedLeads.filter((l) => l.assignedStaffId === emp.id);
    return {
      employeeId: emp.id,
      empCode: emp.empCode,
      name: emp.name,
      activeLeads: myLeads.filter(
        (l) => !LEAD_CLOSED_STATUSES.includes(l.status)
      ).length,
      followUpsToday: allFollowups.filter(
        (f) => f.staffId === emp.id && f.date === crmToday
      ).length,
      followUpsCompleted: allFollowups.filter((f) => f.staffId === emp.id).length,
      overdueFollowUps: myLeads.filter((l) => l.isOverdue).length,
    };
  }).filter((s) => s.activeLeads > 0 || s.followUpsCompleted > 0);

  // Enrich Materials with verified Stock Formula & Valuation
  const enrichedMaterials = allMaterials.map((m) => {
    const calculatedStock = computeExactMaterialStock(m);
    const stockValuation = Number((calculatedStock * Number(m.unitCost || 0)).toFixed(2));
    return {
      ...m,
      currentStock: calculatedStock.toFixed(2),
      stockValuation,
      isLowStock: calculatedStock <= Number(m.reorderLevel),
    };
  });

  void section;

  return NextResponse.json({
    currentUser,
    users: isSuperAdminRole(currentUser.role) || isFullAccess ? allUsers : [],
    employees:
      isFullAccess || isHR
        ? allEmployees
        : allEmployees.filter((e) => e.id === myEmpId),
    allEmployeesDirectory: scopedDirectory,
    attendances: scopedAttendances,
    attendanceCorrections:
      isFullAccess || isHR
        ? allCorrections
        : allCorrections.filter((c) => c.employeeId === myEmpId),
    companies: allCompanies,
    announcements: allAnnouncements,
    leads: isManagement
      ? enrichedLeads
      : currentUser.role === "Marketing" || currentUser.role === "Sales"
      ? currentUser.marketingScope === "IBDC"
        ? enrichedLeads.filter((l) => l.companyId === 1)
        : currentUser.marketingScope === "IREL"
        ? enrichedLeads.filter((l) => l.companyId === 2)
        : []
      : [],
    leadFollowups: isManagement
      ? allFollowups
      : currentUser.role === "Marketing" || currentUser.role === "Sales"
      ? allFollowups.filter((f) => {
          const l = enrichedLeads.find((lead) => lead.id === f.leadId);
          if (!l) return false;
          if (currentUser.marketingScope === "IBDC") return l.companyId === 1;
          if (currentUser.marketingScope === "IREL") return l.companyId === 2;
          return false;
        })
      : [],
    crmFollowUpStats: isManagement || currentUser.role === "Marketing" || currentUser.role === "Sales" ? crmFollowUpStats : null,
    staffFollowUpStats: isManagement ? staffFollowUpStats : [],
    clients: isManagement || currentUser.role === "Marketing" || currentUser.role === "Sales" ? allClients : [],
    projects: enrichedProjects,
    sites: scopedSites,
    siteReports: allSiteReports,
    quotations: isManagement || currentUser.role === "Marketing" || currentUser.role === "Sales" ? allQuotations : [],
    tasks: scopedTasks,
    taskComments: allTaskComments,
    dailyWorks: scopedDailyWorks,
    dailyWorkPlans: scopedDailyWorkPlans,
    materials: enrichedMaterials,
    stockMovements: allStockMovements,
    suppliers: isStaffOnly ? [] : allSuppliers,
    purchaseRequests: allPRs,
    purchaseOrders: isStaffOnly ? [] : allPOs,
    supplierBills: isStaffOnly ? [] : allSupplierBills,
    labours: allLabours,
    contractors: isStaffOnly ? [] : allContractors,
    expenses: isStaffOnly ? allExpenses.filter((e) => e.employeeId === myEmpId) : allExpenses,
    accounts: isFullAccess || isAccounts ? allAccounts : [],
    journalEntries: isFullAccess || isAccounts ? allJournals : [],
    journalLines: isFullAccess || isAccounts ? allJournalLines : [],
    invoices: isStaffOnly ? [] : allInvoices,
    payments: isStaffOnly ? [] : allPayments,
    payrolls: scopedPayrolls,
    leaveRequests: scopedLeaves,
    performanceReviews: scopedPerformance,
    documents: scopedDocuments,
    // Notifications are scoped per-user:
    // - GLOBAL announcements (user_id IS NULL) are visible to every authenticated user
    // - Private notifications (user_id = currentUser.id) are visible only to that user
    notifications: allNotifications.filter((n: any) => {
      const myUserId = currentUser?.id;
      if (!myUserId) return false;
      // GLOBAL: no specific user_id means visible to all (announcements)
      if (n.user_id == null) return true;
      // Private: only for me
      return n.user_id === myUserId;
    }),
    reminderSettings: allReminderSettings[0] || {
      lateCheckInAfter: "09:30",
      workPlanReminderTime: "10:00",
      dailySummaryReminderTime: "18:30",
      enableOverdueTaskReminder: true,
      enablePendingTaskReminder: true,
    },
    auditLogs: isFullAccess || isAccounts || isHR ? allAuditLogs : [],
  });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const today = new Date().toISOString().split("T")[0];

    // =========================================================================
    // SECURITY RULE: FINANCIAL RECORDS CANNOT BE HARD-DELETED
    // =========================================================================
    if (action === "deleteFinancialRecord") {
      return NextResponse.json(
        {
          error:
            "SECURITY BLOCK: Financial records (Invoices, Payments, Journals, Bills, Payrolls) cannot be hard-deleted. Use the Void/Reverse mechanism.",
        },
        { status: 403 }
      );
    }

    // =========================================================================
    // 1. USER & PERMISSION MANAGEMENT
    // =========================================================================
    if (action === "createUser") {
      if (currentUser.role !== "Owner" && currentUser.role !== "Admin") {
        return NextResponse.json({ error: "Forbidden: Owner/Admin access required" }, { status: 403 });
      }
      const { name, email, password, role } = body;
      if (!name || !email || !password || !role) {
        return NextResponse.json({ error: "All user fields are required" }, { status: 400 });
      }
      const perms = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS["Staff"];
      const [created] = await db
        .insert(users)
        .values({
          name,
          email: String(email).toLowerCase().trim(),
          passwordHash: hashPassword(password),
          role,
          permissions: perms,
          status: "Active",
        })
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "User",
        recordId: String(created.id),
        afterData: { name, email, role },
      });
      return NextResponse.json({ success: true, user: created });
    }

    if (action === "updateUserStatusAndRole") {
      if (!isSuperAdminRole(currentUser.role) && !isChairman(currentUser.role)) {
        return NextResponse.json(
          { error: "403 Forbidden: ব্যবহারকারী ও পদবী পরিবর্তনের অনুমতি শুধুমাত্র প্রতিষ্ঠাতা ও চেয়ারম্যানের রয়েছে।" },
          { status: 403 }
        );
      }
      const { userId, status, role, permissions } = body;
      const [beforeUser] = await db.select().from(users).where(eq(users.id, Number(userId)));
      if (!beforeUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const newRole = role || beforeUser.role;
      const newPerms = Array.isArray(permissions)
        ? permissions
        : ROLE_DEFAULT_PERMISSIONS[newRole] || beforeUser.permissions;

      await db
        .update(users)
        .set({
          status: status || beforeUser.status,
          role: newRole,
          permissions: newPerms,
        })
        .where(eq(users.id, Number(userId)));

      // If user is made Inactive, immediately revoke all active sessions
      if (status === "Inactive") {
        await db.delete(sessions).where(eq(sessions.userId, Number(userId)));
      }

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "PERMISSION_CHANGE",
        entity: "User",
        recordId: String(userId),
        beforeData: { status: beforeUser.status, role: beforeUser.role, permissions: beforeUser.permissions },
        afterData: { status, role: newRole, permissions: newPerms },
      });

      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // 2. EMPLOYEE / HR MODULE
    // =========================================================================
    if (action === "createEmployee") {
      if (!hasPermission(currentUser, "employees.manage")) {
        return NextResponse.json({ error: "Forbidden: HR/Admin permission required" }, { status: 403 });
      }
      const {
        name,
        department,
        designation,
        joiningDate,
        basicSalary,
        allowance,
        phone,
        email,
        address,
        emergencyContact,
        bankName,
        bankAccountNo,
        paymentMethod,
        role,
      } = body;

      if (!name || !department || !designation || !phone || !email) {
        return NextResponse.json({ error: "Required employee fields missing" }, { status: 400 });
      }
      if (Number(basicSalary) < 0 || Number(allowance || 0) < 0) {
        return NextResponse.json({ error: "Salary/Allowance cannot be negative" }, { status: 400 });
      }

      const existingEmps = await db.select().from(employees);
      const nextCode = `EMP-${String(existingEmps.length + 1).padStart(4, "0")}`;

      // Also create a linked user account if email doesn't exist
      let linkedUserId: number | null = null;
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, String(email).toLowerCase().trim()));
      if (existingUser.length > 0) {
        linkedUserId = existingUser[0].id;
      } else {
        const assignedRole = role || "Staff";
        const [newUser] = await db
          .insert(users)
          .values({
            name,
            email: String(email).toLowerCase().trim(),
            passwordHash: hashPassword("insaf123"),
            role: assignedRole,
            permissions: ROLE_DEFAULT_PERMISSIONS[assignedRole] || ROLE_DEFAULT_PERMISSIONS["Staff"],
            status: "Active",
          })
          .returning();
        linkedUserId = newUser.id;
      }

      const [emp] = await db
        .insert(employees)
        .values({
          empCode: nextCode,
          userId: linkedUserId,
          name,
          department,
          designation,
          joiningDate: joiningDate || today,
          basicSalary: Number(basicSalary || 0).toFixed(2),
          allowance: Number(allowance || 0).toFixed(2),
          phone,
          email: String(email).toLowerCase().trim(),
          address: address || "",
          emergencyContact: emergencyContact || "",
          bankName: bankName || "",
          bankAccountNo: bankAccountNo || "",
          paymentMethod: paymentMethod || "Bank",
          employmentStatus: "Active",
        })
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "Employee",
        recordId: emp.empCode,
        afterData: emp,
      });

      return NextResponse.json({ success: true, employee: emp });
    }

    // =========================================================================
    // 3. ATTENDANCE & CORRECTION WORKFLOW (Auto-Approved on IN/OUT)
    // =========================================================================
    if (action === "checkIn") {
      const canManageOthers = canViewAllEmployeeProfiles(currentUser.role);
      if (
        !canManageOthers &&
        body.employeeId &&
        Number(body.employeeId) !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "Forbidden: Staff can only record their own IN TIME." },
          { status: 403 }
        );
      }

      const employeeId = Number(body.employeeId || currentUser.employeeId);
      if (!employeeId) {
        return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
      }
      const checkInTime =
        body.checkIn ||
        new Date().toTimeString().slice(0, 5);
      const date = body.date || today;

      const metrics = calculateAttendanceMetrics(checkInTime, null);

      const [att] = await db
        .insert(attendances)
        .values({
          employeeId,
          date,
          checkIn: checkInTime,
          checkOut: null,
          status: metrics.status,
          lateMinutes: metrics.lateMinutes,
          earlyLeaveMinutes: 0,
          morningHours: "0.00",
          afternoonHours: "0.00",
          workingHours: "0.00",
          overtimeHours: "0.00",
          isApproved: true, // Auto-approved immediately!
          notes: body.notes || "Auto-approved Check-In",
        })
        .returning();

      if (metrics.lateMinutes > 0) {
        await createNotification({
          targetRole: "Manager",
          type: "Attendance Correction",
          title: `Late IN TIME (${metrics.lateMinutes}m after 9:30 AM)`,
          message: `${currentUser.name} checked in at ${checkInTime} on ${date}.`,
          createdBy: currentUser.name,
          relatedUrl: "/attendance",
          relatedEntityCode: `EMP-${String(employeeId).padStart(4, "0")}`,
        });
      }

      return NextResponse.json({ success: true, attendance: att });
    }

    if (action === "checkOut") {
      const attendanceId = Number(body.attendanceId);
      const checkOutTime =
        body.checkOut ||
        new Date().toTimeString().slice(0, 5);

      const [existing] = await db
        .select()
        .from(attendances)
        .where(eq(attendances.id, attendanceId));

      if (!existing) {
        return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
      }

      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        existing.employeeId !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "Forbidden: Staff can only record their own OUT TIME." },
          { status: 403 }
        );
      }

      const metrics = calculateAttendanceMetrics(existing.checkIn, checkOutTime);

      const [updated] = await db
        .update(attendances)
        .set({
          checkOut: checkOutTime,
          status: metrics.status,
          lateMinutes: metrics.lateMinutes,
          earlyLeaveMinutes: metrics.earlyLeaveMinutes,
          morningHours: metrics.morningHours,
          afternoonHours: metrics.afternoonHours,
          workingHours: metrics.workingHours,
          overtimeHours: metrics.overtimeHours,
          isApproved: true, // Auto-approved
        })
        .where(eq(attendances.id, attendanceId))
        .returning();

      return NextResponse.json({ success: true, attendance: updated });
    }

    if (action === "editApprovedAttendance") {
      // Staff CANNOT directly edit approved attendance!
      if (
        currentUser.role !== "Owner" &&
        currentUser.role !== "Admin" &&
        currentUser.role !== "HR" &&
        currentUser.role !== "Manager"
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Staff cannot directly edit approved attendance. Please submit an Attendance Correction Request.",
          },
          { status: 403 }
        );
      }
      const { attendanceId, checkIn, checkOut, status } = body;
      const metrics = calculateAttendanceMetrics(checkIn, checkOut, status);
      const [updated] = await db
        .update(attendances)
        .set({
          checkIn,
          checkOut,
          status: metrics.status,
          lateMinutes: metrics.lateMinutes,
          earlyLeaveMinutes: metrics.earlyLeaveMinutes,
          workingHours: metrics.workingHours,
          overtimeHours: metrics.overtimeHours,
        })
        .where(eq(attendances.id, Number(attendanceId)))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE",
        entity: "Attendance",
        recordId: String(attendanceId),
        afterData: updated,
      });
      return NextResponse.json({ success: true, attendance: updated });
    }

    if (action === "requestAttendanceCorrection") {
      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        body.employeeId &&
        Number(body.employeeId) !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "403 Forbidden: অন্য কর্মকর্তার উপস্থিতি সংশোধনের আবেদন করা সম্পূর্ণ নিষিদ্ধ।" },
          { status: 403 }
        );
      }
      const employeeId = Number(currentUser.employeeId || body.employeeId || 1);
      const { attendanceId, date, requestedCheckIn, requestedCheckOut, reason } = body;
      if (!date || !requestedCheckIn || !requestedCheckOut || !reason) {
        return NextResponse.json({ error: "All correction fields are required" }, { status: 400 });
      }

      const [corr] = await db
        .insert(attendanceCorrections)
        .values({
          attendanceId: attendanceId ? Number(attendanceId) : null,
          employeeId,
          date,
          requestedCheckIn,
          requestedCheckOut,
          reason,
          status: "Pending",
        })
        .returning();

      await createNotification({
        targetRole: "HR",
        type: "Attendance Correction",
        title: `Attendance Correction Request from ${currentUser.name}`,
        message: `Date: ${date} (${requestedCheckIn} - ${requestedCheckOut}). Reason: ${reason}`,
        relatedUrl: "/attendance",
        relatedEntityCode: `CORR-${corr.id}`,
      });

      return NextResponse.json({ success: true, correction: corr });
    }

    if (action === "approveAttendanceCorrection") {
      if (!hasPermission(currentUser, "attendance.approve")) {
        return NextResponse.json({ error: "Forbidden: Manager/HR approval required" }, { status: 403 });
      }
      const { correctionId, decision } = body; // Approved or Rejected
      const [corr] = await db
        .select()
        .from(attendanceCorrections)
        .where(eq(attendanceCorrections.id, Number(correctionId)));

      if (!corr) {
        return NextResponse.json({ error: "Correction request not found" }, { status: 404 });
      }

      await db
        .update(attendanceCorrections)
        .set({
          status: decision,
          approvedBy: currentUser.name,
          approvedAt: new Date(),
        })
        .where(eq(attendanceCorrections.id, corr.id));

      if (decision === "Approved") {
        const metrics = calculateAttendanceMetrics(
          corr.requestedCheckIn,
          corr.requestedCheckOut
        );

        if (corr.attendanceId) {
          await db
            .update(attendances)
            .set({
              checkIn: corr.requestedCheckIn,
              checkOut: corr.requestedCheckOut,
              status: metrics.status,
              lateMinutes: metrics.lateMinutes,
              earlyLeaveMinutes: metrics.earlyLeaveMinutes,
              workingHours: metrics.workingHours,
              overtimeHours: metrics.overtimeHours,
              notes: `Corrected via request #${corr.id}`,
            })
            .where(eq(attendances.id, corr.attendanceId));
        } else {
          await db.insert(attendances).values({
            employeeId: corr.employeeId,
            date: corr.date,
            checkIn: corr.requestedCheckIn,
            checkOut: corr.requestedCheckOut,
            status: metrics.status,
            lateMinutes: metrics.lateMinutes,
            earlyLeaveMinutes: metrics.earlyLeaveMinutes,
            workingHours: metrics.workingHours,
            overtimeHours: metrics.overtimeHours,
            isApproved: true,
            notes: `Approved Correction #${corr.id}`,
          });
        }
      }

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: decision === "Approved" ? "APPROVE" : "REJECT",
        entity: "AttendanceCorrection",
        recordId: String(corr.id),
        afterData: { decision, date: corr.date, checkIn: corr.requestedCheckIn, checkOut: corr.requestedCheckOut },
      });

      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // 4. DAILY OPERATIONS / MY DAY & WORK PLAN (Bangla/English + Multiple Attachments)
    // =========================================================================
    if (action === "submitDailyWork") {
      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        body.employeeId &&
        Number(body.employeeId) !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "Forbidden: Staff can only submit their own daily work summary." },
          { status: 403 }
        );
      }

      const employeeId = Number(body.employeeId || currentUser.employeeId || 1);
      const {
        date,
        arrivalTime,
        startTime,
        endTime,
        status,
        workSummary,
        taskId,
        clientId,
        projectId,
        siteId,
        progressPercent,
        problems,
        pendingWork,
        tomorrowPlan,
        notes,
        attachments,
      } = body;

      if (!workSummary) {
        return NextResponse.json(
          { error: "Work description / summary is required (Bangla, English or Mixed)" },
          { status: 400 }
        );
      }

      const prog = Math.min(100, Math.max(0, Number(progressPercent ?? 100)));

      const [dw] = await db
        .insert(dailyWorks)
        .values({
          employeeId,
          date: date || today,
          arrivalTime: arrivalTime || startTime || "09:30",
          startTime: startTime || arrivalTime || "09:30",
          endTime: endTime || "19:30",
          status: status || "Completed",
          workSummary,
          taskId: taskId ? Number(taskId) : null,
          clientId: clientId ? Number(clientId) : null,
          projectId: projectId ? Number(projectId) : null,
          siteId: siteId ? Number(siteId) : null,
          progressPercent: prog,
          problems: problems || "",
          pendingWork: pendingWork || "",
          tomorrowPlan: tomorrowPlan || "Continue assigned tasks",
          notes: notes || "",
          attachments: Array.isArray(attachments) ? attachments : [],
        })
        .returning();

      // Auto-sync linked Task progress!
      if (taskId) {
        const [linkedTask] = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, Number(taskId)));
        if (linkedTask) {
          const newStatus =
            prog >= 100
              ? "Completed"
              : prog > 0
              ? "In Progress"
              : linkedTask.status;

          await db
            .update(tasks)
            .set({
              progressPercent: prog,
              status: newStatus,
              completedBy: newStatus === "Completed" ? currentUser.name : linkedTask.completedBy,
              completedAt: newStatus === "Completed" ? new Date() : linkedTask.completedAt,
            })
            .where(eq(tasks.id, linkedTask.id));

          await db.insert(taskComments).values({
            taskId: linkedTask.id,
            userId: currentUser.id,
            authorName: currentUser.name,
            comment: `Daily Work Summary (${prog}%): ${workSummary}`,
            actionType: "ProgressUpdate",
          });
        }
      }

      // Auto-sync linked Site & Project activity if provided
      if (siteId && prog > 0) {
        await db
          .update(sites)
          .set({
            progressPercent: prog,
            problems: problems || undefined,
          })
          .where(eq(sites.id, Number(siteId)));
      }

      // দৈনিক কাজের বিবরণ জমা দেওয়া হয়েছে Management কে notification পাঠানো
      await createNotification({
        targetRole: "All",
        type: "Daily Work Submitted",
        title: `দৈনিক কাজের বিবরণ: ${currentUser.name} (${dw.date})`,
        message: `অগ্রগতি ${dw.progressPercent}% • ${dw.workSummary.slice(0, 140)}${dw.workSummary.length > 140 ? "…" : ""}`,
        createdBy: currentUser.name,
        priority: "Normal",
        assignedPersonOrTeam: "Management",
        relatedUrl: "/my-day",
        relatedTaskId: dw.taskId || undefined,
        relatedEntityCode: `DW-${dw.id}`,
      });

      if (problems && String(problems).trim().length > 3) {
        await createNotification({
          targetRole: "Manager",
          type: "Project Update",
          title: `সমস্যা রিপোর্ট: ${currentUser.name}`,
          message: problems,
          createdBy: currentUser.name,
          relatedUrl: "/daily-works",
          relatedTaskId: dw.taskId || undefined,
          relatedEntityCode: `DW-${dw.id}`,
        });
      }

      return NextResponse.json({ success: true, dailyWork: dw });
    }

    if (action === "saveDailyWorkPlan") {
      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        body.employeeId &&
        Number(body.employeeId) !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "Forbidden: Staff can only manage their own Work Plan." },
          { status: 403 }
        );
      }

      const employeeId = Number(body.employeeId || currentUser.employeeId || 1);
      const planDate = body.date || today;
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        return NextResponse.json(
          { error: "Please add at least 1 planned item for Today's Work Plan" },
          { status: 400 }
        );
      }

      const formattedItems = items.map(
        (
          it: {
            id?: string;
            title: string;
            status?: "Completed" | "In Progress" | "Pending" | "Blocked";
            notes?: string;
          },
          idx: number
        ) => {
          const st = it.status || "Pending";
          const pct = st === "Completed" ? 100 : st === "In Progress" ? 50 : 0;
          return {
            id: it.id || `wp-${Date.now()}-${idx}`,
            title: it.title,
            status: st,
            completionPercent: pct,
            notes: it.notes || "",
          };
        }
      );

      const autoProgressPercent = calculateWorkPlanProgress(formattedItems);

      const existingPlans = await db
        .select()
        .from(dailyWorkPlans)
        .where(eq(dailyWorkPlans.employeeId, employeeId));
      const existingToday = existingPlans.find((p) => p.date === planDate);

      if (existingToday) {
        const [updated] = await db
          .update(dailyWorkPlans)
          .set({
            items: formattedItems,
            autoProgressPercent,
          })
          .where(eq(dailyWorkPlans.id, existingToday.id))
          .returning();
        return NextResponse.json({ success: true, workPlan: updated });
      } else {
        const [created] = await db
          .insert(dailyWorkPlans)
          .values({
            employeeId,
            date: planDate,
            items: formattedItems,
            autoProgressPercent,
          })
          .returning();
        return NextResponse.json({ success: true, workPlan: created });
      }
    }

    if (action === "updateWorkPlanItemStatus") {
      const { planId, itemId, status } = body;
      const [plan] = await db
        .select()
        .from(dailyWorkPlans)
        .where(eq(dailyWorkPlans.id, Number(planId)));
      if (!plan) {
        return NextResponse.json({ error: "Work Plan not found" }, { status: 404 });
      }
      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        plan.employeeId !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "Forbidden: You can only update your own Work Plan." },
          { status: 403 }
        );
      }

      const updatedItems = (plan.items || []).map((it) => {
        if (it.id === itemId) {
          const pct =
            status === "Completed" ? 100 : status === "In Progress" ? 50 : 0;
          return { ...it, status, completionPercent: pct };
        }
        return it;
      });

      const autoProgressPercent = calculateWorkPlanProgress(updatedItems);

      const [updated] = await db
        .update(dailyWorkPlans)
        .set({
          items: updatedItems,
          autoProgressPercent,
        })
        .where(eq(dailyWorkPlans.id, plan.id))
        .returning();

      return NextResponse.json({ success: true, workPlan: updated });
    }

    if (action === "overrideWorkPlanProgress") {
      if (!canViewAllEmployeeProfiles(currentUser.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only Manager, MD or Owner can override progress percentage." },
          { status: 403 }
        );
      }
      const { planId, manualOverridePercent, overrideReason } = body;
      const [plan] = await db
        .select()
        .from(dailyWorkPlans)
        .where(eq(dailyWorkPlans.id, Number(planId)));
      if (!plan) {
        return NextResponse.json({ error: "Work Plan not found" }, { status: 404 });
      }

      const pct = Math.min(100, Math.max(0, Number(manualOverridePercent)));
      const [updated] = await db
        .update(dailyWorkPlans)
        .set({
          manualOverridePercent: pct,
          overrideReason: overrideReason || "Manager manual evaluation adjustment",
          overriddenBy: currentUser.name,
        })
        .where(eq(dailyWorkPlans.id, plan.id))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "WORK_PLAN_PROGRESS_OVERRIDE",
        entity: "DailyWorkPlan",
        recordId: String(plan.id),
        beforeData: {
          autoProgressPercent: plan.autoProgressPercent,
          manualOverridePercent: plan.manualOverridePercent,
        },
        afterData: {
          manualOverridePercent: pct,
          overrideReason: overrideReason || "Manager manual evaluation adjustment",
          overriddenBy: currentUser.name,
        },
      });

      return NextResponse.json({ success: true, workPlan: updated });
    }

    // =========================================================================
    // 5. TASK MANAGEMENT & COMPANY-WIDE ANNOUNCEMENTS
    // =========================================================================
    if (action === "createTask") {
      const {
        title,
        description,
        assignedTo,
        assignToAllStaff,
        managerId,
        projectId,
        siteId,
        clientId,
        priority,
        dueDate,
        requiresReview,
        attachmentUrl,
        visibility,
      } = body;

      if (!title || (!assignedTo && !assignToAllStaff) || !dueDate) {
        return NextResponse.json(
          { error: "টাস্কের শিরোনাম, দায়িত্বপ্রাপ্ত ব্যক্তি এবং সময়সীমা প্রদান করা আবশ্যক।" },
          { status: 400 }
        );
      }

      const effectiveVisibility = visibility || (assignToAllStaff ? "Everyone" : "Assigned Staff");

      // Security: Non-management cannot create Management-Only tasks
      if (effectiveVisibility === "Management Only" && !isManagementRole(currentUser.role)) {
        return NextResponse.json(
          { error: "403 Forbidden: শুধুমাত্র ম্যানেজমেন্ট গোপনীয় টাস্ক তৈরি করতে পারে।" },
          { status: 403 }
        );
      }

      // Security: Non-management cannot assign tasks to other staff without permission
      if (!isManagementRole(currentUser.role) && !hasPermission(currentUser, "tasks.manage")) {
        return NextResponse.json(
          { error: "403 Forbidden: অন্যান্য কর্মকর্তাদের দায়িত্ব বণ্টন করার অনুমতি আপনার নেই।" },
          { status: 403 }
        );
      }

      const existingTasks = await db.select().from(tasks);
      const taskCode = `TSK-${String(existingTasks.length + 1).padStart(4, "0")}`;
      const allEmps = await db.select().from(employees);
      const targetEmp = allEmps.find((e) => e.id === Number(assignedTo));
      const assignedLabel = assignToAllStaff
        ? "All Staff"
        : targetEmp
        ? `${targetEmp.name} (${targetEmp.empCode})`
        : `EMP-${assignedTo}`;

      const [created] = await db
        .insert(tasks)
        .values({
          taskCode,
          title,
          description: description || "",
          assignedTo: Number(assignedTo || currentUser.employeeId || 1),
          managerId: managerId ? Number(managerId) : currentUser.employeeId,
          projectId: projectId ? Number(projectId) : null,
          siteId: siteId ? Number(siteId) : null,
          clientId: clientId ? Number(clientId) : null,
          priority: priority || "Medium",
          dueDate,
          status: "Todo",
          progressPercent: 0,
          requiresReview: Boolean(requiresReview),
          visibility: effectiveVisibility,
          createdBy: `${currentUser.name} (${currentUser.designation || currentUser.role})`,
          attachmentUrl: attachmentUrl || null,
          isCompanyWide: Boolean(assignToAllStaff) || effectiveVisibility === "Everyone",
        })
        .returning();

      // নির্দিষ্ট কর্মকর্তার private notification (userId-based) — কেবল assigned employee দেখবে
      if (targetEmp && targetEmp.userId) {
        await createNotification({
          userId: targetEmp.userId,
          targetRole: "User",
          type: "TASK_ASSIGNED",
          title: `টাস্ক অর্পিত: ${taskCode} — ${title}`,
          message:
            description ||
            `${title} (Deadline: ${dueDate}). অর্পণকারী: ${currentUser.name} (${currentUser.designation || currentUser.role})।`,
          createdBy: currentUser.name,
          priority: priority || "Medium",
          assignedPersonOrTeam: assignedLabel,
          dueDate,
          attachmentUrl: attachmentUrl || null,
          relatedTaskId: created.id,
          relatedUrl: `/tasks/${created.id}`,
          relatedEntityCode: taskCode,
        });
      }

      // Management-side update (Founder/Chairman/GM/PM can see)
      if (isManagementRole(currentUser.role) || currentUser.employeeId !== created.assignedTo) {
        await createNotification({
          targetRole: "Manager",
          type: "TASK_ASSIGNED",
          title: `নতুন টাস্ক অর্পিত: ${taskCode} — ${title}`,
          message: `অর্পণকারী: ${currentUser.name} (${currentUser.designation || currentUser.role}) → প্রাপক: ${assignedLabel}। Deadline: ${dueDate}।`,
          createdBy: currentUser.name,
          priority: priority || "Medium",
          assignedPersonOrTeam: created.createdBy || "Management",
          dueDate,
          relatedTaskId: created.id,
          relatedUrl: `/tasks/${created.id}`,
          relatedEntityCode: taskCode,
        });
      }

      return NextResponse.json({ success: true, task: created });
    }

    if (action === "createAnnouncement") {
      // Security: Only Owner/Founder, Chairman, and General Manager can publish company-wide announcements
      if (!canCreateAnnouncements(currentUser.role)) {
        return NextResponse.json(
          { error: "403 Forbidden: শুধুমাত্র ম্যানেজমেন্ট (প্রতিষ্ঠাতা ও সিইও, চেয়ারম্যান, জেনারেল ম্যানেজার) নোটিশ তৈরি করতে পারেন।" },
          { status: 403 }
        );
      }

      const {
        title,
        message,
        priority,
        assignedPersonOrTeam,
        dueDate,
        attachmentUrl,
      } = body;
      if (!title || !message) {
        return NextResponse.json(
          { error: "নোটিশের শিরোনাম এবং বিস্তারিত বিবরণ প্রদান করা বাধ্যতামূলক।" },
          { status: 400 }
        );
      }

      const [ann] = await db
        .insert(announcements)
        .values({
          title,
          message,
          createdBy: `${currentUser.name} (${currentUser.designation || currentUser.role})`,
          createdById: currentUser.id,
          priority: priority || "Normal",
          publishedStatus: "Published",
          attachmentUrl: attachmentUrl || null,
          readByUserIds: [currentUser.id],
        })
        .returning();

      await createNotification({
        targetRole: "All",
        type: "Announcement",
        title: `নতুন নোটিশ: ${title}`,
        message,
        createdBy: `${currentUser.name} (${currentUser.designation || currentUser.role})`,
        priority: priority || "High",
        assignedPersonOrTeam: assignedPersonOrTeam || "All Staff",
        dueDate: dueDate || today,
        attachmentUrl: attachmentUrl || null,
        relatedUrl: "/dashboard",
        relatedEntityCode: `ANN-${ann.id}`,
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_ANNOUNCEMENT",
        entity: "Announcement",
        recordId: String(ann.id),
        afterData: ann,
      });

      return NextResponse.json({ success: true, announcement: ann });
    }

    if (action === "markAnnouncementRead") {
      const { announcementId } = body;
      const [ann] = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, Number(announcementId)));
      if (ann) {
        const currentRead = ann.readByUserIds || [];
        if (!currentRead.includes(currentUser.id)) {
          await db
            .update(announcements)
            .set({ readByUserIds: [...currentRead, currentUser.id] })
            .where(eq(announcements.id, ann.id));
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "updateTaskStatus") {
      // Supports: Todo -> Accepted -> In Progress -> Review -> Completed
      // Plus: Blocked -> Reopened -> Cancelled
      const {
        taskId,
        status,
        progressPercent,
        comment,
        completionNote,
        attachmentUrl,
        evidenceAttachments,
      } = body;
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      let finalStatus = status || task.status;
      let finalProgress =
        progressPercent !== undefined
          ? Number(progressPercent)
          : finalStatus === "Completed"
          ? 100
          : finalStatus === "Review"
          ? 90
          : finalStatus === "In Progress"
          ? Math.max(40, task.progressPercent)
          : finalStatus === "Accepted"
          ? Math.max(15, task.progressPercent)
          : task.progressPercent;

      if (finalStatus === "Completed") {
        finalProgress = 100;
      }

      const newEvidence = Array.isArray(evidenceAttachments)
        ? evidenceAttachments
        : task.evidenceAttachments || [];

      const [updated] = await db
        .update(tasks)
        .set({
          status: finalStatus,
          progressPercent: finalProgress,
          reviewedBy: finalStatus === "Completed" ? currentUser.name : task.reviewedBy,
          reviewedAt: finalStatus === "Completed" ? new Date() : task.reviewedAt,
          completedBy: finalStatus === "Completed" ? currentUser.name : task.completedBy,
          completedAt: finalStatus === "Completed" ? new Date() : task.completedAt,
          completionNote:
            completionNote !== undefined ? completionNote : task.completionNote,
          attachmentUrl: attachmentUrl || task.attachmentUrl,
          evidenceAttachments: newEvidence,
        })
        .where(eq(tasks.id, task.id))
        .returning();

      // নতুন taskComments actionType অনুসারে সঠিক history entry তৈরি করা হচ্ছে
      const historyComment =
        comment ||
        completionNote ||
        `স্ট্যাটাস পরিবর্তন: ${finalStatus} (${finalProgress}%)`;
      const historyActionType =
        finalStatus === "Completed"
          ? "ReviewApproved"
          : finalStatus === "Accepted"
          ? "Accepted"
          : finalStatus === "In Progress"
          ? "ProgressUpdate"
          : finalStatus === "Blocked" || finalStatus === "Reopened"
          ? "StatusChange"
          : "ProgressUpdate";

      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        comment: historyComment,
        actionType: historyActionType,
      });

      // প্রতিটি lifecycle event-এর জন্য Notification পাঠানো হচ্ছে:
      // Assigned person-এর পরিবর্তন (অর্পণের পরে গৃহীত/শুরু/অগ্রগতি/সম্পন্ন)
      // Management-এ (অর্পণকারী) পাওয়ার জন্য

      // সর্বদা অর্পণকারী ও Management কাছে update পাঠানো
      const notifyTargetRole =
        finalStatus === "Completed"
          ? "Manager"
          : "All"; // All = creator/assigner can receive too

      // Recipient-scoped notification system:
      // - privateUserId = assigned employee's user_id (only this user sees the notification in their payload)
      // - managementCopy  = a copy to the task creator/assigner (Founder/CEO/Chairman/GM/PM)
      // - We DO NOT use targetRole="All" for private task events.

      const hadOldEvidence = (task.evidenceAttachments || []).length;
      const hasNewEvidence = (newEvidence || []).length > hadOldEvidence;

      // Lookup the assigned employee's user_id so private notifications land only in their inbox
      const [assignedEmp] = task.assignedTo
        ? await db
            .select({
                id: employees.id,
                userId: employees.userId,
                name: employees.name,
                empCode: employees.empCode,
              })
            .from(employees)
            .where(eq(employees.id, task.assignedTo))
            .limit(1)
        : [];
      const privateUserId = assignedEmp?.userId ?? null;

      // Helper to insert a private notification to a specific user
      const pushPrivate = async (
        userId: number | null,
        nType: string,
        title: string,
        message: string
      ) => {
        if (!userId) return;
        await createNotification({
          userId,
          targetRole: "User",
          type: nType,
          title,
          message,
          createdBy: currentUser.name,
          priority: task.priority,
          assignedPersonOrTeam: assignedEmp ? `${assignedEmp.name} (${assignedEmp.empCode})` : "",
          dueDate: task.dueDate,
          attachmentUrl: attachmentUrl || task.attachmentUrl,
          relatedTaskId: task.id,
          relatedUrl: `/tasks/${task.id}`,
          relatedEntityCode: task.taskCode,
        });
      };

      // Helper to insert a management-side update notification
      const pushManagement = async (
        nType: string,
        title: string,
        message: string
      ) => {
        await createNotification({
          targetRole: "Manager",
          type: nType,
          title,
          message,
          createdBy: currentUser.name,
          priority: task.priority,
          assignedPersonOrTeam: task.createdBy || "Management",
          dueDate: task.dueDate,
          relatedTaskId: task.id,
          relatedUrl: `/tasks/${task.id}`,
          relatedEntityCode: task.taskCode,
        });
      };

      // Resolve event type
      let eventType = "TASK_PROGRESS_UPDATED";
      if (finalStatus === "Completed") eventType = "TASK_COMPLETED";
      else if (finalStatus === "Accepted") eventType = "TASK_ACCEPTED";
      else if (finalStatus === "In Progress") eventType = "TASK_STARTED";

      // Build shared event message
      const baseMsg = `${currentUser.name} — ${task.taskCode} — ${task.title}`;

      // Build event-specific messages
      let privateTitle = `কাজের হালনাগাদ: ${task.taskCode}`;
      let privateMessage = `${baseMsg} (${finalProgress}%) হালনাগাদ করা হয়েছে।`;
      let managementTitle = `টাস্ক হালনাগাদ: ${task.taskCode}`;
      let managementMessage = `${baseMsg} — ${finalStatus} (${finalProgress}%)।`;

      if (finalStatus === "Completed") {
        privateTitle = `টাস্ক সম্পন্ন: ${task.taskCode}`;
        privateMessage = `${baseMsg} সম্পন্ন হয়েছে। ${completionNote ? `মন্তব্য: ${completionNote}` : ""}`;
        managementTitle = `টাস্ক সম্পন্ন: ${task.taskCode}`;
        managementMessage = `${baseMsg} ${currentUser.name} সম্পন্ন করেছেন (${finalProgress}%)।`;
      } else if (finalStatus === "Accepted") {
        privateTitle = `কাজ গৃহীত: ${task.taskCode}`;
        privateMessage = `${baseMsg} গৃহীত হয়েছে। Deadline: ${task.dueDate}।`;
        managementTitle = `কাজ গৃহীত: ${task.taskCode}`;
        managementMessage = `${baseMsg} ${currentUser.name} গ্রহণ করেছেন।`;
      } else if (finalStatus === "In Progress") {
        privateTitle = `কাজ শুরু: ${task.taskCode}`;
        privateMessage = `${baseMsg} কাজ শুরু হয়েছে।`;
        managementTitle = `কাজ শুরু: ${task.taskCode}`;
        managementMessage = `${baseMsg} ${currentUser.name} কাজ শুরু করেছেন।`;
      } else if (
        typeof progressPercent === "number" &&
        finalStatus === task.status
      ) {
        // শুধু অগ্রগতি update
        privateTitle = `কাজের অগ্রগতি: ${task.taskCode} (${finalProgress}%)`;
        privateMessage = `${baseMsg} অগ্রগতি ${finalProgress}% হালনাগাদ হয়েছে। ${comment ? `মন্তব্য: ${comment}` : ""}`;
        managementTitle = `কাজের অগ্রগতি: ${task.taskCode} (${finalProgress}%)`;
        managementMessage = `${baseMsg} ${currentUser.name} অগ্রগতি ${finalProgress}% হালনাগাদ করেছেন।`;
      }

      // Send PRIVATE notification to assigned employee (userId-targeted)
      // Skip if the actor is the same user as the recipient (employee self-updating)
      if (privateUserId && privateUserId !== currentUser.id) {
        await pushPrivate(privateUserId, eventType, privateTitle, privateMessage);
      }

      // Send MANAGEMENT notification if the actor is the employee (then the creator must know)
      if (currentUser.id !== (task.createdBy ? null : null) || true) {
        // always send to management (creator + monitoring team) for visibility
        // unless the currentUser is itself management
        if (currentUser.employeeId !== task.assignedTo) {
          // actor is management → management already knows; skip
        } else {
          // actor is the employee → notify management
          await pushManagement(eventType, managementTitle, managementMessage);
        }
      }

      // নতুন attachment সংযুক্ত হলে — assigned employee + management both notified
      if (hasNewEvidence && finalStatus !== "Completed") {
        if (privateUserId && privateUserId !== currentUser.id) {
          await pushPrivate(
            privateUserId,
            "TASK_ATTACHMENT_ADDED",
            `প্রমাণপত্র সংযুক্ত: ${task.taskCode}`,
            `${baseMsg} — ${newEvidence.length - hadOldEvidence}টি নতুন ফাইল/ইমেজ সংযুক্ত হয়েছে।`
          );
        }
        await pushManagement(
          "TASK_ATTACHMENT_ADDED",
          `প্রমাণপত্র সংযুক্ত: ${task.taskCode}`,
          `${baseMsg} — ${currentUser.name} ${newEvidence.length - hadOldEvidence}টি নতুন ফাইল আপলোড করেছেন।`
        );
      }

      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "overrideTaskProgress") {
      if (!canViewAllEmployeeProfiles(currentUser.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only Manager, MD or Owner can override task progress." },
          { status: 403 }
        );
      }
      const { taskId, manualProgressPercent, overrideReason } = body;
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      const pct = Math.min(100, Math.max(0, Number(manualProgressPercent)));
      const [updated] = await db
        .update(tasks)
        .set({ progressPercent: pct })
        .where(eq(tasks.id, task.id))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "TASK_PROGRESS_OVERRIDE",
        entity: "Task",
        recordId: task.taskCode,
        beforeData: { progressPercent: task.progressPercent },
        afterData: { progressPercent: pct, overrideReason },
      });

      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "addTaskComment") {
      const { taskId, comment } = body;
      if (!comment) {
        return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
      }
      const [c] = await db
        .insert(taskComments)
        .values({
          taskId: Number(taskId),
          userId: currentUser.id,
          authorName: currentUser.name,
          comment,
          actionType: "Comment",
        })
        .returning();
      return NextResponse.json({ success: true, comment: c });
    }

    // =========================================================
    // OPTION B: ADVANCED EMPLOYEE WORK TRACKING & MANAGEMENT REVIEW
    // =========================================================

    if (action === "submitTaskProgress") {
      const {
        taskId,
        progressPercent,
        nextAction,
        delayReason,
        note,
        attachments,
        attachmentsInput,
        completionStatus,
      } = body;
      if (!taskId) {
        return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
      }
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

      // Security: A Staff employee may only update their OWN assigned tasks.
      if (currentUser.role === "Staff" || currentUser.role === "Site Staff" || currentUser.role === "Engineer" || currentUser.role === "Marketing" || currentUser.role === "Sales") {
        if (task.assignedTo !== currentUser.employeeId) {
          return NextResponse.json(
            { error: "403 Forbidden: কর্মকর্তারা শুধুমাত্র নিজের অর্পিত কাজের আপডেট দিতে পারেন।" },
            { status: 403 }
          );
        }
      }

      const pct = Math.min(100, Math.max(0, Number(progressPercent ?? task.progressPercent ?? 0)));
      const mergedAttachments = [
        ...(Array.isArray(attachments) ? attachments : []),
        ...(Array.isArray(attachmentsInput) ? attachmentsInput : []),
      ];
      const completed = completionStatus === "Completed" || pct >= 100;

      const [updated] = await db
        .update(tasks)
        .set({
          progressPercent: completed ? 100 : pct,
          status: completed ? "Completed" : task.status,
          completedBy: completed ? currentUser.name : task.completedBy,
          completedAt: completed ? new Date() : task.completedAt,
          completionNote: note ?? task.completionNote,
          nextAction: nextAction ?? task.nextAction,
          delayReason: delayReason ?? task.delayReason,
          evidenceAttachments: mergedAttachments.length > 0 ? mergedAttachments : task.evidenceAttachments,
        })
        .where(eq(tasks.id, task.id))
        .returning();

      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        comment: `অগ্রগতি আপডেট: ${pct}%${nextAction ? ` | পরবর্তী পদক্ষেপ: ${nextAction}` : ""}${delayReason ? ` | বিলম্ব: ${delayReason}` : ""}${note ? ` | নোট: ${note}` : ""}`,
        actionType: "ProgressUpdate",
      });

      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "managementReviewTask") {
      if (!isManagementRole(currentUser.role)) {
        return NextResponse.json(
          { error: "403 Forbidden: শুধুমাত্র ম্যানেজমেন্ট অনুমোদন বা সংশোধন করতে পারে।" },
          { status: 403 }
        );
      }
      const { taskId, decision, correctionReason } = body;
      if (!taskId || !decision || !["Approved", "Correction Required"].includes(decision)) {
        return NextResponse.json(
          { error: "taskId এবং decision (Approved / Correction Required) প্রয়োজন।" },
          { status: 400 }
        );
      }
      if (decision === "Correction Required" && !correctionReason) {
        return NextResponse.json(
          { error: "Correction Required-এর জন্য কারণ বিবরণ আবশ্যক।" },
          { status: 400 }
        );
      }
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

      const reviewByFull = `${currentUser.name} (${currentUser.designation || currentUser.role})`;

      const [updated] = await db
        .update(tasks)
        .set({
          status: decision === "Approved" ? "Completed" : "In Progress",
          managementReviewStatus: decision,
          managementReviewBy: reviewByFull,
          managementReviewAt: new Date(),
          correctionReason:
            decision === "Correction Required"
              ? correctionReason
              : "",
          reviewedBy: reviewByFull,
          reviewedAt: new Date(),
          completedBy:
            decision === "Approved" ? reviewByFull : task.completedBy,
          completedAt:
            decision === "Approved" ? new Date() : task.completedAt,
          progressPercent:
            decision === "Approved" ? 100 : task.progressPercent,
        })
        .where(eq(tasks.id, task.id))
        .returning();

      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: reviewByFull,
        comment:
          decision === "Approved"
            ? `Approved by Management (${reviewByFull})`
            : `Correction Required by Management (${reviewByFull}): ${correctionReason}`,
        actionType: decision === "Approved" ? "Approved" : "Correction",
      });

      // কে কাজটি করছে তাকে notification
      const assignedEmpId = task.assignedTo;
      await createNotification({
        targetRole: "All",
        type: decision === "Approved" ? "Task Update" : "Correction",
        title:
          decision === "Approved"
            ? `কাজ অনুমোদিত: ${task.taskCode}`
            : `সংশোধন প্রয়োজন: ${task.taskCode}`,
        message:
          decision === "Approved"
            ? `${reviewByFull} আপনার কাজ "${task.title}" সফলভাবে অনুমোদন করেছেন।`
            : `${reviewByFull} আপনার কাজ "${task.title}" এ সংশোধন প্রয়োজন। কারণ: ${correctionReason}`,
        createdBy: reviewByFull,
        priority: task.priority,
        assignedPersonOrTeam: task.createdBy || "Management",
        dueDate: task.dueDate,
        relatedTaskId: task.id,
        relatedUrl: `/tasks/${task.id}`,
        relatedEntityCode: task.taskCode,
      });

      return NextResponse.json({ success: true, task: updated });
    }

    // =========================================================================
    // 6. CRM: LEADS, FOLLOW-UPS, CLIENTS & QUOTATIONS
    // =========================================================================
    if (action === "createLead") {
      const {
        companyId,
        name,
        phone,
        whatsapp,
        location,
        source,
        priority,
        status,
        requirement,
        budget,
        assignedStaffId,
        nextFollowUpDate,
        // IBDC fields
        service,
        landSize,
        roadWidth,
        // IREL fields
        propertyType,
        projectName,
        unitNo,
        preferredLocation,
        propertySize,
        floor,
        bedrooms,
        purpose,
        expectedPurchaseDate,
      } = body;

      if (!name || !phone) {
        return NextResponse.json(
          { error: "Lead Name and Phone are required" },
          { status: 400 }
        );
      }

      const allComps = await db.select().from(companies);
      const targetCompany =
        allComps.find((c) => c.id === Number(companyId)) ||
        allComps.find((c) => c.code === COMPANY_IBDC);

      if (!targetCompany) {
        return NextResponse.json(
          { error: "Invalid business unit. Select IBDC or IREL." },
          { status: 400 }
        );
      }

      // Security (Part 11 & 12): Strictly verify if user can create leads for this business unit
      if (!canAccessMarketingLeads(currentUser, targetCompany.code)) {
        return NextResponse.json(
          { error: `403 Forbidden: ${targetCompany.shortName}-এর লিড ডাটাবেজ অ্যাক্সেস করার অনুমতি আপনার নেই।` },
          { status: 403 }
        );
      }

      const isIbdc = targetCompany.code === COMPANY_IBDC;

      // STRICT BUSINESS-UNIT CATEGORY SEPARATION
      if (isIbdc) {
        if (!service || !IBDC_SERVICE_TYPES.includes(service)) {
          return NextResponse.json(
            {
              error: `Invalid Service Type for ${targetCompany.shortName}. Allowed: ${IBDC_SERVICE_TYPES.join(", ")}`,
            },
            { status: 400 }
          );
        }
        if (propertyType && IREL_PROPERTY_TYPES.includes(propertyType)) {
          return NextResponse.json(
            {
              error:
                "Data Separation Violation: Real Estate property types cannot be used for Building Design leads.",
            },
            { status: 400 }
          );
        }
      } else {
        if (!propertyType || !IREL_PROPERTY_TYPES.includes(propertyType)) {
          return NextResponse.json(
            {
              error: `Invalid Property Type for ${targetCompany.shortName}. Allowed: ${IREL_PROPERTY_TYPES.join(", ")}`,
            },
            { status: 400 }
          );
        }
        if (service && IBDC_SERVICE_TYPES.includes(service) && service !== "Other") {
          return NextResponse.json(
            {
              error:
                "Data Separation Violation: Building Design services (e.g. RAJUK Approval) cannot be used for Real Estate leads.",
            },
            { status: 400 }
          );
        }
      }

      const finalPriority = LEAD_PRIORITIES.includes(priority) ? priority : "Warm";
      const finalStatus = LEAD_STATUSES.includes(status) ? status : "New";
      const budgetNum = Number(budget || 0);
      if (budgetNum < 0) {
        return NextResponse.json(
          { error: "Budget cannot be negative" },
          { status: 400 }
        );
      }

      const companyLeads = (await db.select().from(leads)).filter(
        (l) => l.companyId === targetCompany.id
      );
      const leadCode = `${targetCompany.leadPrefix}-${String(
        companyLeads.length + 1
      ).padStart(4, "0")}`;

      const [lead] = await db
        .insert(leads)
        .values({
          leadCode,
          companyId: targetCompany.id,
          name,
          phone,
          whatsapp: whatsapp || phone,
          location: location || "",
          source: source || "Direct",
          priority: finalPriority,
          service: isIbdc ? service : "",
          landSize: isIbdc ? landSize || "" : "",
          roadWidth: isIbdc ? roadWidth || "" : "",
          propertyType: isIbdc ? "" : propertyType,
          projectName: isIbdc ? "" : projectName || "",
          unitNo: isIbdc ? "" : unitNo || "",
          preferredLocation: isIbdc ? "" : preferredLocation || "",
          propertySize: isIbdc ? "" : propertySize || "",
          floor: isIbdc ? "" : floor || "",
          bedrooms: isIbdc ? "" : bedrooms || "",
          purpose: isIbdc ? "" : purpose || "",
          expectedPurchaseDate: isIbdc ? null : expectedPurchaseDate || null,
          requirement: requirement || "",
          budget: budgetNum.toFixed(2),
          status: finalStatus,
          assignedStaffId: assignedStaffId
            ? Number(assignedStaffId)
            : currentUser.employeeId,
          nextFollowUpDate: nextFollowUpDate || today,
          nextFollowUpTime: body.nextFollowUpTime || "10:00",
          followUpCount: 0,
          lastContactDate: null,
          lastOutcome: "",
          reminder1: body.reminder1 || "",
          reminder2: body.reminder2 || "",
          reminder3: body.reminder3 || "",
        })
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "Lead",
        recordId: lead.leadCode,
        afterData: { company: targetCompany.code, ...lead },
      });

      return NextResponse.json({ success: true, lead });
    }

    if (action === "updateLeadStatusPriority") {
      const { leadId, status, priority, nextFollowUpDate } = body;
      const [existingLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, Number(leadId)));
      if (!existingLead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const allComps = await db.select().from(companies);
      const targetCompany = allComps.find((c) => c.id === existingLead.companyId);
      if (targetCompany && !canAccessMarketingLeads(currentUser, targetCompany.code)) {
        return NextResponse.json(
          { error: `403 Forbidden: ${targetCompany.shortName}-এর লিড ডাটাবেজ অ্যাক্সেস করার অনুমতি আপনার নেই।` },
          { status: 403 }
        );
      }

      if (status && !LEAD_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
      }
      if (priority && !LEAD_PRIORITIES.includes(priority)) {
        return NextResponse.json({ error: "Invalid lead priority" }, { status: 400 });
      }

      const [updated] = await db
        .update(leads)
        .set({
          status: status || existingLead.status,
          priority: priority || existingLead.priority,
          nextFollowUpDate: nextFollowUpDate || existingLead.nextFollowUpDate,
        })
        .where(eq(leads.id, existingLead.id))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE",
        entity: "Lead",
        recordId: existingLead.leadCode,
        beforeData: { status: existingLead.status, priority: existingLead.priority },
        afterData: { status: updated.status, priority: updated.priority },
      });

      return NextResponse.json({ success: true, lead: updated });
    }

    if (action === "addLeadFollowup") {
      // UNLIMITED REPEATED FOLLOW-UP — NEVER overwrite history, always append.
      const {
        leadId,
        method,
        outcome,
        clientResponse,
        note,
        nextFollowUpDate,
        nextFollowUpTime,
        attachments,
        newStatus,
        // legacy aliases still accepted
        discussion,
        nextAction,
        result,
      } = body;

      if (!leadId) {
        return NextResponse.json({ error: "Lead is required" }, { status: 400 });
      }

      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, Number(leadId)));
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const allComps = await db.select().from(companies);
      const targetCompany = allComps.find((c) => c.id === lead.companyId);
      if (targetCompany && !canAccessMarketingLeads(currentUser, targetCompany.code)) {
        return NextResponse.json(
          { error: `403 Forbidden: ${targetCompany.shortName}-এর লিড ডাটাবেজ অ্যাক্সেস করার অনুমতি আপনার নেই।` },
          { status: 403 }
        );
      }

      const finalMethod = FOLLOWUP_METHODS.includes(method) ? method : "Phone Call";
      const finalOutcome = FOLLOWUP_OUTCOMES.includes(outcome)
        ? outcome
        : FOLLOWUP_OUTCOMES.includes(result)
        ? result
        : "Contacted";
      const finalNote = note || discussion || "";
      const finalResponse = clientResponse || nextAction || "";

      if (!finalNote.trim()) {
        return NextResponse.json(
          { error: "Staff Note / discussion is required for every follow-up" },
          { status: 400 }
        );
      }

      // Resolve the new lead status from the outcome (No Response / Call Back
      // Later keep the lead ACTIVE — it must never auto-convert to Lost).
      const resolvedStatus =
        newStatus && LEAD_STATUSES.includes(newStatus)
          ? newStatus
          : OUTCOME_TO_STATUS[finalOutcome] || "Follow-up Required";

      const isClosed = LEAD_CLOSED_STATUSES.includes(resolvedStatus);

      // Next Follow-up is MANDATORY unless the lead is Won / Lost / On Hold
      if (!isClosed && !nextFollowUpDate) {
        return NextResponse.json(
          {
            error:
              "Next Follow-up Date is required. Active leads (not Won/Lost/On Hold) must always have the next follow-up scheduled so they are never forgotten.",
          },
          { status: 400 }
        );
      }

      if (nextFollowUpDate && nextFollowUpDate < today) {
        return NextResponse.json(
          { error: "Next Follow-up Date cannot be in the past" },
          { status: 400 }
        );
      }

      const existingFollowups = (await db.select().from(leadFollowups)).filter(
        (f) => f.leadId === lead.id
      );
      const nextNumber = existingFollowups.length + 1;
      const nowTime = new Date().toTimeString().slice(0, 5);

      const [f] = await db
        .insert(leadFollowups)
        .values({
          leadId: lead.id,
          followupNumber: nextNumber,
          staffId: currentUser.employeeId,
          staffName: currentUser.name,
          date: today,
          time: nowTime,
          method: finalMethod,
          outcome: finalOutcome,
          clientResponse: finalResponse,
          note: finalNote,
          // legacy columns kept populated for backward compatibility
          discussion: finalNote,
          nextAction: finalResponse || finalOutcome,
          result: finalOutcome,
          nextFollowUpDate: isClosed ? null : nextFollowUpDate,
          nextFollowUpTime: isClosed ? null : nextFollowUpTime || "10:00",
          attachments: Array.isArray(attachments) ? attachments : [],
        })
        .returning();

      const [updatedLead] = await db
        .update(leads)
        .set({
          status: resolvedStatus,
          lastContactDate: today,
          lastOutcome: finalOutcome,
          followUpCount: nextNumber,
          nextFollowUpDate: isClosed ? null : nextFollowUpDate,
          nextFollowUpTime: isClosed ? null : nextFollowUpTime || "10:00",
          lastReminderNotifiedDate: null, // allow a fresh reminder for the new date
        })
        .where(eq(leads.id, lead.id))
        .returning();

      // Reminder / notification for the newly scheduled follow-up
      if (!isClosed && nextFollowUpDate) {
        await createNotification({
          targetRole: "All",
          type: "Follow-up Due",
          title: `Follow-up #${nextNumber + 1} scheduled: ${lead.name}`,
          message: `${finalOutcome} via ${finalMethod}. Next follow-up on ${nextFollowUpDate} at ${
            nextFollowUpTime || "10:00"
          }. Note: ${finalNote}`,
          createdBy: currentUser.name,
          priority: lead.priority === "Hot" ? "High" : "Medium",
          assignedPersonOrTeam: currentUser.name,
          dueDate: nextFollowUpDate,
          relatedUrl: "/leads",
          relatedEntityCode: lead.leadCode,
        });
      } else if (isClosed) {
        await createNotification({
          targetRole: "Manager",
          type: "Project Update",
          title: `Lead ${resolvedStatus}: ${lead.name} (${lead.leadCode})`,
          message: `${currentUser.name} closed this lead as ${resolvedStatus} after ${nextNumber} follow-up(s). Final note: ${finalNote}`,
          createdBy: currentUser.name,
          relatedUrl: "/leads",
          relatedEntityCode: lead.leadCode,
        });
      }

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "LEAD_FOLLOWUP",
        entity: "Lead",
        recordId: lead.leadCode,
        beforeData: {
          status: lead.status,
          followUpCount: lead.followUpCount,
          nextFollowUpDate: lead.nextFollowUpDate,
        },
        afterData: {
          followupNumber: nextNumber,
          method: finalMethod,
          outcome: finalOutcome,
          status: resolvedStatus,
          nextFollowUpDate: isClosed ? null : nextFollowUpDate,
        },
      });

      return NextResponse.json({ success: true, followup: f, lead: updatedLead });
    }

    // Dispatch due / overdue follow-up reminders (no duplicates per day)
    if (action === "runFollowUpReminders") {
      const allLeadsForRem = await db.select().from(leads);
      let dueCount = 0;
      let overdueCount = 0;

      for (const l of allLeadsForRem) {
        if (
          !l.nextFollowUpDate ||
          LEAD_CLOSED_STATUSES.includes(l.status) ||
          l.lastReminderNotifiedDate === today // already notified today
        ) {
          continue;
        }

        const isDueToday = l.nextFollowUpDate === today;
        const isOverdue = l.nextFollowUpDate < today;
        if (!isDueToday && !isOverdue) continue;

        const daysOverdue = isOverdue
          ? daysBetween(l.nextFollowUpDate, today)
          : 0;

        await createNotification({
          targetRole: "All",
          type: isOverdue ? "Task Overdue" : "Follow-up Due",
          title: isOverdue
            ? `Follow-up overdue: ${l.name} — ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
            : `Follow-up due today: ${l.name}`,
          message: `${l.leadCode} • ${l.phone} • Priority: ${l.priority} • Status: ${l.status} • Total follow-ups so far: ${l.followUpCount}`,
          createdBy: "Follow-up Automation",
          priority: isOverdue || l.priority === "Hot" ? "Critical" : "High",
          assignedPersonOrTeam: "CRM Team",
          dueDate: l.nextFollowUpDate,
          relatedUrl: "/leads",
          relatedEntityCode: l.leadCode,
        });

        await db
          .update(leads)
          .set({ lastReminderNotifiedDate: today })
          .where(eq(leads.id, l.id));

        if (isOverdue) overdueCount++;
        else dueCount++;
      }

      return NextResponse.json({
        success: true,
        dispatched: { dueToday: dueCount, overdue: overdueCount },
      });
    }

    if (action === "convertLeadToClient") {
      const { leadId, email, companyName } = body;
      const [lead] = await db.select().from(leads).where(eq(leads.id, Number(leadId)));
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const allComps = await db.select().from(companies);
      const targetCompany = allComps.find((c) => c.id === lead.companyId);
      if (targetCompany && !canAccessMarketingLeads(currentUser, targetCompany.code)) {
        return NextResponse.json(
          { error: `403 Forbidden: ${targetCompany.shortName}-এর লিড রূপান্তর করার অনুমতি আপনার নেই।` },
          { status: 403 }
        );
      }

      const existingClients = await db.select().from(clients);
      const clientCode = `CLI-${String(existingClients.length + 1).padStart(4, "0")}`;

      const [client] = await db
        .insert(clients)
        .values({
          clientCode,
          leadId: lead.id,
          name: lead.name,
          companyName: companyName || `${lead.name} Holdings`,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: email || "",
          address: lead.location,
          assignedStaffId: lead.assignedStaffId,
          totalInvoiced: "0.00",
          totalPaid: "0.00",
          outstandingBalance: "0.00",
        })
        .returning();

      await db
        .update(leads)
        .set({ status: "Won", convertedClientId: client.id })
        .where(eq(leads.id, lead.id));

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "Client",
        recordId: client.clientCode,
        afterData: { fromLead: lead.leadCode, clientCode: client.clientCode },
      });

      return NextResponse.json({ success: true, client });
    }

    if (action === "createClient") {
      const { name, companyName, phone, whatsapp, email, address } = body;
      if (!name || !phone) {
        return NextResponse.json({ error: "Client Name and Phone are required" }, { status: 400 });
      }
      const existingClients = await db.select().from(clients);
      const clientCode = `CLI-${String(existingClients.length + 1).padStart(4, "0")}`;

      const [client] = await db
        .insert(clients)
        .values({
          clientCode,
          name,
          companyName: companyName || "",
          phone,
          whatsapp: whatsapp || phone,
          email: email || "",
          address: address || "",
          assignedStaffId: currentUser.employeeId,
        })
        .returning();

      return NextResponse.json({ success: true, client });
    }

    if (action === "createQuotation") {
      const { leadId, clientId, projectId, service, items, discount, tax, terms, validUntil } = body;
      if (!service || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Service and at least 1 item required" }, { status: 400 });
      }

      const subtotal = items.reduce(
        (s: number, it: { quantity: number; rate: number }) =>
          s + Number(it.quantity) * Number(it.rate),
        0
      );
      const disc = Number(discount || 0);
      const tx = Number(tax || 0);
      const totalAmount = Math.max(0, subtotal - disc + tx);

      const existingQ = await db.select().from(quotations);
      const quotationNumber = `QUO-${String(existingQ.length + 1).padStart(4, "0")}`;

      const [q] = await db
        .insert(quotations)
        .values({
          quotationNumber,
          leadId: leadId ? Number(leadId) : null,
          clientId: clientId ? Number(clientId) : null,
          projectId: projectId ? Number(projectId) : null,
          service,
          items: items.map((it: { description: string; unit: string; quantity: number; rate: number }) => ({
            description: it.description,
            unit: it.unit || "LS",
            quantity: Number(it.quantity),
            rate: Number(it.rate),
            amount: Number(it.quantity) * Number(it.rate),
          })),
          subtotal: subtotal.toFixed(2),
          discount: disc.toFixed(2),
          tax: tx.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          terms: terms || "50% advance, 50% on completion.",
          validUntil: validUntil || "2026-12-31",
          status: "Sent",
          createdBy: currentUser.name,
        })
        .returning();

      if (leadId) {
        await db.update(leads).set({ status: "Quotation" }).where(eq(leads.id, Number(leadId)));
      }

      return NextResponse.json({ success: true, quotation: q });
    }

    if (action === "updateQuotationStatus") {
      const { quotationId, status } = body;
      const [updated] = await db
        .update(quotations)
        .set({ status })
        .where(eq(quotations.id, Number(quotationId)))
        .returning();
      return NextResponse.json({ success: true, quotation: updated });
    }

    // =========================================================================
    // 7. PROJECTS & SITES
    // =========================================================================
    if (action === "createProject") {
      const {
        clientId,
        quotationId,
        name,
        location,
        landSize,
        roadWidth,
        projectType,
        startDate,
        expectedCompletion,
        budget,
        managerId,
        engineerId,
      } = body;

      if (!clientId || !name || !location) {
        return NextResponse.json({ error: "Client, Project Name & Location required" }, { status: 400 });
      }

      const existingP = await db.select().from(projects);
      const projectCode = `PRJ-${String(existingP.length + 1).padStart(4, "0")}`;

      const [proj] = await db
        .insert(projects)
        .values({
          projectCode,
          clientId: Number(clientId),
          quotationId: quotationId ? Number(quotationId) : null,
          name,
          location,
          landSize: landSize || "8 Katha",
          roadWidth: roadWidth || "30 ft",
          projectType: projectType || "Residential Building",
          startDate: startDate || today,
          expectedCompletion: expectedCompletion || "2027-12-31",
          budget: Number(budget || 0).toFixed(2),
          managerId: managerId ? Number(managerId) : currentUser.employeeId,
          engineerId: engineerId ? Number(engineerId) : currentUser.employeeId,
          assignedStaffIds: [
            Number(managerId || currentUser.employeeId || 1),
            Number(engineerId || currentUser.employeeId || 1),
          ],
          progressPercent: 0,
          status: "Active",
        })
        .returning();

      return NextResponse.json({ success: true, project: proj });
    }

    if (action === "createSite") {
      const { projectId, name, location, siteManagerId, engineerId, workersCount } = body;
      if (!projectId || !name || !location) {
        return NextResponse.json({ error: "Project, Site Name & Location required" }, { status: 400 });
      }

      const existingS = await db.select().from(sites);
      const siteCode = `SITE-${String(existingS.length + 1).padStart(4, "0")}`;

      const [site] = await db
        .insert(sites)
        .values({
          siteCode,
          projectId: Number(projectId),
          name,
          location,
          siteManagerId: siteManagerId ? Number(siteManagerId) : currentUser.employeeId,
          engineerId: engineerId ? Number(engineerId) : currentUser.employeeId,
          workersCount: Number(workersCount || 15),
          progressPercent: 0,
          status: "Active",
        })
        .returning();

      return NextResponse.json({ success: true, site });
    }

    if (action === "submitSiteReport") {
      const {
        siteId,
        projectId,
        date,
        workDone,
        progressPercent,
        labourCount,
        materialsUsedSummary,
        siteExpenseAmount,
        problems,
        tomorrowPlan,
        photoUrl,
      } = body;

      if (!siteId || !projectId || !workDone) {
        return NextResponse.json({ error: "Site, Project, and Work Done are required" }, { status: 400 });
      }

      const existingSR = await db.select().from(siteReports);
      const reportCode = `SR-${String(existingSR.length + 1).padStart(4, "0")}`;
      const prog = Math.min(100, Math.max(0, Number(progressPercent || 0)));

      const [sr] = await db
        .insert(siteReports)
        .values({
          reportCode,
          siteId: Number(siteId),
          projectId: Number(projectId),
          reportedById: currentUser.employeeId,
          date: date || today,
          workDone,
          progressPercent: prog,
          labourCount: Number(labourCount || 0),
          materialsUsedSummary: materialsUsedSummary || "",
          siteExpenseAmount: Number(siteExpenseAmount || 0).toFixed(2),
          problems: problems || "",
          tomorrowPlan: tomorrowPlan || "",
          photoUrls: photoUrl ? [photoUrl] : [],
        })
        .returning();

      // Update Site progress & workers
      await db
        .update(sites)
        .set({
          progressPercent: prog,
          workersCount: Number(labourCount || 0),
          problems: problems || "",
        })
        .where(eq(sites.id, Number(siteId)));

      // Aggregate Site progress to Project dashboard
      const projectSites = await db
        .select()
        .from(sites)
        .where(eq(sites.projectId, Number(projectId)));
      if (projectSites.length > 0) {
        const avgProg = Math.round(
          projectSites.reduce((s, st) => s + Number(st.progressPercent || 0), 0) /
            projectSites.length
        );
        await db
          .update(projects)
          .set({ progressPercent: avgProg })
          .where(eq(projects.id, Number(projectId)));
      }

      return NextResponse.json({ success: true, siteReport: sr });
    }

    // =========================================================================
    // 8. MATERIAL & INVENTORY (Transactional Stock Formula Engine)
    // =========================================================================
    if (action === "createMaterial") {
      const { name, category, unit, warehouse, openingStock, unitCost, reorderLevel } = body;
      if (!name || !category || !unit) {
        return NextResponse.json({ error: "Material Name, Category & Unit required" }, { status: 400 });
      }
      if (Number(openingStock || 0) < 0 || Number(unitCost || 0) < 0) {
        return NextResponse.json({ error: "Stock and Unit Cost cannot be negative" }, { status: 400 });
      }

      const existingM = await db.select().from(materials);
      const materialCode = `MAT-${String(existingM.length + 1).padStart(4, "0")}`;
      const openQty = Number(openingStock || 0);
      const cost = Number(unitCost || 0);

      const [mat] = await db
        .insert(materials)
        .values({
          materialCode,
          name,
          category,
          unit,
          warehouse: warehouse || "Central Warehouse",
          openingStock: openQty.toFixed(2),
          currentStock: openQty.toFixed(2),
          unitCost: cost.toFixed(2),
          reorderLevel: Number(reorderLevel || 20).toFixed(2),
        })
        .returning();

      if (openQty > 0) {
        await db.insert(stockMovements).values({
          materialId: mat.id,
          movementType: "Opening",
          quantity: openQty.toFixed(2),
          unitCost: cost.toFixed(2),
          totalValue: (openQty * cost).toFixed(2),
          warehouseFrom: warehouse || "Central Warehouse",
          referenceCode: "OPENING",
          notes: "Initial opening stock",
          createdBy: currentUser.name,
          date: today,
        });
      }

      return NextResponse.json({ success: true, material: mat });
    }

    if (action === "recordStockMovement") {
      const {
        materialId,
        movementType,
        quantity,
        unitCost,
        projectId,
        siteId,
        warehouseFrom,
        warehouseTo,
        referenceCode,
        notes,
        recordAsProjectExpense,
      } = body;

      const result = await db.transaction(async (tx) => {
        const newStock = await recordStockMovementTx(tx, {
          materialId: Number(materialId),
          movementType,
          quantity: Number(quantity),
          unitCost: unitCost ? Number(unitCost) : undefined,
          projectId: projectId ? Number(projectId) : null,
          siteId: siteId ? Number(siteId) : null,
          warehouseFrom,
          warehouseTo,
          referenceCode,
          notes,
          createdBy: currentUser.name,
          date: today,
        });

        if (
          recordAsProjectExpense &&
          projectId &&
          (movementType === "Consumption" || movementType === "Issue")
        ) {
          const [mat] = await tx
            .select()
            .from(materials)
            .where(eq(materials.id, Number(materialId)));
          const expAmount = Number(quantity) * Number(mat.unitCost || 0);
          if (expAmount > 0) {
            const allExp = await tx.select().from(expenses);
            const expCode = `EXP-${String(allExp.length + 1).padStart(4, "0")}`;
            await tx.insert(expenses).values({
              expenseCode: expCode,
              date: today,
              category: "Material",
              amount: expAmount.toFixed(2),
              projectId: Number(projectId),
              siteId: siteId ? Number(siteId) : null,
              employeeId: currentUser.employeeId,
              vendorName: "Warehouse Inventory Issue",
              paymentMethod: "Payable",
              description: `Material ${movementType}: ${quantity} ${mat.unit} ${mat.name}`,
              approvalStatus: "Approved",
              approvedBy: currentUser.name,
            });
          }
        }

        return newStock;
      });

      return NextResponse.json({ success: true, newStock: result });
    }

    // =========================================================================
    // 9. SUPPLIERS & PROCUREMENT (PR -> PO -> GRN Receive -> Stock + Payable + Journal)
    // =========================================================================
    if (action === "createSupplier") {
      const { name, phone, email, address, contactPerson, productsProvided } = body;
      if (!name || !phone) {
        return NextResponse.json({ error: "Supplier Name and Phone required" }, { status: 400 });
      }
      const existingSup = await db.select().from(suppliers);
      const supplierCode = `SUP-${String(existingSup.length + 1).padStart(4, "0")}`;

      const [sup] = await db
        .insert(suppliers)
        .values({
          supplierCode,
          name,
          phone,
          email: email || "",
          address: address || "",
          contactPerson: contactPerson || "",
          productsProvided: productsProvided || "",
        })
        .returning();

      return NextResponse.json({ success: true, supplier: sup });
    }

    if (action === "createPurchaseRequest") {
      const { projectId, siteId, items, notes } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "At least 1 material item required" }, { status: 400 });
      }
      const existingPR = await db.select().from(purchaseRequests);
      const prCode = `PR-${String(existingPR.length + 1).padStart(4, "0")}`;
      const totalEstimated = items.reduce(
        (s: number, i: { quantity: number; estimatedRate: number }) =>
          s + Number(i.quantity) * Number(i.estimatedRate || 0),
        0
      );

      const [pr] = await db
        .insert(purchaseRequests)
        .values({
          prCode,
          projectId: projectId ? Number(projectId) : null,
          siteId: siteId ? Number(siteId) : null,
          requestedById: currentUser.employeeId,
          items,
          totalEstimated: totalEstimated.toFixed(2),
          status: "Pending",
          notes: notes || "",
          date: today,
        })
        .returning();

      await createNotification({
        targetRole: "Manager",
        type: "Purchase Request",
        title: `New Site Purchase Request: ${prCode}`,
        message: `Estimated value: ৳${totalEstimated.toLocaleString()} requested by ${currentUser.name}.`,
        relatedUrl: "/purchase-orders",
        relatedEntityCode: prCode,
      });

      return NextResponse.json({ success: true, purchaseRequest: pr });
    }

    if (action === "approvePurchaseRequest") {
      const { prId } = body;
      const [pr] = await db
        .update(purchaseRequests)
        .set({ status: "Approved", approvedBy: currentUser.name })
        .where(eq(purchaseRequests.id, Number(prId)))
        .returning();
      return NextResponse.json({ success: true, purchaseRequest: pr });
    }

    if (action === "createPurchaseOrder") {
      const { prId, supplierId, projectId, siteId, items, supplierQuotationRef } = body;
      if (!supplierId || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Supplier and PO items required" }, { status: 400 });
      }

      const existingPO = await db.select().from(purchaseOrders);
      const poCode = `PO-${String(existingPO.length + 1).padStart(4, "0")}`;
      const formattedItems = items.map(
        (it: {
          materialId: number;
          materialName: string;
          orderedQty: number;
          unit: string;
          rate: number;
        }) => ({
          materialId: Number(it.materialId),
          materialName: it.materialName,
          orderedQty: Number(it.orderedQty),
          receivedQty: 0,
          unit: it.unit || "Unit",
          rate: Number(it.rate),
          total: Number(it.orderedQty) * Number(it.rate),
        })
      );
      const totalAmount = formattedItems.reduce((s, i) => s + i.total, 0);

      const [po] = await db
        .insert(purchaseOrders)
        .values({
          poCode,
          prId: prId ? Number(prId) : null,
          supplierId: Number(supplierId),
          projectId: projectId ? Number(projectId) : null,
          siteId: siteId ? Number(siteId) : null,
          items: formattedItems,
          totalAmount: totalAmount.toFixed(2),
          receivedAmount: "0.00",
          status: "Approved",
          supplierQuotationRef: supplierQuotationRef || "",
          approvedBy: currentUser.name,
          date: today,
        })
        .returning();

      if (prId) {
        await db
          .update(purchaseRequests)
          .set({ status: "Converted to PO" })
          .where(eq(purchaseRequests.id, Number(prId)));
      }

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "PurchaseOrder",
        recordId: poCode,
        afterData: po,
      });

      return NextResponse.json({ success: true, purchaseOrder: po });
    }

    if (action === "receivePurchaseOrder") {
      // TRANSACTIONAL GRN: Updates PO + Increases Inventory Stock + Creates Supplier Bill + Updates Supplier Payable + Posts Journal Entry!
      const { poId, receiveRatio = 1 } = body; // receiveRatio 1 = Full receive, 0.5 = Partial receive

      const result = await db.transaction(async (tx) => {
        const [po] = await tx
          .select()
          .from(purchaseOrders)
          .where(eq(purchaseOrders.id, Number(poId)));

        if (!po) throw new Error("Purchase Order not found");
        if (po.status === "Received" || po.status === "Cancelled") {
          throw new Error(`PO is already ${po.status}`);
        }

        const ratio = Math.min(1, Math.max(0.1, Number(receiveRatio)));
        let batchValue = 0;

        const updatedItems = [];
        for (const item of po.items) {
          const remainingQty = Math.max(0, item.orderedQty - item.receivedQty);
          const qtyNow = Number((remainingQty * ratio).toFixed(2));
          if (qtyNow > 0) {
            await recordStockMovementTx(tx, {
              materialId: item.materialId,
              movementType: "Purchase",
              quantity: qtyNow,
              unitCost: item.rate,
              projectId: po.projectId,
              siteId: po.siteId,
              referenceCode: po.poCode,
              notes: `GRN Receive against ${po.poCode}`,
              createdBy: currentUser.name,
              date: today,
            });
            batchValue += qtyNow * item.rate;
          }
          updatedItems.push({
            ...item,
            receivedQty: Number((item.receivedQty + qtyNow).toFixed(2)),
          });
        }

        const allFullyReceived = updatedItems.every(
          (i) => i.receivedQty >= i.orderedQty - 0.01
        );
        const newPoStatus = allFullyReceived ? "Received" : "Partially Received";
        const newReceivedAmount = Number(po.receivedAmount) + batchValue;

        await tx
          .update(purchaseOrders)
          .set({
            items: updatedItems,
            receivedAmount: newReceivedAmount.toFixed(2),
            status: newPoStatus,
          })
          .where(eq(purchaseOrders.id, po.id));

        // Create Supplier Bill
        const existingBills = await tx.select().from(supplierBills);
        const billCode = `BILL-${String(existingBills.length + 1).padStart(4, "0")}`;

        const [bill] = await tx
          .insert(supplierBills)
          .values({
            billCode,
            poId: po.id,
            supplierId: po.supplierId,
            projectId: po.projectId,
            totalAmount: batchValue.toFixed(2),
            paidAmount: "0.00",
            outstandingAmount: batchValue.toFixed(2),
            status: "Unpaid",
            date: today,
            dueDate: "2026-06-30",
          })
          .returning();

        // Update Supplier Payable dynamically
        const [sup] = await tx
          .select()
          .from(suppliers)
          .where(eq(suppliers.id, po.supplierId));
        if (sup) {
          const newBilled = Number(sup.totalBilled) + batchValue;
          const newPayable = newBilled - Number(sup.totalPaid);
          await tx
            .update(suppliers)
            .set({
              totalBilled: newBilled.toFixed(2),
              outstandingPayable: newPayable.toFixed(2),
            })
            .where(eq(suppliers.id, sup.id));
        }

        // Double-Entry Journal: Debit Inventory (1200) / Credit Accounts Payable (2010)
        if (batchValue > 0) {
          await postDoubleEntryJournalTx(tx, {
            date: today,
            referenceType: "Purchase",
            referenceCode: `${po.poCode}/${billCode}`,
            description: `GRN Material Receive against ${po.poCode}`,
            createdBy: currentUser.name,
            lines: [
              { accountCode: "1200", debit: batchValue, credit: 0 },
              { accountCode: "2010", debit: 0, credit: batchValue },
            ],
          });
        }

        return { poCode: po.poCode, bill, newPoStatus };
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "GRN_RECEIVE",
        entity: "PurchaseOrder",
        recordId: result.poCode,
        afterData: result,
      });

      return NextResponse.json({ success: true, result });
    }

    // =========================================================================
    // 10. LABOUR & CONTRACTOR
    // =========================================================================
    if (action === "createLabour") {
      const { name, category, dailyRate, phone, projectId, assignedSiteId, workDays } = body;
      if (!name || !dailyRate) {
        return NextResponse.json({ error: "Labour Name and Daily Rate required" }, { status: 400 });
      }
      const existingL = await db.select().from(labours);
      const labourCode = `LAB-${String(existingL.length + 1).padStart(4, "0")}`;
      const days = Number(workDays || 0);
      const rate = Number(dailyRate);
      const earned = days * rate;

      const [lab] = await db
        .insert(labours)
        .values({
          labourCode,
          name,
          category: category || "Mason",
          dailyRate: rate.toFixed(2),
          phone: phone || "",
          projectId: projectId ? Number(projectId) : null,
          assignedSiteId: assignedSiteId ? Number(assignedSiteId) : null,
          totalWorkDays: days.toFixed(2),
          totalEarned: earned.toFixed(2),
          totalPaid: "0.00",
          dueAmount: earned.toFixed(2),
        })
        .returning();

      return NextResponse.json({ success: true, labour: lab });
    }

    if (action === "createContractor") {
      const {
        name,
        phone,
        specialty,
        projectId,
        siteId,
        workOrderRef,
        contractAmount,
        approvedBillAmount,
      } = body;
      if (!name || !specialty) {
        return NextResponse.json({ error: "Contractor Name and Specialty required" }, { status: 400 });
      }
      const existingC = await db.select().from(contractors);
      const contractorCode = `CON-${String(existingC.length + 1).padStart(4, "0")}`;
      const approved = Number(approvedBillAmount || 0);

      const [con] = await db
        .insert(contractors)
        .values({
          contractorCode,
          name,
          phone: phone || "",
          specialty,
          projectId: projectId ? Number(projectId) : null,
          siteId: siteId ? Number(siteId) : null,
          workOrderRef: workOrderRef || `WO-${Date.now().toString().slice(-4)}`,
          contractAmount: Number(contractAmount || approved).toFixed(2),
          approvedBillAmount: approved.toFixed(2),
          paidAmount: "0.00",
          outstandingDue: approved.toFixed(2),
        })
        .returning();

      return NextResponse.json({ success: true, contractor: con });
    }

    // =========================================================================
    // 11. EXPENSE MANAGEMENT (Project Cost + Accounting Integration)
    // =========================================================================
    if (action === "createExpense") {
      const {
        date,
        category,
        amount,
        projectId,
        siteId,
        vendorName,
        paymentMethod,
        description,
      } = body;

      const amt = Number(amount);
      if (!category || !description || isNaN(amt) || amt <= 0) {
        return NextResponse.json(
          { error: "Valid positive amount, category, and description required" },
          { status: 400 }
        );
      }

      const canAutoApprove = hasPermission(currentUser, "expenses.approve");

      const exp = await db.transaction(async (tx) => {
        const existingE = await tx.select().from(expenses);
        const expenseCode = `EXP-${String(existingE.length + 1).padStart(4, "0")}`;

        const [created] = await tx
          .insert(expenses)
          .values({
            expenseCode,
            date: date || today,
            category,
            amount: amt.toFixed(2),
            projectId: projectId ? Number(projectId) : null,
            siteId: siteId ? Number(siteId) : null,
            employeeId: currentUser.employeeId,
            vendorName: vendorName || "",
            paymentMethod: paymentMethod || "Cash",
            description,
            approvalStatus: canAutoApprove ? "Approved" : "Pending",
            approvedBy: canAutoApprove ? currentUser.name : null,
          })
          .returning();

        if (canAutoApprove) {
          const creditAcc =
            paymentMethod === "Bank"
              ? "1020"
              : paymentMethod === "Payable"
              ? "2010"
              : "1010";

          await postDoubleEntryJournalTx(tx, {
            date: date || today,
            referenceType: "Expense",
            referenceCode: expenseCode,
            description: `${category} Expense: ${description}`,
            createdBy: currentUser.name,
            lines: [
              { accountCode: "5010", debit: amt, credit: 0 },
              { accountCode: creditAcc, debit: 0, credit: amt },
            ],
          });
        }

        return created;
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "Expense",
        recordId: exp.expenseCode,
        afterData: exp,
      });

      return NextResponse.json({ success: true, expense: exp });
    }

    if (action === "approveExpense") {
      if (!hasPermission(currentUser, "expenses.approve")) {
        return NextResponse.json({ error: "Forbidden: Accounts/Admin approval required" }, { status: 403 });
      }
      const { expenseId } = body;
      await db.transaction(async (tx) => {
        const [exp] = await tx
          .select()
          .from(expenses)
          .where(eq(expenses.id, Number(expenseId)));
        if (!exp || exp.approvalStatus === "Approved") return;

        await tx
          .update(expenses)
          .set({ approvalStatus: "Approved", approvedBy: currentUser.name })
          .where(eq(expenses.id, exp.id));

        const creditAcc = exp.paymentMethod === "Bank" ? "1020" : "1010";
        await postDoubleEntryJournalTx(tx, {
          date: today,
          referenceType: "Expense",
          referenceCode: exp.expenseCode,
          description: `Approved Expense ${exp.expenseCode}: ${exp.description}`,
          createdBy: currentUser.name,
          lines: [
            { accountCode: "5010", debit: Number(exp.amount), credit: 0 },
            { accountCode: creditAcc, debit: 0, credit: Number(exp.amount) },
          ],
        });
      });

      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // 12. ACCOUNTS RECEIVABLE (INVOICES) & ALL PAYMENTS (TRANSACTIONAL)
    // =========================================================================
    if (action === "createInvoice") {
      const { clientId, projectId, quotationId, totalAmount, dueDate, notes, items } = body;
      const amt = Number(totalAmount);
      if (!clientId || isNaN(amt) || amt <= 0) {
        return NextResponse.json({ error: "Client and positive Invoice amount required" }, { status: 400 });
      }

      const inv = await db.transaction(async (tx) => {
        const existingInv = await tx.select().from(invoices);
        const invoiceCode = `INV-${String(existingInv.length + 1).padStart(4, "0")}`;

        const [created] = await tx
          .insert(invoices)
          .values({
            invoiceCode,
            clientId: Number(clientId),
            projectId: projectId ? Number(projectId) : null,
            quotationId: quotationId ? Number(quotationId) : null,
            items: items || [
              {
                description: notes || "Project Construction Running Bill",
                unit: "LS",
                quantity: 1,
                rate: amt,
                amount: amt,
              },
            ],
            totalAmount: amt.toFixed(2),
            paidAmount: "0.00",
            outstandingAmount: amt.toFixed(2),
            date: today,
            dueDate: dueDate || "2026-06-30",
            status: "Unpaid",
            notes: notes || "",
          })
          .returning();

        // Update Client totalInvoiced & outstandingBalance
        const [cli] = await tx
          .select()
          .from(clients)
          .where(eq(clients.id, Number(clientId)));
        if (cli) {
          const newInvoiced = Number(cli.totalInvoiced) + amt;
          const newOut = newInvoiced - Number(cli.totalPaid);
          await tx
            .update(clients)
            .set({
              totalInvoiced: newInvoiced.toFixed(2),
              outstandingBalance: newOut.toFixed(2),
            })
            .where(eq(clients.id, cli.id));
        }

        // Post Double-Entry Journal: Debit AR (1100) / Credit Revenue (4010)
        await postDoubleEntryJournalTx(tx, {
          date: today,
          referenceType: "Invoice",
          referenceCode: invoiceCode,
          description: `Client Invoice ${invoiceCode} billed`,
          createdBy: currentUser.name,
          lines: [
            { accountCode: "1100", debit: amt, credit: 0 },
            { accountCode: "4010", debit: 0, credit: amt },
          ],
        });

        return created;
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "Invoice",
        recordId: inv.invoiceCode,
        afterData: inv,
      });

      return NextResponse.json({ success: true, invoice: inv });
    }

    if (action === "recordPayment") {
      // STRICT TRANSACTIONAL PAYMENT + BALANCE UPDATE + DOUBLE-ENTRY JOURNAL
      const {
        paymentType, // Client Receipt, Supplier Payment, Contractor Payment, Labour Payment, Expense Payment
        amount,
        method, // Cash or Bank
        referenceCode,
        invoiceId,
        supplierId,
        supplierBillId,
        contractorId,
        labourId,
        projectId,
        notes,
      } = body;

      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        return NextResponse.json({ error: "Payment amount must be greater than zero" }, { status: 400 });
      }

      const cashOrBankCode = method === "Cash" ? "1010" : "1020";

      const payRecord = await db.transaction(async (tx) => {
        const existingPay = await tx.select().from(payments);
        const paymentCode = `PAY-${String(existingPay.length + 1).padStart(4, "0")}`;

        const [cashBankAcc] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.code, cashOrBankCode));

        let linkedClientId: number | null = null;

        if (paymentType === "Client Receipt") {
          if (!invoiceId) throw new Error("Invoice ID is required for Client Receipt");
          const [inv] = await tx
            .select()
            .from(invoices)
            .where(eq(invoices.id, Number(invoiceId)));
          if (!inv) throw new Error("Invoice not found");
          if (amt > Number(inv.outstandingAmount) + 0.01) {
            throw new Error(
              `Payment (৳${amt}) exceeds invoice outstanding balance (৳${inv.outstandingAmount})`
            );
          }

          linkedClientId = inv.clientId;
          const newPaid = Number(inv.paidAmount) + amt;
          const newOut = Math.max(0, Number(inv.totalAmount) - newPaid);
          const newStatus = newOut <= 0.01 ? "Paid" : "Partial";

          await tx
            .update(invoices)
            .set({
              paidAmount: newPaid.toFixed(2),
              outstandingAmount: newOut.toFixed(2),
              status: newStatus,
            })
            .where(eq(invoices.id, inv.id));

          const [cli] = await tx
            .select()
            .from(clients)
            .where(eq(clients.id, inv.clientId));
          if (cli) {
            const cPaid = Number(cli.totalPaid) + amt;
            const cOut = Math.max(0, Number(cli.totalInvoiced) - cPaid);
            await tx
              .update(clients)
              .set({
                totalPaid: cPaid.toFixed(2),
                outstandingBalance: cOut.toFixed(2),
              })
              .where(eq(clients.id, cli.id));
          }

          // Debit Cash/Bank, Credit Accounts Receivable (1100)
          await postDoubleEntryJournalTx(tx, {
            date: today,
            referenceType: "Payment",
            referenceCode: paymentCode,
            description: `Client Payment against ${inv.invoiceCode}`,
            createdBy: currentUser.name,
            lines: [
              { accountCode: cashOrBankCode, debit: amt, credit: 0 },
              { accountCode: "1100", debit: 0, credit: amt },
            ],
          });
        } else if (paymentType === "Supplier Payment") {
          if (!supplierId) throw new Error("Supplier ID is required");
          const [sup] = await tx
            .select()
            .from(suppliers)
            .where(eq(suppliers.id, Number(supplierId)));
          if (!sup) throw new Error("Supplier not found");

          const sPaid = Number(sup.totalPaid) + amt;
          const sOut = Math.max(0, Number(sup.totalBilled) - sPaid);
          await tx
            .update(suppliers)
            .set({
              totalPaid: sPaid.toFixed(2),
              outstandingPayable: sOut.toFixed(2),
            })
            .where(eq(suppliers.id, sup.id));

          if (supplierBillId) {
            const [bill] = await tx
              .select()
              .from(supplierBills)
              .where(eq(supplierBills.id, Number(supplierBillId)));
            if (bill) {
              const bPaid = Number(bill.paidAmount) + amt;
              const bOut = Math.max(0, Number(bill.totalAmount) - bPaid);
              await tx
                .update(supplierBills)
                .set({
                  paidAmount: bPaid.toFixed(2),
                  outstandingAmount: bOut.toFixed(2),
                  status: bOut <= 0.01 ? "Paid" : "Partial",
                })
                .where(eq(supplierBills.id, bill.id));
            }
          }

          // Debit Accounts Payable (2010), Credit Cash/Bank
          await postDoubleEntryJournalTx(tx, {
            date: today,
            referenceType: "Payment",
            referenceCode: paymentCode,
            description: `Supplier Payment to ${sup.name}`,
            createdBy: currentUser.name,
            lines: [
              { accountCode: "2010", debit: amt, credit: 0 },
              { accountCode: cashOrBankCode, debit: 0, credit: amt },
            ],
          });
        } else if (paymentType === "Contractor Payment") {
          if (!contractorId) throw new Error("Contractor ID required");
          const [con] = await tx
            .select()
            .from(contractors)
            .where(eq(contractors.id, Number(contractorId)));
          if (!con) throw new Error("Contractor not found");

          const cPaid = Number(con.paidAmount) + amt;
          const cDue = Math.max(0, Number(con.approvedBillAmount) - cPaid);
          await tx
            .update(contractors)
            .set({
              paidAmount: cPaid.toFixed(2),
              outstandingDue: cDue.toFixed(2),
            })
            .where(eq(contractors.id, con.id));

          // Debit Contractor Payable (2020), Credit Cash/Bank
          await postDoubleEntryJournalTx(tx, {
            date: today,
            referenceType: "Payment",
            referenceCode: paymentCode,
            description: `Contractor Payment to ${con.name}`,
            createdBy: currentUser.name,
            lines: [
              { accountCode: "2020", debit: amt, credit: 0 },
              { accountCode: cashOrBankCode, debit: 0, credit: amt },
            ],
          });
        } else if (paymentType === "Labour Payment") {
          if (!labourId) throw new Error("Labour ID required");
          const [lab] = await tx
            .select()
            .from(labours)
            .where(eq(labours.id, Number(labourId)));
          if (!lab) throw new Error("Labour not found");

          const lPaid = Number(lab.totalPaid) + amt;
          const lDue = Math.max(0, Number(lab.totalEarned) - lPaid);
          await tx
            .update(labours)
            .set({
              totalPaid: lPaid.toFixed(2),
              dueAmount: lDue.toFixed(2),
            })
            .where(eq(labours.id, lab.id));

          await postDoubleEntryJournalTx(tx, {
            date: today,
            referenceType: "Payment",
            referenceCode: paymentCode,
            description: `Labour Muster Roll Payment to ${lab.name}`,
            createdBy: currentUser.name,
            lines: [
              { accountCode: "5010", debit: amt, credit: 0 },
              { accountCode: cashOrBankCode, debit: 0, credit: amt },
            ],
          });
        }

        const [createdPayment] = await tx
          .insert(payments)
          .values({
            paymentCode,
            paymentType,
            amount: amt.toFixed(2),
            date: today,
            method: method || "Bank",
            accountId: cashBankAcc?.id ?? null,
            referenceCode: referenceCode || `REF-${Date.now().toString().slice(-4)}`,
            clientId: linkedClientId,
            invoiceId: invoiceId ? Number(invoiceId) : null,
            supplierId: supplierId ? Number(supplierId) : null,
            supplierBillId: supplierBillId ? Number(supplierBillId) : null,
            contractorId: contractorId ? Number(contractorId) : null,
            labourId: labourId ? Number(labourId) : null,
            projectId: projectId ? Number(projectId) : null,
            createdBy: currentUser.name,
            notes: notes || "",
          })
          .returning();

        return createdPayment;
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "PAYMENT",
        entity: "Payment",
        recordId: payRecord.paymentCode,
        afterData: payRecord,
      });

      return NextResponse.json({ success: true, payment: payRecord });
    }

    if (action === "cashBankTransfer") {
      // Cash -> Bank or Bank -> Cash Double-Entry Transfer
      const { fromAccountCode, toAccountCode, amount, description } = body;
      const amt = Number(amount);
      if (!fromAccountCode || !toAccountCode || fromAccountCode === toAccountCode || amt <= 0) {
        return NextResponse.json({ error: "Valid transfer accounts and positive amount required" }, { status: 400 });
      }

      const jv = await db.transaction(async (tx) => {
        return await postDoubleEntryJournalTx(tx, {
          date: today,
          referenceType: "Transfer",
          referenceCode: `TRF-${Date.now().toString().slice(-4)}`,
          description: description || `Internal Fund Transfer (${fromAccountCode} -> ${toAccountCode})`,
          createdBy: currentUser.name,
          lines: [
            { accountCode: toAccountCode, debit: amt, credit: 0 },
            { accountCode: fromAccountCode, debit: 0, credit: amt },
          ],
        });
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "JOURNAL_TRANSFER",
        entity: "JournalEntry",
        recordId: jv.voucherNo,
        afterData: jv,
      });

      return NextResponse.json({ success: true, journalEntry: jv });
    }

    // =========================================================================
    // 13. PAYROLL MODULE (Exact Formula: Basic + Allowance + Overtime + Bonus - Advance - Deduction - Tax)
    // =========================================================================
    if (action === "generatePayroll") {
      if (!hasPermission(currentUser, "payroll.manage")) {
        return NextResponse.json({ error: "Forbidden: HR/Accounts permission required" }, { status: 403 });
      }
      const {
        employeeId,
        salaryMonth,
        basicSalary,
        allowance,
        overtimePay,
        bonus,
        advanceDeduction,
        otherDeduction,
        taxDeduction,
      } = body;

      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, Number(employeeId)));
      if (!emp) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      const basic = Number(basicSalary !== undefined ? basicSalary : emp.basicSalary);
      const allow = Number(allowance !== undefined ? allowance : emp.allowance);
      const ot = Number(overtimePay || 0);
      const bon = Number(bonus || 0);
      const adv = Number(advanceDeduction !== undefined ? advanceDeduction : emp.advanceBalance);
      const ded = Number(otherDeduction !== undefined ? otherDeduction : emp.deductionDefault);
      const tax = Number(taxDeduction || 0);

      // Exact Net Salary Formula
      const netSalary = basic + allow + ot + bon - adv - ded - tax;

      const empAttendances = await db
        .select()
        .from(attendances)
        .where(eq(attendances.employeeId, emp.id));
      const presentDays = empAttendances.filter(
        (a) => a.status === "Present" || a.status === "Late"
      ).length || 25;
      const lateDays = empAttendances.filter((a) => a.status === "Late").length;
      const leaveDays = empAttendances.filter((a) => a.status === "Leave").length;
      const totalOtHours = empAttendances.reduce(
        (s, a) => s + Number(a.overtimeHours || 0),
        0
      );

      const existingPr = await db.select().from(payrolls);
      const payrollCode = `PAYR-${String(existingPr.length + 1).padStart(4, "0")}`;

      const [pr] = await db
        .insert(payrolls)
        .values({
          payrollCode,
          employeeId: emp.id,
          salaryMonth: salaryMonth || "2026-04",
          workingDays: 26,
          presentDays,
          lateDays,
          leaveDays,
          overtimeHours: totalOtHours.toFixed(2),
          basicSalary: basic.toFixed(2),
          allowance: allow.toFixed(2),
          overtimePay: ot.toFixed(2),
          bonus: bon.toFixed(2),
          advanceDeduction: adv.toFixed(2),
          otherDeduction: ded.toFixed(2),
          taxDeduction: tax.toFixed(2),
          netSalary: netSalary.toFixed(2),
          status: "Approved",
          approvedBy: currentUser.name,
        })
        .returning();

      return NextResponse.json({ success: true, payroll: pr });
    }

    if (action === "disbursePayroll") {
      if (!hasPermission(currentUser, "payroll.manage")) {
        return NextResponse.json({ error: "Forbidden: Accounts/HR permission required" }, { status: 403 });
      }
      const { payrollId, method = "Bank" } = body;

      const updatedPr = await db.transaction(async (tx) => {
        const [pr] = await tx
          .select()
          .from(payrolls)
          .where(eq(payrolls.id, Number(payrollId)));
        if (!pr) throw new Error("Payroll record not found");
        if (pr.status === "Paid") throw new Error("Payroll already disbursed");

        const net = Number(pr.netSalary);
        const accCode = method === "Cash" ? "1010" : "1020";

        const existingPay = await tx.select().from(payments);
        const paymentCode = `PAY-${String(existingPay.length + 1).padStart(4, "0")}`;

        const [pay] = await tx
          .insert(payments)
          .values({
            paymentCode,
            paymentType: "Salary Payment",
            amount: net.toFixed(2),
            date: today,
            method,
            referenceCode: pr.payrollCode,
            employeeId: pr.employeeId,
            payrollId: pr.id,
            createdBy: currentUser.name,
            notes: `Salary payment for ${pr.salaryMonth} (${pr.payrollCode})`,
          })
          .returning();

        // Double-Entry Journal: Debit Salary Expense (5020) / Credit Cash/Bank (1010/1020)
        await postDoubleEntryJournalTx(tx, {
          date: today,
          referenceType: "Payroll",
          referenceCode: pr.payrollCode,
          description: `Salary Disbursement ${pr.payrollCode} (${pr.salaryMonth})`,
          createdBy: currentUser.name,
          lines: [
            { accountCode: "5020", debit: net, credit: 0 },
            { accountCode: accCode, debit: 0, credit: net },
          ],
        });

        const [updated] = await tx
          .update(payrolls)
          .set({
            status: "Paid",
            paidAt: new Date(),
            paymentId: pay.id,
          })
          .where(eq(payrolls.id, pr.id))
          .returning();

        return updated;
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "PAYROLL_DISBURSE",
        entity: "Payroll",
        recordId: updatedPr.payrollCode,
        afterData: updatedPr,
      });

      return NextResponse.json({ success: true, payroll: updatedPr });
    }

    // =========================================================================
    // 14. LEAVE MANAGEMENT (Auto-reflects in Attendance when Approved)
    // =========================================================================
    if (action === "applyLeave") {
      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        body.employeeId &&
        Number(body.employeeId) !== currentUser.employeeId
      ) {
        return NextResponse.json(
          { error: "403 Forbidden: অন্য কর্মকর্তার ছুটির আবেদন করা সম্পূর্ণ নিষিদ্ধ।" },
          { status: 403 }
        );
      }
      const employeeId = Number(currentUser.employeeId || body.employeeId || 1);
      const { leaveType, startDate, endDate, totalDays, reason } = body;
      if (!leaveType || !startDate || !endDate || !reason) {
        return NextResponse.json({ error: "All leave application fields required" }, { status: 400 });
      }

      const existingL = await db.select().from(leaveRequests);
      const leaveCode = `LV-${String(existingL.length + 1).padStart(4, "0")}`;

      const [lv] = await db
        .insert(leaveRequests)
        .values({
          leaveCode,
          employeeId,
          leaveType,
          startDate,
          endDate,
          totalDays: Number(totalDays || 1),
          reason,
          status: "Pending",
        })
        .returning();

      await createNotification({
        targetRole: "HR",
        type: "Leave Request",
        title: `Leave Application: ${leaveCode}`,
        message: `${currentUser.name} requested ${totalDays || 1} day(s) ${leaveType} leave (${startDate} to ${endDate}).`,
        relatedUrl: "/leave",
        relatedEntityCode: leaveCode,
      });

      return NextResponse.json({ success: true, leave: lv });
    }

    if (action === "approveLeave") {
      if (!hasPermission(currentUser, "leave.approve")) {
        return NextResponse.json({ error: "Forbidden: Manager/HR permission required" }, { status: 403 });
      }
      const { leaveId, decision } = body; // Approved or Rejected
      const [lv] = await db
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.id, Number(leaveId)));
      if (!lv) {
        return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
      }

      const [updated] = await db
        .update(leaveRequests)
        .set({
          status: decision,
          managerApprovedBy: currentUser.name,
          hrApprovedBy: currentUser.name,
        })
        .where(eq(leaveRequests.id, lv.id))
        .returning();

      // Automatically reflect approved leave in Attendance!
      if (decision === "Approved") {
        await db.insert(attendances).values({
          employeeId: lv.employeeId,
          date: lv.startDate,
          checkIn: null,
          checkOut: null,
          status: "Leave",
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          morningHours: "0.00",
          afternoonHours: "0.00",
          workingHours: "0.00",
          overtimeHours: "0.00",
          isApproved: true,
          notes: `Approved ${lv.leaveType} Leave (${lv.leaveCode})`,
        });
      }

      await createNotification({
        targetRole: "All",
        type: "Leave Approved/Rejected",
        title: `Leave ${decision}: ${lv.leaveCode}`,
        message: `Leave request ${lv.leaveCode} (${lv.leaveType}: ${lv.startDate} to ${lv.endDate}) has been ${decision} by ${currentUser.name}.`,
        createdBy: currentUser.name,
        relatedUrl: "/leave",
        relatedEntityCode: lv.leaveCode,
      });

      return NextResponse.json({ success: true, leave: updated });
    }

    // =========================================================================
    // 15. PERFORMANCE REVIEW (Real Activity Calculation)
    // =========================================================================
    if (action === "generatePerformanceReview") {
      const { employeeId, period, managerReviewPoints, managerComments } = body;
      const empId = Number(employeeId);

      // Compute real activity metrics from DB
      const empAtt = await db.select().from(attendances).where(eq(attendances.employeeId, empId));
      const empTasks = await db.select().from(tasks).where(eq(tasks.assignedTo, empId));
      const empDaily = await db.select().from(dailyWorks).where(eq(dailyWorks.employeeId, empId));
      const empFollowups = await db.select().from(leadFollowups).where(eq(leadFollowups.staffId, empId));

      const presentCount = empAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
      const lateCount = empAtt.filter((a) => a.status === "Late").length;
      const attendanceScore = Math.min(25, Math.max(10, presentCount * 5 - lateCount * 2));

      const completedTasks = empTasks.filter((t) => t.status === "Completed" || t.status === "Review").length;
      const avgProgress =
        empTasks.length > 0
          ? empTasks.reduce((s, t) => s + t.progressPercent, 0) / empTasks.length
          : 80;
      const taskScore = Math.min(25, Math.round((avgProgress / 100) * 20 + completedTasks * 2));

      const dailyUpdateScore = Math.min(20, Math.max(12, empDaily.length * 6));
      const followUpScore = Math.min(15, Math.max(10, empFollowups.length * 5));
      const projectContributionScore = 12;
      const mgrPts = Math.min(10, Math.max(0, Number(managerReviewPoints || 8)));

      const totalPoints = Math.min(
        100,
        attendanceScore +
          taskScore +
          dailyUpdateScore +
          followUpScore +
          projectContributionScore +
          mgrPts
      );

      const [rev] = await db
        .insert(performanceReviews)
        .values({
          employeeId: empId,
          period: period || "2026-04",
          attendanceScore,
          taskScore,
          dailyUpdateScore,
          followUpScore,
          projectContributionScore,
          managerReviewPoints: mgrPts,
          totalPoints,
          managerComments: managerComments || "Evaluated based on real ERP operational metrics.",
          reviewedBy: currentUser.name,
        })
        .returning();

      return NextResponse.json({ success: true, review: rev });
    }

    // =========================================================================
    // 16. DOCUMENT MANAGEMENT
    // =========================================================================
    if (action === "uploadDocument") {
      const {
        name,
        category,
        fileType,
        fileSize,
        fileDataUrl,
        relatedEntityCode,
        minRoleRequired,
      } = body;

      if (!name || !category) {
        return NextResponse.json({ error: "Document name and category required" }, { status: 400 });
      }

      const existingD = await db.select().from(documents);
      const docCode = `DOC-${String(existingD.length + 1).padStart(4, "0")}`;

      const [doc] = await db
        .insert(documents)
        .values({
          docCode,
          name,
          category,
          fileType: fileType || "PDF",
          fileSize: fileSize || "420 KB",
          fileDataUrl:
            fileDataUrl ||
            "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLUAA5AIAVj4EagplbmRzdHJlYW0KZW5kb2JqCg==",
          relatedEntityCode: relatedEntityCode || "",
          uploadedBy: currentUser.name,
          minRoleRequired: minRoleRequired || "Staff",
        })
        .returning();

      return NextResponse.json({ success: true, document: doc });
    }

    // =========================================================================
    // 17. NOTIFICATIONS
    // =========================================================================
    if (action === "markNotificationRead") {
      const { notificationId } = body;
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, Number(notificationId)));
      return NextResponse.json({ success: true });
    }

    if (action === "markAllNotificationsRead") {
      await db.update(notifications).set({ isRead: true });
      return NextResponse.json({ success: true });
    }

    // =========================================================================
    // 18. CONFIGURABLE REMINDER AUTOMATION
    // =========================================================================
    if (action === "updateReminderSettings") {
      if (!canViewAllEmployeeProfiles(currentUser.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only Manager, MD or Owner can change reminder settings." },
          { status: 403 }
        );
      }
      const {
        lateCheckInAfter,
        workPlanReminderTime,
        dailySummaryReminderTime,
        enableOverdueTaskReminder,
        enablePendingTaskReminder,
      } = body;

      const existing = await db.select().from(reminderSettings);
      if (existing.length > 0) {
        const [updated] = await db
          .update(reminderSettings)
          .set({
            lateCheckInAfter: lateCheckInAfter || "09:30",
            workPlanReminderTime: workPlanReminderTime || "10:00",
            dailySummaryReminderTime: dailySummaryReminderTime || "18:30",
            enableOverdueTaskReminder: Boolean(enableOverdueTaskReminder),
            enablePendingTaskReminder: Boolean(enablePendingTaskReminder),
            updatedBy: currentUser.name,
            updatedAt: new Date(),
          })
          .where(eq(reminderSettings.id, existing[0].id))
          .returning();
        return NextResponse.json({ success: true, reminderSettings: updated });
      } else {
        const [created] = await db
          .insert(reminderSettings)
          .values({
            lateCheckInAfter: lateCheckInAfter || "09:30",
            workPlanReminderTime: workPlanReminderTime || "10:00",
            dailySummaryReminderTime: dailySummaryReminderTime || "18:30",
            enableOverdueTaskReminder: Boolean(enableOverdueTaskReminder),
            enablePendingTaskReminder: Boolean(enablePendingTaskReminder),
            updatedBy: currentUser.name,
          })
          .returning();
        return NextResponse.json({ success: true, reminderSettings: created });
      }
    }

    if (action === "runReminderAutomation") {
      const [settings] = await db.select().from(reminderSettings);
      const allEmps = await db.select().from(employees);
      const todayAtt = (await db.select().from(attendances)).filter(
        (a) => a.date === today
      );
      const todayPlans = (await db.select().from(dailyWorkPlans)).filter(
        (p) => p.date === today
      );
      const todayWorks = (await db.select().from(dailyWorks)).filter(
        (d) => d.date === today
      );
      const allTasksList = await db.select().from(tasks);

      const checkedInSet = new Set(todayAtt.map((a) => a.employeeId));
      const plannedSet = new Set(todayPlans.map((p) => p.employeeId));
      const summarySet = new Set(todayWorks.map((d) => d.employeeId));

      const missingCheckInNames = allEmps
        .filter((e) => !checkedInSet.has(e.id))
        .map((e) => e.name);
      const missingPlanNames = allEmps
        .filter((e) => !plannedSet.has(e.id))
        .map((e) => e.name);
      const missingSummaryNames = allEmps
        .filter((e) => !summarySet.has(e.id))
        .map((e) => e.name);
      const overdueTasksList = allTasksList.filter(
        (t) =>
          t.dueDate < today &&
          t.status !== "Completed" &&
          t.status !== "Cancelled"
      );

      if (missingPlanNames.length > 0) {
        await createNotification({
          targetRole: "All",
          type: "Work Plan Reminder",
          title: `Work Plan Reminder (${settings?.workPlanReminderTime || "10:00"} AM)`,
          message: `আজকের Today's Work Plan এখনও সাবমিট করেননি: ${missingPlanNames.join(", ")}। অনুগ্রহ করে My Day-তে পরিকল্পনা যুক্ত করুন।`,
          createdBy: "Reminder Automation",
          priority: "High",
          assignedPersonOrTeam: "All Staff",
          dueDate: today,
          relatedUrl: "/my-day",
          relatedEntityCode: "REM-PLAN",
        });
      }

      if (missingSummaryNames.length > 0) {
        await createNotification({
          targetRole: "All",
          type: "Daily Work Reminder",
          title: `Daily Work Summary Reminder (${settings?.dailySummaryReminderTime || "18:30"} PM)`,
          message: `অফিস শেষ হওয়ার আগে আজকের কাজের সারাংশ (Daily Work Summary) সাবমিট করুন। পেন্ডিং: ${missingSummaryNames.join(", ")}`,
          createdBy: "Reminder Automation",
          priority: "High",
          assignedPersonOrTeam: "All Staff",
          dueDate: today,
          relatedUrl: "/my-day",
          relatedEntityCode: "REM-SUMMARY",
        });
      }

      if (missingCheckInNames.length > 0) {
        await createNotification({
          targetRole: "All",
          type: "Attendance Correction",
          title: `IN TIME Reminder (After ${settings?.lateCheckInAfter || "09:30"} AM)`,
          message: `${missingCheckInNames.join(", ")} এখনও আজকের IN TIME দেননি।`,
          createdBy: "Reminder Automation",
          priority: "Medium",
          assignedPersonOrTeam: "All Staff",
          dueDate: today,
          relatedUrl: "/attendance",
          relatedEntityCode: "REM-IN",
        });
      }

      if (
        (settings?.enableOverdueTaskReminder ?? true) &&
        overdueTasksList.length > 0
      ) {
        await createNotification({
          targetRole: "All",
          type: "Task Overdue",
          title: `Overdue & Pending Task Reminder (${overdueTasksList.length} tasks)`,
          message: `Overdue tasks requiring immediate action: ${overdueTasksList
            .map((t) => t.taskCode)
            .join(", ")}`,
          createdBy: "Reminder Automation",
          priority: "Critical",
          assignedPersonOrTeam: "Assigned Staff",
          dueDate: today,
          relatedTaskId: overdueTasksList[0].id,
          relatedUrl: `/tasks/${overdueTasksList[0].id}`,
          relatedEntityCode: overdueTasksList[0].taskCode,
        });
      }

      return NextResponse.json({
        success: true,
        dispatched: {
          missingCheckIn: missingCheckInNames.length,
          missingPlan: missingPlanNames.length,
          missingSummary: missingSummaryNames.length,
          overdueTasks: overdueTasksList.length,
        },
      });
    }

    return NextResponse.json({ error: `Unknown ERP action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "ERP operation failed";
    console.error("ERP POST Error:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
