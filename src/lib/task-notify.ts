import { db, users, employees, tasks, notifications, taskComments, reminderSettings } from "@/db";
import { and, eq, inArray, or, sql } from "drizzle-orm";

export const TASK_MGMT_ROLES = ["Owner", "Chairman", "MD", "Admin", "Manager"];

export type TaskEventType =
  | "TASK_ASSIGNED"
  | "TASK_VIEWED"
  | "TASK_ACCEPTED"
  | "TASK_STARTED"
  | "TASK_PROGRESS_UPDATED"
  | "DAILY_WORK_SUBMITTED"
  | "TASK_PROBLEM_REPORTED"
  | "TASK_ATTACHMENT_ADDED"
  | "TASK_COMPLETED"
  | "TASK_CORRECTION_REQUIRED"
  | "TASK_RESUBMITTED"
  | "TASK_APPROVED"
  | "TASK_REASSIGNED"
  | "TASK_DEADLINE_CHANGED"
  | "TASK_DEADLINE_APPROACHING"
  | "TASK_OVERDUE"
  | "TASK_STATUS_CHANGED"
  | "ANNOUNCEMENT";

export type NotifyCategory =
  | "Announcement"
  | "Task Assigned"
  | "Task Update"
  | "Daily Work"
  | "Approval"
  | "Correction"
  | "Deadline"
  | "Overdue"
  | "Leave"
  | "Attendance";

type Actor = { id: number; name: string } | null;

/** Deliver one notification per recipient user (no broadcast). Skips the actor themself. */
export async function notifyUsers(params: {
  recipientUserIds: Array<number | null | undefined>;
  actor: Actor;
  category: NotifyCategory;
  eventType: TaskEventType;
  title: string;
  message: string;
  task?: { id: number; taskCode: string; priority?: string; dueDate?: string; assignedTo?: number } | null;
  relatedEmployeeId?: number | null;
  relatedUrl?: string;
}) {
  const ids = Array.from(
    new Set(params.recipientUserIds.filter((x): x is number => typeof x === "number" && x > 0))
  ).filter((id) => !params.actor || id !== params.actor.id);
  if (ids.length === 0) return 0;

  const [userRows, empRows] = await Promise.all([
    db.select().from(users).where(inArray(users.id, ids)),
    db.select().from(employees).where(inArray(employees.userId, ids)),
  ]);
  const active = userRows.filter((u) => u.status === "Active");
  if (active.length === 0) return 0;

  await db.insert(notifications).values(
    active.map((u) => {
      const emp = empRows.find((e) => e.userId === u.id);
      return {
        userId: u.id,
        targetRole: "User",
        type: params.eventType,
        category: params.category,
        title: params.title,
        message: params.message,
        createdBy: params.actor?.name || "System",
        senderUserId: params.actor?.id ?? null,
        recipientEmployeeId: emp?.id ?? null,
        recipientName: emp?.name || u.name,
        relatedEmployeeId: params.relatedEmployeeId ?? params.task?.assignedTo ?? null,
        priority: params.task?.priority || "Medium",
        dueDate: params.task?.dueDate || null,
        relatedTaskId: params.task?.id ?? null,
        relatedEntityCode: params.task?.taskCode || "",
        relatedUrl: params.relatedUrl || (params.task ? `/tasks/${params.task.id}` : "/notifications"),
        isRead: false,
      };
    })
  );
  return active.length;
}

/** User ids of active top/operational management (Owner, Chairman, MD, Admin, Manager). */
export async function managementUserIds(): Promise<number[]> {
  const rows = await db.select().from(users).where(eq(users.status, "Active"));
  return rows.filter((u) => TASK_MGMT_ROLES.includes(u.role)).map((u) => u.id);
}

/** Who should hear about work on a task: the assigner + management. */
export async function taskWatcherUserIds(task: typeof tasks.$inferSelect): Promise<number[]> {
  const mgmt = await managementUserIds();
  return [task.assignedByUserId ?? 0, ...mgmt].filter((x) => x > 0);
}

export async function assigneeUserId(task: typeof tasks.$inferSelect): Promise<number | null> {
  const [emp] = await db.select().from(employees).where(eq(employees.id, task.assignedTo));
  return emp?.userId ?? null;
}

function nowLocalParts() {
  return { ms: Date.now() };
}

/** Deadlines are entered in Bangladesh time (UTC+06:00). */
function dueMs(t: typeof tasks.$inferSelect) {
  return new Date(`${t.dueDate}T${t.dueTime || "23:59"}:00+06:00`).getTime();
}

export function isTaskOverdue(t: typeof tasks.$inferSelect, nowMs = Date.now()) {
  return t.status !== "Completed" && t.status !== "Cancelled" && dueMs(t) < nowMs;
}

/**
 * Idempotent deadline scan: sends ONE "deadline approaching" (≤24h left) and ONE "overdue"
 * notification per task. Safe to call on every request.
 */
