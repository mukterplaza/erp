import {
  db,
  auditLogs,
  notifications,
  accounts,
  journalEntries,
  journalLines,
  materials,
  stockMovements,
} from "@/db";
import { eq, sql } from "drizzle-orm";

// ============================================================================
// 1. AUDIT TRAIL LOGGER
// ============================================================================
export async function logAudit(params: {
  userId?: number | null;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  recordId: string;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId ?? null,
    userName: params.userName,
    userRole: params.userRole,
    action: params.action,
    entity: params.entity,
    recordId: params.recordId,
    beforeData: params.beforeData ?? null,
    afterData: params.afterData ?? null,
    ipAddress: params.ipAddress || "127.0.0.1",
  });
}

// ============================================================================
// 2. NOTIFICATION DISPATCHER
// ============================================================================
export async function createNotification(params: {
  userId?: number | null;
  targetRole?: string;
  type: string;
  title: string;
  message: string;
  createdBy?: string;
  priority?: string;
  assignedPersonOrTeam?: string;
  dueDate?: string | null;
  attachmentUrl?: string | null;
  relatedTaskId?: number | null;
  relatedUrl: string;
  relatedEntityCode?: string;
  category?: string | null;
}) {
  await db.insert(notifications).values({
    category: params.category ?? null,
    userId: params.userId ?? null,
    targetRole: params.targetRole || "All",
    type: params.type,
    title: params.title,
    message: params.message,
    createdBy: params.createdBy || "System",
    priority: params.priority || "Medium",
    assignedPersonOrTeam: params.assignedPersonOrTeam || "All Staff",
    dueDate: params.dueDate ?? null,
    attachmentUrl: params.attachmentUrl ?? null,
    relatedTaskId: params.relatedTaskId ?? null,
    relatedUrl: params.relatedUrl,
    relatedEntityCode: params.relatedEntityCode || "",
    isRead: false,
  });
}

// ============================================================================
// 3. ATTENDANCE ENGINE — Option B (flexible punch, fixed office rule)
// ----------------------------------------------------------------------------
// • কর্মী যেকোনো সময় IN/OUT দিতে পারবে (11:00 IN → 15:00 OUT → 16:00 IN → 22:00 OUT)
// • শুধু ক্রম ঠিক থাকতে হবে: IN1 < OUT1 < IN2 < OUT2
// • মোট কাজ = (OUT1-IN1) + (OUT2-IN2)  → break কাজের সময়ে ধরা হয় না
// • Late  = প্রথম IN অফিস সময় 09:30-এর পরে হলে (রেকর্ড সবসময় থাকবে)
// • OT    = মোট কাজ ৮.৭৫ ঘণ্টার বেশি হলে অতিরিক্ত অংশ
// • Late deduction: ৮.৭৫ ঘণ্টা পূরণ হলে কাটবে না (isLateDeductible)
// ============================================================================
export const SHIFT_START_MINUTES = 9 * 60 + 30; // 09:30
export const SHIFT_END_MINUTES = 19 * 60 + 30; // 19:30
export const STANDARD_WORK_MINUTES = 8.75 * 60; // 525 মিনিট
export const STANDARD_WORK_HOURS = 8.75;
const EARLY_LEAVE_GRACE_MINUTES = 15;

function punchToMinutes(value?: string | null): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function sessionMinutes(inMinutes: number | null, outMinutes: number | null): number {
  if (inMinutes === null || outMinutes === null) return 0;
  return Math.max(0, outMinutes - inMinutes);
}

function emptyMetrics(status: string) {
  return {
    status,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    morningHours: "0.00",
    afternoonHours: "0.00",
    workingHours: "0.00",
    overtimeHours: "0.00",
  };
}

/**
 * পুরোনো দুই-punch রেকর্ডের জন্য (legacy correction ইত্যাদি)।
 * এখন এটাও একই Option B নিয়মে চলে — একটি IN–OUT session হিসেবে।
 */
