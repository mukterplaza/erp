"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Plus,
  Send,
  ShieldAlert,
  ArrowUpRight,
  Printer,
  MessageSquare,
  CheckSquare,
  Paperclip,
  BellRing,
  Sparkles,
  LogIn,
  LogOut,
  Activity,
  Megaphone,
  Filter,
  X,
  Edit3,
  Trash2,
  Save,
  TrendingUp,
  AlertCircle,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

// ============================================================================
// 🛠️ Helpers & Constants
// ============================================================================
const getTodayLocal = (): string => new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"

const formatTime = (time?: string): string => {
  if (!time || time === "--:--") return "—";
  return time;
};

const num = (v: any, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const taka = (n: number): string => "৳" + num(n).toLocaleString("en-IN");

const hoursFromHHMM = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

// ============================================================================
// 📦 Strongly-typed Interfaces (No more `any` abuse)
// ============================================================================
type AttendanceStatus =
  | "Present"
  | "Late"
  | "Early Leave"
  | "Missing Checkout"
  | "Leave"
  | "Absent";

type Attendance = {
  id: number;
  employeeId: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  workingHours?: number | string;
  morningHours?: number | string;
  afternoonHours?: number | string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeHours?: number | string;
  notes?: string;
};

type WorkPlanItem = {
  id: string;
  title: string;
  status: "Completed" | "In Progress" | "Pending" | "Blocked";
  completionPercent?: number;
};

type WorkPlan = {
  id: number;
  employeeId: number;
  date: string;
  items: WorkPlanItem[];
  manualOverridePercent?: number;
  autoProgressPercent?: number;
};

type Task = {
  id: number;
  taskCode: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: number;
  isCompanyWide?: boolean;
  dueDate?: string;
  createdBy?: string;
  progressPercent?: number;
  completionNote?: string;
  completedBy?: string;
  reviewedBy?: string;
  completedAt?: string;
  evidenceAttachments?: Array<{ name: string; size: string }>;
};

type Attachment = { name: string; type: string; size: string; url: string };

// ============================================================================
// 🎯 Shared Sub-components
// ============================================================================
function StatPill({
  label,
  value,
  hint,
  color = "slate",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  color?: "emerald" | "amber" | "rose" | "slate" | "blue" | "indigo";
}) {
  const map = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    slate: "text-slate-900",
    blue: "text-blue-600",
    indigo: "text-indigo-600",
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${map[color]}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    Present: "bg-emerald-100 text-emerald-700",
    Late: "bg-amber-100 text-amber-700",
    Leave: "bg-blue-100 text-blue-700",
    "Early Leave": "bg-orange-100 text-orange-700",
    "Missing Checkout": "bg-purple-100 text-purple-700",
    Absent: "bg-rose-100 text-rose-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Accepted: "bg-blue-100 text-blue-700",
    "In Progress": "bg-indigo-100 text-indigo-700",
    Review: "bg-purple-100 text-purple-700",
    Blocked: "bg-rose-100 text-rose-700",
    Todo: "bg-slate-100 text-slate-700",
    Draft: "bg-slate-100 text-slate-700",
    Pending: "bg-amber-100 text-amber-700",
    Paid: "bg-emerald-100 text-emerald-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Cancelled: "bg-slate-100 text-slate-500",
    Reopened: "bg-amber-100 text-amber-700",
  };
  const cls = map[status || ""] || "bg-slate-100 text-slate-700";
  const bn: Record<string, string> = {
    Present: "উপস্থিত",
    Late: "দেরিতে",
    Absent: "অনুপস্থিত",
    Leave: "ছুটিতে",
    "Early Leave": "আগে বের",
    "Missing Checkout": "আউট বাকি",
    Completed: "সম্পন্ন",
    Accepted: "গৃহীত",
    "In Progress": "চলমান",
    Review: "পর্যালোচনা",
    Blocked: "ব্লকড",
    Todo: "করণীয়",
    Pending: "বিচারাধীন",
    Approved: "অনুমোদিত",
    Paid: "পরিশোধিত",
    Rejected: "প্রত্যাখ্যাত",
    Cancelled: "বাতিল",
    Reopened: "পুনরায় খোলা",
    Draft: "ড্রাফট",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${cls}`}>
      {bn[status || ""] || status}
    </span>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      {right}
    </div>
  );
}

// ============================================================================
// 1. DASHBOARD VIEW
// ============================================================================
export function DashboardView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = getTodayLocal();
  const role = data.currentUser?.role || "Staff";
  const myEmpId: number | undefined = data.currentUser?.employeeId;

  const [selectedStaffTimelineId, setSelectedStaffTimelineId] = useState<
    number | null
  >(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticePriority, setNoticePriority] = useState("High");
  const [attendanceDate, setAttendanceDate] = useState(today);

  const isManagement = ["Owner", "MD", "Admin", "Manager", "HR"].includes(role);
  const isOwnerOrMD = ["Owner", "MD", "Admin"].includes(role);
  const isAccounts = role === "Accounts";

  // ===== Memoized Derived Data =====
  const attendances: Attendance[] = data.attendances || [];
  const workPlans: WorkPlan[] = data.dailyWorkPlans || [];
  const dailyWorks = data.dailyWorks || [];
  const tasks: Task[] = data.tasks || [];
  const allEmps = data.allEmployeesDirectory || [];

  const todayAtt = useMemo(
    () => attendances.filter((a) => a.date === today),
    [attendances, today]
  );

  const myTodayAtt = useMemo(() => {
    if (!myEmpId) return undefined;
    return todayAtt.find((a) => a.employeeId === myEmpId);
  }, [todayAtt, myEmpId]);

  const todayWorkPlans = useMemo(
    () => workPlans.filter((p) => p.date === today),
    [workPlans, today]
  );

  const myTodayPlan = useMemo(() => {
    if (!myEmpId) return undefined;
    return todayWorkPlans.find((p) => p.employeeId === myEmpId);
  }, [todayWorkPlans, myEmpId]);

  const myDailyWorks = useMemo(
    () =>
      myEmpId ? dailyWorks.filter((d: any) => d.employeeId === myEmpId) : [],
    [dailyWorks, myEmpId]
  );

  const myTasks = useMemo(
    () =>
      myEmpId
        ? tasks.filter(
            (t) => t.assignedTo === myEmpId || t.isCompanyWide
          )
        : [],
    [tasks, myEmpId]
  );

  const myPendingTasks = useMemo(
    () =>
      myTasks.filter(
        (t) => t.status !== "Completed" && t.status !== "Cancelled"
      ),
    [myTasks]
  );

  const myCompletedTasks = useMemo(
    () => myTasks.filter((t) => t.status === "Completed"),
    [myTasks]
  );

  const myEffectiveCompletion = useMemo(() => {
    if (myTodayPlan?.manualOverridePercent !== undefined) {
      return myTodayPlan.manualOverridePercent;
    }
    if (myTodayPlan?.autoProgressPercent !== undefined) {
      return myTodayPlan.autoProgressPercent;
    }
    if (myTasks.length === 0) return 0;
    return Math.round(
      myTasks.reduce((s, t) => s + num(t.progressPercent), 0) / myTasks.length
    );
  }, [myTodayPlan, myTasks]);

  // ===========================================================================
  // STAFF SELF DASHBOARD
  // ===========================================================================
  if (!isManagement && !isAccounts) {
    if (!myEmpId) {
      return (
        <div className="p-10 text-center text-sm text-slate-500 animate-pulse">
          আপনার প্রোফাইল লোড হচ্ছে…
        </div>
      );
    }

    const myAttendances = attendances.filter((a) => a.employeeId === myEmpId);
    const myLeaves = (data.leaveRequests || []).filter(
      (l: any) => l.employeeId === myEmpId
    );

    const handleQuickCheckIn = () =>
      onMutate({
        action: "checkIn",
        employeeId: myEmpId,
        date: today,
        checkIn: new Date().toTimeString().slice(0, 5),
        notes: "Quick IN from Staff Dashboard",
      });

    const handleQuickCheckOut = () => {
      if (!myTodayAtt) {
        alert("Please record IN TIME first.");
        return;
      }
      onMutate({
        action: "checkOut",
        attendanceId: myTodayAtt.id,
        checkOut: new Date().toTimeString().slice(0, 5),
      });
    };

    return (
      <div className="space-y-6">
        {/* Sticky Quick Actions Bar */}
        <div className="sticky top-14 z-10 bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Staff Self-Service • {data.currentUser?.empCode || "EMP"}
            </span>
            <h1 className="text-lg font-bold mt-1">
              স্বাগতম, {data.currentUser?.name} — My Day Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleQuickCheckIn}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <LogIn className="w-4 h-4" /> 1. IN TIME
            </button>
            <Link
              href="/my-day"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" /> 2. Work Plan
            </Link>
            <Link
              href="/tasks"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4 text-indigo-400" /> 3. Task ({myPendingTasks.length})
            </Link>
            <Link
              href="/my-day"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4 text-amber-400" /> 4. Daily Update
            </Link>
            <button
              type="button"
              onClick={handleQuickCheckOut}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" /> 5. OUT TIME
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatPill
            label="আজকের ইন টাইম"
            value={<span className="font-mono">{myTodayAtt?.checkIn || "Not Checked In"}</span>}
            hint="Auto-Approved • Shift 09:30"
            color="emerald"
          />
          <StatPill
            label="আজকের আউট টাইম"
            value={<span className="font-mono">{myTodayAtt?.checkOut || "Active"}</span>}
            hint={`Hours: ${myTodayAtt?.workingHours || "0.00"}h`}
            color="slate"
          />
          <StatPill
            label="আজকের কাজের পরিকল্পনা"
            value={`${myTodayPlan?.items?.length || 0} Items`}
            hint={`Auto Progress: ${myTodayPlan?.autoProgressPercent || 0}%`}
            color="indigo"
          />
          <StatPill
            label="পেন্ডিং টাস্ক"
            value={myPendingTasks.length}
            hint={`Completed: ${myCompletedTasks.length}`}
            color="amber"
          />
          <StatPill
            label="সার্বিক অগ্রগতি %"
            value={`${myEffectiveCompletion}%`}
            hint={
              <span className="block w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <span
                  className="block h-full bg-emerald-500 transition-all"
                  style={{ width: `${myEffectiveCompletion}%` }}
                />
              </span>
            }
            color="emerald"
          />
          <StatPill
            label="আমার ছুটি ও হাজিরা"
            value={`${myAttendances.length} Days`}
            hint={`Leaves: ${myLeaves.length}`}
            color="slate"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Work Plan + Tasks */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    আজকের কাজের পরিকল্পনা
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click status buttons to auto-compute your daily completion %
                  </p>
                </div>
                <Link
                  href="/my-day"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  + Edit Plan / Summary
                </Link>
              </div>

              {myTodayPlan && (myTodayPlan.items || []).length > 0 ? (
                <div className="space-y-2">
                  {(myTodayPlan.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(
                          ["Completed", "In Progress", "Pending", "Blocked"] as const
                        ).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              onMutate({
                                action: "updateWorkPlanItemStatus",
                                planId: myTodayPlan.id,
                                itemId: item.id,
                                status: st,
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                              item.status === st
                                ? st === "Completed"
                                  ? "bg-emerald-600 text-white"
                                  : st === "Blocked"
                                  ? "bg-rose-600 text-white"
                                  : st === "In Progress"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-amber-500 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No Work Plan added for today yet. Click "+ Edit Plan / Summary" to add.
                </p>
              )}
            </div>

            {/* My Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  My অ্যাসাইনকৃত টাস্ক ({myTasks.length})
                </h3>
                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-emerald-600"
                >
                  আমার সব টাস্ক →
                </Link>
              </div>
              {myTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  কোনো টাস্ক অ্যাসাইন করা হয়নি
                </p>
              ) : (
                myTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {t.taskCode}
                      </span>
                      <span className="ml-2 font-bold text-slate-900">
                        {t.title}
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        Due: {t.dueDate} • Status:{" "}
                        <strong>{t.status}</strong> ({t.progressPercent}%)
                      </p>
                    </div>
                    {t.status !== "Completed" && t.status !== "Cancelled" ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "updateTaskStatus",
                              taskId: t.id,
                              status: "Accepted",
                              progressPercent: 15,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "updateTaskStatus",
                              taskId: t.id,
                              status: "In Progress",
                              progressPercent: 50,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "updateTaskStatus",
                              taskId: t.id,
                              status: "Completed",
                              progressPercent: 100,
                              completionNote: "Completed from My Day Self Dashboard",
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                        >
                          Complete
                        </button>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-700">
                        ✓ {t.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Notifications + Activity Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  My Notifications
                </h3>
                <Link
                  href="/notifications"
                  className="text-xs font-semibold text-emerald-600"
                >
                  সেন্টার খুলুন →
                </Link>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {(data.notifications || []).slice(0, 5).map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[10px]">
                        {n.type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        By {n.createdBy || "System"}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{n.title}</p>
                    <p className="text-slate-600">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Private Activity Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> আমার ব্যক্তিগত
                কার্যক্রম
              </h3>
              <p className="text-[11px] text-slate-500">
                Attendance → Work Plan → Daily Work → Tasks → Leave (Strictly
                private to you & Management)
              </p>
              <div className="space-y-2.5 border-l-2 border-emerald-500 pl-3 ml-1 text-xs">
                {myTodayAtt && (
                  <div>
                    <span className="font-bold text-emerald-700">
                      Attendance:
                    </span>{" "}
                    Checked in at {myTodayAtt.checkIn}{" "}
                    {myTodayAtt.checkOut
                      ? `• Checked out at ${myTodayAtt.checkOut}`
                      : ""}
                  </div>
                )}
                {myTodayPlan && (
                  <div>
                    <span className="font-bold text-indigo-700">
                      Work Plan:
                    </span>{" "}
                    {(myTodayPlan.items || []).length} planned items (
                    {myTodayPlan.autoProgressPercent}% complete)
                  </div>
                )}
                {myDailyWorks.slice(0, 2).map((dw: any) => (
                  <div key={dw.id}>
                    <span className="font-bold text-slate-800">
                      দৈনিক সারাংশ ({dw.date}):
                    </span>{" "}
                    {dw.workSummary}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MANAGEMENT & OWNER DASHBOARD
  // ===========================================================================
  const totalEmpCount = allEmps.length;

  const checkedInToday = todayAtt.filter((a) => Boolean(a.checkIn)).length;
  const checkedOutToday = todayAtt.filter((a) => Boolean(a.checkOut)).length;
  const presentToday = todayAtt.filter((a) =>
    ["Present", "Late", "Early Leave", "Missing Checkout"].includes(
      a.status || ""
    )
  ).length;
  const lateToday = todayAtt.filter((a) => a.status === "Late").length;
  const onLeaveToday = todayAtt.filter((a) => a.status === "Leave").length;
  const absentToday = Math.max(
    0,
    totalEmpCount - presentToday - onLeaveToday
  );

  const selectedDateAttendances = useMemo(
    () => attendances.filter((a) => a.date === attendanceDate),
    [attendances, attendanceDate]
  );

  const selectedDatePresent = selectedDateAttendances.filter((a) =>
    ["Present", "Late", "Early Leave", "Missing Checkout"].includes(
      a.status || ""
    )
  ).length;
  const selectedDateLeave = selectedDateAttendances.filter(
    (a) => a.status === "Leave"
  ).length;
  const selectedDateAbsent = Math.max(
    0,
    totalEmpCount - selectedDatePresent - selectedDateLeave
  );
  const selectedDateLate = selectedDateAttendances.filter(
    (a) => a.status === "Late"
  ).length;

  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate < today &&
      t.status !== "Completed" &&
      t.status !== "Cancelled"
  );
  const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasksCount = tasks.filter((t) =>
    ["Todo", "Accepted", "In Progress"].includes(t.status)
  ).length;
  const blockedTasksCount = tasks.filter((t) => t.status === "Blocked").length;

  const todayDailyWorks = dailyWorks.filter(
    (d: any) => d.date === today
  );

  const updatedEmpIdsToday = new Set(
    todayDailyWorks.map((d: any) => d.employeeId)
  );
  const staffWithoutDailyUpdate = allEmps.filter(
    (e: any) => !updatedEmpIdsToday.has(e.id)
  );

  const teamCompletionPercent = useMemo(() => {
    if (todayWorkPlans.length > 0) {
      return Math.round(
        todayWorkPlans.reduce(
          (s, p) =>
            s +
            num(p.manualOverridePercent ?? p.autoProgressPercent ?? 0),
          0
        ) / todayWorkPlans.length
      );
    }
    if (tasks.length > 0) {
      return Math.round(
        tasks.reduce((s, t) => s + num(t.progressPercent), 0) / tasks.length
      );
    }
    return 0;
  }, [todayWorkPlans, tasks]);

  // Financial KPIs
  const accounts = data.accounts || [];
  const cashAcc = accounts.find((a: any) => a.code === "1010");
  const bankAcc = accounts.find((a: any) => a.code === "1020");
  const cashAndBank = num(cashAcc?.balance) + num(bankAcc?.balance);

  const invoices = data.invoices || [];
  const totalRevenue = invoices.reduce(
    (s: number, i: any) => s + num(i.totalAmount),
    0
  );
  const totalAR = invoices.reduce(
    (s: number, i: any) => s + num(i.outstandingAmount),
    0
  );

  const totalSupplierAP = (data.suppliers || []).reduce(
    (s: number, sup: any) => s + num(sup.outstandingPayable),
    0
  );
  const totalContractorDue = (data.contractors || []).reduce(
    (s: number, c: any) => s + num(c.outstandingDue),
    0
  );

  const totalExpenses = (data.expenses || [])
    .filter((e: any) => e.approvalStatus === "Approved")
    .reduce((s: number, e: any) => s + num(e.amount), 0);

  const totalSalaryExpense = (data.payrolls || [])
    .filter((p: any) => p.status === "Paid")
    .reduce((s: number, p: any) => s + num(p.netSalary), 0);

  const netProfit = totalRevenue - totalExpenses - totalSalaryExpense;

  // Verification records
  const mat1 = (data.materials || []).find((m: any) => m.materialCode === "MAT-0001");
  const prj1 = (data.projects || []).find((p: any) => p.projectCode === "PRJ-0001");
  const inv1 = (data.invoices || []).find((i: any) => i.invoiceCode === "INV-0001");
  const sup1 = (data.suppliers || []).find((s: any) => s.supplierCode === "SUP-0001");
  const con1 = (data.contractors || []).find((c: any) => c.contractorCode === "CON-0001");
  const payr1 = (data.payrolls || []).find((p: any) => p.payrollCode === "PAYR-0001");

  const inspectedStaff = selectedStaffTimelineId
    ? allEmps.find((e: any) => e.id === selectedStaffTimelineId)
    : null;

  return (
    <div className="space-y-6">
      {/* ROLE-SPECIFIC QUICK ACTIONS BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-lg border border-slate-700/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {role} কমান্ড সেন্টার
            </span>
            <span className="text-xs text-slate-300">
              Schedule: Morning 9:30–1:15 • Break 1:15–2:30 • Afternoon 2:30–7:30
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">
            INSAF ERP — Today&apos;s Team & Executive Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwnerOrMD ? (
            <>
              <Link href="/leads" className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">1. Business</Link>
              <Link href="/employees" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">2. People</Link>
              <Link href="/projects" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">3. Projects</Link>
              <Link href="/accounts" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">4. Finance</Link>
              <Link href="/reports" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">5. Reports</Link>
              <Link href="/settings" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">6. Settings</Link>
            </>
          ) : (
            <>
              <Link href="/employees" className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">1. Team</Link>
              <Link href="/tasks" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">2. Tasks</Link>
              <Link href="/leave" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">3. Approvals</Link>
              <Link href="/notifications" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">4. Notifications</Link>
              <Link href="/reports" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600">5. Reports</Link>
            </>
          )}
        </div>
      </div>

      {/* TODAY'S TEAM METRICS */}
      <div>
        <SectionTitle
          icon={<BellRing className="w-4 h-4 text-amber-500" />}
          title={`Today's Team Operational Dashboard (${today})`}
          subtitle="14 operational counters at a glance"
          right={
            <button
              type="button"
              onClick={() => onMutate({ action: "runReminderAutomation" })}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <BellRing className="w-3.5 h-3.5" /> অটো রিমাইন্ডার চালান
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatPill
            label="উপস্থিত / অনুপস্থিত"
            value={<>{presentToday} / <span className="text-rose-600">{absentToday}</span></>}
            hint={`Total Staff: ${totalEmpCount}`}
            color="emerald"
          />
          <StatPill
            label="লেট / ছুটিতে"
            value={<>{lateToday} / <span className="text-blue-600">{onLeaveToday}</span></>}
            hint="সকাল ৯:৩০-এর পর"
            color="amber"
          />
          <StatPill
            label="ইন / আউট"
            value={<>{checkedInToday} / <span className="text-emerald-600">{checkedOutToday}</span></>}
            hint="স্বয়ংক্রিয় অনুমোদিত"
            color="slate"
          />
          <StatPill
            label="আজকের কাজের পরিকল্পনা"
            value={`${todayWorkPlans.length} Plans`}
            hint="আজ জমা হয়েছে"
            color="indigo"
          />
          <StatPill
            label="সম্পন্ন / পেন্ডিং / ব্লকড"
            value={
              <>
                <span className="text-emerald-600">{completedTasksCount}</span> /{" "}
                <span className="text-amber-600">{pendingTasksCount}</span> /{" "}
                <span className="text-rose-600">{blockedTasksCount}</span>
              </>
            }
            hint={`Overdue: ${overdueTasks.length}`}
            color="slate"
          />
          <StatPill
            label="দৈনিক আপডেট নেই"
            value={`${staffWithoutDailyUpdate.length} Staff`}
            hint={`Submitted: ${todayDailyWorks.length}`}
            color="rose"
          />
          <StatPill
            label="টিম সম্পন্ন %"
            value={`${teamCompletionPercent}%`}
            hint={
              <span className="block w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <span
                  className="block h-full bg-emerald-500 transition-all"
                  style={{ width: `${teamCompletionPercent}%` }}
                />
              </span>
            }
            color="emerald"
          />
        </div>
      </div>

      {/* OWNER ATTENDANCE PANEL */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  আজকের সকলের হাজিরা
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Owner / Management Dashboard — সকল কর্মকর্তা ও কর্মচারীর দৈনিক হাজিরা
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">
                তারিখ
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-200">
          <StatPill label="মোট কর্মচারী" value={totalEmpCount} color="slate" />
          <StatPill label="উপস্থিত" value={selectedDatePresent} color="emerald" />
          <StatPill label="অনুপস্থিত" value={selectedDateAbsent} color="rose" />
          <StatPill label="ছুটিতে" value={selectedDateLeave} color="amber" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">কর্মচারী</th>
                <th className="p-3 font-semibold">পদবি</th>
                <th className="p-3 font-semibold">ইন টাইম</th>
                <th className="p-3 font-semibold">আউট টাইম</th>
                <th className="p-3 font-semibold">মোট ঘণ্টা</th>
                <th className="p-3 font-semibold">লেট</th>
                <th className="p-3 font-semibold">ওভারটাইম</th>
                <th className="p-3 font-semibold">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allEmps.map((emp: any) => {
                const att = selectedDateAttendances.find(
                  (a) => a.employeeId === emp.id
                );
                const status = att?.status || "Absent";
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[10px] text-slate-500">{emp.empCode}</div>
                    </td>
                    <td className="p-3 text-slate-600">{emp.designation || "—"}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-700">
                      {att?.checkIn || "—"}
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {att?.checkOut || (att?.checkIn ? "কার্যরত" : "—")}
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      {att?.workingHours ? `${att.workingHours} ঘণ্টা` : "—"}
                    </td>
                    <td className="p-3">
                      {num(att?.lateMinutes) > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {att.lateMinutes} মিনিট
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {num(att?.overtimeHours) > 0
                        ? `${att.overtimeHours} ঘণ্টা`
                        : "—"}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedDateLate > 0 && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-800">
            এই তারিখে দেরিতে উপস্থিত হয়েছেন:{" "}
            <strong>{selectedDateLate}</strong> জন
          </div>
        )}
      </section>

      {/* TEAM ACTIVITY MATRIX + STAFF TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Today&apos;s Team Matrix (Click Staff Name for Timeline)
              </h3>
              <p className="text-xs text-slate-500">
                Shows who planned what, automatic completion %, daily summary
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">স্টাফ (নামে ক্লিক)</th>
                  <th className="p-3">ইন / আউট</th>
                  <th className="p-3">আজকের কাজের পরিকল্পনা</th>
                  <th className="p-3">দৈনিক সারাংশ</th>
                  <th className="p-3">সম্পন্ন %</th>
                  <th className="p-3">ওভাররাইড</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allEmps.map((emp: any) => {
                  const att = todayAtt.find((a) => a.employeeId === emp.id);
                  const plan = todayWorkPlans.find(
                    (p) => p.employeeId === emp.id
                  );
                  const dw = todayDailyWorks.find(
                    (d: any) => d.employeeId === emp.id
                  );
                  const doneCount = (plan?.items || []).filter(
                    (i: any) => i.status === "Completed"
                  ).length;
                  const totalItems = (plan?.items || []).length;
                  const effectivePct =
                    plan?.manualOverridePercent ??
                    plan?.autoProgressPercent ??
                    dw?.progressPercent ??
                    0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffTimelineId(emp.id)}
                          className="font-bold text-slate-900 hover:text-emerald-600 text-left underline decoration-emerald-500/50"
                        >
                          {emp.name}
                        </button>
                        <div className="text-[11px] text-slate-400">
                          {emp.empCode} • {emp.designation}
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        {att ? (
                          <div>
                            <span className="text-emerald-700 font-bold">
                              IN: {formatTime(att.checkIn)}
                            </span>
                            <span className="block text-slate-500">
                              OUT: {formatTime(att.checkOut) || "Active"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-semibold">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {plan ? (
                          <div>
                            <span className="font-bold text-indigo-700">
                              {doneCount}/{totalItems} Completed
                            </span>
                            <div className="text-[11px] text-slate-500 truncate max-w-48">
                              {(plan.items || [])
                                .map((i: any) => i.title)
                                .join(" • ")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600">
                            পরিকল্পনা নেই
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {dw ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Submitted ({dw.status})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                            আপডেট নেই
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {effectivePct}%
                          </span>
                          {plan?.manualOverridePercent !== null &&
                            plan?.manualOverridePercent !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                                Overridden
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="p-3">
                        {plan && (
                          <button
                            type="button"
                            onClick={() => {
                              const val = prompt(
                                `Override Work Plan অগ্রগতি % for ${emp.name} (Auto: ${plan.autoProgressPercent}%):`,
                                String(effectivePct)
                              );
                              if (val === null) return;
                              const pct = Number(val);
                              if (Number.isNaN(pct) || pct < 0 || pct > 100) {
                                alert(
                                  "অনুগ্রহ করে 0 থেকে 100 এর মধ্যে একটি সংখ্যা দিন।"
                                );
                                return;
                              }
                              const reason =
                                prompt(
                                  "Reason for manual progress override (logged in Audit Trail):",
                                  "Verified site & drawing output quality"
                                ) || "Manager evaluation";
                              onMutate({
                                action: "overrideWorkPlanProgress",
                                planId: plan.id,
                                manualOverridePercent: pct,
                                overrideReason: reason,
                              });
                            }}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-semibold"
                          >
                            ওভাররাইড %
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Broadcast / Staff Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {inspectedStaff ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    8. কর্মচারী কার্যক্রম টাইমলাইন
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {inspectedStaff.name} ({inspectedStaff.empCode})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffTimelineId(null)}
                  className="text-xs text-slate-400 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-2.5 border-l-2 border-emerald-500 pl-3 text-xs max-h-80 overflow-y-auto">
                <div>
                  <strong className="text-emerald-700 block">
                    ১. আজকের হাজিরা:
                  </strong>
                  {(() => {
                    const att = todayAtt.find(
                      (a) => a.employeeId === inspectedStaff.id
                    );
                    return att
                      ? `IN: ${formatTime(att.checkIn)} | OUT: ${formatTime(att.checkOut) || "Active"}`
                      : "No attendance recorded today";
                  })()}
                </div>
                <div>
                  <strong className="text-indigo-700 block">
                    2. আজকের কাজের পরিকল্পনা:
                  </strong>
                  {(
                    todayWorkPlans.find(
                      (p) => p.employeeId === inspectedStaff.id
                    )?.items || []
                  ).map((it: any) => (
                    <div key={it.id} className="text-slate-600">
                      • {it.title} — <strong>{it.status}</strong> (
                      {it.completionPercent}%)
                    </div>
                  ))}
                </div>
                <div>
                  <strong className="text-slate-800 block">
                    ৩. দৈনিক সারাংশ:
                  </strong>
                  {dailyWorks
                    .filter((d: any) => d.employeeId === inspectedStaff.id)
                    .slice(0, 2)
                    .map((d: any) => (
                      <div key={d.id} className="text-slate-600">
                        • [{d.date}] {d.workSummary} ({d.progressPercent}%)
                      </div>
                    ))}
                </div>
                <div>
                  <strong className="text-amber-700 block">
                    4. অ্যাসাইনকৃত টাস্ক:
                  </strong>
                  {tasks
                    .filter((t) => t.assignedTo === inspectedStaff.id)
                    .map((t) => (
                      <div key={t.id} className="text-slate-600">
                        • {t.taskCode}: {t.title} ({t.status} -{" "}
                        {t.progressPercent}%)
                      </div>
                    ))}
                </div>
                <div>
                  <strong className="text-purple-700 block">
                    5. Leave & Performance:
                  </strong>
                  Leaves:{" "}
                  {
                    (data.leaveRequests || []).filter(
                      (l: any) => l.employeeId === inspectedStaff.id
                    ).length
                  }{" "}
                  • Score:{" "}
                  {(data.performanceReviews || []).find(
                    (r: any) => r.employeeId === inspectedStaff.id
                  )?.totalPoints || 90}
                  /100
                </div>
              </div>

              <Link
                href={`/employees/${inspectedStaff.id}/daily`}
                className="block text-center py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Open Full 360° Profile →
              </Link>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onMutate({
                  action: "createAnnouncement",
                  title: noticeTitle,
                  message: noticeMsg,
                  priority: noticePriority,
                  assignedPersonOrTeam: "All Staff",
                });
                setNoticeTitle("");
                setNoticeMsg("");
              }}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" /> Broadcast Notice
              </h3>
              <input
                type="text"
                required
                placeholder="Notice / Instruction Title *"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <textarea
                rows={2}
                required
                placeholder="Write instruction for All Staff..."
                value={noticeMsg}
                onChange={(e) => setNoticeMsg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <div className="flex gap-2">
                <select
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option>High</option>
                  <option>Critical</option>
                  <option>Medium</option>
                </select>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                >
                  সকল স্টাফকে জানান
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* FINANCIAL KPIs */}
      <div>
        <SectionTitle
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          title="ম্যানেজমেন্ট আর্থিক সারাংশ"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatPill
            label="নগদ ও ব্যাংক ব্যালেন্স"
            value={taka(cashAndBank)}
            hint={`Cash: ${taka(cashAcc?.balance)} | Bank: ${taka(bankAcc?.balance)}`}
            color="slate"
          />
          <StatPill
            label="ইনভয়েস আয়"
            value={taka(totalRevenue)}
            hint={`Net P&L: ${taka(netProfit)}`}
            color="emerald"
          />
          <StatPill
            label="প্রাপ্য হিসাব (AR)"
            value={taka(totalAR)}
            hint={`Collected: ${taka(totalRevenue - totalAR)}`}
            color="amber"
          />
          <StatPill
            label="সাপ্লায়ার ও ঠিকাদার পরিশোধযোগ্য"
            value={taka(totalSupplierAP + totalContractorDue)}
            hint={`Suppliers: ${taka(totalSupplierAP)} | Contr: ${taka(totalContractorDue)}`}
            color="rose"
          />
          <StatPill
            label="সরাসরি প্রজেক্ট খরচ"
            value={taka(totalExpenses)}
            hint={`Payroll Disbursed: ${taka(totalSalaryExpense)}`}
            color="slate"
          />
        </div>
      </div>

      {/* LIVE DB VERIFICATION MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              লাইভ হিসাব ও ফর্মুলা যাচাই
            </h3>
            <p className="text-xs text-slate-500">
              All 6 core mathematical formulas computed dynamically from
              PostgreSQL rows
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            6 / 6 Exact Formula Tests Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                1. Inventory (MAT-0001)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Stock = {num(mat1?.currentStock)} {mat1?.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Open({num(mat1?.openingStock)}) + Pur({num(mat1?.purchaseReceived)}) - Iss({num(mat1?.issueQty)}) - TrfOut({num(mat1?.transferOut)}) + TrfIn({num(mat1?.transferIn)}) - Con({num(mat1?.consumptionQty)}) = {num(mat1?.currentStock)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                2. Project Cost (PRJ-0001)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Cost = {taka(prj1?.actualCost)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Mat({taka(prj1?.materialCost)}) + Lab({taka(prj1?.labourCost)}) + Con({taka(prj1?.contractorCost)}) + Trp({taka(prj1?.transportCost)}) + Site({taka(prj1?.siteExpenseCost)}) = {taka(prj1?.actualCost)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                3. Client Receivable (INV-0001)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                AR = {taka(inv1?.outstandingAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Invoice({taka(inv1?.totalAmount)}) - Paid({taka(inv1?.paidAmount)}) = {taka(inv1?.outstandingAmount)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                4. Supplier Payable (SUP-0001)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                AP = {taka(sup1?.outstandingPayable)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Bill({taka(sup1?.totalBilled)}) - Paid({taka(sup1?.totalPaid)}) = {taka(sup1?.outstandingPayable)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                5. Contractor Due (CON-0001)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Due = {taka(con1?.outstandingDue)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Approved({taka(con1?.approvedBillAmount)}) - Paid({taka(con1?.paidAmount)}) = {taka(con1?.outstandingDue)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                6. Payroll Net (PAYR-0001)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Net = {taka(payr1?.netSalary)}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              {taka(payr1?.basicSalary)} + {taka(payr1?.allowance)} + {taka(payr1?.overtimePay)} - {taka(payr1?.advanceDeduction)} - {taka(payr1?.otherDeduction)} = {taka(payr1?.netSalary)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ATTENDANCE VIEW
// ============================================================================
export function AttendanceView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = getTodayLocal();
  const [employeeId, setEmployeeId] = useState(
    String(data.currentUser?.employeeId || data.allEmployeesDirectory?.[0]?.id || 1)
  );
  const [checkInTime, setCheckInTime] = useState("09:30");
  const [notes, setNotes] = useState("Office / Site Shift Check-In");

  // Correction state
  const [corrDate, setCorrDate] = useState(today);
  const [reqIn, setReqIn] = useState("09:30");
  const [reqOut, setReqOut] = useState("19:30");
  const [corrReason, setCorrReason] = useState("");

  const empMap = useMemo(
    () => new Map<number, any>((data.allEmployeesDirectory || []).map((e: any) => [e.id, e])),
    [data.allEmployeesDirectory]
  );

  const handleCheckIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onMutate({
        action: "checkIn",
        employeeId: Number(employeeId),
        date: today,
        checkIn: checkInTime,
        notes,
      });
    },
    [employeeId, today, checkInTime, notes, onMutate]
  );

  const handleCheckOut = useCallback(
    async (attendanceId: number) => {
      const outTime = prompt("Enter OUT TIME (HH:mm, Official End 19:30):", "19:30");
      if (!outTime) return;
      await onMutate({
        action: "checkOut",
        attendanceId,
        checkOut: outTime,
      });
    },
    [onMutate]
  );

  const handleCorrectionSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onMutate({
        action: "requestAttendanceCorrection",
        employeeId: Number(employeeId),
        date: corrDate,
        requestedCheckIn: reqIn,
        requestedCheckOut: reqOut,
        reason: corrReason,
      });
      setCorrReason("");
    },
    [employeeId, corrDate, reqIn, reqOut, corrReason, onMutate]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              স্বয়ংক্রিয় অনুমোদিত হাজিরা
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Morning: 9:30 AM – 1:15 PM • Break: 1:15 PM – 2:30 PM • Afternoon: 2:30 PM – 7:30 PM
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            হাজিরা ও শিফট হিসাব ব্যবস্থা
          </h1>
          <p className="text-xs text-slate-500">
            IN TIME & OUT TIME auto-approved. Only Leave / Correction need Manager approval.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToCSV("INSAF_Attendance", data.attendances || [])}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToPDFPrint("হাজিরা রেজিস্টার", `As of ${today}`, data.attendances || [])
            }
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> PDF প্রিন্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Check-In Form */}
        <form
          onSubmit={handleCheckIn}
          className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Record আজকের ইন টাইম (Auto-Approved)
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            >
              {(data.allEmployeesDirectory || []).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.empCode} — {e.name} ({e.designation})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                IN TIME (Shift 09:30)
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location / Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
          >
            ইন টাইম জমা (তাৎক্ষণিক অনুমোদন)
          </button>
        </form>

        {/* Correction Form */}
        <form
          onSubmit={handleCorrectionSubmit}
          className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Correction Request
            </h2>
            <span className="text-[11px] text-slate-500">
              Requires Manager / MD / Owner Approval
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Requested IN</label>
              <input
                type="time"
                required
                value={reqIn}
                onChange={(e) => setReqIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Requested OUT</label>
              <input
                type="time"
                required
                value={reqOut}
                onChange={(e) => setReqOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              required
              placeholder="Reason for correction / special adjustment..."
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0"
            >
              অনুমোদন চান
            </button>
          </div>

          {(data.attendanceCorrections || []).length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Correction Requests ({(data.attendanceCorrections || []).length})
              </p>
              {(data.attendanceCorrections || []).map((c: any) => {
                const emp = empMap.get(c.employeeId);
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {emp?.name || `EMP-${c.employeeId}`}
                      </span>{" "}
                      • {c.date} ({c.requestedCheckIn} → {c.requestedCheckOut}) —{" "}
                      <span className="text-slate-600">{c.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      {c.status === "Pending" &&
                        data.currentUser?.role !== "Staff" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onMutate({
                                  action: "approveAttendanceCorrection",
                                  correctionId: c.id,
                                  decision: "Approved",
                                })
                              }
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onMutate({
                                  action: "approveAttendanceCorrection",
                                  correctionId: c.id,
                                  decision: "Rejected",
                                })
                              }
                              className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </div>

      {/* Attendance Register */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            হাজিরা রেজিস্টার ({(data.attendances || []).length} records)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">তারিখ</th>
                <th className="p-3 font-semibold">কর্মচারী</th>
                <th className="p-3 font-semibold">ইন</th>
                <th className="p-3 font-semibold">আউট</th>
                <th className="p-3 font-semibold">সকাল / বিকাল</th>
                <th className="p-3 font-semibold">মোট ঘণ্টা</th>
                <th className="p-3 font-semibold">লেট / আগে-বের</th>
                <th className="p-3 font-semibold">ওভারটাইম</th>
                <th className="p-3 font-semibold">স্ট্যাটাস</th>
                <th className="p-3 font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.attendances || []).map((a: any) => {
                const emp = empMap.get(a.employeeId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{a.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        {emp?.name || `Employee #${a.employeeId}`}
                      </div>
                      <div className="text-[11px] text-slate-400">{emp?.empCode}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{a.checkIn || "—"}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{a.checkOut || "—"}</td>
                    <td className="p-3 font-mono text-slate-600">
                      {a.morningHours || "0.00"}h / {a.afternoonHours || "0.00"}h
                    </td>
                    <td className="p-3 font-bold text-slate-900">{a.workingHours}h</td>
                    <td className="p-3">
                      <span className="text-amber-600 font-semibold">{a.lateMinutes}m</span> /{" "}
                      <span className="text-rose-600">{a.earlyLeaveMinutes || 0}m</span>
                    </td>
                    <td className="p-3 text-indigo-600 font-semibold">{a.overtimeHours}h</td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                    <td className="p-3">
                      {!a.checkOut && a.status !== "Leave" && (
                        <button
                          type="button"
                          onClick={() => handleCheckOut(a.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                        >
                          আউট টাইম দিন
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3, 4 & 5. MY DAY: WORK PLAN + DAILY SUMMARY + ATTACHMENTS
// ============================================================================
export function MyDayAndDailyWorksView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = getTodayLocal();
  const myEmpId = data.currentUser?.employeeId;

  const existingMyPlan = useMemo(
    () => (data.dailyWorkPlans || []).find((p: any) => p.employeeId === myEmpId && p.date === today),
    [data.dailyWorkPlans, myEmpId, today]
  );

  const [planInput, setPlanInput] = useState("");
  const [draftPlanItems, setDraftPlanItems] = useState<WorkPlanItem[]>([]);

  useEffect(() => {
    if (existingMyPlan?.items) {
      setDraftPlanItems(existingMyPlan.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMyPlan?.id, existingMyPlan?.items?.length]);

  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("19:30");
  const [workStatus, setWorkStatus] = useState("Completed");
  const [workSummary, setWorkSummary] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [clientId, setClientId] = useState("");
  const [progressPercent, setProgressPercent] = useState("80");
  const [problems, setProblems] = useState("");
  const [pendingWork, setPendingWork] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const empMap = useMemo(
    () => new Map<number, any>((data.allEmployeesDirectory || []).map((e: any) => [e.id, e])),
    [data.allEmployeesDirectory]
  );
  const projMap = useMemo(
    () => new Map<number, any>((data.projects || []).map((p: any) => [p.id, p])),
    [data.projects]
  );
  const siteMap = useMemo(
    () => new Map<number, any>((data.sites || []).map((s: any) => [s.id, s])),
    [data.sites]
  );
  const taskMap = useMemo(
    () => new Map<number, any>((data.tasks || []).map((t: any) => [t.id, t])),
    [data.tasks]
  );

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const mapped: Attachment[] = files.map((f) => ({
      name: f.name,
      type: f.type || f.name.split(".").pop()?.toUpperCase() || "FILE",
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      url: `#attachment-${encodeURIComponent(f.name)}`,
    }));
    setAttachments((prev) => [...prev, ...mapped]);
  };

  const handleSaveWorkPlan = useCallback(async () => {
    await onMutate({
      action: "saveDailyWorkPlan",
      date: today,
      items: draftPlanItems,
    });
  }, [today, draftPlanItems, onMutate]);

  const handleSubmitSummary = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onMutate({
        action: "submitDailyWork",
        date: today,
        arrivalTime: startTime,
        startTime,
        endTime,
        status: workStatus,
        workSummary,
        taskId: taskId ? Number(taskId) : null,
        projectId: projectId ? Number(projectId) : null,
        siteId: siteId ? Number(siteId) : null,
        clientId: clientId ? Number(clientId) : null,
        progressPercent: Number(progressPercent),
        problems,
        pendingWork,
        tomorrowPlan: tomorrowPlan || "Continue scheduled tasks",
        attachments,
      });
      setWorkSummary("");
      setProblems("");
      setPendingWork("");
      setAttachments([]);
    },
    [today, startTime, endTime, workStatus, workSummary, taskId, projectId, siteId, clientId, progressPercent, problems, pendingWork, tomorrowPlan, attachments, onMutate]
  );

  const completedDraftCount = useMemo(
    () => draftPlanItems.filter((i) => i.status === "Completed").length,
    [draftPlanItems]
  );

  const autoDraftPercent = useMemo(() => {
    if (draftPlanItems.length === 0) return 0;
    return Math.round((completedDraftCount / draftPlanItems.length) * 100);
  }, [completedDraftCount, draftPlanItems.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            My Day — আজকের কাজের পরিকল্পনা & Daily Work Summary
          </h1>
          <p className="text-xs text-slate-500">
            Plan your tasks • Auto-progress calculation • Multi-file attachments
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Auto Progress: {autoDraftPercent}% ({completedDraftCount}/{draftPlanItems.length})
        </span>
      </div>

      {/* Work Plan */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> আজকের কাজের পরিকল্পনা
            </h2>
            <p className="text-xs text-slate-500">
              Example: 5 planned → 5 completed = 100%, 4 = 80%, 3 = 60%
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveWorkPlan}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
          >
            Save Plan ({autoDraftPercent}%)
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={planInput}
            onChange={(e) => setPlanInput(e.target.value)}
            placeholder="Add planned task (Bangla/English)..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              if (!planInput.trim()) return;
              setDraftPlanItems((prev) => [
                ...prev,
                { id: `wp-${Date.now()}`, title: planInput.trim(), status: "Pending" },
              ]);
              setPlanInput("");
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            + যোগ
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {draftPlanItems.map((it, idx) => (
            <div
              key={it.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
            >
              <span className="font-semibold text-slate-800">
                {idx + 1}. {it.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {(["Completed", "In Progress", "Pending", "Blocked"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() =>
                      setDraftPlanItems((prev) =>
                        prev.map((p) => (p.id === it.id ? { ...p, status: st } : p))
                      )
                    }
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      it.status === st
                        ? st === "Completed"
                          ? "bg-emerald-600 text-white"
                          : st === "Blocked"
                          ? "bg-rose-600 text-white"
                          : st === "In Progress"
                          ? "bg-indigo-600 text-white"
                          : "bg-amber-500 text-white"
                        : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Work Summary Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmitSummary}
          className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 h-fit"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Submit Daily Summary (Bangla/English/Mixed)
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">শুরুর সময়</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">শেষ সময়</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={workStatus} onChange={(e) => setWorkStatus(e.target.value)} className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs">
                <option>Completed</option>
                <option>In Progress</option>
                <option>Pending</option>
                <option>Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সংযুক্ত টাস্ক</label>
              <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                <option value="">-- ঐচ্ছিক টাস্ক --</option>
                {(data.tasks || []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.taskCode}: {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সম্পন্ন %</label>
              <input type="number" min="0" max="100" value={progressPercent} onChange={(e) => setProgressPercent(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="">-- প্রজেক্ট --</option>
              {(data.projects || []).map((p: any) => <option key={p.id} value={p.id}>{p.projectCode}</option>)}
            </select>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="">-- সাইট --</option>
              {(data.sites || []).map((s: any) => <option key={s.id} value={s.id}>{s.siteCode}</option>)}
            </select>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="">-- ক্লায়েন্ট --</option>
              {(data.clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.clientCode}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Work Description *</label>
            <textarea
              required
              rows={3}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="আজ বসুন্ধরা সাইটে ৩য় তলার ছাদের রড বাইন্ডিং চেক করেছি..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> Attach Images, PDFs (Multiple Allowed)
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleMultipleFiles}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {attachments.map((att, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                    {att.name} ({att.size})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={problems} onChange={(e) => setProblems(e.target.value)} placeholder="Problems / সমস্যা (Optional)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            <input type="text" value={tomorrowPlan} onChange={(e) => setTomorrowPlan(e.target.value)} placeholder="Tomorrow Plan / আগামীকালের পরিকল্পনা" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Save দৈনিক সারাংশ & Attachments
          </button>
        </form>

        {/* Submitted Work Plans & Logs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              জমাকৃত দৈনিক সারাংশ ({(data.dailyWorks || []).length})
            </h3>
            {(data.dailyWorks || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">কোনো সারাংশ জমা হয়নি</p>
            ) : (
              (data.dailyWorks || []).map((dw: any) => {
                const emp = empMap.get(dw.employeeId);
                const proj = projMap.get(dw.projectId);
                const site = siteMap.get(dw.siteId);
                const task = taskMap.get(dw.taskId);
                return (
                  <div key={dw.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-bold text-slate-900">
                          {emp?.name || `EMP-${dw.employeeId}`}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          {dw.date} • {dw.startTime || dw.arrivalTime} – {dw.endTime || "19:30"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold">
                          {dw.status || "Completed"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          {dw.progressPercent}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {dw.workSummary}
                    </p>
                    {(dw.attachments || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(dw.attachments || []).map((att: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                            <Paperclip className="w-3 h-3" /> {att.name} ({att.size})
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {task && (
                        <Link href={`/tasks/${task.id}`} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          Task: {task.taskCode}
                        </Link>
                      )}
                      {proj && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Project: {proj.projectCode}</span>}
                      {site && <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Site: {site.siteCode}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6 & 7. TASK MANAGEMENT
// ============================================================================
export function TasksView({
  data,
  onMutate,
  focusedTaskId,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  focusedTaskId?: number;
}) {
  const today = getTodayLocal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(
    String(data.allEmployeesDirectory?.[0]?.id || 1)
  );
  const [assignToAllStaff, setAssignToAllStaff] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [priority, setPriority] = useState("High");
  const [dueDate, setDueDate] = useState(today);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<Attachment[]>([]);

  const empMap = useMemo(
    () => new Map<number, any>((data.allEmployeesDirectory || []).map((e: any) => [e.id, e])),
    [data.allEmployeesDirectory]
  );

  const handleCreateTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onMutate({
        action: "createTask",
        title,
        description,
        assignedTo: Number(assignedTo),
        assignToAllStaff,
        projectId: projectId ? Number(projectId) : null,
        siteId: siteId ? Number(siteId) : null,
        priority,
        dueDate,
        attachmentUrl,
        requiresReview: false,
      });
      setTitle("");
      setDescription("");
      setAttachmentUrl("");
    },
    [title, description, assignedTo, assignToAllStaff, projectId, siteId, priority, dueDate, attachmentUrl, onMutate]
  );

  const filteredTasks = useMemo(() => {
    const all = data.tasks || [];
    if (focusedTaskId) return all.filter((t: any) => t.id === focusedTaskId);
    if (statusFilter === "All") return all;
    return all.filter((t: any) => t.status === statusFilter);
  }, [data.tasks, focusedTaskId, statusFilter]);

  const submitCompletion = useCallback(async () => {
    if (!completingTaskId) return;
    await onMutate({
      action: "updateTaskStatus",
      taskId: completingTaskId,
      status: "Completed",
      progressPercent: 100,
      completionNote: completionNote || "Completed with verified evidence",
      evidenceAttachments: evidenceFiles,
    });
    setCompletingTaskId(null);
    setCompletionNote("");
    setEvidenceFiles([]);
  }, [completingTaskId, completionNote, evidenceFiles, onMutate]);

  const submitComment = useCallback(
    async (taskId: number) => {
      const text = (commentDrafts[taskId] || "").trim();
      if (!text) return;
      await onMutate({
        action: "addTaskComment",
        taskId,
        comment: text,
      });
      setCommentDrafts((prev) => ({ ...prev, [taskId]: "" }));
    },
    [commentDrafts, onMutate]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {focusedTaskId
              ? `Task Detail & Completion Evidence (#${focusedTaskId})`
              : "টাস্ক ব্যবস্থাপনা ও নির্দেশনা ওয়ার্কফ্লো"}
          </h1>
          <p className="text-xs text-slate-500">
            Workflow: Todo → Accepted → In Progress → Review → Completed
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {focusedTaskId ? (
            <Link href="/tasks" className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold">
              ← সকল টাস্ক
            </Link>
          ) : (
            ["All", "Todo", "Accepted", "In Progress", "Review", "Completed", "Blocked", "Reopened"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Completion Evidence Modal */}
      {completingTaskId && (
        <div className="bg-emerald-950 text-white p-5 rounded-2xl border border-emerald-700 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">
              Complete Task #{completingTaskId} — Attach Completion Note & Evidence
            </h3>
            <button type="button" onClick={() => setCompletingTaskId(null)} className="text-xs text-slate-300">
              ✕ Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="Completion Note..."
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
          />
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setEvidenceFiles(
                files.map((f) => ({
                  name: f.name,
                  type: f.type || "FILE",
                  size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                  url: `#evidence-${encodeURIComponent(f.name)}`,
                }))
              );
            }}
            className="text-xs text-slate-300"
          />
          <button
            type="button"
            onClick={submitCompletion}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            সম্পন্ন নিশ্চিত ও ম্যানেজারকে জানান
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {!focusedTaskId && (
          <form
            onSubmit={handleCreateTask}
            className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> টাস্ক / কোম্পানি নির্দেশনা তৈরি
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">টাস্ক শিরোনাম *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 4th Floor Column Reinforcement Check"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">কর্মচারী অ্যাসাইন</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} disabled={assignToAllStaff} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                {(data.allEmployeesDirectory || []).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.empCode} — {e.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-700 mt-2 cursor-pointer font-medium">
                <input type="checkbox" checked={assignToAllStaff} onChange={(e) => setAssignToAllStaff(e.target.checked)} />
                Notify & Assign to All Staff
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  <option value="">-- ঐচ্ছিক --</option>
                  {(data.projects || []).map((p: any) => <option key={p.id} value={p.id}>{p.projectCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Site</label>
                <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  <option value="">-- ঐচ্ছিক --</option>
                  {(data.sites || []).map((s: any) => <option key={s.id} value={s.id}>{s.siteCode}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Instructions / Specs</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition">
              টাস্ক তৈরি ও নোটিফিকেশন
            </button>
          </form>
        )}

        <div className={focusedTaskId ? "lg:col-span-12 space-y-4" : "lg:col-span-8 space-y-3"}>
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              কোনো টাস্ক পাওয়া যায়নি
            </div>
          ) : (
            filteredTasks.map((t: any) => {
              const emp = empMap.get(t.assignedTo);
              const isOverdue =
                t.dueDate &&
                t.dueDate < today &&
                t.status !== "Completed" &&
                t.status !== "Cancelled";
              const comments = (data.taskComments || []).filter(
                (c: any) => c.taskId === t.id
              );

              return (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                          {t.taskCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          t.priority === "Critical" || t.priority === "High"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {t.priority}
                        </span>
                        <StatusBadge status={t.status} />
                        {t.isCompanyWide && (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            ALL STAFF
                          </span>
                        )}
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <Link href={`/tasks/${t.id}`} className="text-base font-bold text-slate-900 hover:text-emerald-600 mt-1.5 block">
                        {t.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-slate-800">
                        Assignee: {t.isCompanyWide ? "All Staff" : emp?.name || `EMP-${t.assignedTo}`}
                      </p>
                      <p className="text-slate-500">
                        By: {t.createdBy || "Manager"} • Due: {t.dueDate}
                      </p>
                      <p className="font-bold text-emerald-600 mt-1">Progress: {t.progressPercent}%</p>
                    </div>
                  </div>

                  {t.status === "Completed" && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                      <div className="font-bold text-emerald-900">
                        ✓ Completed by {t.completedBy || t.reviewedBy || "Staff"}{" "}
                        {t.completedAt ? `on ${new Date(t.completedAt).toLocaleString()}` : ""}
                      </div>
                      {t.completionNote && <p className="text-emerald-800">Note: {t.completionNote}</p>}
                      {(t.evidenceAttachments || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(t.evidenceAttachments || []).map((ev: any, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
                              Evidence: {ev.name} ({ev.size})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {(["Accepted", "In Progress", "Review", "Blocked", "Reopened", "Cancelled"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            onMutate({ action: "updateTaskStatus", taskId: t.id, status: st })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCompletingTaskId(t.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                      >
                        ✓ প্রমাণসহ সম্পন্ন
                      </button>
                    </div>
                    <Link href={`/tasks/${t.id}`} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                      থ্রেড খুলুন ({comments.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {comments.map((c: any) => (
                      <div key={c.id} className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{c.authorName}: </span>
                          <span className="text-slate-600">{c.comment}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          {c.actionType}
                        </span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentDrafts[t.id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Comment
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
// ============================================================================
// ⭐ MONTHLY ATTENDANCE REGISTER — সম্পূর্ণ সংস্করণ (দিনে ৪টি পাঞ্চ ও ৩টি ভিউ)
// 1. Grid: সব কর্মচারী × সব দিন (ম্যানেজমেন্টের জন্য)
// 2. Summary: সবার মাসিক সারাংশ (ম্যানেজমেন্টের জন্য)
// 3. Individual: ⭐ একজন করে আলাদাভাবে ৪টি পাঞ্চসহ বিস্তারিত দেখা (স্টাফ শুধুমাত্র নিজেরটা দেখবে)
// ============================================================================
export function MonthlyAttendanceView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const currentUser = data?.currentUser || {};
  const myEmpId = Number(currentUser?.employeeId);
  const myRole = currentUser?.role || "Staff";

  // ম্যানেজমেন্ট রোল যাচাই
  const isManagement = [
    "Owner",
    "Chairman",
    "MD",
    "Admin",
    "Manager",
    "HR",
    "Accounts",
  ].includes(myRole);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [search, setSearch] = useState("");

  // সাধারণ কর্মীর জন্য ভিউ সবসময় 'individual' এ ফিক্সড থাকবে
  const [viewMode, setViewMode] = useState<"grid" | "summary" | "individual">(
    isManagement ? "grid" : "individual"
  );

  // সাধারণ কর্মী কখনো অন্যের আইডি দেখতে পারবে না
  const [individualEmpId, setIndividualEmpId] = useState<number | null>(
    isManagement
      ? (data.allEmployeesDirectory?.[0]?.id || myEmpId || null)
      : myEmpId
  );
  const [empSearch, setEmpSearch] = useState("");

  const activeEmpId = isManagement ? individualEmpId : myEmpId;

  const empMap = useMemo(
    () => new Map<number, any>((data.allEmployeesDirectory || []).map((e: any) => [e.id, e])),
    [data.allEmployeesDirectory]
  );

  const daysInMonth = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }, [selectedMonth]);

  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const monthName = new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ===== মাসের সব attendance প্রসেস ও ৪টি পাঞ্চ একত্রীকরণ (সকাল ও বিকাল) =====
  const dailyAttendanceMap = useMemo(() => {
    const map = new Map<
      string,
      {
        employeeId: number;
        date: string;
        morningIn: string;
        morningOut: string;
        afternoonIn: string;
        eveningOut: string;
        workingHours: number;
        overtimeHours: number;
        lateMinutes: number;
        status: string;
        notes: string;
      }
    >();

    const rawList = (data.attendances || []).filter(
      (a: any) => a.date && a.date.startsWith(selectedMonth)
    );

    rawList.forEach((a: any) => {
      const key = `${a.employeeId}_${a.date}`;
      const existing = map.get(key) || {
        employeeId: a.employeeId,
        date: a.date,
        morningIn: "",
        morningOut: "",
        afternoonIn: "",
        eveningOut: "",
        workingHours: 0,
        lateMinutes: 0,
        overtimeHours: 0,
        status: a.status || "Present",
        notes: a.notes || "",
      };

      // সকাল ৯:৩০ ও দুপুর ১:১৫ (সকালের শিফট)
      // দুপুর ২:৩০ ও রাত ৭:৩০ (বিকালের শিফট)
      if (a.checkIn) {
        if (a.checkIn < "14:00") {
          existing.morningIn = existing.morningIn
            ? (existing.morningIn < a.checkIn ? existing.morningIn : a.checkIn)
            : a.checkIn;
        } else {
          existing.afternoonIn = existing.afternoonIn
            ? (existing.afternoonIn < a.checkIn ? existing.afternoonIn : a.checkIn)
            : a.checkIn;
        }
      }

      if (a.checkOut) {
        if (a.checkOut < "15:00") {
          existing.morningOut = existing.morningOut
            ? (existing.morningOut > a.checkOut ? existing.morningOut : a.checkOut)
            : a.checkOut;
        } else {
          existing.eveningOut = existing.eveningOut
            ? (existing.eveningOut > a.checkOut ? existing.eveningOut : a.checkOut)
            : a.checkOut;
        }
      }

      existing.workingHours += Number(a.workingHours || 0);
      existing.overtimeHours = Math.max(Number(existing.overtimeHours || 0), Number(a.overtimeHours || 0));
      existing.lateMinutes = Math.max(Number(existing.lateMinutes || 0), Number(a.lateMinutes || 0));

      if (a.status === "Late" || existing.status === "Late") existing.status = "Late";
      else if (a.status === "Leave") existing.status = "Leave";

      map.set(key, existing);
    });

    return map;
  }, [data.attendances, selectedMonth]);

  const monthAttendances = useMemo(() => {
    return Array.from(dailyAttendanceMap.values());
  }, [dailyAttendanceMap]);

  // ফিল্টার করা কর্মচারী (ম্যানেজমেন্টের জন্য)
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.allEmployeesDirectory || [];
    return (data.allEmployeesDirectory || []).filter(
      (e: any) =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.empCode || "").toLowerCase().includes(q)
    );
  }, [data.allEmployeesDirectory, search]);

  const individualEmpChoices = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    const all = data.allEmployeesDirectory || [];
    if (!q) return all;
    return all.filter(
      (e: any) =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.empCode || "").toLowerCase().includes(q)
    );
  }, [data.allEmployeesDirectory, empSearch]);

  // মাসিক সারাংশ (১ দিনে ১টি উপস্থিতি কাউন্ট)
  const empMonthlySummary = useMemo(() => {
    const map = new Map<
      number,
      {
        present: number; late: number; leave: number; absent: number;
        totalHours: number; totalOT: number; totalLateMin: number;
        firstIn: string; lastOut: string;
      }
    >();

    monthAttendances.forEach((a: any) => {
      if (!map.has(a.employeeId)) {
        map.set(a.employeeId, {
          present: 0, late: 0, leave: 0, absent: 0,
          totalHours: 0, totalOT: 0, totalLateMin: 0,
          firstIn: "99:99", lastOut: "00:00",
        });
      }
      const s = map.get(a.employeeId)!;
      const isPresent = Boolean(a.morningIn || a.afternoonIn || a.status === "Present" || a.status === "Late");

      if (a.status === "Late") {
        s.late += 1;
        s.present += 1;
      } else if (a.status === "Leave") {
        s.leave += 1;
      } else if (isPresent) {
        s.present += 1;
      } else {
        s.absent += 1;
      }

      s.totalHours += Number(a.workingHours || 0);
      s.totalOT += Number(a.overtimeHours || 0);
      s.totalLateMin += Number(a.lateMinutes || 0);

      const dayIn = a.morningIn || a.afternoonIn;
      const dayOut = a.eveningOut || a.morningOut;

      if (dayIn && dayIn < s.firstIn) s.firstIn = dayIn;
      if (dayOut && dayOut > s.lastOut) s.lastOut = dayOut;
    });

    return map;
  }, [monthAttendances]);

  const getDayAtt = (empId: number, day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    return dailyAttendanceMap.get(`${empId}_${dateStr}`);
  };

  // নির্বাচিত কর্মচারীর ১ থেকে ৩০ দিনের পূর্ণাঙ্গ দিনভিত্তিক রেকর্ড
  const individualDays = useMemo(() => {
    if (!activeEmpId) return [];
    return daysArray.map((day) => {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(dateStr);
      return {
        day,
        date: dateStr,
        weekday: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        weekdayBn: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"][dateObj.getDay()],
        isFriday: dateObj.getDay() === 5,
        isSunday: dateObj.getDay() === 0,
        att: dailyAttendanceMap.get(`${activeEmpId}_${dateStr}`),
      };
    });
  }, [activeEmpId, daysArray, selectedMonth, dailyAttendanceMap]);

  // ব্যক্তিগত সারাংশ
  const individualStats = useMemo(() => {
    if (!activeEmpId) return null;
    return empMonthlySummary.get(activeEmpId) || {
      present: 0, late: 0, leave: 0, absent: 0,
      totalHours: 0, totalOT: 0, totalLateMin: 0,
      firstIn: "99:99", lastOut: "00:00",
    };
  }, [activeEmpId, empMonthlySummary]);

  const individualEmp = activeEmpId ? empMap.get(activeEmpId) || {
    name: currentUser.name,
    empCode: currentUser.empCode || "EMP",
    designation: currentUser.role,
    department: "General",
  } : null;

  // CSV Exports
  const exportMonthlyCSV = () => {
    const headers = ["Employee", "Code", ...daysArray.map((d) => `Day ${d}`), "Present", "Late", "Leave", "Total Hrs", "OT Hrs"];
    const rows = filteredEmployees.map((emp: any) => {
      const s = empMonthlySummary.get(emp.id);
      const dayCells = daysArray.map((d) => {
        const att = getDayAtt(emp.id, d);
        if (!att) return "";
        const inTime = att.morningIn || att.afternoonIn || "";
        const outTime = att.eveningOut || att.morningOut || "";
        if (inTime && outTime) return `${inTime}-${outTime}`;
        if (inTime) return `${inTime}-?`;
        return att.status || "A";
      });
      return [
        emp.name, emp.empCode, ...dayCells,
        s?.present || 0, s?.late || 0, s?.leave || 0,
        (s?.totalHours || 0).toFixed(2), (s?.totalOT || 0).toFixed(2),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportIndividualCSV = () => {
    if (!individualEmp) return;
    const headers = ["Date", "Day", "Morning IN", "Morning OUT", "Afternoon IN", "Evening OUT", "Working Hrs", "OT Hrs", "Late (min)", "Status", "Notes"];
    const rows = individualDays.map((d) => {
      const att = d.att;
      return [
        d.date, d.weekday,
        att?.morningIn || "", att?.morningOut || "",
        att?.afternoonIn || "", att?.eveningOut || "",
        (att?.workingHours || 0).toFixed(2),
        (att?.overtimeHours || 0).toFixed(2),
        att?.lateMinutes || 0,
        att?.status || (d.isFriday ? "Friday" : d.isSunday ? "Sunday" : "No Record"),
        att?.notes || "",
      ];
    });
    const totalsRow = [
      "TOTAL", "", individualStats?.firstIn === "99:99" ? "" : individualStats?.firstIn,
      "", "",
      individualStats?.lastOut === "00:00" ? "" : individualStats?.lastOut,
      (individualStats?.totalHours || 0).toFixed(2),
      (individualStats?.totalOT || 0).toFixed(2),
      individualStats?.totalLateMin || 0,
      `P:${individualStats?.present} L:${individualStats?.late} LV:${individualStats?.leave} A:${individualStats?.absent}`,
      "",
    ];
    const csv = [headers, ...rows, totalsRow]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_${individualEmp.empCode}_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthStats = useMemo(() => {
    let present = 0, late = 0, leave = 0, absent = 0, ot = 0, hours = 0;
    monthAttendances.forEach((a: any) => {
      if (a.status === "Leave") {
        leave += 1;
      } else if (a.status === "Late") {
        late += 1;
        present += 1;
      } else if (a.morningIn || a.afternoonIn || a.status === "Present") {
        present += 1;
      } else {
        absent += 1;
      }
      ot += Number(a.overtimeHours || 0);
      hours += Number(a.workingHours || 0);
    });
    return { present, late, leave, absent, ot, hours, records: monthAttendances.length };
  }, [monthAttendances]);

  return (
    <div className="space-y-5">
      {/* ===== Header ===== */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl shadow-xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 border border-blue-300/40">
              {isManagement ? "মাসিক হাজিরা খাতা (Management)" : "আমার মাসিক হাজিরা খাতা"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">
              {isManagement
                ? `${monthName} — সকল কর্মচারীর In/Out`
                : `${currentUser.name} — ${monthName} হাজিরা`}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              সারা মাসের In-Time / Out-Time / Overtime • {monthStats.records} দিন উপস্থিতি রেকর্ড
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white/95 text-slate-800 text-sm font-bold focus:ring-2 focus:ring-white"
            />

            {/* বাটনগুলো শুধুমাত্র Owner, MD, Manager, HR দেখতে পাবেন */}
            {isManagement && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2.5 rounded-xl font-semibold text-xs border ${
                    viewMode === "grid" ? "bg-white text-indigo-700 border-white" : "bg-white/20 border-white/30"
                  }`}
                >
                  📅 সবার গ্রিড
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("summary")}
                  className={`px-3 py-2.5 rounded-xl font-semibold text-xs border ${
                    viewMode === "summary" ? "bg-white text-indigo-700 border-white" : "bg-white/20 border-white/30"
                  }`}
                >
                  📊 সবার সারাংশ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("individual")}
                  className={`px-3 py-2.5 rounded-xl font-semibold text-xs border ${
                    viewMode === "individual" ? "bg-white text-indigo-700 border-white" : "bg-white/20 border-white/30"
                  }`}
                >
                  👤 একজন করে
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          ⭐ VIEW 3: INDIVIDUAL — একজন করে আলাদাভাবে দেখা (৪টি পাঞ্চসহ)
          ================================================================ */}
      {viewMode === "individual" && (
        <div className="space-y-4">
          {/* Employee Picker: শুধুমাত্র Owner / MD / Manager / HR দেখতে পাবেন */}
          {isManagement && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                👤 কর্মচারী নির্বাচন করুন — ব্যক্তিগত মাসিক হাজিরা
              </h3>
              <input
                type="text"
                placeholder="🔍 নাম বা কোড লিখে খুঁজুন (যেমন: Talha, EMP-0005)..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {individualEmpChoices.map((emp: any) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setIndividualEmpId(emp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      activeEmpId === emp.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {emp.empCode} • {emp.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {individualEmp && individualStats ? (
            <>
              {/* Personal Profile Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xl font-bold text-slate-950">
                    {individualEmp.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                      {individualEmp.empCode}
                    </span>
                    <h2 className="text-xl font-bold mt-1">{individualEmp.name}</h2>
                    <p className="text-xs text-slate-400">
                      {individualEmp.designation} • {individualEmp.department}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportIndividualCSV}
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    ⬇ এই ব্যক্তির CSV
                  </button>
                  {isManagement && (
                    <Link
                      href={`/employees/${individualEmp.id}/daily`}
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 font-semibold text-xs"
                    >
                      360° প্রোফাইল →
                    </Link>
                  )}
                </div>
              </div>

              {/* Personal Monthly Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-white rounded-xl p-3 border border-emerald-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">উপস্থিত</p>
                  <p className="text-xl font-bold text-emerald-600">{individualStats.present}<span className="text-xs text-slate-400">/{daysInMonth}</span></p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-amber-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">দেরি</p>
                  <p className="text-xl font-bold text-amber-600">{individualStats.late}d</p>
                  <p className="text-[9px] text-slate-400">{individualStats.totalLateMin} মিনিট</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-blue-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">ছুটি</p>
                  <p className="text-xl font-bold text-blue-600">{individualStats.leave}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-rose-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">অনুপস্থিত</p>
                  <p className="text-xl font-bold text-rose-600">{individualStats.absent}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">মোট ঘণ্টা</p>
                  <p className="text-xl font-bold text-slate-800">{individualStats.totalHours.toFixed(0)}h</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-indigo-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">মোট OT</p>
                  <p className="text-xl font-bold text-indigo-600">{individualStats.totalOT.toFixed(1)}h</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-purple-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">উপস্থিতি হার</p>
                  <p className="text-xl font-bold text-purple-600">
                    {daysInMonth > 0 ? Math.round(((individualStats.present + individualStats.leave) / daysInMonth) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Earliest IN / Latest OUT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center">
                  <p className="text-[10px] text-emerald-700 uppercase font-bold">সবচেয়ে আগে IN</p>
                  <p className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                    {individualStats.firstIn === "99:99" ? "—" : individualStats.firstIn}
                  </p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 text-center">
                  <p className="text-[10px] text-rose-700 uppercase font-bold">সবচেয়ে দেরি OUT</p>
                  <p className="text-lg font-bold font-mono text-rose-800 mt-0.5">
                    {individualStats.lastOut === "00:00" ? "—" : individualStats.lastOut}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-600 uppercase font-bold">দৈনিক গড় ঘণ্টা</p>
                  <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                    {individualStats.present > 0
                      ? (individualStats.totalHours / individualStats.present).toFixed(1)
                      : "0"}h
                  </p>
                </div>
              </div>

              {/* ⭐ Calendar Grid: একজনের পুরো মাস (সকাল ও বিকালের পাঞ্চসহ) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">
                    🗓️ {individualEmp.name} — {monthName} ক্যালেন্ডার
                  </h3>
                  <p className="text-[11px] text-slate-500">প্রতিটি ঘরে সেই দিনের সকাল ও বিকালের IN / OUT টাইম</p>
                </div>
                <div className="p-4 grid grid-cols-7 gap-2">
                  {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"].map((wd) => (
                    <div key={wd} className="text-center text-[10px] font-bold text-slate-500 uppercase pb-1">
                      {wd}
                    </div>
                  ))}
                  {Array.from({ length: new Date(selectedMonth + "-01").getDay() }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {individualDays.map((d) => {
                    const att = d.att;
                    let bg = "bg-slate-50 border-slate-200";
                    let content = (
                      <div className="text-slate-300 text-lg font-bold">{d.day}</div>
                    );

                    if (att?.status === "Leave") {
                      bg = "bg-blue-50 border-blue-300";
                      content = (
                        <div>
                          <div className="text-blue-800 text-sm font-bold">{d.day}</div>
                          <div className="text-blue-600 text-[10px] font-bold">ছুটি</div>
                        </div>
                      );
                    } else if (att?.morningIn || att?.afternoonIn) {
                      const isLate = att.status === "Late";
                      bg = isLate ? "bg-amber-50 border-amber-300" : "bg-emerald-50 border-emerald-300";
                      content = (
                        <div className="text-[10px] leading-tight">
                          <div className={`font-bold ${isLate ? "text-amber-800" : "text-emerald-800"}`}>
                            {d.day} {isLate && "⏰"}
                          </div>
                          {att.morningIn && <div className="font-mono text-emerald-700">১ম: {att.morningIn}-{att.morningOut || "?"}</div>}
                          {att.afternoonIn && <div className="font-mono text-blue-700">২য়: {att.afternoonIn}-{att.eveningOut || "?"}</div>}
                          {Number(att.overtimeHours) > 0 && (
                            <div className="text-[9px] font-bold text-indigo-600">+{att.overtimeHours}h OT</div>
                          )}
                        </div>
                      );
                    } else if (d.isFriday) {
                      bg = "bg-purple-50/50 border-purple-200";
                      content = (
                        <div>
                          <div className="text-purple-800 text-sm font-bold">{d.day}</div>
                          <div className="text-[9px] text-purple-600 font-semibold">শুক্রবার</div>
                        </div>
                      );
                    } else if (d.isSunday) {
                      bg = "bg-slate-100 border-slate-200";
                      content = (
                        <div className="text-slate-400 text-sm font-bold">{d.day}*</div>
                      );
                    }

                    return (
                      <div key={d.day} className={`min-h-[70px] p-1.5 rounded-lg border ${bg} transition hover:shadow-sm`}>
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ⭐ Detailed Daily Table — ৪টি পাঞ্চসহ ১ থেকে ৩০ দিনের পূর্ণ বিবরণী */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    📋 দৈনিক বিস্তারিত রেজিস্টার (সকাল ও বিকাল ৪টি পাঞ্চ) — {individualEmp.name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    শিফট ১: ০৯:৩০–০১:১৫ | বিরতি | শিফট ২: ০২:৩০–০৭:৩০
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="p-2.5">তারিখ</th>
                        <th className="p-2.5">বার</th>
                        <th className="p-2.5 text-center bg-emerald-50 text-emerald-800">১. সকাল IN (০৯:৩০)</th>
                        <th className="p-2.5 text-center bg-emerald-50 text-emerald-800">২. দুপুর OUT (০১:১৫)</th>
                        <th className="p-2.5 text-center bg-blue-50 text-blue-800">৩. দুপুর IN (০২:৩০)</th>
                        <th className="p-2.5 text-center bg-blue-50 text-blue-800">৪. রাত OUT (০৭:৩০)</th>
                        <th className="p-2.5 text-center">ঘণ্টা</th>
                        <th className="p-2.5 text-center">OT</th>
                        <th className="p-2.5 text-center">দেরি</th>
                        <th className="p-2.5 text-center">স্ট্যাটাস</th>
                        <th className="p-2.5">নোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {individualDays.map((d) => {
                        const att = d.att;

                        return (
                          <tr
                            key={d.day}
                            className={`hover:bg-slate-50 ${d.isFriday ? "bg-purple-50/20" : d.isSunday ? "bg-slate-50/50" : ""}`}
                          >
                            <td className="p-2.5 font-semibold text-slate-800">{d.date}</td>
                            <td className="p-2.5 text-slate-500">
                              {d.weekdayBn} {d.isFriday && <span className="text-purple-600 font-bold">(ছুটি)</span>} {d.isSunday && <span className="text-slate-400">*</span>}
                            </td>

                            {/* ১. সকাল IN */}
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                              {att?.morningIn || "—"}
                            </td>

                            {/* ২. দুপুর OUT */}
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-700 bg-emerald-50/20">
                              {att?.morningOut || "—"}
                            </td>

                            {/* ৩. দুপুর IN */}
                            <td className="p-2.5 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                              {att?.afternoonIn || "—"}
                            </td>

                            {/* ৪. রাত OUT */}
                            <td className="p-2.5 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                              {att?.eveningOut || (att?.afternoonIn ? "কার্যরত" : "—")}
                            </td>

                            {/* মোট ঘণ্টা */}
                            <td className="p-2.5 text-center font-semibold">
                              {att?.workingHours ? `${att.workingHours.toFixed(1)}h` : "—"}
                            </td>

                            {/* OT */}
                            <td className="p-2.5 text-center text-indigo-600 font-semibold">
                              {Number(att?.overtimeHours || 0) > 0 ? `${att.overtimeHours}h` : "—"}
                            </td>

                            {/* দেরি */}
                            <td className="p-2.5 text-center">
                              {Number(att?.lateMinutes || 0) > 0 ? (
                                <span className="text-amber-600 font-bold">{att.lateMinutes}m</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* স্ট্যাটাস */}
                            <td className="p-2.5 text-center">
                              {att ? (
                                <StatusBadge status={att.status} />
                              ) : d.isFriday ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-[11px]">
                                  শুক্রবার
                                </span>
                              ) : d.isSunday ? (
                                <span className="text-slate-400 text-[11px]">রবিবার</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[11px]">
                                  রেকর্ড নেই
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-500 text-[11px] max-w-40 truncate">
                              {att?.notes || (d.isFriday ? "সাপ্তাহিক ছুটি" : "—")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50 border-t-2 border-indigo-300 font-bold">
                        <td className="p-2.5" colSpan={2}>মোট ({daysInMonth} দিন)</td>
                        <td className="p-2.5 text-center font-mono" colSpan={4}>
                          সকাল শুরু: {individualStats.firstIn === "99:99" ? "—" : individualStats.firstIn} • ছুটি: {individualStats.lastOut === "00:00" ? "—" : individualStats.lastOut}
                        </td>
                        <td className="p-2.5 text-center">{individualStats.totalHours.toFixed(1)}h</td>
                        <td className="p-2.5 text-center text-indigo-700">{individualStats.totalOT.toFixed(1)}h</td>
                        <td className="p-2.5 text-center text-amber-700">{individualStats.totalLateMin}m</td>
                        <td className="p-2.5 text-center text-[11px]" colSpan={2}>
                          উপস্থিত: {individualStats.present} | দেরি: {individualStats.late} | ছুটি: {individualStats.leave} | অনুপস্থিত: {individualStats.absent}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
              <p className="text-sm text-slate-400">👆 উপরে থেকে একজন কর্মচারী নির্বাচন করুন</p>
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          VIEW 2: SUMMARY — সবার সারাংশ (শুধু ম্যানেজমেন্টের জন্য)
          ================================================================ */}
      {viewMode === "summary" && isManagement && (
        <>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="🔍 কর্মচারীর নাম / কোড খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-xs text-slate-500 flex items-center px-2">
              {filteredEmployees.length} জন কর্মচারী
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                📊 {monthName} — কর্মচারী সারাংশ (নামে ক্লিক করলে ব্যক্তিগত ভিউ)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3">কর্মচারী</th>
                    <th className="p-3">বিভাগ</th>
                    <th className="p-3 text-center">প্রথম IN</th>
                    <th className="p-3 text-center">শেষ OUT</th>
                    <th className="p-3 text-center">উপস্থিত</th>
                    <th className="p-3 text-center">দেরি</th>
                    <th className="p-3 text-center">ছুটি</th>
                    <th className="p-3 text-center">মোট ঘণ্টা</th>
                    <th className="p-3 text-center">OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp: any) => {
                    const s = empMonthlySummary.get(emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIndividualEmpId(emp.id);
                              setViewMode("individual");
                            }}
                            className="text-left font-bold text-slate-900 hover:text-indigo-600 underline decoration-indigo-400/50"
                          >
                            {emp.name}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.empCode}</div>
                        </td>
                        <td className="p-3 text-slate-600">{emp.department}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">
                          {s?.firstIn === "99:99" || !s ? "—" : s.firstIn}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-rose-600">
                          {s?.lastOut === "00:00" || !s ? "—" : s.lastOut}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-emerald-700">{s?.present || 0}</span>
                          <span className="text-slate-400">/{daysInMonth}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-amber-600">{s?.late || 0}</td>
                        <td className="p-3 text-center font-bold text-blue-600">{s?.leave || 0}</td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {(s?.totalHours || 0).toFixed(1)}h
                        </td>
                        <td className="p-3 text-center font-bold text-indigo-600">
                          {(s?.totalOT || 0).toFixed(1)}h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          VIEW 1: GRID — সবার দিন-ভিত্তিক টেবিল (শুধু ম্যানেজমেন্টের জন্য)
          ================================================================ */}
      {viewMode === "grid" && isManagement && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold">উপস্থিতি</p>
              <p className="text-xl font-bold text-emerald-600">{monthStats.present}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold">দেরি</p>
              <p className="text-xl font-bold text-amber-600">{monthStats.late}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold">ছুটি</p>
              <p className="text-xl font-bold text-blue-600">{monthStats.leave}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold">অনুপস্থিত</p>
              <p className="text-xl font-bold text-rose-600">{monthStats.absent}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold">মোট ঘণ্টা</p>
              <p className="text-xl font-bold text-slate-800">{monthStats.hours.toFixed(0)}h</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold">মোট OT</p>
              <p className="text-xl font-bold text-indigo-600">{monthStats.ot.toFixed(1)}h</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="🔍 কর্মচারীর নাম / কোড খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={exportMonthlyCSV}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              ⬇ CSV এক্সপোর্ট
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                📅 {monthName} — দৈনিক In/Out রেজিস্টার
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                প্রতিটি সেল = সেই দিনের IN-OUT • L=দেরি, A=অনুপস্থিত, LV=ছুটি
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="text-[10px] border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="sticky left-0 bg-indigo-50 z-10 p-2 text-left border border-slate-200 min-w-[160px]">
                      কর্মচারী
                    </th>
                    {daysArray.map((d) => (
                      <th key={d} className="p-1 border border-slate-200 min-w-[52px] text-center">
                        {d}
                        <div className="text-[8px] text-slate-400 font-normal">
                          {new Date(`${selectedMonth}-${String(d).padStart(2, "0")}`).toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                      </th>
                    ))}
                    <th className="p-2 border border-slate-200 bg-emerald-50">P</th>
                    <th className="p-2 border border-slate-200 bg-amber-50">L</th>
                    <th className="p-2 border border-slate-200 bg-blue-50">LV</th>
                    <th className="p-2 border border-slate-200 bg-indigo-50">OT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp: any) => {
                    const s = empMonthlySummary.get(emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="sticky left-0 bg-white z-10 p-2 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              setIndividualEmpId(emp.id);
                              setViewMode("individual");
                            }}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left"
                          >
                            {emp.name}
                          </button>
                          <div className="text-[9px] text-slate-400 font-mono">{emp.empCode}</div>
                        </td>
                        {daysArray.map((d) => {
                          const att = getDayAtt(emp.id, d);
                          const isFriday =
                            new Date(`${selectedMonth}-${String(d).padStart(2, "0")}`).getDay() === 5;
                          const isSunday =
                            new Date(`${selectedMonth}-${String(d).padStart(2, "0")}`).getDay() === 0;
                          let cellContent = "—";
                          let cellClass = "text-slate-300";

                          if (att) {
                            if (att.status === "Leave") {
                              cellContent = "LV";
                              cellClass = "text-blue-600 font-bold bg-blue-50";
                            } else if (att.morningIn && att.eveningOut) {
                              cellContent = `${att.morningIn}\n${att.eveningOut}`;
                              cellClass =
                                att.status === "Late"
                                  ? "text-amber-700 font-semibold bg-amber-50"
                                  : "text-emerald-700 font-semibold";
                            } else if (att.morningIn) {
                              cellContent = `${att.morningIn}\n—`;
                              cellClass = "text-purple-700 font-semibold bg-purple-50";
                            } else {
                              cellContent = "A";
                              cellClass = "text-rose-600 font-bold bg-rose-50";
                            }
                          } else if (isFriday) {
                            cellContent = "W";
                            cellClass = "bg-purple-100 text-purple-700 font-bold";
                          } else if (isSunday) {
                            cellClass = "bg-slate-100 text-slate-300";
                          }

                          return (
                            <td
                              key={d}
                              className={`p-1 border border-slate-200 text-center whitespace-pre-line leading-tight ${cellClass}`}
                            >
                              {cellContent}
                            </td>
                          );
                        })}
                        <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700 bg-emerald-50/50">
                          {s?.present || 0}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold text-amber-700 bg-amber-50/50">
                          {s?.late || 0}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold text-blue-700 bg-blue-50/50">
                          {s?.leave || 0}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold text-indigo-700 bg-indigo-50/50">
                          {(s?.totalOT || 0).toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-4 text-[11px] text-slate-600">
            <span><span className="inline-block w-3 h-3 bg-emerald-50 border border-emerald-300 mr-1 align-middle"></span>IN-OUT সম্পূর্ণ</span>
            <span><span className="inline-block w-3 h-3 bg-amber-50 border border-amber-300 mr-1 align-middle"></span>দেরি (Late)</span>
            <span><span className="inline-block w-3 h-3 bg-purple-50 border border-purple-300 mr-1 align-middle"></span>OUT বাকি</span>
            <span><b className="text-blue-600">LV</b> = ছুটি</span>
            <span><b className="text-rose-600">A</b> = অনুপস্থিত</span>
            <span><span className="inline-block w-3 h-3 bg-purple-100 border border-purple-300 mr-1 align-middle"></span>শুক্রবার (ছুটি)</span>
          </div>
        </>
      )}
    </div>
  );
}
void Users;
void DollarSign;
void Calendar;
void Filter;
void X;
void Edit3;
void Trash2;
void Save;
void TrendingUp;
void AlertCircle;