import { and, eq, inArray, sql } from "drizzle-orm";
import { db, attendances, dailyWorkPlans, dailyWorks, employees, notifications, reminderSettings, users } from "@/db";

function dhakaDateTime(now: Date) {
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

function validTime(value: string | undefined, fallback: string) {
  return value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
}

async function notifyEmployeeOnce(params: {
  employee: typeof employees.$inferSelect;
  userId: number;
  date: string;
  key: string;
  type: string;
  title: string;
  message: string;
  relatedUrl: string;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${params.key}, 0))`
    );
    const existing = await tx
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, params.userId),
          eq(notifications.dueDate, params.date),
          eq(notifications.relatedEntityCode, params.key)
        )
      )
      .limit(1);
    if (existing.length) return false;

    await tx.insert(notifications).values({
      userId: params.userId,
      targetRole: "User",
      type: params.type,
      category: "Attendance",
      title: params.title,
      message: params.message,
      createdBy: "Reminder Automation",
      priority: "Medium",
      assignedPersonOrTeam: params.employee.name,
      dueDate: params.date,
      recipientEmployeeId: params.employee.id,
      recipientName: params.employee.name,
      relatedEmployeeId: params.employee.id,
      relatedUrl: params.relatedUrl,
      relatedEntityCode: params.key,
      isRead: false,
    });
    return true;
  });
}

export async function runReminderAutomation(now = new Date()) {
  const { date, time } = dhakaDateTime(now);
  const [settings] = await db.select().from(reminderSettings).limit(1);
  const morningCutoff = validTime(settings?.lateCheckInAfter, "09:30");
  const planCutoff = validTime(settings?.workPlanReminderTime, "10:00");
  const summaryCutoff = validTime(settings?.dailySummaryReminderTime, "18:30");
  const activeEmployees = await db
    .select()
    .from(employees)
    .where(eq(employees.employmentStatus, "Active"));
  const eligibleEmployees = activeEmployees.filter(
    (employee) => !employee.archived && employee.userId !== null
  );
  const activeUsers = eligibleEmployees.length
    ? await db
        .select()
        .from(users)
        .where(inArray(users.id, eligibleEmployees.map((employee) => employee.userId!)))
    : [];
  const activeUserIds = new Set(activeUsers.filter((user) => user.status === "Active").map((user) => user.id));
  const todayAttendance = await db
    .select()
    .from(attendances)
    .where(eq(attendances.date, date));
  const todayPlans = await db
    .select({ employeeId: dailyWorkPlans.employeeId })
    .from(dailyWorkPlans)
    .where(eq(dailyWorkPlans.date, date));
  const todaySummaries = await db
    .select({ employeeId: dailyWorks.employeeId })
    .from(dailyWorks)
    .where(eq(dailyWorks.date, date));
  const planEmployeeIds = new Set(todayPlans.map((plan) => plan.employeeId));
  const summaryEmployeeIds = new Set(todaySummaries.map((summary) => summary.employeeId));

  const sent = { missingCheckIn: 0, missingCheckOut: 0, missingPlan: 0, missingSummary: 0 };
  for (const employee of eligibleEmployees) {
    const userId = employee.userId;
    if (!userId || !activeUserIds.has(userId)) continue;
    const records = todayAttendance.filter((row) => row.employeeId === employee.id);
    const hasMorningIn = records.some((row) => Boolean(row.checkIn));
    const hasAnyPunch = records.some((row) => Boolean(row.checkIn || row.checkIn2));
    const hasFinalOut = records.some((row) => Boolean(row.checkOut2));
    const base = { employee, userId, date, relatedUrl: "/attendance" };

    if (time > morningCutoff && !hasMorningIn) {
      const key = `ATT-MORNING-IN:${date}:${employee.id}`;
      if (await notifyEmployeeOnce({
        ...base,
        key,
        type: "Attendance Reminder",
        title: `${employee.name}: সকাল IN রিমাইন্ডার`,
        message: `${date} তারিখে আপনার সকাল IN এখনো রেকর্ড হয়নি।`,
      })) sent.missingCheckIn++;
    }

    if (time > "19:30" && hasAnyPunch && !hasFinalOut) {
      const key = `ATT-EVENING-OUT:${date}:${employee.id}`;
      if (await notifyEmployeeOnce({
        ...base,
        key,
        type: "Attendance Reminder",
        title: `${employee.name}: দিনের শেষ OUT রিমাইন্ডার`,
        message: `${date} তারিখে আপনার checkOut2 এখনো রেকর্ড হয়নি।`,
      })) sent.missingCheckOut++;
    }

    if (time >= planCutoff && !planEmployeeIds.has(employee.id)) {
      const key = `WORK-PLAN:${date}:${employee.id}`;
      if (await notifyEmployeeOnce({
        ...base,
        key,
        type: "Work Plan Reminder",
        title: `${employee.name}: Today's Work Plan`,
        message: `${date} তারিখের Today's Work Plan এখনো জমা হয়নি।`,
        relatedUrl: "/my-day",
      })) sent.missingPlan++;
    }

    if (time >= summaryCutoff && !summaryEmployeeIds.has(employee.id)) {
      const key = `DAILY-SUMMARY:${date}:${employee.id}`;
      if (await notifyEmployeeOnce({
        ...base,
        key,
        type: "Daily Work Reminder",
        title: `${employee.name}: Daily Work Summary`,
        message: `${date} তারিখের Daily Work Summary এখনো জমা হয়নি।`,
        relatedUrl: "/my-day",
      })) sent.missingSummary++;
    }
  }
  return sent;
}