export function calculateAttendanceMetrics(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  overrideStatus?: string
) {
  if (overrideStatus === "Leave" || overrideStatus === "Holiday" || overrideStatus === "Absent") {
    return emptyMetrics(overrideStatus);
  }
  const inM = punchToMinutes(checkIn);
  if (inM === null) return emptyMetrics("Absent");

  const outM = punchToMinutes(checkOut);
  const lateMinutes = Math.max(0, inM - SHIFT_START_MINUTES);

  if (outM === null) {
    return { ...emptyMetrics(lateMinutes > 0 ? "Late" : "Present"), lateMinutes };
  }

  const worked = sessionMinutes(inM, outM);
  const earlyLeaveMinutes =
    worked < STANDARD_WORK_MINUTES ? Math.max(0, SHIFT_END_MINUTES - outM) : 0;
  const overtimeMinutes = Math.max(0, worked - STANDARD_WORK_MINUTES);

  let status = "Present";
  if (lateMinutes > 0) status = "Late";
  else if (earlyLeaveMinutes > EARLY_LEAVE_GRACE_MINUTES) status = "Early Leave";

  return {
    status,
    lateMinutes,
    earlyLeaveMinutes,
    morningHours: (worked / 60).toFixed(2),
    afternoonHours: "0.00",
    workingHours: (worked / 60).toFixed(2),
    overtimeHours: (overtimeMinutes / 60).toFixed(2),
  };
}

/** চার-punch (দুই session) হিসাব — Option B */
export function calculateFourPunchAttendanceMetrics(times: {
  checkIn?: string | null;
  checkOut?: string | null;
  checkIn2?: string | null;
  checkOut2?: string | null;
  overrideStatus?: string;
}) {
  const { checkIn, checkOut, checkIn2, checkOut2, overrideStatus } = times;

  if (overrideStatus === "Leave" || overrideStatus === "Holiday" || overrideStatus === "Absent") {
    return emptyMetrics(overrideStatus);
  }

  const in1 = punchToMinutes(checkIn);
  const out1 = punchToMinutes(checkOut);
  const in2 = punchToMinutes(checkIn2);
  const out2 = punchToMinutes(checkOut2);

  if (in1 === null && in2 === null) return emptyMetrics("Absent");

  const morningMinutes = sessionMinutes(in1, out1);
  const afternoonMinutes = sessionMinutes(in2, out2);
  const workedMinutes = morningMinutes + afternoonMinutes;

  const firstIn = in1 ?? in2;
  const lateMinutes = firstIn !== null ? Math.max(0, firstIn - SHIFT_START_MINUTES) : 0;

  // দিনের শেষ OUT (OUT2, না থাকলে শুধু-এক-session দিনে OUT1)
  const dayEnded = out2 !== null || (in2 === null && out1 !== null);
  const lastOut = out2 ?? out1;
  const earlyLeaveMinutes =
    dayEnded && lastOut !== null && workedMinutes < STANDARD_WORK_MINUTES
      ? Math.max(0, SHIFT_END_MINUTES - lastOut)
      : 0;

  const overtimeMinutes = Math.max(0, workedMinutes - STANDARD_WORK_MINUTES);

  let status = "Present";
  if (lateMinutes > 0) status = "Late";
  else if (earlyLeaveMinutes > EARLY_LEAVE_GRACE_MINUTES) status = "Early Leave";
  else if (in2 !== null && out2 === null) status = "Present"; // দ্বিতীয় session চলমান

  return {
    status,
    lateMinutes,
    earlyLeaveMinutes,
    morningHours: (morningMinutes / 60).toFixed(2),
    afternoonHours: (afternoonMinutes / 60).toFixed(2),
    workingHours: (workedMinutes / 60).toFixed(2),
    overtimeHours: (overtimeMinutes / 60).toFixed(2),
  };
}

/**
 * Option B: দেরি হলেও দিনে ৮.৭৫ ঘণ্টা বা বেশি কাজ হলে late deduction হবে না।
 * Payroll-এ প্রতিদিনের রেকর্ডে এটা দিয়ে যাচাই হবে।
 */
