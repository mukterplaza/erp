import type {
  tasks,
  employees,
  attendances,
  dailyWorks,
  leads,
  performanceReviews,
  taskComments,
} from "@/db/schema";

type Task = typeof tasks.$inferSelect;
type Emp = typeof employees.$inferSelect;
type Att = typeof attendances.$inferSelect;
type Dw = typeof dailyWorks.$inferSelect;
type Lead = typeof leads.$inferSelect;
type Perf = typeof performanceReviews.$inferSelect;
type Comment = typeof taskComments.$inferSelect;

export const DISPLAY_STATUS: Record<string, string> = {
  Todo: "Not Started",
  Accepted: "Accepted",
  "In Progress": "In Progress",
  Review: "Awaiting Review",
  Reopened: "Correction Required",
  Blocked: "Blocked",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const OPEN = (t: Task) => t.status !== "Completed" && t.status !== "Cancelled";
const IS_OVERDUE = (t: Task, today: string) => {
  if (!OPEN(t)) return false;
  if (t.dueDate < today) return true;
  if (t.dueDate === today && t.dueTime) {
    const dhakaNow = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: false });
    return t.dueTime < dhakaNow;
  }
  return false;
};
const dateOf = (d: Date | string | null | undefined) =>
  d ? new Date(d).toISOString().split("T")[0] : null;
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export function displayStatus(t: Task, today: string) {
  if (IS_OVERDUE(t, today)) return "Overdue";
  return DISPLAY_STATUS[t.status] || t.status;
}

/** Performance weights (transparent, total 100). Missing factors are excluded and the rest re-normalised. */
export const PERFORMANCE_WEIGHTS = {
  completion: 25,
  onTime: 20,
  noOverdue: 15,
  dailyUpdates: 15,
  attendance: 10,
  quality: 10,
  followUps: 5,
};

