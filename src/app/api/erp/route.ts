export const dynamic = "force-dynamic";
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
  announcements,
  announcementReads,
  workFiles,
} from "@/db";
import { eq, desc, and, isNull, sql, gte, lt } from "drizzle-orm";
import {
  getCurrentUser,
  hasPermission,
  hashPassword,
  ROLE_DEFAULT_PERMISSIONS,
  canViewAllEmployeeProfiles,
  isSuperAdminRole,
  leadCompanyAccess,
  canCreateAnnouncement,
  isManagementRole,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { runReminderAutomation } from "@/lib/reminder-automation";
import {
  logAudit,
  createNotification,
  calculateAttendanceMetrics,
  calculateFourPunchAttendanceMetrics,
  calculateWorkPlanProgress,
  recordStockMovementTx,
  postDoubleEntryJournalTx,
  computeExactMaterialStock,
  isLateDeductible,
  workShortfallHours,
  STANDARD_WORK_HOURS,
} from "@/lib/erp-engine";
import { computeEmployeeWork } from "@/lib/work-tracking";
import { randomBytes } from "crypto";
import {
  notifyUsers,
  managementUserIds,
  taskWatcherUserIds,
  assigneeUserId,
  runTaskDeadlineScan,
  TASK_MGMT_ROLES,
} from "@/lib/task-notify";

class AttendanceRequestError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
  }
}

function getDhakaDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

