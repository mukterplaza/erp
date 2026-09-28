import { db, users, employees, tasks, notifications, taskComments } from "@/db";
import { and, eq, isNull, inArray } from "drizzle-orm";

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
  const open = (await db.select().from(tasks)).filter(
    (t) => t.status !== "Completed" && t.status !== "Cancelled"
  );
  let reminders = 0;
  let overdue = 0;
  for (const t of open) {
    const due = dueMs(t);
    const left = due - ms;
    if (left < 0 && !t.overdueNotifiedAt) {
      // claim atomically to avoid duplicate notifications under concurrency
      const claimed = await db
        .update(tasks)
        .set({ overdueNotifiedAt: new Date() })
        .where(and(eq(tasks.id, t.id), isNull(tasks.overdueNotifiedAt)))
        .returning({ id: tasks.id });
      if (claimed.length === 0) continue;
      const days = Math.max(0, Math.floor(-left / 86400000));
      const assignee = await assigneeUserId(t);
      const watchers = await taskWatcherUserIds(t);
      await notifyUsers({
        recipientUserIds: [assignee, ...watchers],
        actor: null,
        category: "Overdue",
        eventType: "TASK_OVERDUE",
        title: `ডেডলাইন পার হয়েছে: ${t.title}`,
        message: `${t.taskCode} • ${t.assignedToName || ""} • ডেডলাইন ${t.dueDate}${t.dueTime ? ` ${t.dueTime}` : ""}${days ? ` • ${days} দিন ওভারডিউ` : ""} • অগ্রগতি ${t.progressPercent}%`,
        task: t,
      });
      await db.insert(taskComments).values({
        taskId: t.id,
        userId: null,
        authorName: "System",
        comment: `ডেডলাইন পার হয়েছে (অগ্রগতি ${t.progressPercent}%)`,
        actionType: "Overdue",
        eventType: "TASK_OVERDUE",
        oldStatus: t.status,
        newStatus: t.status,
        progressPercent: t.progressPercent,
      });
      overdue++;
    } else if (left >= 0 && left <= 24 * 3600000 && !t.deadlineReminderSentAt) {
      const claimed = await db
        .update(tasks)
        .set({ deadlineReminderSentAt: new Date() })
        .where(and(eq(tasks.id, t.id), isNull(tasks.deadlineReminderSentAt)))
        .returning({ id: tasks.id });
      if (claimed.length === 0) continue;
      const assignee = await assigneeUserId(t);
      await notifyUsers({
        recipientUserIds: [assignee],
        actor: null,
        category: "Deadline",
        eventType: "TASK_DEADLINE_APPROACHING",
        title: `ডেডলাইন আসন্ন: ${t.title}`,
        message: `${t.taskCode} • ডেডলাইন ${t.dueDate}${t.dueTime ? ` ${t.dueTime}` : ""} • বর্তমান অগ্রগতি ${t.progressPercent}%`,
        task: t,
      });
      reminders++;
    }
  }
  return { reminders, overdue };
}