export function computeEmployeeWork(params: {
  emp: Emp;
  tasks: Task[];
  attendances: Att[];
  dailyWorks: Dw[];
  leads: Lead[];
  reviews: Perf[];
  comments: Comment[];
  today: string;
}) {
  const { emp, today } = params;
  const month = today.slice(0, 7);
  const monthStart = `${month}-01`;
  const d = new Date(today);
  const dow = d.getDay(); // 6 = Saturday (BD week start)
  const weekStartDate = new Date(d);
  weekStartDate.setDate(d.getDate() - ((dow + 1) % 7));
  const weekStart = weekStartDate.toISOString().split("T")[0];

  const myTasks = params.tasks.filter((t) => t.assignedTo === emp.id && t.status !== "Cancelled");
  const created = (t: Task) => dateOf(t.createdAt) || today;
  const completedOn = (t: Task) => dateOf(t.completedAt);

  const bucket = (list: Task[]) => ({
    assigned: list.length,
    notStarted: list.filter((t) => t.status === "Todo" || t.status === "Accepted").length,
    inProgress: list.filter((t) => t.status === "In Progress" || t.status === "Reopened").length,
    awaitingReview: list.filter((t) => t.status === "Review").length,
    blocked: list.filter((t) => t.status === "Blocked").length,
    completed: list.filter((t) => t.status === "Completed").length,
    pending: list.filter(OPEN).length,
    overdue: list.filter((t) => IS_OVERDUE(t, today)).length,
    completionPercent: list.length
      ? Math.round((list.filter((t) => t.status === "Completed").length / list.length) * 100)
      : 0,
  });

  const todayTasks = myTasks.filter(
    (t) => t.dueDate === today || created(t) === today || completedOn(t) === today || (IS_OVERDUE(t, today))
  );
  const weekTasks = myTasks.filter(
    (t) => created(t) >= weekStart || t.dueDate >= weekStart || (OPEN(t))
  );
  const monthTasks = myTasks.filter(
    (t) => created(t) >= monthStart || t.dueDate >= monthStart || OPEN(t)
  );

  const overdueTasks = myTasks.filter((t) => IS_OVERDUE(t, today));
  const oldestOverdueDays = overdueTasks.length
    ? Math.max(...overdueTasks.map((t) => daysBetween(t.dueDate, today)))
    : 0;

  const myAtt = params.attendances.filter((a) => a.employeeId === emp.id);
  const todayAtt = myAtt.find((a) => a.date === today) || null;
  const monthAtt = myAtt.filter((a) => a.date >= monthStart && a.date <= today && a.status !== "Leave" && a.status !== "Holiday");

  const myDw = params.dailyWorks.filter((w) => w.employeeId === emp.id);
  const todayDw = myDw.filter((w) => w.date === today);
  const monthDwDays = new Set(myDw.filter((w) => w.date >= monthStart).map((w) => w.date)).size;

  // ---------------- PERFORMANCE (transparent) ----------------
  const W = PERFORMANCE_WEIGHTS;
  const mCompleted = monthTasks.filter((t) => t.status === "Completed");
  const onTime = mCompleted.filter((t) => (completedOn(t) || today) <= t.dueDate).length;
  const mOverdue = monthTasks.filter((t) => IS_OVERDUE(t, today)).length;
  const reviewed = monthTasks.filter((t) => t.reviewStatus === "Approved" || t.correctionCount > 0);
  const firstTimeApproved = reviewed.filter((t) => t.reviewStatus === "Approved" && t.correctionCount === 0).length;

  const attScore = (a: Att) =>
    a.status === "Present" ? 1 : a.status === "Late" ? 0.7 : a.status === "Early Leave" ? 0.8 : a.status === "Missing Checkout" ? 0.5 : 0;
  const presentDays = monthAtt.filter((a) => a.status !== "Absent").length;

  const myLeads = params.leads.filter(
    (l) => l.assignedStaffId === emp.id && !["Won", "Lost", "On Hold"].includes(l.status)
  );
  const leadsOnTrack = myLeads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate >= today).length;

  const factors: Array<{ key: string; label: string; weight: number; ratio: number | null; detail: string }> = [
    {
      key: "completion",
      label: "টাস্ক সম্পন্ন",
      weight: W.completion,
      ratio: monthTasks.length ? mCompleted.length / monthTasks.length : null,
      detail: `${mCompleted.length}/${monthTasks.length} সম্পন্ন`,
    },
    {
      key: "onTime",
      label: "সময়মতো সম্পন্ন",
      weight: W.onTime,
      ratio: mCompleted.length ? onTime / mCompleted.length : null,
      detail: `${onTime}/${mCompleted.length} ডেডলাইনের মধ্যে`,
    },
    {
      key: "noOverdue",
      label: "ওভারডিউ নেই",
      weight: W.noOverdue,
      ratio: monthTasks.length ? 1 - mOverdue / monthTasks.length : null,
      detail: `${mOverdue} ওভারডিউ`,
    },
    {
      key: "dailyUpdates",
      label: "দৈনিক আপডেট",
      weight: W.dailyUpdates,
      ratio: presentDays > 0 ? Math.min(1, monthDwDays / presentDays) : monthDwDays > 0 ? 1 : null,
      detail: `${monthDwDays} দিনের আপডেট / ${presentDays} উপস্থিত দিন`,
    },
    {
      key: "attendance",
      label: "হাজিরা",
      weight: W.attendance,
      ratio: monthAtt.length ? monthAtt.reduce((s, a) => s + attScore(a), 0) / monthAtt.length : null,
      detail: `${monthAtt.length} রেকর্ড (উপস্থিত=১, লেট=০.৭, আগে বের=০.৮, আউট নেই=০.৫)`,
    },
    {
      key: "quality",
      label: "কাজের মান (রিওয়ার্ক ছাড়া)",
      weight: W.quality,
      ratio: reviewed.length ? firstTimeApproved / reviewed.length : null,
      detail: `${firstTimeApproved}/${reviewed.length} প্রথমবারেই অনুমোদিত`,
    },
    {
      key: "followUps",
      label: "লিড ফলো-আপ",
      weight: W.followUps,
      ratio: myLeads.length ? leadsOnTrack / myLeads.length : null,
      detail: `${leadsOnTrack}/${myLeads.length} লিড সময়মতো`,
    },
  ];

  const available = factors.filter((f) => f.ratio !== null);
  const availWeight = available.reduce((s, f) => s + f.weight, 0);
  const earned = available.reduce((s, f) => s + f.weight * (f.ratio as number), 0);
  const autoScore = availWeight > 0 ? Math.round((earned / availWeight) * 100) : null;

  const manual = params.reviews
    .filter((r) => r.employeeId === emp.id && r.period === month)
    .sort((a, b) => b.id - a.id)[0];
  const manualScore = manual ? manual.totalPoints : null;
  const finalScore =
    autoScore === null
      ? manualScore
      : manualScore === null
      ? autoScore
      : Math.round(autoScore * 0.8 + manualScore * 0.2);

  // ---------------- LAST ACTIVITY ----------------
  const empUserComments = params.comments.filter((c) => emp.userId && c.userId === emp.userId);
  const stamps: Array<{ at: string; text: string }> = [];
  if (todayAtt?.checkIn) stamps.push({ at: `${todayAtt.date}T${todayAtt.checkIn}`, text: `ইন টাইম ${todayAtt.checkIn}` });
  if (todayAtt?.checkOut) stamps.push({ at: `${todayAtt.date}T${todayAtt.checkOut}`, text: `আউট টাইম ${todayAtt.checkOut}` });
  myDw.slice(0, 3).forEach((w) => stamps.push({ at: new Date(w.createdAt).toISOString(), text: `দৈনিক আপডেট: ${w.workSummary.slice(0, 60)}` }));
  empUserComments.slice(0, 5).forEach((c) => stamps.push({ at: new Date(c.createdAt).toISOString(), text: c.comment.slice(0, 60) }));
  stamps.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    employeeId: emp.id,
    today: {
      attendance: todayAtt
        ? { status: todayAtt.status, checkIn: todayAtt.checkIn, checkOut: todayAtt.checkOut }
        : null,
      tasks: todayTasks.length,
      completed: todayTasks.filter((t) => completedOn(t) === today).length,
      pending: todayTasks.filter(OPEN).length,
      dailyUpdate: todayDw[0]?.workSummary || null,
      dailyUpdates: todayDw.length,
    },
    week: bucket(weekTasks),
    month: bucket(monthTasks),
    all: bucket(myTasks),
    overdueCount: overdueTasks.length,
    oldestOverdueDays,
    lastActivity: stamps[0] || null,
    performance: {
      autoScore,
      manualScore,
      finalScore,
      manualBy: manual?.reviewedBy || null,
      manualComment: manual?.managerComments || null,
      factors: factors.map((f) => ({
        ...f,
        points: f.ratio === null ? null : Math.round(f.weight * f.ratio * 10) / 10,
      })),
      formula:
        "স্কোর = Σ(ওজন × অনুপাত) ÷ Σ(প্রযোজ্য ওজন) × ১০০। যে ফ্যাক্টরের ডাটা নেই তা বাদ দিয়ে বাকিগুলো সমানুপাতে গণনা। ম্যানেজমেন্ট স্কোর থাকলে চূড়ান্ত = স্বয়ংক্রিয় × ৮০% + ম্যানেজমেন্ট × ২০%।",
    },
  };
}