export function isLateDeductible(lateMinutes: number, workingHours: number | string): boolean {
  return Number(lateMinutes) > 0 && Number(workingHours) < STANDARD_WORK_HOURS;
}

/**
 * Payroll helper: কাজের ঘাটতি (ঘণ্টা)। ঘাটতি থাকলে সেই অনুপাতে টাকা কাটবে।
 * পূরণ হলে 0।
 */
export function workShortfallHours(workingHours: number | string): number {
  return Math.max(0, Number((STANDARD_WORK_HOURS - Number(workingHours || 0)).toFixed(2)));
}

// ============================================================================
// 3b. AUTOMATIC WORK PLAN PROGRESS ENGINE
// ============================================================================
export function calculateWorkPlanProgress(
  items: Array<{ status: string; completionPercent?: number }>
): number {
  if (!items || items.length === 0) return 0;
  const completedCount = items.filter((i) => i.status === "Completed").length;
  return Math.round((completedCount / items.length) * 100);
}

// ============================================================================
// 4. STRICT INVENTORY STOCK FORMULA ENGINE
// ============================================================================
export function computeExactMaterialStock(mat: {
  openingStock: string | number;
  purchaseReceived: string | number;
  transferIn: string | number;
  returnQty: string | number;
  issueQty: string | number;
  transferOut: string | number;
  consumptionQty: string | number;
  adjustmentQty: string | number;
}): number {
  const opening = Number(mat.openingStock || 0);
  const purchase = Number(mat.purchaseReceived || 0);
  const tIn = Number(mat.transferIn || 0);
  const ret = Number(mat.returnQty || 0);
  const issue = Number(mat.issueQty || 0);
  const tOut = Number(mat.transferOut || 0);
  const consumption = Number(mat.consumptionQty || 0);
  const adj = Number(mat.adjustmentQty || 0);

  return Number(
    (opening + purchase + tIn + ret - issue - tOut - consumption + adj).toFixed(2)
  );
}

export async function recordStockMovementTx(
  tx: any,
  params: {
    materialId: number;
    movementType:
      | "Opening"
      | "Purchase"
      | "Issue"
      | "Consumption"
      | "Transfer In"
      | "Transfer Out"
      | "Return"
      | "Adjustment";
    quantity: number;
    unitCost?: number;
    projectId?: number | null;
    siteId?: number | null;
    warehouseFrom?: string;
    warehouseTo?: string;
    referenceCode?: string;
    notes?: string;
    createdBy: string;
    date: string;
  }
) {
  const matRows = await tx
    .select()
    .from(materials)
    .where(eq(materials.id, params.materialId))
    .limit(1);

  if (matRows.length === 0) {
    throw new Error("Material not found");
  }

  const mat = matRows[0];
  const qty = Number(params.quantity);
  if (isNaN(qty) || (params.movementType !== "Adjustment" && qty <= 0)) {
    throw new Error("Quantity must be greater than zero");
  }

  const updated = {
    openingStock: Number(mat.openingStock),
    purchaseReceived: Number(mat.purchaseReceived),
    transferIn: Number(mat.transferIn),
    returnQty: Number(mat.returnQty),
    issueQty: Number(mat.issueQty),
    transferOut: Number(mat.transferOut),
    consumptionQty: Number(mat.consumptionQty),
    adjustmentQty: Number(mat.adjustmentQty),
  };

  switch (params.movementType) {
    case "Opening":
      updated.openingStock += qty;
      break;
    case "Purchase":
      updated.purchaseReceived += qty;
      break;
    case "Transfer In":
      updated.transferIn += qty;
      break;
    case "Return":
      updated.returnQty += qty;
      break;
    case "Issue":
      updated.issueQty += qty;
      break;
    case "Transfer Out":
      updated.transferOut += qty;
      break;
    case "Consumption":
      updated.consumptionQty += qty;
      break;
    case "Adjustment":
      updated.adjustmentQty += qty;
      break;
  }

  const newCurrentStock = computeExactMaterialStock(updated);
  if (newCurrentStock < 0) {
    throw new Error(
      `Insufficient stock for ${mat.name}. Available: ${mat.currentStock} ${mat.unit}, Requested: ${qty} ${mat.unit}`
    );
  }

  const effectiveUnitCost =
    params.unitCost !== undefined && params.unitCost > 0
      ? params.unitCost
      : Number(mat.unitCost);

  await tx
    .update(materials)
    .set({
      openingStock: updated.openingStock.toFixed(2),
      purchaseReceived: updated.purchaseReceived.toFixed(2),
      transferIn: updated.transferIn.toFixed(2),
      returnQty: updated.returnQty.toFixed(2),
      issueQty: updated.issueQty.toFixed(2),
      transferOut: updated.transferOut.toFixed(2),
      consumptionQty: updated.consumptionQty.toFixed(2),
      adjustmentQty: updated.adjustmentQty.toFixed(2),
      currentStock: newCurrentStock.toFixed(2),
      unitCost: effectiveUnitCost.toFixed(2),
    })
    .where(eq(materials.id, mat.id));

  await tx.insert(stockMovements).values({
    materialId: mat.id,
    movementType: params.movementType,
    quantity: qty.toFixed(2),
    unitCost: effectiveUnitCost.toFixed(2),
    totalValue: (Math.abs(qty) * effectiveUnitCost).toFixed(2),
    projectId: params.projectId ?? null,
    siteId: params.siteId ?? null,
    warehouseFrom: params.warehouseFrom || mat.warehouse,
    warehouseTo: params.warehouseTo || "",
    referenceCode: params.referenceCode || "",
    notes: params.notes || "",
    createdBy: params.createdBy,
    date: params.date,
  });

  if (newCurrentStock <= Number(mat.reorderLevel)) {
    await tx.insert(notifications).values({
      targetRole: "Manager",
      type: "Low Stock",
      title: `Low Stock Alert: ${mat.name}`,
      message: `${mat.name} (${mat.materialCode}) stock is down to ${newCurrentStock} ${mat.unit} (Reorder level: ${mat.reorderLevel}).`,
      relatedUrl: "/inventory",
      relatedEntityCode: mat.materialCode,
      isRead: false,
    });
  }

  return newCurrentStock;
}

