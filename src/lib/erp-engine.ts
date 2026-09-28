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

// 1. AUDIT TRAIL LOGGER
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

// 2. NOTIFICATION DISPATCHER
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

// 3. AUTOMATIC ATTENDANCE CALCULATION ENGINE
// Schedule:
// Morning: 9:30 AM – 1:15 PM (570m to 795m = 3.75h)
// Break:   1:15 PM – 2:30 PM (795m to 870m = 1.25h break)
// Afternoon: 2:30 PM – 7:30 PM (870m to 1170m = 5.00h)
export function calculateAttendanceMetrics(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  overrideStatus?: string
) {
  if (overrideStatus === "Leave" || overrideStatus === "Holiday" || overrideStatus === "Absent") {
    return {
      status: overrideStatus,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      morningHours: "0.00",
      afternoonHours: "0.00",
      workingHours: "0.00",
      overtimeHours: "0.00",
    };
  }

  if (!checkIn) {
    return {
      status: "Absent",
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      morningHours: "0.00",
      afternoonHours: "0.00",
      workingHours: "0.00",
      overtimeHours: "0.00",
    };
  }

  const [inH, inM] = checkIn.split(":").map(Number);
  const inTotalMinutes = inH * 60 + (inM || 0);

  const morningStartMinutes = 9 * 60 + 30; // 09:30 AM
  const breakStartMinutes = 13 * 60 + 15; // 01:15 PM
  const afternoonStartMinutes = 14 * 60 + 30; // 02:30 PM
  const officialEndMinutes = 19 * 60 + 30; // 07:30 PM (19:30)

  const lateMinutes =
    inTotalMinutes > morningStartMinutes ? inTotalMinutes - morningStartMinutes : 0;

  if (!checkOut) {
    return {
      status: lateMinutes > 0 ? "Late" : "Present",
      lateMinutes,
      earlyLeaveMinutes: 0,
      morningHours: "0.00",
      afternoonHours: "0.00",
      workingHours: "0.00",
      overtimeHours: "0.00",
    };
  }

  const [outH, outM] = checkOut.split(":").map(Number);
  const outTotalMinutes = outH * 60 + (outM || 0);

  const earlyLeaveMinutes =
    outTotalMinutes < officialEndMinutes ? officialEndMinutes - outTotalMinutes : 0;

  // Morning duration: overlap between [inTotalMinutes, outTotalMinutes] and [0, breakStartMinutes]
  const morningEnd = Math.min(outTotalMinutes, breakStartMinutes);
  const morningMins = Math.max(0, morningEnd - inTotalMinutes);
  const morningHoursNum = morningMins / 60;

  // Afternoon duration: overlap between [inTotalMinutes, outTotalMinutes] and [afternoonStartMinutes, Infinity]
  const afternoonBegin = Math.max(inTotalMinutes, afternoonStartMinutes);
  const afternoonMins = Math.max(0, outTotalMinutes - afternoonBegin);
  const afternoonHoursNum = afternoonMins / 60;

  // Total net working hours (excluding the 1:15 PM - 2:30 PM break)
  let workingHoursNum = morningHoursNum + afternoonHoursNum;
  if (workingHoursNum <= 0 && outTotalMinutes > inTotalMinutes) {
    workingHoursNum = (outTotalMinutes - inTotalMinutes) / 60;
  }

  // Overtime: time worked after 7:30 PM (19:30) or net hours above 8.75h
  const postShiftMins = Math.max(0, outTotalMinutes - officialEndMinutes);
  const overtimeHoursNum = Math.max(postShiftMins / 60, Math.max(0, workingHoursNum - 8.75));

  let status = "Present";
  if (lateMinutes > 0) {
    status = "Late";
  } else if (earlyLeaveMinutes > 15) {
    status = "Early Leave";
  }

  return {
    status,
    lateMinutes,
    earlyLeaveMinutes,
    morningHours: morningHoursNum.toFixed(2),
    afternoonHours: afternoonHoursNum.toFixed(2),
    workingHours: workingHoursNum.toFixed(2),
    overtimeHours: overtimeHoursNum.toFixed(2),
  };
}

// 3b. AUTOMATIC WORK PLAN PROGRESS ENGINE
// 5 planned tasks: 5 completed = 100%, 4 completed = 80%, 3 completed = 60%
export function calculateWorkPlanProgress(
  items: Array<{ status: string; completionPercent?: number }>
): number {
  if (!items || items.length === 0) return 0;
  const completedCount = items.filter((i) => i.status === "Completed").length;
  return Math.round((completedCount / items.length) * 100);
}

// 4. STRICT INVENTORY STOCK FORMULA ENGINE
// Current Stock = Opening + Purchase Received + Transfer In + Return - Issue - Transfer Out - Consumption ± Adjustment
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

// 5. DOUBLE-ENTRY JOURNAL POSTING ENGINE (TRANSACTIONAL)
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

    // Asset & Expense increase on Debit, decrease on Credit
    // Liability, Equity & Revenue increase on Credit, decrease on Debit
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