// ইতিহাস কত দিন পেছন পর্যন্ত API-তে যাবে (মাসিক হাজিরা ৬ মাস কভার করে)
function historyCutoffDate(days = 365): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function validateFourPunches(punches: {
  checkIn?: string | null;
  checkOut?: string | null;
  checkIn2?: string | null;
  checkOut2?: string | null;
  overrideStatus?: string;
}) {
  const values = [punches.checkIn, punches.checkOut, punches.checkIn2, punches.checkOut2];
  
  // Time format validation
  if (values.some((value) => value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) {
    throw new AttendanceRequestError("Attendance times must use HH:mm format.");
  }

  // Order validation: IN1 < OUT1 < IN2 < OUT2
  if (punches.checkOut && punches.checkIn && punches.checkOut <= punches.checkIn) {
    throw new AttendanceRequestError("Morning OUT must be after morning IN.");
  }
  if (punches.checkIn2 && punches.checkOut && punches.checkIn2 <= punches.checkOut) {
    throw new AttendanceRequestError("Afternoon IN must be after morning OUT.");
  }
  if (punches.checkOut2 && punches.checkIn2 && punches.checkOut2 <= punches.checkIn2) {
    throw new AttendanceRequestError("Afternoon OUT must be after afternoon IN.");
  }

  // Dependency validation
  if (punches.checkOut && !punches.checkIn) {
    throw new AttendanceRequestError("Morning OUT requires morning IN.");
  }
  if (punches.checkIn2 && !punches.checkOut) {
    throw new AttendanceRequestError("Afternoon IN requires morning OUT.");
  }
  if (punches.checkOut2 && !punches.checkIn2) {
    throw new AttendanceRequestError("Afternoon OUT requires afternoon IN.");
  }

  return calculateFourPunchAttendanceMetrics(punches);
}

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Server-side retention: permanently remove notifications older than 7 days.
  // This is additive and does not delete announcements or payroll records.
  const notificationExpiryCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db.delete(notifications).where(lt(notifications.createdAt, notificationExpiryCutoff));

  const section = req.nextUrl.searchParams.get("section") || "all";
  const requestedEmpId = req.nextUrl.searchParams.get("employeeId");
  const canSeeAllEmployees = canViewAllEmployeeProfiles(currentUser.role);

  if (
    (section === "leads" || section === "crm") &&
    leadCompanyAccess(currentUser) === "NONE"
  ) {
    return NextResponse.json(
      { error: "লিড/CRM দেখার অনুমতি নেই। Access Denied." },
      { status: 403 }
    );
  }

  if (
    requestedEmpId &&
    !canSeeAllEmployees &&
    Number(requestedEmpId) !== currentUser.employeeId
  ) {
    return NextResponse.json(
      {
        error:
          "Forbidden: Staff can only view their own profile, attendance, salary, leave, performance, and daily activity.",
      },
      { status: 403 }
    );
  }

  const cutoff = historyCutoffDate();

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
    allAnnouncements,
    allAnnouncementReads,
    workFileRows,
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
    // শুধু শেষ ১৯০ দিনের হাজিরা — মাসিক রিপোর্ট ৬ মাস পর্যন্ত কাজ করবে
    db.select().from(attendances)
      .where(gte(attendances.date, cutoff))
      .orderBy(desc(attendances.date), desc(attendances.id)),
    db.select().from(attendanceCorrections).orderBy(desc(attendanceCorrections.id)).limit(300),
    db.select().from(leads).orderBy(desc(leads.id)),
    db.select().from(leadFollowups).orderBy(desc(leadFollowups.id)),
    db.select().from(clients).orderBy(desc(clients.id)),
    db.select().from(projects).orderBy(projects.id),
    db.select().from(sites).orderBy(sites.id),
    db.select().from(siteReports).orderBy(desc(siteReports.id)).limit(300),
    db.select().from(quotations).orderBy(desc(quotations.id)),
    db.select().from(tasks).orderBy(desc(tasks.id)),
    // Comments শুধু display-এ লাগে
    db.select().from(taskComments).orderBy(desc(taskComments.id)).limit(800),
    // শেষ ১৯০ দিনের দৈনিক কাজ
    db.select().from(dailyWorks)
      .where(gte(dailyWorks.date, cutoff))
      .orderBy(desc(dailyWorks.date), desc(dailyWorks.id)),
    db.select().from(materials).orderBy(materials.id),
    // Stock movement তালিকা display-only (স্টক হিসাব materials টেবিল থেকে হয়)
    db.select().from(stockMovements).orderBy(desc(stockMovements.id)).limit(400),
    db.select().from(suppliers).orderBy(suppliers.id),
    db.select().from(purchaseRequests).orderBy(desc(purchaseRequests.id)),
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.id)),
    db.select().from(supplierBills).orderBy(desc(supplierBills.id)),
    db.select().from(labours).orderBy(labours.id),
    db.select().from(contractors).orderBy(contractors.id),
    // ⚠️ আর্থিক টেবিলে limit নেই — টাকার হিসাব সম্পূর্ণ থাকতে হবে
    db.select().from(expenses).orderBy(desc(expenses.id)),
    db.select().from(accounts).orderBy(accounts.code),
    db.select().from(journalEntries).orderBy(desc(journalEntries.id)),
    db.select().from(journalLines).orderBy(journalLines.id),
    db.select().from(invoices).orderBy(desc(invoices.id)),
    db.select().from(payments).orderBy(desc(payments.id)),
    db.select().from(payrolls).orderBy(desc(payrolls.id)),
    db.select().from(leaveRequests).orderBy(desc(leaveRequests.id)),
    db.select().from(performanceReviews).orderBy(desc(performanceReviews.id)),
    db.select().from(documents).orderBy(desc(documents.id)).limit(300),
    db.select().from(notifications).orderBy(desc(notifications.id)).limit(150),
    db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(150),
    // শেষ ১৯০ দিনের কাজের পরিকল্পনা
    db.select().from(dailyWorkPlans)
      .where(gte(dailyWorkPlans.date, cutoff))
      .orderBy(desc(dailyWorkPlans.date), desc(dailyWorkPlans.id)),
    db.select().from(reminderSettings).orderBy(reminderSettings.id),
    db.select().from(announcements).orderBy(desc(announcements.id)),
    db.select().from(announcementReads),
    db.select({
      id: workFiles.id,
      taskId: workFiles.taskId,
      employeeId: workFiles.employeeId,
      uploadedByName: workFiles.uploadedByName,
      uploadedByUserId: workFiles.uploadedByUserId,
      fileName: workFiles.fileName,
      mimeType: workFiles.mimeType,
      sizeBytes: workFiles.sizeBytes,
      createdAt: workFiles.createdAt,
    }).from(workFiles).orderBy(desc(workFiles.id)).limit(400),
  ]);

  // =========================================================================
  // GRANULAR SERVER-SIDE DATA SCOPING & STAFF PRIVACY ENFORCEMENT
  // =========================================================================
  const isFullAccess =
    currentUser.role === "Owner" ||
    currentUser.role === "Chairman" ||
    currentUser.role === "MD" ||
    currentUser.role === "Admin" ||
    currentUser.role === "Manager";
  const isHR = currentUser.role === "HR";
  const isAccounts = currentUser.role === "Accounts";
  const isPM = currentUser.role === "Project Manager";
  const isStaffOnly =
    currentUser.role === "Staff" ||
    currentUser.role === "Site Staff" ||
    currentUser.role === "Engineer" ||
    currentUser.role === "Sales";

  const myEmpId = currentUser.employeeId;

  const canSeeAllFinancials = isFullAccess || isAccounts || isHR;

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

  const scopedTasks =
    isFullAccess || isHR || isPM
      ? allTasks
      : allTasks.filter((t) => {
          const vis = t.visibility || (t.isCompanyWide ? "Everyone" : "Assigned");
          if (vis === "Management") return false;
          if (vis === "Everyone" || t.isCompanyWide) return true;
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

  const scopedExpenses = canSeeAllFinancials
    ? allExpenses
    : isPM
    ? allExpenses.filter(
        (e) =>
          e.employeeId === myEmpId ||
          (e.projectId && scopedProjectIds.has(e.projectId))
      )
    : allExpenses.filter((e) => e.employeeId === myEmpId);

  const scopedPayments = canSeeAllFinancials
    ? allPayments
    : isPM
    ? allPayments.filter(
        (p) =>
          p.employeeId === myEmpId ||
          (p.projectId && scopedProjectIds.has(p.projectId))
      )
    : allPayments.filter((p) => p.employeeId === myEmpId);

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

  const attendanceEmployeeIds = new Set(allAttendances.map((attendance) => attendance.employeeId));
  const directoryShape = (employee: (typeof allEmployees)[number]) => ({
    id: employee.id,
    empCode: employee.empCode,
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    companyId: employee.companyId,
    assignedSite: employee.assignedSite,
    archived: employee.archived,
  });
  const scopedDirectory =
    isFullAccess || isHR
      ? allEmployees
          .filter((employee) => !employee.archived || attendanceEmployeeIds.has(employee.id))
          .map(directoryShape)
      : isPM || isAccounts
        ? allEmployees.filter((employee) => !employee.archived).map(directoryShape)
        : allEmployees.filter((employee) => employee.id === myEmpId).map(directoryShape);

  // Enrich Projects (Budget vs Actual vs Revenue vs P/L)
  const enrichedProjects = scopedProjects.map((proj) => {
    const projExpenses = allExpenses.filter(
      (e) => e.projectId === proj.id && e.approvalStatus === "Approved"
    );
    const sumBy = (cat?: string) =>
      projExpenses
        .filter((e) => !cat || e.category === cat)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const actualCost = sumBy();
    const projInvoices = allInvoices.filter(
      (inv) => inv.projectId === proj.id && inv.status !== "Void"
    );
    const totalRevenue = projInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
    const collectedRevenue = projInvoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0);

    return {
      ...proj,
      actualCost: Number(actualCost.toFixed(2)),
      materialCost: Number(sumBy("Material").toFixed(2)),
      labourCost: Number(sumBy("Labour").toFixed(2)),
      contractorCost: Number(sumBy("Contractor").toFixed(2)),
      transportCost: Number(sumBy("Transport").toFixed(2)),
      siteExpenseCost: Number(sumBy("Site Expense").toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      collectedRevenue: Number(collectedRevenue.toFixed(2)),
      profitLoss: Number((totalRevenue - actualCost).toFixed(2)),
    };
  });

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

  // =========================================================================
  // FOLLOW-UP ANALYTICS BOARD
  // =========================================================================
  const todayStr = getDhakaDateTime().date; // ⭐ বাংলাদেশ তারিখ (আগে UTC ছিল)
  const dayMs = 86400000;
  const dayOffset = (n: number) =>
    new Date(Date.now() + n * dayMs).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const tomorrowStr = dayOffset(1);
  const in3DaysStr = dayOffset(3);
  const in7DaysStr = dayOffset(7);

  const empDirMap = new Map(allEmployees.map((e) => [e.id, e.name]));
  const allLeadRowsForBoard = allLeads;
  const activeLeadRows = allLeadRowsForBoard.filter(
    (l) => !["Won", "Lost", "On Hold"].includes(l.status)
  );

  const leadFollowUpMap = new Map<number, typeof allFollowups>();
  allFollowups.forEach((f) => {
    const arr = leadFollowUpMap.get(f.leadId) || [];
    arr.push(f);
    leadFollowUpMap.set(f.leadId, arr);
  });

  function daysBetween(from: string, to: string) {
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / dayMs);
  }

  const followUpBoardRows = activeLeadRows.map((l) => {
    const fus = (leadFollowUpMap.get(l.id) || []).sort(
      (a, b) => b.followUpNumber - a.followUpNumber
    );
    const last = fus[0] || null;
    const nextDate = l.nextFollowUpDate || null;
    const overdueDays = nextDate && nextDate < todayStr ? daysBetween(nextDate, todayStr) : 0;

    return {
      leadId: l.id,
      leadCode: l.leadCode,
      companyId: Number(l.companyId) === 2 ? "IREL" : "IBDC",
      clientName: l.name,
      phone: l.phone,
      category: l.companyId === 2 ? l.propertyType : l.service,
      projectName: l.projectName || "",
      assignedStaffId: l.assignedStaffId,
      assignedStaffName: l.assignedStaffId ? empDirMap.get(l.assignedStaffId) || "Unassigned" : "Unassigned",
      priority: l.priority,
      status: l.status,
      totalFollowUps: fus.length,
      lastContactDate: l.lastContactDate || last?.date || null,
      lastContactMethod: last?.contactMethod || null,
      lastOutcome: last?.outcome || null,
      nextFollowUpDate: nextDate,
      nextFollowUpTime: l.nextFollowUpTime || "10:00",
      daysSinceLastContact: l.lastContactDate ? daysBetween(l.lastContactDate, todayStr) : null,
      daysOverdue: overdueDays,
      bucket:
        nextDate === null
          ? "No Next Follow-up"
          : nextDate < todayStr
          ? "Overdue"
          : nextDate === todayStr
          ? "Today"
          : nextDate === tomorrowStr
          ? "Tomorrow"
          : nextDate <= in3DaysStr
          ? "Next 3 Days"
          : nextDate <= in7DaysStr
          ? "Next 7 Days"
          : "Later",
    };
  });

  const bucketOf = (b: string) => followUpBoardRows.filter((r) => r.bucket === b);

  const followUpBoard = {
    today: bucketOf("Today"),
    overdue: bucketOf("Overdue"),
    tomorrow: bucketOf("Tomorrow"),
    next3Days: bucketOf("Next 3 Days"),
    next7Days: bucketOf("Next 7 Days"),
    later: bucketOf("Later"),
    noNextFollowUp: bucketOf("No Next Follow-up"),
    neverFollowedUp: followUpBoardRows.filter((r) => r.totalFollowUps === 0),
    multipleFollowUps: followUpBoardRows.filter((r) => r.totalFollowUps >= 2),
    noResponseLeads: allLeadRowsForBoard.filter((l) => {
      const fus = leadFollowUpMap.get(l.id) || [];
      return fus.length > 0 && fus.every((f) => f.outcome === "No Response");
    }).map((l) => ({
      leadId: l.id,
      leadCode: l.leadCode,
      companyId: Number(l.companyId) === 2 ? "IREL" : "IBDC",
      clientName: l.name,
      phone: l.phone,
      assignedStaffName: l.assignedStaffId ? empDirMap.get(l.assignedStaffId) || "Unassigned" : "Unassigned",
      totalFollowUps: (leadFollowUpMap.get(l.id) || []).length,
      nextFollowUpDate: l.nextFollowUpDate,
    })),
    awaitingClientResponse: followUpBoardRows.filter((r) =>
      ["Quotation Sent", "Need More Information", "Call Back Later", "Negotiating"].includes(
        r.lastOutcome || ""
      )
    ),
    summary: {
      activeLeads: activeLeadRows.length,
      totalLeads: allLeadRowsForBoard.length,
      todaysFollowUps: bucketOf("Today").length,
      overdueFollowUps: bucketOf("Overdue").length,
      upcomingFollowUps:
        bucketOf("Tomorrow").length +
        bucketOf("Next 3 Days").length +
        bucketOf("Next 7 Days").length,
      followUpsCompletedToday: allFollowups.filter((f) => f.date === todayStr).length,
      leadsWithoutNextFollowUp: bucketOf("No Next Follow-up").length,
      leadsNeverFollowedUp: followUpBoardRows.filter((r) => r.totalFollowUps === 0).length,
      leadsWithNoResponse: 0,
      leadsAwaitingClientResponse: 0,
      onHoldLeads: allLeadRowsForBoard.filter((l) => l.status === "On Hold").length,
    },
    staffPerformance: Array.from(
      new Set(allLeadRowsForBoard.map((l) => l.assignedStaffId).filter(Boolean))
    ).map((staffId) => {
      const staffLeads = activeLeadRows.filter((l) => l.assignedStaffId === staffId);
      const staffLeadIds = new Set(staffLeads.map((l) => l.id));
      const staffFUs = allFollowups.filter((f) => staffLeadIds.has(f.leadId));
      return {
        staffId,
        staffName: empDirMap.get(staffId as number) || "Unassigned",
        activeLeads: staffLeads.length,
        followUpsToday: staffFUs.filter((f) => f.date === todayStr).length,
        totalFollowUps: staffFUs.length,
        overdueFollowUps: followUpBoardRows.filter(
          (r) => r.assignedStaffId === staffId && r.bucket === "Overdue"
        ).length,
        todaysFollowUps: followUpBoardRows.filter(
          (r) => r.assignedStaffId === staffId && r.bucket === "Today"
        ).length,
      };
    }),
  };

  followUpBoard.summary.leadsWithNoResponse = followUpBoard.noResponseLeads.length;
  followUpBoard.summary.leadsAwaitingClientResponse =
    followUpBoard.awaitingClientResponse.length;

  // =========================================================================
  // EMPLOYEE WORK TRACKING
  // =========================================================================
  const canSeeTeamWork = isFullAccess || isHR;
  const workScopeEmployees = allEmployees.filter(
    (e) => !e.archived && (canSeeTeamWork || e.id === myEmpId)
  );
  const employeeWork = workScopeEmployees.map((emp) =>
    computeEmployeeWork({
      emp,
      tasks: allTasks,
      attendances: allAttendances,
      dailyWorks: allDailyWorks,
      leads: allLeads,
      reviews: allPerformance,
      comments: allTaskComments,
      today: todayStr,
    })
  );
  const workOverview = {
    activeEmployees: workScopeEmployees.length,
    presentToday: employeeWork.filter((w) => w.today.attendance && w.today.attendance.status !== "Absent" && w.today.attendance.status !== "Leave").length,
    absentToday: employeeWork.filter((w) => !w.today.attendance || w.today.attendance.status === "Absent").length,
    onLeaveToday: employeeWork.filter((w) => w.today.attendance?.status === "Leave").length,
    activeTasks: employeeWork.reduce((s, w) => s + w.all.pending, 0),
    completedToday: employeeWork.reduce((s, w) => s + w.today.completed, 0),
    pending: employeeWork.reduce((s, w) => s + w.all.notStarted + w.all.inProgress, 0),
    awaitingReview: employeeWork.reduce((s, w) => s + w.all.awaitingReview, 0),
    overdue: employeeWork.reduce((s, w) => s + w.overdueCount, 0),
    dailyUpdatesToday: employeeWork.reduce((s, w) => s + w.today.dailyUpdates, 0),
  };
  const visibleTaskIds = new Set<number>();
  for (const t of allTasks) {
    if (canSeeTeamWork || isPM || t.assignedTo === myEmpId || t.isCompanyWide) visibleTaskIds.add(t.id);
  }
  const scopedWorkFiles = workFileRows.filter(
    (f) =>
      canSeeTeamWork ||
      f.employeeId === myEmpId ||
      f.uploadedByUserId === currentUser.id ||
      (f.taskId !== null && visibleTaskIds.has(f.taskId) && isPM)
  );

  return NextResponse.json({
    currentUser,
    employeeWork,
    workOverview,
    workFiles: scopedWorkFiles,
    followUpBoard: leadCompanyAccess(currentUser) === "NONE" ? { today: [], overdue: [], tomorrow: [], next3Days: [], next7Days: [], later: [], noNextFollowUp: [], neverFollowedUp: [], multipleFollowUps: [], noResponseLeads: [], awaitingClientResponse: [], summary: {}, staffPerformance: [] } : followUpBoard,
    users: isSuperAdminRole(currentUser.role) || isFullAccess ? allUsers : [],
    employees:
      isFullAccess || isHR
        ? allEmployees.filter((e) => !e.archived)
        : allEmployees.filter((e) => e.id === myEmpId),
    allEmployeesDirectory: scopedDirectory,
    attendances: scopedAttendances,
    attendanceCorrections:
      isFullAccess || isHR
        ? allCorrections
        : allCorrections.filter((c) => c.employeeId === myEmpId),
          leads: (() => {
        const access = leadCompanyAccess(currentUser);
        if (access === "NONE") return [];

        // DB-তে companyId সংখ্যা (1 = IBDC, 2 = IREL) — frontend-এর জন্য স্ট্রিং-এ রূপান্তর
        const normalized = allLeads.map((l) => ({
          ...l,
          companyId: Number(l.companyId) === 2 ? "IREL" : "IBDC",
        }));

        if (access === "BOTH") return normalized;
        return normalized.filter((l) => l.companyId === access);
      })(),
          leadFollowups: (() => {
        const access = leadCompanyAccess(currentUser);
        if (access === "NONE") return [];
        if (access === "BOTH") return allFollowups;

        const allowedIds = new Set(
          allLeads
            .filter((l) => (Number(l.companyId) === 2 ? "IREL" : "IBDC") === access)
            .map((l) => l.id)
        );
        return allFollowups.filter((f) => allowedIds.has(f.leadId));
      })(),
    announcements: allAnnouncements
      .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > Date.now())
      .map((a) => ({
        ...a,
        isRead: allAnnouncementReads.some(
          (r) => r.announcementId === a.id && r.userId === currentUser.id
        ),
      })),
    clients: currentUser.role === "Staff" ? [] : allClients,
    projects: enrichedProjects,
    sites: scopedSites,
    siteReports: allSiteReports,
    quotations: currentUser.role === "Staff" ? [] : allQuotations,
    tasks: scopedTasks,
    taskComments: (() => {
      const ids = new Set(scopedTasks.map((t) => t.id));
      return allTaskComments.filter((c) => ids.has(c.taskId));
    })(),
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
    expenses: scopedExpenses,
    accounts: isFullAccess || isAccounts ? allAccounts : [],
    journalEntries: isFullAccess || isAccounts ? allJournals : [],
    journalLines: isFullAccess || isAccounts ? allJournalLines : [],
    invoices: isStaffOnly ? [] : allInvoices,
    payments: scopedPayments,
    payrolls: scopedPayrolls,
    leaveRequests: scopedLeaves,
    performanceReviews: scopedPerformance,
    documents: scopedDocuments,
    notifications: allNotifications.filter((n) => {
      if (n.userId !== null) return n.userId === currentUser.id;
      if (n.type === "Announcement" || n.type === "ANNOUNCEMENT") return true;
      if (n.type === "Work Plan Reminder" || n.type === "Daily Work Reminder") return true;
      return isFullAccess || isHR;
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
    const today = getDhakaDateTime().date;

    const LEAD_ACTIONS = [
      "createLead",
      "updateLead",
      "deleteLead",
      "addLeadFollowup",
      "updateLeadStatus",
      "convertLeadToClient",
      "sendFollowUpReminders",
    ];
    if (LEAD_ACTIONS.includes(action) && leadCompanyAccess(currentUser) === "NONE") {
      return NextResponse.json(
        { error: "লিড/CRM API ব্যবহারের অনুমতি নেই। 403 Forbidden." },
        { status: 403 }
      );
    }

    if (action === "createAnnouncement") {
      if (!canCreateAnnouncement(currentUser.role)) {
        return NextResponse.json(
          { error: "ঘোষণা তৈরির অনুমতি নেই।" },
          { status: 403 }
        );
      }
      const { title, message, attachmentUrl } = body;
      const allowedDurations = [1, 3, 7, 15, 30];
      const requestedDuration = Number(body.durationDays ?? 7);
      const durationDays = allowedDurations.includes(requestedDuration) ? requestedDuration : 7;
      if (!title || !message) {
        return NextResponse.json({ error: "শিরোনাম ও বার্তা আবশ্যক" }, { status: 400 });
      }
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      const [ann] = await db
        .insert(announcements)
        .values({
          title,
          message,
          createdBy: currentUser.name,
          createdByUserId: currentUser.id,
          published: true,
          attachmentUrl: attachmentUrl || null,
          expiresAt,
        })
        .returning();
      await createNotification({
        targetRole: "All",
        type: "ANNOUNCEMENT",
        category: "Announcement",
        title: `ঘোষণা: ${title}`,
        message,
        createdBy: currentUser.name,
        relatedUrl: "/dashboard",
        relatedEntityCode: `ANN-${ann.id}`,
      });
      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "ANNOUNCEMENT_CREATE",
        entity: "Announcement",
        recordId: String(ann.id),
        afterData: { title, durationDays, expiresAt: expiresAt.toISOString() },
      });
      return NextResponse.json({ success: true, announcement: ann });
    }

    if (action === "markAnnouncementRead") {
      const { announcementId } = body;
      const existing = await db
        .select()
        .from(announcementReads)
        .where(eq(announcementReads.userId, currentUser.id));
      if (!existing.some((r) => r.announcementId === Number(announcementId))) {
        await db.insert(announcementReads).values({
          announcementId: Number(announcementId),
          userId: currentUser.id,
        });
      }
      return NextResponse.json({ success: true });
    }
    
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
      if (
        currentUser.role !== "Owner" &&
        currentUser.role !== "Admin" &&
        currentUser.role !== "Manager"
      ) {
        return NextResponse.json(
          { error: "ভূমিকা/অনুমতি পরিবর্তনের অনুমতি নেই।" },
          { status: 403 }
        );
      }
      if (Number(body.userId) === currentUser.id && body.role && body.role !== currentUser.role) {
        return NextResponse.json(
          { error: "নিজের ভূমিকা নিজে পরিবর্তন করা যায় না।" },
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
      const salary = Number(basicSalary || 0);
      const monthlyAllowance = Number(allowance || 0);
      if (!Number.isFinite(salary) || !Number.isFinite(monthlyAllowance) || salary < 0 || monthlyAllowance < 0) {
        return NextResponse.json({ error: "Salary/Allowance cannot be negative" }, { status: 400 });
      }
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedName = String(name).trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
        return NextResponse.json({ error: "A valid employee email is required." }, { status: 400 });
      }
      if (role && !ROLE_DEFAULT_PERMISSIONS[role]) {
        return NextResponse.json({ error: "Invalid employee login role." }, { status: 400 });
      }
      const assignedRole = role || "Staff";
      const result = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`employee-create:${normalizedEmail}`}, 0))`
        );
        const [emailEmployee] = await tx
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.email, normalizedEmail))
          .limit(1);
        if (emailEmployee) {
          throw new AttendanceRequestError("An employee profile already uses this email.", 409);
        }

        const [existingUser] = await tx
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);
        let linkedUserId: number;
        let accountCreated = false;
        let passwordSetupRequired = false;
        if (existingUser) {
          const [linkedEmployee] = await tx
            .select({ id: employees.id })
            .from(employees)
            .where(eq(employees.userId, existingUser.id))
            .limit(1);
          if (linkedEmployee || existingUser.status !== "Active" || existingUser.name.trim().toLowerCase() !== normalizedName.toLowerCase()) {
            throw new AttendanceRequestError("This login already belongs to another or inactive profile; review the account before linking.", 409);
          }
          linkedUserId = existingUser.id;
          passwordSetupRequired = existingUser.mustChangePassword;
        } else {
          const bootstrapSecret = randomBytes(48).toString("base64url");
          const [newUser] = await tx
            .insert(users)
            .values({
              name: normalizedName,
              email: normalizedEmail,
              passwordHash: hashPassword(bootstrapSecret),
              role: assignedRole,
              permissions: ROLE_DEFAULT_PERMISSIONS[assignedRole] || ROLE_DEFAULT_PERMISSIONS.Staff,
              status: "Active",
              mustChangePassword: true,
            })
            .returning({ id: users.id });
          linkedUserId = newUser.id;
          accountCreated = true;
          passwordSetupRequired = true;
        }

        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('employee-code-allocation', 0))`
        );
        const codes = await tx.select({ empCode: employees.empCode }).from(employees);
        const usedCodes = new Set(codes.map((row) => row.empCode));
        const maxCodeNumber = codes.reduce((max, row) => {
          const match = /^EMP-(\d+)$/.exec(row.empCode);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        let nextCodeNumber = maxCodeNumber + 1;
        let empCode = `EMP-${String(nextCodeNumber).padStart(4, "0")}`;
        while (usedCodes.has(empCode)) {
          nextCodeNumber++;
          empCode = `EMP-${String(nextCodeNumber).padStart(4, "0")}`;
        }

        const [employee] = await tx
          .insert(employees)
          .values({
            empCode,
            userId: linkedUserId,
            name: normalizedName,
            department: String(department).trim(),
            designation: String(designation).trim(),
            joiningDate: joiningDate || today,
            basicSalary: salary.toFixed(2),
            allowance: monthlyAllowance.toFixed(2),
            phone: String(phone).trim(),
            email: normalizedEmail,
            address: address || "",
            emergencyContact: emergencyContact || "",
            bankName: bankName || "",
            bankAccountNo: bankAccountNo || "",
            paymentMethod: paymentMethod || "Bank",
            employmentStatus: "Active",
            archived: false,
          })
          .returning();
        return { employee, accountCreated, passwordSetupRequired };
      });
      const emp = result.employee;

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "Employee",
        recordId: emp.empCode,
        afterData: emp,
      });

      return NextResponse.json({
        success: true,
        employee: emp,
        accountCreated: result.accountCreated,
        passwordSetupRequired: result.passwordSetupRequired,
      });
    }

        // =========================================================================
    // 3. ATTENDANCE & CORRECTION WORKFLOW (Option B: যেকোনো সময় IN/OUT)
    // =========================================================================
    if (action === "checkIn" || action === "checkOut") {
      const canManageOthers = canViewAllEmployeeProfiles(currentUser.role);
      const employeeId = Number(body.employeeId || currentUser.employeeId);
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
      }
      if (!canManageOthers && employeeId !== currentUser.employeeId) {
        return NextResponse.json({ error: "নিজের হাজিরাই শুধু দেওয়া যাবে।" }, { status: 403 });
      }

      const { date, time } = getDhakaDateTime();
      const result = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`attendance:${employeeId}:${date}`}, 0))`
        );
        const [employee] = await tx
          .select()
          .from(employees)
          .where(eq(employees.id, employeeId))
          .limit(1);
        if (!employee || employee.archived || employee.employmentStatus !== "Active") {
          throw new AttendanceRequestError("শুধু সক্রিয় কর্মী হাজিরা দিতে পারবেন।", 404);
        }

        const rows = await tx
          .select()
          .from(attendances)
          .where(and(eq(attendances.employeeId, employeeId), eq(attendances.date, date)))
          .limit(2);
        if (rows.length > 1) {
          throw new AttendanceRequestError("এই তারিখে একাধিক রেকর্ড আছে; ম্যানেজমেন্টকে জানান।", 409);
        }
        const existing = rows[0];
        if (body.attendanceId && Number(body.attendanceId) !== existing?.id) {
          throw new AttendanceRequestError("হাজিরা রেকর্ড মিলছে না।", 409);
        }

        const nextSlot = !existing
          ? "checkIn"
          : !existing.checkOut
            ? "checkOut"
            : !existing.checkIn2
              ? "checkIn2"
              : !existing.checkOut2
                ? "checkOut2"
                : null;
        if (!nextSlot) {
          throw new AttendanceRequestError("আজকের চারটি punch সম্পন্ন হয়েছে।", 409);
        }
        if (
          (action === "checkIn" && nextSlot !== "checkIn" && nextSlot !== "checkIn2") ||
          (action === "checkOut" && nextSlot !== "checkOut" && nextSlot !== "checkOut2")
        ) {
          throw new AttendanceRequestError(
            nextSlot === "checkOut" || nextSlot === "checkOut2"
              ? "এখন OUT দেওয়ার সময়।"
              : "এখন IN দেওয়ার সময়।",
            409
          );
        }

        // ⭐ ১৪:৩০ cutoff সরানো — শুধু আগের punch-এর পরে হতে হবে
        const priorTime =
          nextSlot === "checkOut" ? existing?.checkIn :
          nextSlot === "checkIn2" ? existing?.checkOut :
          nextSlot === "checkOut2" ? existing?.checkIn2 : null;
        if (priorTime && time <= priorTime) {
          throw new AttendanceRequestError("আগের punch-এর পরের সময় হতে হবে।", 409);
        }

        const punches = {
          checkIn: nextSlot === "checkIn" ? time : existing?.checkIn ?? null,
          checkOut: nextSlot === "checkOut" ? time : existing?.checkOut ?? null,
          checkIn2: nextSlot === "checkIn2" ? time : existing?.checkIn2 ?? null,
          checkOut2: nextSlot === "checkOut2" ? time : existing?.checkOut2 ?? null,
        };
        const metrics = validateFourPunches(punches);
        const note = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";
        const updateValues = {
          ...punches,
          ...metrics,
          isApproved: true,
          notes: [existing?.notes, note].filter(Boolean).join(" | ") || "Attendance punch",
        };

        const [attendance] = existing
          ? await tx
              .update(attendances)
              .set(updateValues)
              .where(eq(attendances.id, existing.id))
              .returning()
          : await tx
              .insert(attendances)
              .values({ employeeId, date, ...updateValues })
              .returning();
        return { attendance, before: existing, employeeName: employee.name, slot: nextSlot };
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: result.before ? "UPDATE" : "CREATE",
        entity: "AttendancePunch",
        recordId: String(result.attendance.id),
        beforeData: result.before,
        afterData: { attendance: result.attendance, punch: result.slot },
      });
      if (result.slot === "checkIn" && Number(result.attendance.lateMinutes) > 0) {
        await createNotification({
          targetRole: "Manager",
          type: "Attendance Correction",
          title: `দেরিতে IN: ${result.employeeName}`,
          message: `${result.employeeName} ${date} তারিখে ${time}-এ IN দিয়েছেন (${result.attendance.lateMinutes} মিনিট দেরি)।`,
          createdBy: currentUser.name,
          relatedUrl: "/attendance",
          relatedEntityCode: `EMP-${String(employeeId).padStart(4, "0")}`,
        });
      }
      return NextResponse.json({ success: true, attendance: result.attendance, punch: result.slot });
    }

    if (action === "editApprovedAttendance") {
      if (!canViewAllEmployeeProfiles(currentUser.role)) {
        return NextResponse.json(
          { error: "সরাসরি হাজিরা পরিবর্তন করা যাবে না। Correction Request দিন।" },
          { status: 403 }
        );
      }
      const { attendanceId, checkIn, checkOut, status } = body;
      const id = Number(attendanceId);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "Attendance ID is required." }, { status: 400 });
      }
      const [existing] = await db.select().from(attendances).where(eq(attendances.id, id)).limit(1);
      if (!existing) {
        return NextResponse.json({ error: "Attendance record not found." }, { status: 404 });
      }
      const punches = {
        checkIn: checkIn === undefined ? existing.checkIn : checkIn || null,
        checkOut: checkOut === undefined ? existing.checkOut : checkOut || null,
        checkIn2: body.checkIn2 === undefined ? existing.checkIn2 : body.checkIn2 || null,
        checkOut2: body.checkOut2 === undefined ? existing.checkOut2 : body.checkOut2 || null,
      };
      const metrics = validateFourPunches({ ...punches, overrideStatus: status });
      const [updated] = await db
        .update(attendances)
        .set({ ...punches, ...metrics })
        .where(eq(attendances.id, id))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE",
        entity: "Attendance",
        recordId: String(id),
        beforeData: existing,
        afterData: updated,
      });
      return NextResponse.json({ success: true, attendance: updated });
    }

    if (action === "requestAttendanceCorrection") {
      const employeeId = Number(body.employeeId || currentUser.employeeId);
      const canManageCorrections = canViewAllEmployeeProfiles(currentUser.role);
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return NextResponse.json({ error: "Employee ID required." }, { status: 400 });
      }
      if (!canManageCorrections && employeeId !== currentUser.employeeId) {
        return NextResponse.json({ error: "শুধু নিজের হাজিরার সংশোধন চাওয়া যাবে।" }, { status: 403 });
      }
      const {
        attendanceId,
        date,
        requestedCheckIn,
        requestedCheckOut,
        requestedCheckIn2,
        requestedCheckOut2,
        reason,
      } = body;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ||
        !requestedCheckIn ||
        !requestedCheckOut ||
        !String(reason || "").trim()
      ) {
        return NextResponse.json({ error: "সব তথ্য দিন (তারিখ, IN, OUT, কারণ)।" }, { status: 400 });
      }
      validateFourPunches({
        checkIn: requestedCheckIn,
        checkOut: requestedCheckOut,
        checkIn2: requestedCheckIn2 || null,
        checkOut2: requestedCheckOut2 || null,
      });
      if (attendanceId) {
        const [record] = await db
          .select()
          .from(attendances)
          .where(eq(attendances.id, Number(attendanceId)))
          .limit(1);
        if (!record || record.employeeId !== employeeId || record.date !== date) {
          return NextResponse.json({ error: "হাজিরা রেকর্ড মিলছে না।" }, { status: 404 });
        }
      }

      const [corr] = await db
        .insert(attendanceCorrections)
        .values({
          attendanceId: attendanceId ? Number(attendanceId) : null,
          employeeId,
          date,
          requestedCheckIn,
          requestedCheckOut,
          requestedCheckIn2: requestedCheckIn2 || null,
          requestedCheckOut2: requestedCheckOut2 || null,
          reason: String(reason).trim().slice(0, 1000),
          status: "Pending",
        })
        .returning();

      await createNotification({
        targetRole: "HR",
        type: "Attendance Correction",
        title: `হাজিরা সংশোধনের অনুরোধ: ${currentUser.name}`,
        message: `তারিখ: ${date} (${requestedCheckIn} - ${requestedCheckOut}${requestedCheckIn2 ? `, ${requestedCheckIn2} - ${requestedCheckOut2 || "?"}` : ""})। কারণ: ${reason}`,
        relatedUrl: "/attendance",
        relatedEntityCode: `CORR-${corr.id}`,
      });

      return NextResponse.json({ success: true, correction: corr });
    }

    if (action === "approveAttendanceCorrection") {
      if (!hasPermission(currentUser, "attendance.approve")) {
        return NextResponse.json({ error: "Forbidden: Manager/HR approval required" }, { status: 403 });
      }
      const { correctionId, decision } = body;
      if (decision !== "Approved" && decision !== "Rejected") {
        return NextResponse.json({ error: "Decision must be Approved or Rejected." }, { status: 400 });
      }
      const result = await db.transaction(async (tx) => {
        const [corr] = await tx
          .select()
          .from(attendanceCorrections)
          .where(eq(attendanceCorrections.id, Number(correctionId)))
          .for("update")
          .limit(1);
        if (!corr) throw new AttendanceRequestError("Correction request not found.", 404);
        if (corr.status !== "Pending") {
          throw new AttendanceRequestError("এই অনুরোধ আগেই রিভিউ হয়েছে।", 409);
        }

        let beforeAttendance: typeof attendances.$inferSelect | undefined;
        let updatedAttendance: typeof attendances.$inferSelect | undefined;
        if (decision === "Approved") {
          await tx.execute(
            sql`select pg_advisory_xact_lock(hashtextextended(${`attendance:${corr.employeeId}:${corr.date}`}, 0))`
          );
          if (corr.attendanceId) {
            const [linked] = await tx
              .select()
              .from(attendances)
              .where(eq(attendances.id, corr.attendanceId))
              .limit(1);
            if (!linked || linked.employeeId !== corr.employeeId || linked.date !== corr.date) {
              throw new AttendanceRequestError("সংশোধন আর হাজিরা রেকর্ডের সাথে মিলছে না।", 409);
            }
            beforeAttendance = linked;
          } else {
            const rows = await tx
              .select()
              .from(attendances)
              .where(and(eq(attendances.employeeId, corr.employeeId), eq(attendances.date, corr.date)))
              .limit(2);
            if (rows.length > 1) {
              throw new AttendanceRequestError("এই তারিখে একাধিক রেকর্ড আছে; ম্যানেজমেন্ট রিভিউ দরকার।", 409);
            }
            beforeAttendance = rows[0];
          }

          // ⭐ Option B: legacy ১৪:৩০ ভাগাভাগি নেই — অনুরোধ যেমন, তেমনই চার punch
          const punches = {
            checkIn: corr.requestedCheckIn,
            checkOut: corr.requestedCheckOut,
            checkIn2: corr.requestedCheckIn2 ?? null,
            checkOut2: corr.requestedCheckOut2 ?? null,
          };
          const metrics = validateFourPunches(punches);
          const values = {
            ...punches,
            ...metrics,
            isApproved: true,
            notes: `${beforeAttendance?.notes ? `${beforeAttendance.notes} | ` : ""}Corrected via request #${corr.id}`,
          };
          [updatedAttendance] = beforeAttendance
            ? await tx
                .update(attendances)
                .set(values)
                .where(eq(attendances.id, beforeAttendance.id))
                .returning()
            : await tx
                .insert(attendances)
                .values({ employeeId: corr.employeeId, date: corr.date, ...values })
                .returning();
        }

        await tx
          .update(attendanceCorrections)
          .set({ status: decision, approvedBy: currentUser.name, approvedAt: new Date() })
          .where(eq(attendanceCorrections.id, corr.id));
        return { correction: corr, beforeAttendance, updatedAttendance };
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: decision === "Approved" ? "APPROVE" : "REJECT",
        entity: "AttendanceCorrection",
        recordId: String(result.correction.id),
        afterData: {
          decision,
          date: result.correction.date,
          checkIn: result.correction.requestedCheckIn,
          checkOut: result.correction.requestedCheckOut,
          checkIn2: result.correction.requestedCheckIn2,
          checkOut2: result.correction.requestedCheckOut2,
        },
      });
      if (result.updatedAttendance) {
        await logAudit({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: "UPDATE",
          entity: "Attendance",
          recordId: String(result.updatedAttendance.id),
          beforeData: result.beforeAttendance,
          afterData: result.updatedAttendance,
        });
      }
      return NextResponse.json({ success: true, attendance: result.updatedAttendance });
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

      // ⭐ fallback "|| 1" সরানো — লগইনে কর্মী লিংক না থাকলে ভুল কর্মীর নামে সেভ হতো
      const employeeId = Number(body.employeeId || currentUser.employeeId);
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return NextResponse.json(
          { error: "আপনার লগইন কোনো কর্মী প্রোফাইলের সাথে যুক্ত নয়। HR-কে জানান।" },
          { status: 400 }
        );
      }
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
      const isDwMgmt =
        canViewAllEmployeeProfiles(currentUser.role) || currentUser.role === "Project Manager";

      if (taskId) {
        const [chk] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
        if (!chk) return NextResponse.json({ error: "Task not found" }, { status: 404 });
        if (!isDwMgmt && chk.assignedTo !== employeeId && !chk.isCompanyWide) {
          return NextResponse.json(
            { error: "নিজের নয় এমন টাস্কে দৈনিক কাজ যুক্ত করা যাবে না।" },
            { status: 403 }
          );
        }
      }

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
        if (linkedTask && linkedTask.status !== "Completed" && linkedTask.status !== "Cancelled") {
          // 100% from staff goes to management review (no self-approval)
          const newStatus =
            prog >= 100
              ? isDwMgmt && linkedTask.assignedTo !== currentUser.employeeId ? "Completed" : "Review"
              : prog > 0
              ? "In Progress"
              : linkedTask.status;

          await db
            .update(tasks)
            .set({
              progressPercent: prog,
              status: newStatus,
              reviewStatus: newStatus === "Review" ? "Pending Review" : newStatus === "Completed" ? "Approved" : linkedTask.reviewStatus,
              nextAction: tomorrowPlan ? String(tomorrowPlan) : linkedTask.nextAction,
              delayReason: problems ? String(problems) : linkedTask.delayReason,
              startDate: linkedTask.startDate || today,
              lastUpdateAt: new Date(),
              completedBy: newStatus === "Completed" ? currentUser.name : linkedTask.completedBy,
              completedAt: newStatus === "Completed" ? new Date() : linkedTask.completedAt,
            })
            .where(eq(tasks.id, linkedTask.id));

          const dwFileIds = (Array.isArray(attachments) ? attachments : [])
            .map((a: { url?: string }) => Number(String(a?.url || "").split("/api/files/")[1]))
            .filter((n: number) => Number.isFinite(n) && n > 0);

          await db.insert(taskComments).values({
            taskId: linkedTask.id,
            userId: currentUser.id,
            authorName: currentUser.name,
            actorEmployeeId: currentUser.employeeId,
            actorDesignation: currentUser.designation,
            comment: `দৈনিক কাজ (${prog}%): ${workSummary}`,
            actionType: newStatus === "Review" ? "SubmittedForReview" : dwFileIds.length ? "ProofSubmitted" : "ProgressUpdate",
            eventType:
              newStatus === "Review"
                ? linkedTask.status === "Reopened" || linkedTask.correctionCount > 0
                  ? "TASK_RESUBMITTED"
                  : "TASK_COMPLETED"
                : "DAILY_WORK_SUBMITTED",
            oldStatus: linkedTask.status,
            newStatus,
            progressPercent: prog,
            fileIds: dwFileIds,
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

      if (problems && String(problems).trim().length > 3) {
        await createNotification({
          targetRole: "Manager",
          type: "Project Update",
          title: `Operational Issue Reported by ${currentUser.name}`,
          message: problems,
          createdBy: currentUser.name,
          relatedUrl: "/daily-works",
          relatedEntityCode: `DW-${dw.id}`,
        });
      }

      {
        const empRow = (await db.select().from(employees).where(eq(employees.id, employeeId)))[0];
        const linked = taskId ? (await db.select().from(tasks).where(eq(tasks.id, Number(taskId))))[0] : null;
        const recipients = linked ? await taskWatcherUserIds(linked) : await managementUserIds();
        await notifyUsers({
          recipientUserIds: recipients,
          actor: { id: currentUser.id, name: currentUser.name },
          category: "Daily Work",
          eventType: "DAILY_WORK_SUBMITTED",
          title: `দৈনিক আপডেট: ${empRow?.name || currentUser.name}`,
          message: `${String(workSummary).slice(0, 200)}${linked ? `\nটাস্ক: ${linked.taskCode} — ${linked.title} (${prog}%)` : ""}${problems ? `\nসমস্যা: ${problems}` : ""}`,
          task: linked || null,
          relatedEmployeeId: employeeId,
          relatedUrl: linked ? `/tasks/${linked.id}` : `/employees/${employeeId}/daily`,
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

      // ⭐ fallback "|| 1" সরানো
      const employeeId = Number(body.employeeId || currentUser.employeeId);
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return NextResponse.json(
          { error: "আপনার লগইন কোনো কর্মী প্রোফাইলের সাথে যুক্ত নয়। HR-কে জানান।" },
          { status: 400 }
        );
      }
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

      // ⭐ ডুপ্লিকেট প্ল্যান থাকলে সর্বশেষটা আপডেট হবে
      const existingPlans = await db
        .select()
        .from(dailyWorkPlans)
        .where(and(eq(dailyWorkPlans.employeeId, employeeId), eq(dailyWorkPlans.date, planDate)))
        .orderBy(desc(dailyWorkPlans.id));
      const existingToday = existingPlans[0];

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
      } = body;

      if (!title || (!assignedTo && !assignToAllStaff) || !dueDate) {
        return NextResponse.json(
          { error: "Title, Assignee (or All Staff), and Due Date are required" },
          { status: 400 }
        );
      }

      const canAssignOthers =
        canViewAllEmployeeProfiles(currentUser.role) || currentUser.role === "Project Manager";
      if (!canAssignOthers) {
        return NextResponse.json(
          { error: "টাস্ক তৈরি/বণ্টনের অনুমতি নেই।" },
          { status: 403 }
        );
      }

      // ⭐ advisory lock দিয়ে taskCode রেস-কন্ডিশন ঠেকানো
      const created = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('task-code-allocation', 0))`
        );
        const codeRows = await tx.select({ taskCode: tasks.taskCode }).from(tasks);
        const usedCodes = new Set(codeRows.map((r) => r.taskCode));
        const maxNum = codeRows.reduce((max, r) => {
          const m = /^TSK-(\d+)$/.exec(r.taskCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let taskCode = `TSK-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(taskCode)) {
          nextNum++;
          taskCode = `TSK-${String(nextNum).padStart(4, "0")}`;
        }

        const allEmps = await tx.select().from(employees);
        const targetEmp = allEmps.find((e) => e.id === Number(assignedTo || currentUser.employeeId));
        if (!assignToAllStaff && (!targetEmp || targetEmp.archived || targetEmp.employmentStatus !== "Active")) {
          throw new AttendanceRequestError("সক্রিয় কর্মী নির্বাচন করুন", 400);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate))) {
          throw new AttendanceRequestError("সঠিক ডেডলাইন তারিখ দিন", 400);
        }
        const dueTimeVal = body.dueTime && /^\d{2}:\d{2}$/.test(String(body.dueTime)) ? String(body.dueTime) : null;
        const assigner = allEmps.find((e) => e.id === currentUser.employeeId);
        const assigneeEmp = targetEmp || assigner;
        if (!assigneeEmp) {
          throw new AttendanceRequestError("কর্মী প্রোফাইল পাওয়া যায়নি", 400);
        }
        const assignedLabel = assignToAllStaff ? "সকল স্টাফ" : targetEmp!.name;

        const [createdRow] = await tx
          .insert(tasks)
          .values({
            taskCode,
            title,
            description: description || "",
            assignedTo: Number(assigneeEmp.id),
            managerId: managerId ? Number(managerId) : currentUser.employeeId,
            projectId: projectId ? Number(projectId) : null,
            siteId: siteId ? Number(siteId) : null,
            clientId: clientId ? Number(clientId) : null,
            priority: priority || "Medium",
            dueDate,
            dueTime: dueTimeVal,
            status: "Todo",
            progressPercent: 0,
            requiresReview: Boolean(requiresReview),
            createdBy: currentUser.name,
            assignedByUserId: currentUser.id,
            assignedByEmployeeId: assigner?.id ?? null,
            assignedByName: assigner?.name || currentUser.name,
            assignedByDesignation: assigner?.designation || currentUser.role,
            assignedToName: assignToAllStaff ? "সকল স্টাফ" : targetEmp!.name,
            assignedToDesignation: assignToAllStaff ? "" : targetEmp!.designation,
            attachmentUrl: attachmentUrl || null,
            isCompanyWide: Boolean(assignToAllStaff) || body.visibility === "Everyone",
            visibility: body.visibility || (assignToAllStaff ? "Everyone" : "Assigned"),
            category: body.category || "General",
            lastUpdateAt: new Date(),
          })
          .returning();

        await tx.insert(taskComments).values({
          taskId: createdRow.id,
          userId: currentUser.id,
          authorName: currentUser.name,
          actorEmployeeId: currentUser.employeeId,
          actorDesignation: currentUser.designation,
          comment: `${createdRow.assignedByName} → ${assignedLabel}-কে টাস্ক দিয়েছেন • ডেডলাইন ${dueDate}${dueTimeVal ? ` ${dueTimeVal}` : ""}`,
          actionType: "Assigned",
          eventType: "TASK_ASSIGNED",
          oldStatus: null,
          newStatus: "Todo",
          progressPercent: 0,
        });

        return createdRow;
      });

      const allUserRows = await db.select().from(users);
      const [targetEmpRow] = assignedTo
        ? await db.select().from(employees).where(eq(employees.id, Number(assignedTo)))
        : [undefined];
      const recipientIds = assignToAllStaff
        ? allUserRows.filter((u) => u.status === "Active").map((u) => u.id)
        : targetEmpRow?.userId
          ? [targetEmpRow.userId]
          : [];
      const project = projectId ? (await db.select().from(projects).where(eq(projects.id, Number(projectId))))[0] : null;
      const site = siteId ? (await db.select().from(sites).where(eq(sites.id, Number(siteId))))[0] : null;
      const priorityBn: Record<string, string> = { Critical: "অতি জরুরি", High: "জরুরি", Medium: "মাঝারি", Low: "সাধারণ" };
      await notifyUsers({
        recipientUserIds: recipientIds,
        actor: { id: currentUser.id, name: currentUser.name },
        category: "Task Assigned",
        eventType: "TASK_ASSIGNED",
        title: `নতুন দায়িত্ব দেওয়া হয়েছে: ${created.title}`,
        message:
          `কাজ: ${created.title}\n` +
          `দিয়েছেন: ${created.assignedByName}${created.assignedByDesignation ? ` (${created.assignedByDesignation})` : ""}\n` +
          `দেওয়ার সময়: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}\n` +
          `ডেডলাইন: ${created.dueDate}${created.dueTime ? ` ${created.dueTime}` : ""}\n` +
          `অগ্রাধিকার: ${priorityBn[created.priority] || created.priority}` +
          (project ? `\nপ্রজেক্ট: ${project.name}` : "") +
          (site ? `\nসাইট: ${site.name}` : ""),
        task: created,
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "TASK_ASSIGNED",
        entity: "Task",
        recordId: created.taskCode,
        afterData: {
          assignedBy: created.assignedByName,
          assignedTo: created.assignedToName,
          dueDate: created.dueDate,
          dueTime: created.dueTime,
          priority: created.priority,
        },
      });

      return NextResponse.json({ success: true, task: created });
    }

    if (action === "createAnnouncement") {
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
          { error: "Title and Announcement Description are required" },
          { status: 400 }
        );
      }

      await createNotification({
        targetRole: "All",
        type: "Announcement",
        title,
        message,
        createdBy: currentUser.name,
        priority: priority || "High",
        assignedPersonOrTeam: assignedPersonOrTeam || "All Staff",
        dueDate: dueDate || today,
        attachmentUrl: attachmentUrl || null,
        relatedUrl: "/notifications",
        relatedEntityCode: `NOTICE-${Date.now().toString().slice(-4)}`,
      });

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

      const isTaskMgmt = canViewAllEmployeeProfiles(currentUser.role) || currentUser.role === "Project Manager";
      const isOwnTask = task.assignedTo === currentUser.employeeId;
      if (!isTaskMgmt && !isOwnTask && !task.isCompanyWide) {
        return NextResponse.json(
          { error: "অন্যের টাস্ক পরিবর্তনের অনুমতি নেই।" },
          { status: 403 }
        );
      }

      let finalStatus = status || task.status;
      const topMgmt = ["Owner", "Chairman", "MD", "Admin"].includes(currentUser.role);
      if (finalStatus === "Completed" && (!isTaskMgmt || (isOwnTask && !topMgmt))) {
        finalStatus = "Review";
      }
      if (!isTaskMgmt && (finalStatus === "Cancelled" || finalStatus === "Reopened")) {
        return NextResponse.json(
          { error: "এই স্ট্যাটাস শুধু ম্যানেজমেন্ট দিতে পারে।" },
          { status: 403 }
        );
      }

      // ⭐ ফিক্স: স্ট্যাটাস বদলালেই ভুলভাবে ১০০% হয়ে যাওয়া ঠেকানো
      // Accepted → 0%, In Progress → সর্বোচ্চ ৯৯% (জমা ১০০% আলাদাভাবে), Review/Completed → ১০০%
      let finalProgress =
        progressPercent !== undefined
          ? Math.min(100, Math.max(0, Number(progressPercent)))
          : task.progressPercent;

      if (finalStatus === "Completed" || finalStatus === "Review") {
        finalProgress = 100;
      } else if (finalStatus === "Accepted" && progressPercent === undefined) {
        finalProgress = 0;
      } else if (finalStatus === "In Progress" && progressPercent === undefined) {
        finalProgress = Math.min(finalProgress, 99);
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
          reviewStatus:
            finalStatus === "Review"
              ? "Pending Review"
              : finalStatus === "Completed"
              ? "Approved"
              : task.reviewStatus,
          startDate:
            !task.startDate && (finalStatus === "In Progress" || finalStatus === "Accepted")
              ? today
              : task.startDate,
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();

      const isResubmission = task.status === "Reopened" || task.correctionCount > 0;
      const statusEvent =
        finalStatus === "Accepted"
          ? "TASK_ACCEPTED"
          : finalStatus === "In Progress"
          ? "TASK_STARTED"
          : finalStatus === "Review"
          ? isResubmission ? "TASK_RESUBMITTED" : "TASK_COMPLETED"
          : finalStatus === "Completed"
          ? "TASK_APPROVED"
          : finalStatus === "Blocked"
          ? "TASK_PROBLEM_REPORTED"
          : "TASK_STATUS_CHANGED";

      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        actorEmployeeId: currentUser.employeeId,
        actorDesignation: currentUser.designation,
        comment:
          comment ||
          completionNote ||
          `Status updated to ${finalStatus} (${finalProgress}%)`,
        actionType:
          finalStatus === "Completed"
            ? "ReviewApproved"
            : finalStatus === "Review"
            ? "SubmittedForReview"
            : finalStatus === "Accepted"
            ? "Accepted"
            : finalStatus === "In Progress"
            ? "Started"
            : "StatusChange",
        eventType: statusEvent,
        oldStatus: task.status,
        newStatus: finalStatus,
        progressPercent: finalProgress,
      });

      {
        const actor = { id: currentUser.id, name: currentUser.name };
        const watchers = await taskWatcherUserIds(task);
        const assigneeUid = await assigneeUserId(task);
        const who = updated.assignedToName || currentUser.name;
        const reviewer = { name: currentUser.name };
        if (statusEvent === "TASK_ACCEPTED" && task.status !== "Accepted") {
          await notifyUsers({ recipientUserIds: watchers, actor, category: "Task Update", eventType: "TASK_ACCEPTED",
            title: `টাস্ক গ্রহণ করেছেন: ${task.title}`, message: `${who} টাস্কটি গ্রহণ করেছেন (${task.taskCode})।`, task: updated });
        } else if (statusEvent === "TASK_STARTED" && task.status !== "In Progress") {
          await notifyUsers({ recipientUserIds: watchers, actor, category: "Task Update", eventType: "TASK_STARTED",
            title: `কাজ শুরু হয়েছে: ${task.title}`, message: `${who} কাজ শুরু করেছেন (${task.taskCode}) • অগ্রগতি ${finalProgress}%`, task: updated });
        } else if (statusEvent === "TASK_COMPLETED" || statusEvent === "TASK_RESUBMITTED") {
          await notifyUsers({ recipientUserIds: watchers, actor, category: "Approval", eventType: statusEvent,
            title: statusEvent === "TASK_RESUBMITTED" ? `সংশোধনের পর পুনরায় জমা: ${task.title}` : `কাজ সম্পন্ন — অনুমোদন প্রয়োজন: ${task.title}`,
            message: `${who} ${statusEvent === "TASK_RESUBMITTED" ? "সংশোধন করে আবার জমা দিয়েছেন" : "কাজটি সম্পন্ন হিসেবে জমা দিয়েছেন"} (${task.taskCode})। অনুমোদন বা সংশোধন দিন।${completionNote ? ` নোট: ${completionNote}` : ""}`,
            task: updated });
        } else if (statusEvent === "TASK_APPROVED" && assigneeUid) {
          await notifyUsers({ recipientUserIds: [assigneeUid], actor, category: "Approval", eventType: "TASK_APPROVED",
            title: `টাস্ক অনুমোদিত: ${task.title}`,
            message: `টাস্ক: ${task.title} (${task.taskCode})\nঅনুমোদন করেছেন: ${reviewer.name}\nঅনুমোদনের সময়: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}`,
            task: updated });
        } else if (statusEvent === "TASK_PROBLEM_REPORTED") {
          await notifyUsers({ recipientUserIds: watchers, actor, category: "Task Update", eventType: "TASK_PROBLEM_REPORTED",
            title: `সমস্যা/আটকে আছে: ${task.title}`, message: `${who} • ${task.taskCode}${comment ? ` — ${comment}` : ""}`, task: updated });
        } else if ((finalStatus === "Reopened" || finalStatus === "Cancelled") && assigneeUid) {
          await notifyUsers({ recipientUserIds: [assigneeUid], actor, category: "Task Update", eventType: "TASK_STATUS_CHANGED",
            title: `টাস্ক ${finalStatus === "Cancelled" ? "বাতিল" : "পুনরায় খোলা"} হয়েছে: ${task.title}`,
            message: `${task.taskCode} — ${currentUser.name}`, task: updated });
        }
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

    if (action === "updateTaskProgress") {
      // Employee (own task) or management: progress %, update note, next action, delay reason, proof files
      const { taskId, progressPercent, note, nextAction, delayReason, fileIds, blocked, remaining } = body;
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      const isTaskMgmt = canViewAllEmployeeProfiles(currentUser.role) || currentUser.role === "Project Manager";
      if (!isTaskMgmt && task.assignedTo !== currentUser.employeeId) {
        return NextResponse.json({ error: "অন্যের টাস্ক আপডেটের অনুমতি নেই।" }, { status: 403 });
      }
      if (task.status === "Completed" || task.status === "Cancelled") {
        return NextResponse.json({ error: "সম্পন্ন/বাতিল টাস্ক আপডেট করা যায় না।" }, { status: 400 });
      }
      const pct = Math.min(100, Math.max(0, Number(progressPercent ?? task.progressPercent)));
      if (!note || !String(note).trim()) {
        return NextResponse.json({ error: "আপডেট নোট লিখুন" }, { status: 400 });
      }

      // Validate proof files belong to this task
      const ids: number[] = Array.isArray(fileIds) ? fileIds.map(Number).filter(Boolean) : [];
      if (ids.length) {
        const owned = await db.select().from(workFiles).where(eq(workFiles.taskId, task.id));
        const ownedIds = new Set(owned.map((f) => f.id));
        if (!ids.every((i) => ownedIds.has(i))) {
          return NextResponse.json({ error: "অবৈধ ফাইল সংযুক্তি" }, { status: 400 });
        }
      }

      const newStatus = blocked
        ? "Blocked"
        : task.status === "Todo" || task.status === "Accepted" || task.status === "Blocked" || task.status === "Reopened"
        ? pct > 0 ? "In Progress" : task.status
        : task.status;

      const [updated] = await db
        .update(tasks)
        .set({
          progressPercent: pct,
          status: newStatus,
          nextAction: nextAction !== undefined ? String(nextAction) : task.nextAction,
          delayReason: delayReason !== undefined ? String(delayReason) : task.delayReason,
          startDate: task.startDate || (pct > 0 ? today : null),
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();

      const progressWho = task.assignedToName || currentUser.name;
      const problemText = String(delayReason || "").trim();
      const problemReported = Boolean(blocked) || (problemText !== "" && problemText !== (task.delayReason || ""));
      const baseHistory = {
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        actorEmployeeId: currentUser.employeeId,
        actorDesignation: currentUser.designation,
        oldStatus: task.status,
        newStatus: updated.status,
        progressPercent: pct,
      };
      // 1) progress
      await db.insert(taskComments).values({
        ...baseHistory,
        comment: `${String(note)}${remaining ? `\nবাকি কাজ: ${String(remaining)}` : ""}${nextAction ? `\nপরবর্তী: ${String(nextAction)}` : ""}`,
        actionType: "ProgressUpdate",
        eventType: "TASK_PROGRESS_UPDATED",
      });
      // 2) attachment (separate event)
      if (ids.length) {
        await db.insert(taskComments).values({
          ...baseHistory,
          comment: `${ids.length}টি ফাইল/প্রমাণ জমা`,
          actionType: "ProofSubmitted",
          eventType: "TASK_ATTACHMENT_ADDED",
          fileIds: ids,
        });
      }
      // 3) problem / blocker (separate event)
      if (problemReported) {
        await db.insert(taskComments).values({
          ...baseHistory,
          comment: `সমস্যা: ${problemText || "কাজ আটকে আছে"}`,
          actionType: "StatusChange",
          eventType: "TASK_PROBLEM_REPORTED",
        });
      }

      {
        const actor = { id: currentUser.id, name: currentUser.name };
        const watchers = await taskWatcherUserIds(task);
        await notifyUsers({
          recipientUserIds: watchers,
          actor,
          category: "Task Update",
          eventType: "TASK_PROGRESS_UPDATED",
          title: `অগ্রগতি ${pct}%: ${task.title}`,
          message: `${progressWho} • ${task.taskCode} • ${task.progressPercent}% → ${pct}%\n${String(note)}${remaining ? `\nবাকি: ${String(remaining)}` : ""}`,
          task: updated,
        });
        if (ids.length) {
          await notifyUsers({
            recipientUserIds: watchers,
            actor,
            category: "Task Update",
            eventType: "TASK_ATTACHMENT_ADDED",
            title: `প্রমাণ/ফাইল জমা: ${task.title}`,
            message: `${progressWho} ${ids.length}টি ফাইল জমা দিয়েছেন (${task.taskCode})।`,
            task: updated,
          });
        }
        if (problemReported) {
          await notifyUsers({
            recipientUserIds: watchers,
            actor,
            category: "Task Update",
            eventType: "TASK_PROBLEM_REPORTED",
            title: `সমস্যা রিপোর্ট: ${task.title}`,
            message: `${progressWho} • ${task.taskCode}\nসমস্যা: ${problemText || "কাজ আটকে আছে"}`,
            task: updated,
          });
        }
      }

      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "markTaskViewed") {
      // Only the assignee's own first view is recorded
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(body.taskId)));
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (task.assignedTo !== currentUser.employeeId) {
        return NextResponse.json({ success: true, recorded: false });
      }
      if (task.viewedAt) return NextResponse.json({ success: true, recorded: false });
      const claimed = await db
        .update(tasks)
        .set({ viewedAt: new Date() })
        .where(and(eq(tasks.id, task.id), isNull(tasks.viewedAt)))
        .returning();
      if (claimed.length === 0) return NextResponse.json({ success: true, recorded: false });
      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        actorEmployeeId: currentUser.employeeId,
        actorDesignation: currentUser.designation,
        comment: `${currentUser.name} টাস্কটি দেখেছেন`,
        actionType: "Viewed",
        eventType: "TASK_VIEWED",
        oldStatus: task.status,
        newStatus: task.status,
        progressPercent: task.progressPercent,
      });
      // ⭐ null check — assignedByUserId না থাকলে notify crash হতো
      if (task.assignedByUserId) {
        await notifyUsers({
          recipientUserIds: [task.assignedByUserId],
          actor: { id: currentUser.id, name: currentUser.name },
          category: "Task Update",
          eventType: "TASK_VIEWED",
          title: `টাস্ক দেখা হয়েছে: ${task.title}`,
          message: `${currentUser.name} ${task.taskCode} টাস্কটি দেখেছেন।`,
          task: claimed[0],
        });
      }
      return NextResponse.json({ success: true, recorded: true });
    }

    if (action === "reviewTask") {
      // Management: Approve or Correction Required (reason mandatory)
      const isTaskMgmt = canViewAllEmployeeProfiles(currentUser.role) || currentUser.role === "Project Manager";
      if (!isTaskMgmt) {
        return NextResponse.json({ error: "রিভিউ করার অনুমতি নেই।" }, { status: 403 });
      }
      const { taskId, decision, reason } = body;
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (
        task.assignedTo === currentUser.employeeId &&
        !["Owner", "Chairman", "MD", "Admin"].includes(currentUser.role)
      ) {
        return NextResponse.json({ error: "নিজের কাজ নিজে অনুমোদন করা যাবে না।" }, { status: 403 });
      }
      if (decision !== "Approve" && decision !== "Correction") {
        return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
      }
      if (decision === "Correction" && (!reason || !String(reason).trim())) {
        return NextResponse.json({ error: "সংশোধনের কারণ লিখতে হবে" }, { status: 400 });
      }

      const approve = decision === "Approve";
      const [updated] = await db
        .update(tasks)
        .set(
          approve
            ? {
                status: "Completed",
                progressPercent: 100,
                reviewStatus: "Approved",
                reviewNote: reason ? String(reason) : "",
                reviewedBy: currentUser.name,
                reviewedAt: new Date(),
                completedBy: task.completedBy || currentUser.name,
                completedAt: task.completedAt || new Date(),
                lastUpdateAt: new Date(),
              }
            : {
                status: "Reopened",
                progressPercent: Math.min(task.progressPercent, 90),
                reviewStatus: "Correction Required",
                reviewNote: String(reason),
                correctionCount: task.correctionCount + 1,
                reviewedBy: currentUser.name,
                reviewedAt: new Date(),
                lastUpdateAt: new Date(),
              }
        )
        .where(eq(tasks.id, task.id))
        .returning();

      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        actorEmployeeId: currentUser.employeeId,
        actorDesignation: currentUser.designation,
        comment: approve ? `অনুমোদিত${reason ? `: ${reason}` : ""}` : `সংশোধন প্রয়োজন: ${reason}`,
        actionType: approve ? "ReviewApproved" : "CorrectionRequired",
        eventType: approve ? "TASK_APPROVED" : "TASK_CORRECTION_REQUIRED",
        oldStatus: task.status,
        newStatus: updated.status,
        progressPercent: updated.progressPercent,
      });

      const reviewedAtBd = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
      const assigneeUid = await assigneeUserId(task);
      await notifyUsers({
        recipientUserIds: assigneeUid ? [assigneeUid] : [],
        actor: { id: currentUser.id, name: currentUser.name },
        category: approve ? "Approval" : "Correction",
        eventType: approve ? "TASK_APPROVED" : "TASK_CORRECTION_REQUIRED",
        title: approve ? `টাস্ক অনুমোদিত: ${task.title}` : `সংশোধন প্রয়োজন: ${task.title}`,
        message: approve
          ? `টাস্ক: ${task.title} (${task.taskCode})\nঅনুমোদন করেছেন: ${currentUser.name}${currentUser.designation ? ` (${currentUser.designation})` : ""}\nঅনুমোদনের সময়: ${reviewedAtBd}${reason ? `\nমন্তব্য: ${reason}` : ""}`
          : `টাস্ক: ${task.title} (${task.taskCode})\nকারণ: ${reason}\nরিভিউ করেছেন: ${currentUser.name}${currentUser.designation ? ` (${currentUser.designation})` : ""}\nসময়: ${reviewedAtBd}`,
        task: updated,
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: approve ? "TASK_APPROVED" : "TASK_CORRECTION_REQUIRED",
        entity: "Task",
        recordId: task.taskCode,
        beforeData: { status: task.status },
        afterData: { status: updated.status, reason },
      });

      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "updateTaskAssignment") {
      // Management: reassign / change deadline / priority
      const isTaskMgmt = canViewAllEmployeeProfiles(currentUser.role) || currentUser.role === "Project Manager";
      if (!isTaskMgmt) {
        return NextResponse.json({ error: "টাস্ক পুনঃবণ্টনের অনুমতি নেই।" }, { status: 403 });
      }
      const { taskId, assignedTo, dueDate, priority } = body;
      const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate))) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      let newAssignee = task.assignedTo;
      let newEmpRow: typeof employees.$inferSelect | null = null;
      if (assignedTo && Number(assignedTo) !== task.assignedTo) {
        const [emp] = await db.select().from(employees).where(eq(employees.id, Number(assignedTo)));
        if (!emp || emp.archived) return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
        newAssignee = emp.id;
        newEmpRow = emp;
      }
      const [updated] = await db
        .update(tasks)
        .set({
          assignedTo: newAssignee,
          assignedToName: newEmpRow ? newEmpRow.name : task.assignedToName,
          assignedToDesignation: newEmpRow ? newEmpRow.designation : task.assignedToDesignation,
          dueDate: dueDate || task.dueDate,
          dueTime: body.dueTime !== undefined ? (body.dueTime || null) : task.dueTime,
          priority: priority || task.priority,
          overdueNotifiedAt: dueDate && dueDate !== task.dueDate ? null : task.overdueNotifiedAt,
          deadlineReminderSentAt: dueDate && dueDate !== task.dueDate ? null : task.deadlineReminderSentAt,
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();

      const changes: string[] = [];
      if (newAssignee !== task.assignedTo) changes.push("কর্মী পরিবর্তন");
      if (dueDate && dueDate !== task.dueDate) changes.push(`ডেডলাইন ${task.dueDate} → ${dueDate}`);
      if (priority && priority !== task.priority) changes.push(`অগ্রাধিকার ${task.priority} → ${priority}`);
      await db.insert(taskComments).values({
        taskId: task.id,
        userId: currentUser.id,
        authorName: currentUser.name,
        actorEmployeeId: currentUser.employeeId,
        actorDesignation: currentUser.designation,
        comment: changes.join(", ") || "কোনো পরিবর্তন নেই",
        actionType: newAssignee !== task.assignedTo ? "Reassigned" : "DeadlineChanged",
        eventType: newAssignee !== task.assignedTo ? "TASK_REASSIGNED" : "TASK_DEADLINE_CHANGED",
        oldStatus: task.status,
        newStatus: updated.status,
      });
      const oldAssigneeUid = await assigneeUserId(task);
      const recipientIds = newEmpRow
        ? [newEmpRow.userId, oldAssigneeUid].filter((v): v is number => typeof v === "number")
        : oldAssigneeUid
          ? [oldAssigneeUid]
          : [];
      if (recipientIds.length > 0) {
        await notifyUsers({
          recipientUserIds: recipientIds,
          actor: { id: currentUser.id, name: currentUser.name },
          category: newEmpRow ? "Task Assigned" : "Deadline",
          eventType: newEmpRow ? "TASK_REASSIGNED" : "TASK_DEADLINE_CHANGED",
          title: newEmpRow ? `নতুন দায়িত্ব (পুনঃবণ্টন): ${task.title}` : `টাস্ক পরিবর্তন: ${task.title}`,
          message: `${task.taskCode} • ${changes.join(", ") || "হালনাগাদ"} • দিয়েছেন ${currentUser.name}`,
          task: updated,
        });
      }
      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "TASK_ASSIGNMENT_UPDATE",
        entity: "Task",
        recordId: task.taskCode,
        beforeData: { assignedTo: task.assignedTo, dueDate: task.dueDate, priority: task.priority },
        afterData: { assignedTo: newAssignee, dueDate: updated.dueDate, priority: updated.priority },
      });
      return NextResponse.json({ success: true, task: updated });
    }

    if (action === "addManualPerformanceScore") {
      if (!isManagementRole(currentUser.role) && currentUser.role !== "HR") {
        return NextResponse.json({ error: "পারফরম্যান্স রিভিউ দেওয়ার অনুমতি নেই।" }, { status: 403 });
      }
      const { employeeId, period, score, comments } = body;
      const s = Number(score);
      if (!employeeId || isNaN(s) || s < 0 || s > 100) {
        return NextResponse.json({ error: "স্কোর ০–১০০ এর মধ্যে দিন" }, { status: 400 });
      }
      const [rev] = await db
        .insert(performanceReviews)
        .values({
          employeeId: Number(employeeId),
          period: period || new Date().toISOString().slice(0, 7),
          managerReviewPoints: Math.round(s / 10),
          totalPoints: Math.round(s),
          managerComments: comments || "",
          reviewedBy: currentUser.name,
        })
        .returning();
      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "PERFORMANCE_MANUAL_REVIEW",
        entity: "PerformanceReview",
        recordId: String(rev.id),
        afterData: { employeeId, score: s, comments },
      });
      return NextResponse.json({ success: true, review: rev });
    }

    if (action === "addTaskComment") {
      const { taskId, comment } = body;
      if (!comment) {
        return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
      }
      const [cTask] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
      if (!cTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (
        !canViewAllEmployeeProfiles(currentUser.role) &&
        currentUser.role !== "Project Manager" &&
        cTask.assignedTo !== currentUser.employeeId &&
        !cTask.isCompanyWide
      ) {
        return NextResponse.json({ error: "অন্যের টাস্কে মন্তব্যের অনুমতি নেই।" }, { status: 403 });
      }
      const [c] = await db
        .insert(taskComments)
        .values({
          taskId: Number(taskId),
          userId: currentUser.id,
          authorName: currentUser.name,
          actorEmployeeId: currentUser.employeeId,
          actorDesignation: currentUser.designation,
          comment,
          actionType: "Comment",
          eventType: "TASK_COMMENT",
        })
        .returning();
      return NextResponse.json({ success: true, comment: c });
    }
    // =========================================================================
    // 6. CRM: LEADS, FOLLOW-UPS, CLIENTS & QUOTATIONS
    // =========================================================================
    if (action === "createLead") {
      const {
        companyId,
        whatsapp,
        location,
        source,
        service,
        requirement,
        landSize,
        roadWidth,
        budget,
        propertyType,
        projectName,
        unitFlatShop,
        preferredLocation,
        size,
        floor,
        bedrooms,
        purpose,
        expectedPurchaseDate,
        clientRequirement,
        priority,
        status,
        assignedStaffId,
        nextFollowUpDate,
        nextFollowUpTime,
        // ✅ নতুন ফিল্ড
        insafResponse,
        remarks,
        reminder1,
        reminder2,
        reminder3,
        leadDate,
      } = body;

      // Accept the canonical UI payload and common legacy aliases without writing
      // unknown properties into the Drizzle insert object.
      const name = String(body.name ?? body.clientName ?? body.leadName ?? "").trim();
      const phone = String(body.phone ?? body.mobile ?? body.contactNo ?? "").trim();

      if (!name || !phone) {
        return NextResponse.json({ error: "Lead Name and Phone are required" }, { status: 400 });
      }
      const normalizedBudget = Number(budget ?? 0);
      if (!Number.isFinite(normalizedBudget) || normalizedBudget < 0) {
        return NextResponse.json({ error: "Budget must be a valid non-negative number." }, { status: 400 });
      }
      const requestedCompany = String(companyId ?? "IBDC").trim().toUpperCase();
      const resolvedCompany = requestedCompany === "IREL" || requestedCompany === "2" ? "IREL" : "IBDC";
      const normalizedNextDate = nextFollowUpDate ? String(nextFollowUpDate).slice(0, 10) : today;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedNextDate)) {
        return NextResponse.json({ error: "Next Follow-up Date must use YYYY-MM-DD format." }, { status: 400 });
      }
      const normalizedNextTime = nextFollowUpTime ? String(nextFollowUpTime) : "10:00";
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedNextTime)) {
        return NextResponse.json({ error: "Next Follow-up Time must use HH:mm format." }, { status: 400 });
      }
      const access = leadCompanyAccess(currentUser);
      if (access !== "BOTH" && access !== resolvedCompany) {
        return NextResponse.json(
          { error: "এই কোম্পানির লিড তৈরি/দেখার অনুমতি নেই।" },
          { status: 403 }
        );
      }

      const IBDC_SERVICES = [
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
      ];
      const IREL_PROPERTY_TYPES = [
        "Flat",
        "Shop",
        "Office Space",
        "Commercial Space",
        "Apartment",
        "Land/Plot",
        "Investment",
        "Project",
        "Other",
      ];

      if (resolvedCompany === "IREL" && service && service !== "Other" && IBDC_SERVICES.includes(service)) {
        return NextResponse.json(
          {
            error: `Data Separation Violation: "${service}" is a Building Design (IBDC) service and cannot be used for an Insaf Real Estate Ltd. lead. Please select a Property Interest such as Flat, Shop or Land/Plot.`,
          },
          { status: 400 }
        );
      }

      if (resolvedCompany === "IBDC" && propertyType && propertyType !== "Other" && IREL_PROPERTY_TYPES.includes(propertyType)) {
        return NextResponse.json(
          {
            error: `Data Separation Violation: "${propertyType}" is a Real Estate (IREL) property type and cannot be used for an Insaf Building Design & Consultant Ltd. lead. Please select a Building Design Service.`,
          },
          { status: 400 }
        );
      }

      // ⭐ race-condition-safe lead code
      const lead = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('lead-code-allocation', 0))`
        );
        const rows = await tx.select({ leadCode: leads.leadCode }).from(leads);
        const usedCodes = new Set(rows.map((r) => r.leadCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^LEAD-(\d+)$/.exec(r.leadCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let leadCode = `LEAD-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(leadCode)) {
          nextNum++;
          leadCode = `LEAD-${String(nextNum).padStart(4, "0")}`;
        }

        const finalService =
          resolvedCompany === "IBDC"
            ? IBDC_SERVICES.includes(service)
              ? service
              : "Other"
            : "Other";
        const finalPropertyType =
          resolvedCompany === "IREL"
            ? IREL_PROPERTY_TYPES.includes(propertyType)
              ? propertyType
              : "Other"
            : "Other";

        const [createdLead] = await tx
          .insert(leads)
          .values({
            leadCode,
            companyId: resolvedCompany === "IREL" ? 2 : 1,
            name,
            phone,
            whatsapp: String(whatsapp || phone).trim(),
            location: location || "",
            source: source || "Direct",
            service: finalService,
            propertyType: finalPropertyType,
            projectName: resolvedCompany === "IREL" ? projectName || "" : "",
            unitFlatShop: resolvedCompany === "IREL" ? unitFlatShop || "" : "",
            preferredLocation: resolvedCompany === "IREL" ? preferredLocation || "" : "",
            size: resolvedCompany === "IREL" ? size || "" : "",
            floor: resolvedCompany === "IREL" ? floor || "" : "",
            bedrooms: resolvedCompany === "IREL" ? bedrooms || "" : "",
            purpose: resolvedCompany === "IREL" ? purpose || "" : "",
            expectedPurchaseDate: resolvedCompany === "IREL" ? expectedPurchaseDate || "" : "",
            clientRequirement: resolvedCompany === "IREL" ? clientRequirement || "" : "",
            requirement: resolvedCompany === "IBDC" ? requirement || "" : "",
            landSize: resolvedCompany === "IBDC" ? landSize || "" : "",
            roadWidth: resolvedCompany === "IBDC" ? roadWidth || "" : "",
            budget: normalizedBudget.toFixed(2),
            priority: ["Hot", "Warm", "Cold", "Lost"].includes(String(priority)) ? String(priority) : "Warm",
            status: [
              "New", "Contacted", "Follow-up", "Qualified", "Quotation", "Negotiating",
              "Won", "Lost", "On Hold",
              "Conversation Started", "Mid Stage", "Proposal Sent", "No Response", "Converted",
            ].includes(String(status))
              ? String(status)
              : "New",
            assignedStaffId:
              assignedStaffId !== undefined && assignedStaffId !== null && assignedStaffId !== ""
                ? Number(assignedStaffId)
                : currentUser.employeeId,
            nextFollowUpDate: normalizedNextDate,
            nextFollowUpTime: normalizedNextTime,

            // ✅ নতুন কলামগুলো — insert
            leadDate: leadDate ? String(leadDate).slice(0, 10) : null,
            insafResponse: insafResponse ? String(insafResponse) : "",
            remarks: remarks ? String(remarks) : "",
            reminder1: reminder1 ? String(reminder1) : "",
            reminder2: reminder2 ? String(reminder2) : "",
            reminder3: reminder3 ? String(reminder3) : "",
          })
          .returning();
        return createdLead;
      });

      return NextResponse.json({ success: true, lead });
    }

    if (action === "addLeadFollowup") {
      const {
        leadId,
        contactMethod,
        outcome,
        clientResponse,
        note,
        nextAction,
        nextFollowUpDate,
        nextFollowUpTime,
        attachment,
        newStatus,
      } = body;

      if (!leadId || !note || !outcome || !contactMethod) {
        return NextResponse.json(
          { error: "Contact Method, Outcome and Staff Note are required" },
          { status: 400 }
        );
      }

      const [lead] = await db.select().from(leads).where(eq(leads.id, Number(leadId)));
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const VALID_METHODS = [
        "Phone Call", "WhatsApp", "Facebook", "SMS", "Email",
        "Meeting", "Office Visit", "Site Visit", "Other",
      ];
      const VALID_OUTCOMES = [
        "No Response", "Contacted", "Interested", "Qualified", "Need More Information",
        "Quotation Sent", "Negotiating", "Call Back Later", "Not Interested",
        "Won", "Lost", "Other",
      ];
      const CLOSED = ["Won", "Lost", "Not Interested"];

      const method = VALID_METHODS.includes(contactMethod) ? contactMethod : "Phone Call";
      const resolvedOutcome = VALID_OUTCOMES.includes(outcome) ? outcome : "Contacted";
      const isClosed = CLOSED.includes(resolvedOutcome);
      const leadOnHold = lead.status === "On Hold";

      if (!isClosed && !leadOnHold && !nextFollowUpDate) {
        return NextResponse.json(
          {
            error:
              "Next Follow-up Date is required. Active leads must always have a next follow-up scheduled so they are never forgotten.",
          },
          { status: 400 }
        );
      }

      // ⭐ followUpNumber race-safe
      const { followUpNumber, createdFollowup } = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`followup:${leadId}`}, 0))`
        );
        const existingFollowUps = await tx
          .select({ id: leadFollowups.id, followUpNumber: leadFollowups.followUpNumber })
          .from(leadFollowups)
          .where(eq(leadFollowups.leadId, Number(leadId)));
        const maxFU = existingFollowUps.reduce((m, r) => Math.max(m, r.followUpNumber || 0), 0);
        const fuNum = maxFU + 1;
        const nowTime = new Date().toTimeString().slice(0, 5);

        const [f] = await tx
          .insert(leadFollowups)
          .values({
            leadId: Number(leadId),
            followUpNumber: fuNum,
            staffId: currentUser.employeeId,
            staffName: currentUser.name,
            date: today,
            time: nowTime,
            contactMethod: method,
            outcome: resolvedOutcome,
            clientResponse: clientResponse || "",
            discussion: note,
            nextAction: nextAction || (isClosed ? "No further follow-up" : "Follow up as scheduled"),
            nextFollowUpDate: isClosed ? null : nextFollowUpDate,
            nextFollowUpTime: nextFollowUpTime || "10:00",
            attachmentName: attachment?.name || null,
            attachmentType: attachment?.type || null,
            attachmentSize: attachment?.size || null,
            attachmentUrl: attachment?.url || null,
            reminderKey: isClosed ? null : `FU-${leadId}-${fuNum}`,
            reminderNotified: false,
            result: resolvedOutcome,
          })
          .returning();
        return { followUpNumber: fuNum, createdFollowup: f };
      });

      let nextStatus = newStatus;
      if (!nextStatus) {
        if (isClosed) nextStatus = resolvedOutcome === "Won" ? "Won" : "Lost";
        else if (resolvedOutcome === "Qualified") nextStatus = "Qualified";
        else if (resolvedOutcome === "Quotation Sent") nextStatus = "Quotation";
        else if (resolvedOutcome === "Negotiating") nextStatus = "Negotiating";
        else if (resolvedOutcome === "Contacted") nextStatus = "Contacted";
        else nextStatus = "Follow-up";
      }

      await db
        .update(leads)
        .set({
          status: nextStatus,
          lastContactDate: today,
          nextFollowUpDate: isClosed ? null : nextFollowUpDate,
          nextFollowUpTime: nextFollowUpTime || "10:00",
        })
        .where(eq(leads.id, lead.id));

      await createNotification({
        targetRole: "All",
        type: resolvedOutcome === "Won" ? "Project Update" : "Follow-up Due",
        title: isClosed
          ? `Lead ${resolvedOutcome}: ${lead.name} (${lead.leadCode})`
          : `Follow-up #${followUpNumber} logged for ${lead.name}`,
        message: isClosed
          ? `${lead.name} (${lead.leadCode}) marked ${resolvedOutcome} by ${currentUser.name} after ${followUpNumber} follow-up(s).`
          : `${lead.name} (${lead.leadCode}) — ${method} • ${resolvedOutcome}. Next follow-up: ${nextFollowUpDate} ${nextFollowUpTime || "10:00"}. ${clientResponse || note}`,
        createdBy: currentUser.name,
        priority: lead.priority,
        assignedPersonOrTeam: lead.name,
        dueDate: isClosed ? null : nextFollowUpDate,
        relatedUrl: "/leads",
        relatedEntityCode: lead.leadCode,
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "FOLLOW_UP_CREATE",
        entity: "LeadFollowup",
        recordId: `${lead.leadCode}-FU-${followUpNumber}`,
        beforeData: {
          status: lead.status,
          nextFollowUpDate: lead.nextFollowUpDate,
        },
        afterData: {
          followUpNumber,
          contactMethod: method,
          outcome: resolvedOutcome,
          clientResponse: clientResponse || "",
          note,
          nextFollowUpDate: isClosed ? null : nextFollowUpDate,
          nextFollowUpTime: nextFollowUpTime || "10:00",
          newStatus: nextStatus,
        },
      });

      return NextResponse.json({ success: true, followup: createdFollowup });
    }

    if (action === "updateLead") {
      const leadId = Number(body.leadId ?? body.id);
      if (!Number.isInteger(leadId) || leadId <= 0) {
        return NextResponse.json({ error: "A valid Lead ID is required." }, { status: 400 });
      }

      const [existingLead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!existingLead) {
        return NextResponse.json({ error: "Lead not found." }, { status: 404 });
      }

      const access = leadCompanyAccess(currentUser);
      const existingCompany = Number(existingLead.companyId) === 2 ? "IREL" : "IBDC";
      if (access !== "BOTH" && access !== existingCompany) {
        return NextResponse.json({ error: "এই কোম্পানির লিড সম্পাদনার অনুমতি নেই।" }, { status: 403 });
      }

      const requestedCompany = String(body.companyId ?? existingCompany).trim().toUpperCase();
      const nextCompany = requestedCompany === "IREL" || requestedCompany === "2" ? "IREL" : "IBDC";
      if (access !== "BOTH" && access !== nextCompany) {
        return NextResponse.json({ error: "অন্য কোম্পানিতে লিড স্থানান্তরের অনুমতি নেই।" }, { status: 403 });
      }

      const validStatuses = [
        "New", "Contacted", "Follow-up", "Qualified", "Quotation", "Negotiating",
        "Won", "Lost", "On Hold",
        "Conversation Started", "Mid Stage", "Proposal Sent", "No Response", "Converted",
      ];
      const validPriorities = ["Hot", "Warm", "Cold", "Lost"];

      const nextName = String(body.name ?? existingLead.name).trim();
      const nextPhone = String(body.phone ?? existingLead.phone).trim();
      const nextBudget = Number(body.budget ?? existingLead.budget ?? 0);
      if (!nextName || !nextPhone) {
        return NextResponse.json({ error: "Lead Name and Phone are required." }, { status: 400 });
      }
      if (!Number.isFinite(nextBudget) || nextBudget < 0) {
        return NextResponse.json({ error: "Budget must be a valid non-negative number." }, { status: 400 });
      }

      const nextDateRaw =
        body.nextFollowUpDate === undefined ? existingLead.nextFollowUpDate : body.nextFollowUpDate;
      const nextDate = nextDateRaw ? String(nextDateRaw).slice(0, 10) : null;
      if (nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
        return NextResponse.json({ error: "Next Follow-up Date must use YYYY-MM-DD format." }, { status: 400 });
      }

      const nextTime =
        body.nextFollowUpTime === undefined
          ? existingLead.nextFollowUpTime
          : String(body.nextFollowUpTime || "10:00");

      const nextStatus = validStatuses.includes(String(body.status))
        ? String(body.status)
        : existingLead.status;
      const closed = ["Won", "Lost", "On Hold", "Converted"].includes(nextStatus);

      const updateValues: any = {
        companyId: nextCompany === "IREL" ? 2 : 1,
        name: nextName,
        phone: nextPhone,
        whatsapp: String(body.whatsapp ?? existingLead.whatsapp ?? nextPhone).trim(),
        location: String(body.location ?? existingLead.location ?? "").trim(),
        source: String(body.source ?? existingLead.source ?? "Direct"),

        service:
          nextCompany === "IBDC"
            ? (typeof body.service === "string" && body.service.trim() ? body.service : existingLead.service)
            : "Other",
        propertyType:
          nextCompany === "IREL"
            ? (typeof body.propertyType === "string" && body.propertyType.trim() ? body.propertyType : existingLead.propertyType)
            : "Other",

        projectName: nextCompany === "IREL" ? String(body.projectName ?? existingLead.projectName ?? "") : "",
        unitFlatShop: nextCompany === "IREL" ? String(body.unitFlatShop ?? existingLead.unitFlatShop ?? "") : "",
        preferredLocation: nextCompany === "IREL" ? String(body.preferredLocation ?? existingLead.preferredLocation ?? "") : "",
        size: nextCompany === "IREL" ? String(body.size ?? existingLead.size ?? "") : "",
        floor: nextCompany === "IREL" ? String(body.floor ?? existingLead.floor ?? "") : "",
        bedrooms: nextCompany === "IREL" ? String(body.bedrooms ?? existingLead.bedrooms ?? "") : "",
        purpose: nextCompany === "IREL" ? String(body.purpose ?? existingLead.purpose ?? "") : "",
        expectedPurchaseDate:
          nextCompany === "IREL" ? String(body.expectedPurchaseDate ?? existingLead.expectedPurchaseDate ?? "") : "",
        clientRequirement:
          nextCompany === "IREL" ? String(body.clientRequirement ?? existingLead.clientRequirement ?? "") : "",

        requirement: nextCompany === "IBDC" ? String(body.requirement ?? existingLead.requirement ?? "") : "",
        landSize: nextCompany === "IBDC" ? String(body.landSize ?? existingLead.landSize ?? "") : "",
        roadWidth: nextCompany === "IBDC" ? String(body.roadWidth ?? existingLead.roadWidth ?? "") : "",

        budget: nextBudget.toFixed(2),
        priority: validPriorities.includes(String(body.priority))
          ? String(body.priority)
          : existingLead.priority,
        status: nextStatus,
        assignedStaffId:
          body.assignedStaffId === undefined
            ? existingLead.assignedStaffId
            : body.assignedStaffId === null || body.assignedStaffId === ""
            ? null
            : Number(body.assignedStaffId),
        nextFollowUpDate: closed ? null : nextDate,
        nextFollowUpTime: nextTime || "10:00",

        // ✅ নতুন কলামগুলো — update
        insafResponse: String(body.insafResponse ?? existingLead.insafResponse ?? ""),
        remarks: String(body.remarks ?? existingLead.remarks ?? ""),
        reminder1: String(body.reminder1 ?? existingLead.reminder1 ?? ""),
        reminder2: String(body.reminder2 ?? existingLead.reminder2 ?? ""),
        reminder3: String(body.reminder3 ?? existingLead.reminder3 ?? ""),
        leadDate: body.leadDate
          ? String(body.leadDate).slice(0, 10)
          : existingLead.leadDate ?? null,
      };

      const [updatedLead] = await db
        .update(leads)
        .set(updateValues)
        .where(eq(leads.id, leadId))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE",
        entity: "Lead",
        recordId: updatedLead.leadCode,
        beforeData: existingLead,
        afterData: updatedLead,
      });

      return NextResponse.json({ success: true, lead: updatedLead });
    }

    if (action === "deleteLead") {
      const { leadId } = body;
      if (!leadId) {
        return NextResponse.json({ error: "Lead ID প্রয়োজন" }, { status: 400 });
      }

      const [lead] = await db.select().from(leads).where(eq(leads.id, Number(leadId)));
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const access = leadCompanyAccess(currentUser);
      const leadCompany = Number(lead.companyId) === 2 ? "IREL" : "IBDC";
      if (access !== "BOTH" && access !== leadCompany) {
        return NextResponse.json({ error: "এই কোম্পানির লিড মোছার অনুমতি নেই।" }, { status: 403 });
      }

      await db.delete(leadFollowups).where(eq(leadFollowups.leadId, lead.id));
      await db.delete(leads).where(eq(leads.id, lead.id));

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "DELETE",
        entity: "Lead",
        recordId: lead.leadCode,
        beforeData: lead,
        afterData: null,
      });

      return NextResponse.json({ success: true, deletedId: lead.id });
    }

    if (action === "updateLeadStatus") {
      const { leadId, status } = body;
      if (!leadId || !status) {
        return NextResponse.json({ error: "Lead ID and Status are required" }, { status: 400 });
      }
      const [lead] = await db.select().from(leads).where(eq(leads.id, Number(leadId)));
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      await db
        .update(leads)
        .set({
          status,
          nextFollowUpDate:
            status === "Won" || status === "Lost" || status === "On Hold"
              ? null
              : lead.nextFollowUpDate,
        })
        .where(eq(leads.id, lead.id));

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "LEAD_STATUS_UPDATE",
        entity: "Lead",
        recordId: lead.leadCode,
        beforeData: { status: lead.status },
        afterData: { status },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "sendFollowUpReminders") {
      // Idempotent follow-up reminders (never duplicated for the same follow-up)
      const access = leadCompanyAccess(currentUser);
      const rawLeadRows = await db.select().from(leads);
      const allLeadRows = access === "BOTH"
        ? rawLeadRows
        : rawLeadRows.filter((lead) => (Number(lead.companyId) === 2 ? "IREL" : "IBDC") === access);
      const allFollowUps = await db.select().from(leadFollowups);
      const allEmpRows = await db.select().from(employees);
      const empNameMap = new Map(allEmpRows.map((e) => [e.id, e.name]));
      const empById = new Map(allEmpRows.map((e) => [e.id, e]));

      let dueToday = 0;
      let overdueSent = 0;
      let alreadyNotified = 0;

      for (const lead of allLeadRows) {
        if (!lead.nextFollowUpDate) continue;
        if (["Won", "Lost", "On Hold"].includes(lead.status)) continue;

        const isToday = lead.nextFollowUpDate === today;
        const isOverdue = lead.nextFollowUpDate < today;
        if (!isToday && !isOverdue) continue;

        const leadFUs = allFollowUps
          .filter((f) => f.leadId === lead.id)
          .sort((a, b) => b.followUpNumber - a.followUpNumber);
        const latest = leadFUs[0];
        const reminderType = isOverdue ? "Approval Required" : "Follow-up Due";
        // Deduplicate by lead + scheduled date + reminder category. This also
        // works for newly collected leads that do not have a follow-up row yet.
        const [alreadySent] = await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(and(
            eq(notifications.relatedEntityCode, lead.leadCode),
            eq(notifications.dueDate, lead.nextFollowUpDate),
            eq(notifications.type, reminderType),
            eq(notifications.createdBy, "Follow-up Automation"),
          ))
          .limit(1);
        if (alreadySent) {
          alreadyNotified++;
          continue;
        }

        const daysOverdue = isOverdue
          ? Math.round(
              (new Date(today).getTime() - new Date(lead.nextFollowUpDate).getTime()) / 86400000
            )
          : 0;

        const assignedEmployee = lead.assignedStaffId ? empById.get(lead.assignedStaffId) : undefined;
        await createNotification({
          userId: assignedEmployee?.userId ?? null,
          targetRole: assignedEmployee?.userId ? "All" : "Owner",
          type: reminderType,
          title: isOverdue
            ? `Follow-up overdue: ${lead.name} — ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
            : `Follow-up due today: ${lead.name}`,
          message: isOverdue
            ? `${lead.name} (${lead.leadCode}) was scheduled for follow-up on ${lead.nextFollowUpDate} and is now ${daysOverdue} day(s) overdue. Assigned to ${empNameMap.get(lead.assignedStaffId || 0) || "Unassigned"}.`
            : `${lead.name} (${lead.leadCode}) is due for follow-up today (${lead.nextFollowUpDate} ${lead.nextFollowUpTime}). Priority: ${lead.priority}.`,
          createdBy: "Follow-up Automation",
          priority: lead.priority,
          assignedPersonOrTeam: lead.name,
          dueDate: lead.nextFollowUpDate,
          relatedUrl: "/leads",
          relatedEntityCode: lead.leadCode,
        });

        if (latest) {
          await db
            .update(leadFollowups)
            .set({ reminderNotified: true })
            .where(eq(leadFollowups.id, latest.id));
        }

        if (isToday) dueToday++;
        else overdueSent++;
      }

      return NextResponse.json({
        success: true,
        dispatched: { dueToday, overdue: overdueSent, alreadyNotified },
      });
    }

    if (action === "convertLeadToClient") {
      const { leadId, email, companyName } = body;
      const [lead] = await db.select().from(leads).where(eq(leads.id, Number(leadId)));
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const client = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('client-code-allocation', 0))`
        );
        const rows = await tx.select({ clientCode: clients.clientCode }).from(clients);
        const usedCodes = new Set(rows.map((r) => r.clientCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^CLI-(\d+)$/.exec(r.clientCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let clientCode = `CLI-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(clientCode)) {
          nextNum++;
          clientCode = `CLI-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdClient] = await tx
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

        await tx
          .update(leads)
          .set({ status: "Won", convertedClientId: createdClient.id })
          .where(eq(leads.id, lead.id));

        return createdClient;
      });

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

      const client = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('client-code-allocation', 0))`
        );
        const rows = await tx.select({ clientCode: clients.clientCode }).from(clients);
        const usedCodes = new Set(rows.map((r) => r.clientCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^CLI-(\d+)$/.exec(r.clientCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let clientCode = `CLI-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(clientCode)) {
          nextNum++;
          clientCode = `CLI-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdClient] = await tx
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
        return createdClient;
      });

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
      const tx2 = Number(tax || 0);
      const totalAmount = Math.max(0, subtotal - disc + tx2);

      const quotation = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('quotation-code-allocation', 0))`
        );
        const rows = await tx.select({ quotationNumber: quotations.quotationNumber }).from(quotations);
        const usedCodes = new Set(rows.map((r) => r.quotationNumber));
        const maxNum = rows.reduce((max, r) => {
          const m = /^QUO-(\d+)$/.exec(r.quotationNumber);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let quotationNumber = `QUO-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(quotationNumber)) {
          nextNum++;
          quotationNumber = `QUO-${String(nextNum).padStart(4, "0")}`;
        }

        const [q] = await tx
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
            tax: tx2.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            terms: terms || "50% advance, 50% on completion.",
            validUntil: validUntil || "2026-12-31",
            status: "Sent",
            createdBy: currentUser.name,
          })
          .returning();

        if (leadId) {
          await tx.update(leads).set({ status: "Quotation" }).where(eq(leads.id, Number(leadId)));
        }
        return q;
      });

      return NextResponse.json({ success: true, quotation });
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

      const project = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('project-code-allocation', 0))`
        );
        const rows = await tx.select({ projectCode: projects.projectCode }).from(projects);
        const usedCodes = new Set(rows.map((r) => r.projectCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^PRJ-(\d+)$/.exec(r.projectCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let projectCode = `PRJ-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(projectCode)) {
          nextNum++;
          projectCode = `PRJ-${String(nextNum).padStart(4, "0")}`;
        }

        const [proj] = await tx
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
        return proj;
      });

      return NextResponse.json({ success: true, project });
    }

    if (action === "createSite") {
      const { projectId, name, location, siteManagerId, engineerId, workersCount } = body;
      if (!projectId || !name || !location) {
        return NextResponse.json({ error: "Project, Site Name & Location required" }, { status: 400 });
      }

      const site = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('site-code-allocation', 0))`
        );
        const rows = await tx.select({ siteCode: sites.siteCode }).from(sites);
        const usedCodes = new Set(rows.map((r) => r.siteCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^SITE-(\d+)$/.exec(r.siteCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let siteCode = `SITE-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(siteCode)) {
          nextNum++;
          siteCode = `SITE-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdSite] = await tx
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
        return createdSite;
      });

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

      const reportCode = `SR-${String(Date.now()).slice(-8)}`;
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

      await db
        .update(sites)
        .set({
          progressPercent: prog,
          workersCount: Number(labourCount || 0),
          problems: problems || "",
        })
        .where(eq(sites.id, Number(siteId)));

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

      const openQty = Number(openingStock || 0);
      const cost = Number(unitCost || 0);

      const mat = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('material-code-allocation', 0))`
        );
        const rows = await tx.select({ materialCode: materials.materialCode }).from(materials);
        const usedCodes = new Set(rows.map((r) => r.materialCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^MAT-(\d+)$/.exec(r.materialCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let materialCode = `MAT-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(materialCode)) {
          nextNum++;
          materialCode = `MAT-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdMat] = await tx
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
          await tx.insert(stockMovements).values({
            materialId: createdMat.id,
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
        return createdMat;
      });

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
            await tx.execute(
              sql`select pg_advisory_xact_lock(hashtextextended('expense-code-allocation', 0))`
            );
            const rows = await tx.select({ expenseCode: expenses.expenseCode }).from(expenses);
            const usedCodes = new Set(rows.map((r) => r.expenseCode));
            const maxNum = rows.reduce((max, r) => {
              const m = /^EXP-(\d+)$/.exec(r.expenseCode);
              return m ? Math.max(max, Number(m[1])) : max;
            }, 0);
            let nextNum = maxNum + 1;
            let expCode = `EXP-${String(nextNum).padStart(4, "0")}`;
            while (usedCodes.has(expCode)) {
              nextNum++;
              expCode = `EXP-${String(nextNum).padStart(4, "0")}`;
            }

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
    // 9. SUPPLIERS & PROCUREMENT
    // =========================================================================
    if (action === "createSupplier") {
      const { name, phone, email, address, contactPerson, productsProvided } = body;
      if (!name || !phone) {
        return NextResponse.json({ error: "Supplier Name and Phone required" }, { status: 400 });
      }

      const supplier = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('supplier-code-allocation', 0))`
        );
        const rows = await tx.select({ supplierCode: suppliers.supplierCode }).from(suppliers);
        const usedCodes = new Set(rows.map((r) => r.supplierCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^SUP-(\d+)$/.exec(r.supplierCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let supplierCode = `SUP-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(supplierCode)) {
          nextNum++;
          supplierCode = `SUP-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdSup] = await tx
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
        return createdSup;
      });

      return NextResponse.json({ success: true, supplier });
    }

    if (action === "createPurchaseRequest") {
      const { projectId, siteId, items, notes } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "At least 1 material item required" }, { status: 400 });
      }
      const prCode = `PR-${String(Date.now()).slice(-8)}`;
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

      const po = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('po-code-allocation', 0))`
        );
        const rows = await tx.select({ poCode: purchaseOrders.poCode }).from(purchaseOrders);
        const usedCodes = new Set(rows.map((r) => r.poCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^PO-(\d+)$/.exec(r.poCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let poCode = `PO-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(poCode)) {
          nextNum++;
          poCode = `PO-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdPo] = await tx
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
          await tx
            .update(purchaseRequests)
            .set({ status: "Converted to PO" })
            .where(eq(purchaseRequests.id, Number(prId)));
        }
        return createdPo;
      });

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE",
        entity: "PurchaseOrder",
        recordId: po.poCode,
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
        // Create Supplier Bill (⚠️ একই transaction-এর ভিতরে — ধাপ ২ থেকে চলছে)
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('bill-code-allocation', 0))`
        );
        const billRows = await tx.select({ billCode: supplierBills.billCode }).from(supplierBills);
        const usedBillCodes = new Set(billRows.map((r) => r.billCode));
        const maxBillNum = billRows.reduce((max, r) => {
          const m = /^BILL-(\d+)$/.exec(r.billCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextBillNum = maxBillNum + 1;
        let billCode = `BILL-${String(nextBillNum).padStart(4, "0")}`;
        while (usedBillCodes.has(billCode)) {
          nextBillNum++;
          billCode = `BILL-${String(nextBillNum).padStart(4, "0")}`;
        }

        // আজ + ৩০ দিন = default due date (hardcoded 2026-06-30 সরানো)
        const billDueDate = new Date(Date.now() + 30 * 86400000)
          .toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

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
            dueDate: billDueDate,
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
      const days = Number(workDays || 0);
      const rate = Number(dailyRate);
      const earned = days * rate;

      const lab = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('labour-code-allocation', 0))`
        );
        const rows = await tx.select({ labourCode: labours.labourCode }).from(labours);
        const usedCodes = new Set(rows.map((r) => r.labourCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^LAB-(\d+)$/.exec(r.labourCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let labourCode = `LAB-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(labourCode)) {
          nextNum++;
          labourCode = `LAB-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdLab] = await tx
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
        return createdLab;
      });

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
      const approved = Number(approvedBillAmount || 0);

      const con = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('contractor-code-allocation', 0))`
        );
        const rows = await tx.select({ contractorCode: contractors.contractorCode }).from(contractors);
        const usedCodes = new Set(rows.map((r) => r.contractorCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^CON-(\d+)$/.exec(r.contractorCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let contractorCode = `CON-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(contractorCode)) {
          nextNum++;
          contractorCode = `CON-${String(nextNum).padStart(4, "0")}`;
        }

        const [createdCon] = await tx
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
        return createdCon;
      });

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
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('expense-code-allocation', 0))`
        );
        const rows = await tx.select({ expenseCode: expenses.expenseCode }).from(expenses);
        const usedCodes = new Set(rows.map((r) => r.expenseCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^EXP-(\d+)$/.exec(r.expenseCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let expenseCode = `EXP-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(expenseCode)) {
          nextNum++;
          expenseCode = `EXP-${String(nextNum).padStart(4, "0")}`;
        }

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
    // খরচ এডিট ও নোট সংশোধনের অ্যাকশন (Update Expense & Notes)
    // =========================================================================
    if (action === "editExpense") {
      const { expenseId, amount, category, date, description, paymentMethod } = body;

      const [existing] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, Number(expenseId)));

      if (!existing) {
        return NextResponse.json({ error: "খরচের ভাউচার পাওয়া যায়নি" }, { status: 404 });
      }

      const [updated] = await db
        .update(expenses)
        .set({
          amount: amount ? Number(amount).toFixed(2) : existing.amount,
          category: category || existing.category,
          date: date || existing.date,
          // ⭐ ফিক্স: string হলেই update; null/undefined-এ existing থাকবে
          description: typeof description === "string" ? description : existing.description,
          paymentMethod: paymentMethod || existing.paymentMethod,
        })
        .where(eq(expenses.id, Number(expenseId)))
        .returning();

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE",
        entity: "Expense",
        recordId: existing.expenseCode,
        beforeData: existing,
        afterData: updated,
      });

      return NextResponse.json({ success: true, expense: updated });
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

      const invoiceDueDate = dueDate || new Date(Date.now() + 30 * 86400000)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

      const inv = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('invoice-code-allocation', 0))`
        );
        const rows = await tx.select({ invoiceCode: invoices.invoiceCode }).from(invoices);
        const usedCodes = new Set(rows.map((r) => r.invoiceCode));
        const maxNum = rows.reduce((max, r) => {
          const m = /^INV-(\d+)$/.exec(r.invoiceCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextNum = maxNum + 1;
        let invoiceCode = `INV-${String(nextNum).padStart(4, "0")}`;
        while (usedCodes.has(invoiceCode)) {
          nextNum++;
          invoiceCode = `INV-${String(nextNum).padStart(4, "0")}`;
        }

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
            dueDate: invoiceDueDate,
            status: "Unpaid",
            notes: notes || "",
          })
          .returning();

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
        paymentType,
        amount,
        method,
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
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('payment-code-allocation', 0))`
        );
        const payRows = await tx.select({ paymentCode: payments.paymentCode }).from(payments);
        const usedPayCodes = new Set(payRows.map((r) => r.paymentCode));
        const maxPayNum = payRows.reduce((max, r) => {
          const m = /^PAY-(\d+)$/.exec(r.paymentCode);
          return m ? Math.max(max, Number(m[1])) : max;
        }, 0);
        let nextPayNum = maxPayNum + 1;
        let paymentCode = `PAY-${String(nextPayNum).padStart(4, "0")}`;
        while (usedPayCodes.has(paymentCode)) {
          nextPayNum++;
          paymentCode = `PAY-${String(nextPayNum).padStart(4, "0")}`;
        }

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
    // 13. PAYROLL MODULE (৮.৭৫ ঘণ্টা কর্মসময় অনুযায়ী)
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
        pfDeduction, 
        advanceDeduction,
        otherDeduction,
        taxDeduction,
      } = body;

      const toNum = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const targetMonth = String(salaryMonth || today.slice(0, 7)).trim();
      // Validate YYYY-MM before querying attendance or writing payroll.
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
        return NextResponse.json(
          { error: "salaryMonth অবশ্যই YYYY-MM ফরম্যাটে দিন (যেমন 2026-10)।" },
          { status: 400 }
        );
      }
      const targetEmployeeId = Number(employeeId);
      if (!Number.isInteger(targetEmployeeId) || targetEmployeeId <= 0) {
        return NextResponse.json({ error: "সঠিক Employee ID দিন।" }, { status: 400 });
      }

      const [emp] = await db.select().from(employees).where(eq(employees.id, targetEmployeeId)).limit(1);
      if (!emp) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      const basic = toNum(basicSalary !== undefined ? basicSalary : emp.basicSalary);
      const allow = toNum(allowance !== undefined ? allowance : emp.allowance);
      const numericInputs: Array<[string, number]> = [
        ["basicSalary", basic],
        ["allowance", allow],
        ["overtimePay", overtimePay === undefined || overtimePay === null || overtimePay === "" ? 0 : toNum(overtimePay)],
        ["bonus", toNum(bonus)],
        ["pfDeduction", pfDeduction === undefined || pfDeduction === null || pfDeduction === "" ? 0 : toNum(pfDeduction)],
        ["advanceDeduction", advanceDeduction === undefined || advanceDeduction === null || advanceDeduction === "" ? 0 : toNum(advanceDeduction)],
        ["otherDeduction", otherDeduction === undefined || otherDeduction === null || otherDeduction === "" ? 0 : toNum(otherDeduction)],
        ["taxDeduction", toNum(taxDeduction)],
      ];
      if (numericInputs.some(([, value]) => !Number.isFinite(value) || value < 0)) {
        return NextResponse.json(
          { error: "বেতন, ভাতা, OT, বোনাস ও deduction-এর পরিমাণ ঋণাত্মক হতে পারবে না।" },
          { status: 400 }
        );
      }
      const workingDays = 26;
      // প্রতিষ্ঠানের মাসিক বেতন-ভিত্তি ২৬ কর্মদিবস। হাজিরা না থাকলে
      // নির্ধারিত কর্মদিবসের অনুপস্থিতি কর্তন গণনা হবে; শুধু ভবিষ্যৎ তারিখ
      // বলে মাসিক অনুপস্থিতির হিসাব থেকে দিন বাদ দেওয়া হবে না।
      const absenceCalculationDays = workingDays;
      const perDaySalary = basic / workingDays;
      const standardWorkMinutes = STANDARD_WORK_HOURS * 60; // ৮.৭৫ ঘণ্টা = ৫২৫ মিনিট
      const perMinuteRate = perDaySalary / standardWorkMinutes;
      const hourlyRate = perMinuteRate * 60;

      // এই মাসের হাজিরা — প্রতি দিনে একটি রেকর্ড
      const empAtt = await db.select().from(attendances).where(eq(attendances.employeeId, emp.id));
      const dayMap = new Map<string, any>();
      for (const a of empAtt) {
        if (!a.date || !a.date.startsWith(targetMonth)) continue;
        const prev = dayMap.get(a.date);
        if (!prev) {
          dayMap.set(a.date, { ...a });
        } else {
          dayMap.set(a.date, {
            ...prev,
            checkIn: prev.checkIn || a.checkIn,
            checkOut: prev.checkOut || a.checkOut,
            checkIn2: prev.checkIn2 || a.checkIn2,
            checkOut2: prev.checkOut2 || a.checkOut2,
            workingHours: Math.max(toNum(prev.workingHours), toNum(a.workingHours)),
            overtimeHours: Math.max(toNum(prev.overtimeHours), toNum(a.overtimeHours)),
            lateMinutes: Math.max(toNum(prev.lateMinutes), toNum(a.lateMinutes)),
            status:
              prev.status === "Leave" || a.status === "Leave"
                ? "Leave"
                : prev.status === "Late" || a.status === "Late"
                  ? "Late"
                  : prev.status || a.status,
          });
        }
      }

      let presentDays = 0;
      let lateDays = 0; // রেকর্ডের জন্য — সব দেরি
      let deductibleLateDays = 0; // যেসব দিনে ৮.৭৫ ঘণ্টা পূরণ হয়নি
      let leaveDays = 0;
      let totalOtHours = 0;
      let totalShortfallHours = 0;

      for (const a of dayMap.values()) {
        if (a.status === "Leave") {
          leaveDays++;
          continue;
        }
        const hasPunch = Boolean(a.checkIn || a.checkIn2);
        if (!hasPunch && !["Present", "Late", "Early Leave", "Missing Checkout"].includes(a.status || "")) {
          continue;
        }
        presentDays++;
        totalOtHours += toNum(a.overtimeHours);

        const lateMin = toNum(a.lateMinutes);
        if (lateMin > 0) lateDays++;

        // দিন শেষ হয়েছে কিনা (OUT দেওয়া আছে) — চলমান আজকের দিনে ঘাটতি ধরা হবে না
        const dayEnded = Boolean(a.checkOut2) || (Boolean(a.checkOut) && !a.checkIn2);
        if (dayEnded) {
          if (isLateDeductible(lateMin, a.workingHours)) deductibleLateDays++;
          totalShortfallHours += workShortfallHours(a.workingHours);
        }
      }

      const absentDays = Math.max(0, absenceCalculationDays - presentDays - leaveDays);

      // ⭐ Option B:
      //  • অনুপস্থিত দিন → পূর্ণ দিনের বেতন কাটা
      //  • উপস্থিত দিনে ৮.৭৫ ঘণ্টার কম কাজ → ঘাটতি ঘণ্টা × ঘণ্টাপ্রতি রেট কাটা
      //  • দেরি হলেও ৮.৭৫ ঘণ্টা পূরণ হলে কোনো কাটা নেই (শুধু late রেকর্ড থাকবে)
      //  • OT = ৮.৭৫ ঘণ্টার বেশি কাজ × ঘণ্টাপ্রতি রেট
      const autoAbsentDeduction = Number((absentDays * perDaySalary).toFixed(2));
      // প্রতিটি সম্পন্ন কর্মদিবসে ৫২৫ মিনিটের কম কাজের ঘাটতি মিনিট-প্রতি রেটে কাটবে।
      const totalShortfallMinutes = totalShortfallHours * 60;
      const autoShortfallDeduction = Number((totalShortfallMinutes * perMinuteRate).toFixed(2));
      const autoCalculatedOtPay = Number((totalOtHours * hourlyRate).toFixed(2));

      const finalOtPay =
        overtimePay !== undefined && overtimePay !== null && overtimePay !== ""
          ? toNum(overtimePay)
          : autoCalculatedOtPay;

      const bon = toNum(bonus);

            // otherDeduction হলো অতিরিক্ত manual deduction; এটি দিলে automatic
      // absent/shortfall deduction বাদ পড়বে না।
      const manualOtherDeduction =
        otherDeduction !== undefined && otherDeduction !== null && otherDeduction !== ""
          ? toNum(otherDeduction)
          : 0;
      const finalOtherDeduction = Number(
        (manualOtherDeduction + autoAbsentDeduction + autoShortfallDeduction).toFixed(2)
      );

      // ⭐ PF: client থেকে দিলে সেটা, নাহলে Gross-এর ৫%
      const pf = pfDeduction !== undefined && pfDeduction !== null && pfDeduction !== ""
        ? toNum(pfDeduction)
        : Number(((basic + allow) * 0.05).toFixed(2));

      // ⭐ Advance: body-তে দিলে সেটা, নাহলে কর্মীর advanceBalance
      const adv =
        advanceDeduction !== undefined && advanceDeduction !== null && advanceDeduction !== ""
          ? toNum(advanceDeduction)
          : toNum(emp.advanceBalance);

      const tax = toNum(taxDeduction);

        const netSalary = Math.max(
        0,
        Number((basic + allow + finalOtPay + bon - pf - adv - finalOtherDeduction - tax).toFixed(2))
      );

            const payrollValues = {
        workingDays,
        presentDays,
        lateDays,
        leaveDays,
        overtimeHours: totalOtHours.toFixed(2),
        basicSalary: basic.toFixed(2),
        allowance: allow.toFixed(2),
        overtimePay: finalOtPay.toFixed(2),
        bonus: bon.toFixed(2),
        advanceDeduction: adv.toFixed(2),
        taxDeduction: (tax + pf).toFixed(2), // PF আলাদা column না থাকায় এখানেই
        netSalary: netSalary.toFixed(2),
        // Generation শুধু হিসাব তৈরি করবে; অনুমোদন আলাদা workflow-তে হবে।
        status: "Calculated",
        approvedBy: null,
      };

      // একই কর্মী + মাসে আগের পে-রোল থাকলে যাচাই করে আপডেট (ডুপ্লিকেট নয়)।
      const [existingPayroll] = await db
        .select()
        .from(payrolls)
        .where(and(eq(payrolls.employeeId, emp.id), eq(payrolls.salaryMonth, targetMonth)))
        .limit(1);

      // Reviewed/Approved/Paid/Locked payroll পুনরায় generate করে overwrite করা যাবে না।
      if (
        existingPayroll &&
        ["Reviewed", "Approved", "Paid", "Locked"].includes(String(existingPayroll.status))
      ) {
        return NextResponse.json(
          {
            error: `এই মাসের payroll status "${existingPayroll.status}"। নিরাপত্তার জন্য এটি overwrite করা হয়নি।`,
            payroll: existingPayroll,
          },
          { status: 409 }
        );
      }

      let pr;
      if (existingPayroll) {
        [pr] = await db.update(payrolls).set(payrollValues).where(eq(payrolls.id, existingPayroll.id)).returning();
      } else {
        const payrollCode = `PAYR-${targetMonth.replace("-", "")}-${String(emp.id).padStart(4, "0")}`;
        [pr] = await db
          .insert(payrolls)
          .values({ payrollCode, employeeId: emp.id, salaryMonth: targetMonth, ...payrollValues })
          .returning();
      }

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: existingPayroll ? "UPDATE" : "CREATE",
        entity: "Payroll",
        recordId: pr.payrollCode,
        beforeData: existingPayroll || null,
        afterData: {
          ...pr,
          breakdown: {
            absentDays,
            absenceCalculationDays,
            totalShortfallMinutes: Number(totalShortfallMinutes.toFixed(2)),
            deductibleLateDays,
            shortfallHours: Number(totalShortfallHours.toFixed(2)),
            absentDeduction: autoAbsentDeduction,
            shortfallDeduction: autoShortfallDeduction,
            manualOtherDeduction,
            finalOtherDeduction,
            pfDeduction: pf,
            advanceDeduction: adv,
            taxDeduction: tax,
            otPay: autoCalculatedOtPay,
          },
        },
      });

      return NextResponse.json({
        success: true,
        payroll: pr,
        breakdown: {
          presentDays,
          absentDays,
          absenceCalculationDays,
          totalShortfallMinutes: Number(totalShortfallMinutes.toFixed(2)),
          leaveDays,
          lateDays,
          deductibleLateDays,
          shortfallHours: Number(totalShortfallHours.toFixed(2)),
          absentDeduction: autoAbsentDeduction,
          shortfallDeduction: autoShortfallDeduction,
          manualOtherDeduction,
          finalOtherDeduction,
          pfDeduction: pf,
          advanceDeduction: adv,
          taxDeduction: tax,
          otHours: Number(totalOtHours.toFixed(2)),
          otPay: finalOtPay,
        },
      });
    }
    // =========================================================================
    // 14. LEAVE MANAGEMENT (Auto-reflects in Attendance when Approved)
    // =========================================================================
    if (action === "applyLeave") {
      // ⭐ fallback "|| 1" সরানো
      const employeeId = Number(body.employeeId || currentUser.employeeId);
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return NextResponse.json(
          { error: "আপনার লগইন কোনো কর্মী প্রোফাইলের সাথে যুক্ত নয়। HR-কে জানান।" },
          { status: 400 }
        );
      }
      const { leaveType, startDate, endDate, totalDays, reason } = body;
      if (!leaveType || !startDate || !endDate || !reason) {
        return NextResponse.json({ error: "All leave application fields required" }, { status: 400 });
      }

      const leaveCode = `LV-${String(Date.now()).slice(-8)}`;

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
      const { leaveId, decision } = body;
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
      if (!isManagementRole(currentUser.role) && currentUser.role !== "HR") {
        return NextResponse.json(
          { error: "পারফরম্যান্স রিভিউ দেওয়ার অনুমতি নেই।" },
          { status: 403 }
        );
      }
      const { employeeId, period, managerReviewPoints, managerComments } = body;
      const empId = Number(employeeId);

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
          period: period || new Date().toISOString().slice(0, 7),
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

      await logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "PERFORMANCE_REVIEW",
        entity: "PerformanceReview",
        recordId: String(rev.id),
        afterData: { employeeId: empId, totalPoints },
      });

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

      const docCode = `DOC-${String(Date.now()).slice(-8)}`;

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
      const [n] = await db.select().from(notifications).where(eq(notifications.id, Number(notificationId)));
      if (!n) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      const mgmtOrHr = isManagementRole(currentUser.role) || currentUser.role === "HR";
      if (n.userId !== null ? n.userId !== currentUser.id : !mgmtOrHr) {
        return NextResponse.json({ error: "এই নোটিফিকেশন আপনার নয়।" }, { status: 403 });
      }
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, n.id));
      return NextResponse.json({ success: true });
    }

    if (action === "markAllNotificationsRead") {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, currentUser.id));
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
      if (!canViewAllEmployeeProfiles(currentUser.role)) {
        return NextResponse.json(
          { error: "Forbidden: Management/HR permission required." },
          { status: 403 }
        );
      }
      const attendanceReminders = await runReminderAutomation();
      const taskReminders = await runTaskDeadlineScan();
      // ⭐ unreachable code সরানো (return-এর পরের dead line)
      return NextResponse.json({
        success: true,
        dispatched: { ...attendanceReminders, ...taskReminders },
      });
    }

    return NextResponse.json({ error: `Unknown ERP action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    // ⭐ ফিক্স: কাস্টম status (404/409) হারাচ্ছিল — সব error 400 হয়ে যেত
    if (err instanceof AttendanceRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "ERP operation failed";
    console.error("ERP POST Error:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