// ============================================================================
// 5. DOUBLE-ENTRY JOURNAL POSTING ENGINE (TRANSACTIONAL)
// ============================================================================
export async function postDoubleEntryJournalTx(
  tx: any,
  params: {
    date: string;
    referenceType: string;
    referenceCode: string;
    description: string;
    createdBy: string;
    lines: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
  }
) {
  const totalDebit = params.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = params.lines.reduce((s, l) => s + Number(l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Unbalanced Journal Entry: Debit (${totalDebit}) !== Credit (${totalCredit})`
    );
  }

  const countRes = await tx
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries);
  const nextNum = Number(countRes[0]?.count || 0) + 1;
  const voucherNo = `JV-${String(nextNum).padStart(4, "0")}-${Date.now().toString().slice(-3)}`;

  const [entry] = await tx
    .insert(journalEntries)
    .values({
      voucherNo,
      date: params.date,
      referenceType: params.referenceType,
      referenceCode: params.referenceCode,
      description: params.description,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      isVoid: false,
      createdBy: params.createdBy,
    })
    .returning();

  for (const line of params.lines) {
    const accRows = await tx
      .select()
      .from(accounts)
      .where(eq(accounts.code, line.accountCode))
      .limit(1);

    if (accRows.length === 0) {
      throw new Error(`Account code ${line.accountCode} not found in Chart of Accounts`);
    }
    const acc = accRows[0];
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);

    await tx.insert(journalLines).values({
      journalEntryId: entry.id,
      accountId: acc.id,
      accountName: acc.name,
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
      description: line.description || params.description,
    });

    const isDebitNormal = acc.type === "Asset" || acc.type === "Expense";
    const delta = isDebitNormal ? debit - credit : credit - debit;
    const newBal = Number(acc.balance) + delta;

    await tx
      .update(accounts)
      .set({ balance: newBal.toFixed(2) })
      .where(eq(accounts.id, acc.id));
  }

  return entry;
}