export async function runTaskDeadlineScan() {
  const { ms } = nowLocalParts();
  const [settings] = await db.select().from(reminderSettings).limit(1);
  const open = (await db.select().from(tasks)).filter(
    (task) => !["Completed", "Cancelled", "Review"].includes(task.status)
  );
  let reminders = 0;
  let overdue = 0;
  for (const task of open) {
    const due = dueMs(task);
    const left = due - ms;
    const eventType = left < 0 ? "TASK_OVERDUE" : "TASK_DEADLINE_APPROACHING";
    if (eventType === "TASK_OVERDUE" && !(settings?.enableOverdueTaskReminder ?? true)) continue;
    if (eventType === "TASK_DEADLINE_APPROACHING" && !(settings?.enablePendingTaskReminder ?? true)) continue;
    if (left >= 0 && left > 24 * 3600000) continue;
    const sent = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`task-deadline:${task.id}`}, 0))`
      );
      const [current] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id))
        .limit(1);
      if (!current || ["Completed", "Cancelled", "Review"].includes(current.status)) return null;
      const currentDue = dueMs(current);
      const currentLeft = currentDue - Date.now();
      if (eventType === "TASK_OVERDUE" ? currentLeft >= 0 : currentLeft < 0 || currentLeft > 24 * 3600000) {
        return null;
      }

      const [assignee] = await tx
        .select()
        .from(employees)
        .where(eq(employees.id, current.assignedTo))
        .limit(1);
      if (!assignee || assignee.archived || assignee.employmentStatus !== "Active" || !assignee.userId) {
        return null;
      }
      const [assigneeUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, assignee.userId))
        .limit(1);
      if (!assigneeUser || assigneeUser.status !== "Active") return null;

      const recipientIds = Array.from(new Set([
        assignee.userId,
        ...(await taskWatcherUserIds(current)),
      ]));
      const recipientRows = await tx
        .select()
        .from(users)
        .where(inArray(users.id, recipientIds));
      const activeRecipients = recipientRows.filter((user) => user.status === "Active");
      if (!activeRecipients.some((user) => user.id === assignee.userId)) return null;

      const deadlineKey = `${eventType}:${current.id}:${current.dueDate}:${current.dueTime || "23:59"}`;
      const existing = await tx
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.relatedTaskId, current.id),
            eq(notifications.type, eventType),
            eq(notifications.dueDate, current.dueDate),
            or(
              eq(notifications.relatedEntityCode, deadlineKey),
              eq(notifications.relatedEntityCode, current.taskCode)
            )
          )
        )
        .limit(1);
      if (existing.length) return null;

      const claim = await tx.update(tasks).set(
        eventType === "TASK_OVERDUE"
          ? { overdueNotifiedAt: new Date() }
          : { deadlineReminderSentAt: new Date() }
      ).where(and(
        eq(tasks.id, current.id),
        eq(tasks.status, current.status),
        eq(tasks.dueDate, current.dueDate)
      )).returning({ id: tasks.id });
      if (claim.length === 0) return null;

      const days = Math.max(0, Math.floor(-currentLeft / 86400000));
      const title = eventType === "TASK_OVERDUE"
        ? `ডেডলাইন পার হয়েছে: ${current.title}`
        : `ডেডলাইন আসন্ন: ${current.title}`;
      const message = eventType === "TASK_OVERDUE"
        ? `${current.taskCode} • ${assignee.name} • ডেডলাইন ${current.dueDate}${current.dueTime ? ` ${current.dueTime}` : ""}${days ? ` • ${days} দিন ওভারডিউ` : ""} • অগ্রগতি ${current.progressPercent}%`
        : `${current.taskCode} • ${assignee.name} • ডেডলাইন ${current.dueDate}${current.dueTime ? ` ${current.dueTime}` : ""} • বর্তমান অগ্রগতি ${current.progressPercent}%`;

      await tx.insert(notifications).values(activeRecipients.map((user) => ({
        userId: user.id,
        targetRole: "User",
        type: eventType,
        category: eventType === "TASK_OVERDUE" ? "Overdue" : "Deadline",
        title,
        message,
        createdBy: "Task deadline automation",
        priority: current.priority,
        assignedPersonOrTeam: assignee.name,
        dueDate: current.dueDate,
        relatedTaskId: current.id,
        recipientEmployeeId: user.id === assignee.userId ? assignee.id : null,
        recipientName: user.id === assignee.userId ? assignee.name : user.name,
        relatedEmployeeId: assignee.id,
        relatedUrl: `/tasks/${current.id}`,
        relatedEntityCode: deadlineKey,
        isRead: false,
      })));

      if (eventType === "TASK_OVERDUE") {
        await tx.insert(taskComments).values({
          taskId: current.id,
          userId: null,
          authorName: "System",
          comment: `ডেডলাইন পার হয়েছে (অগ্রগতি ${current.progressPercent}%)`,
          actionType: "Overdue",
          eventType: "TASK_OVERDUE",
          oldStatus: current.status,
          newStatus: current.status,
          progressPercent: current.progressPercent,
        });
      }
      return true;
    });
    if (sent) {
      if (eventType === "TASK_OVERDUE") overdue++;
      else reminders++;
    }
  }
  return { reminders, overdue };
}
