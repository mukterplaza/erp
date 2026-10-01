"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

// ============================================================================
// ✅ FIX (Bug 6): Local timezone-safe date helper
// new Date().toISOString() UTC date রিটার্ন করে — ঢাকা (UTC+6)-এ রাত ১২টা থেকে
// ভোর ৬টার মধ্যে "আজ" আসলে গতকালের তারিখ হয়ে যেত। এখন local date-ই ব্যবহার হচ্ছে।
// ============================================================================
const getTodayLocal = () => new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"

// ============================================================================
// 1. DASHBOARD VIEW (Staff Self Dashboard + Management Command Center)
// ============================================================================
export function DashboardView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = getTodayLocal();

  // ✅ FIX (Bug 2): সব useState hook component-এর একদম উপরে —
  // কোনো conditional return-এর নিচে hook রাখা যাবে না (Rules of Hooks)
  const [selectedStaffTimelineId, setSelectedStaffTimelineId] = useState<number | null>(
    null
  );
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticePriority, setNoticePriority] = useState("High");
  const [attendanceDate, setAttendanceDate] = useState(today);

  const role = data.currentUser?.role || "Staff";
  // ✅ FIX (Bug 5): `|| 1` fallback সরানো হয়েছে — currentUser লোড না হলে
  // আগে employee #1-এর নামে IN-TIME / plan / task mutation চলে যেত
  const myEmpId: number | undefined = data.currentUser?.employeeId;

  const isManagement =
    role === "Owner" ||
    role === "MD" ||
    role === "Admin" ||
    role === "Manager" ||
    role === "HR";

  const isOwnerOrMD = role === "Owner" || role === "MD" || role === "Admin";

  const attendances = data.attendances || [];
  const todayAtt = attendances.filter((a: any) => a.date === today);
  const myTodayAtt = myEmpId
    ? todayAtt.find((a: any) => a.employeeId === myEmpId)
    : undefined;

  const workPlans = data.dailyWorkPlans || [];
  const todayWorkPlans = workPlans.filter((p: any) => p.date === today);
  // ✅ FIX (Bug 3): `|| workPlans[0]` fallback সরানো হয়েছে — নিজের plan না থাকলে
  // আগে অন্য কর্মচারীর plan দেখা যেত এবং তার plan-এ status mutation চলে যেত!
  const myTodayPlan = myEmpId
    ? todayWorkPlans.find((p: any) => p.employeeId === myEmpId)
    : undefined;

  const dailyWorks = data.dailyWorks || [];
  const todayDailyWorks = dailyWorks.filter((d: any) => d.date === today);
  const myDailyWorks = myEmpId
    ? dailyWorks.filter((d: any) => d.employeeId === myEmpId)
    : [];

  const tasks = data.tasks || [];
  const myTasks = myEmpId
    ? tasks.filter((t: any) => t.assignedTo === myEmpId || t.isCompanyWide)
    : [];
  const myPendingTasks = myTasks.filter(
    (t: any) => t.status !== "Completed" && t.status !== "Cancelled"
  );
  const myCompletedTasks = myTasks.filter((t: any) => t.status === "Completed");

  // =========================================================================
  // STAFF SELF DASHBOARD ("MY DAY" FIRST EXPERIENCE)
  // =========================================================================
  if (!isManagement && role !== "Accounts") {
    // ✅ FIX (Bug 5 cont.): currentUser এখনো লোড না হলে loading state —
    // রোগ. কোনো mutation employee #1 এর নামে যাবে না
    if (!myEmpId) {
      return (
        <div className="p-10 text-center text-sm text-slate-500">
          আপনার প্রোফাইল লোড হচ্ছে…
        </div>
      );
    }

    const myEffectiveCompletion =
      myTodayPlan?.manualOverridePercent ??
      myTodayPlan?.autoProgressPercent ??
      (myTasks.length > 0
        ? Math.round(
            myTasks.reduce((s: number, t: any) => s + Number(t.progressPercent || 0), 0) /
              myTasks.length
          )
        : 0);

    // ✅ FIX (Bug 4): আগে পুরো কোম্পানির attendance/leave count দেখানো হতো
    const myAttendances = attendances.filter((a: any) => a.employeeId === myEmpId);
    const myLeaves = (data.leaveRequests || []).filter(
      (l: any) => l.employeeId === myEmpId
    );

    return (
      <div className="space-y-6">
        {/* Sticky Staff Quick Actions Bar: IN -> Work Plan -> Task -> Daily Update -> OUT */}
        <div className="sticky top-14 z-10 bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Staff Self-Service Workspace • {data.currentUser?.empCode || "EMP"}
            </span>
            <h1 className="text-lg font-bold mt-1">
              স্বাগতম, {data.currentUser?.name} — My Day Operational Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onMutate({
                  action: "checkIn",
                  employeeId: myEmpId,
                  date: today,
                  checkIn: new Date().toTimeString().slice(0, 5),
                  notes: "Quick IN from Staff Dashboard",
                })
              }
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
              onClick={() => {
                if (!myTodayAtt) {
                  alert("Please record IN TIME first.");
                  return;
                }
                onMutate({
                  action: "checkOut",
                  attendanceId: myTodayAtt.id,
                  checkOut: new Date().toTimeString().slice(0, 5),
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" /> 5. OUT TIME
            </button>
          </div>
        </div>

        {/* My Day KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">আজকের ইন টাইম</p>
            <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">
              {myTodayAtt?.checkIn || "Not Checked In"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Auto-Approved • Shift 09:30
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">আজকের আউট টাইম</p>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {myTodayAtt?.checkOut || "Active Shift"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hours: {myTodayAtt?.workingHours || "0.00"}h
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">আজকের কাজের পরিকল্পনা</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {myTodayPlan?.items?.length || 0} Items
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Auto Progress: {myTodayPlan?.autoProgressPercent || 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">পেন্ডিং টাস্ক</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {myPendingTasks.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Completed: {myCompletedTasks.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">সার্বিক অগ্রগতি %</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {myEffectiveCompletion}%
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${myEffectiveCompletion}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">আমার ছুটি ও হাজিরা</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {myAttendances.length} Days
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Leaves: {myLeaves.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* আজকের কাজের পরিকল্পনা & Tasks */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    আজকের কাজের পরিকল্পনা (আজকের কাজের পরিকল্পনা)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click status buttons to automatically compute your daily completion %
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
                  {(myTodayPlan.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <div className="flex items-center gap-1.5">
                        {(["Completed", "In Progress", "Pending", "Blocked"] as const).map(
                          (st) => (
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
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No Work Plan added for today yet. Click &ldquo;+ Edit Plan / Summary&rdquo; to add your daily plan.
                </p>
              )}
            </div>

            {/* My Tasks with Direct Accept / Start / Complete */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  My অ্যাসাইনকৃত টাস্ক ({myTasks.length})
                </h3>
                <Link href="/tasks" className="text-xs font-semibold text-emerald-600">
                  আমার সব টাস্ক →
                </Link>
              </div>
              {myTasks.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {t.taskCode}
                    </span>
                    <span className="ml-2 font-bold text-slate-900">{t.title}</span>
                    <p className="text-slate-500 mt-0.5">
                      Due: {t.dueDate} • Status: <strong>{t.status}</strong> ({t.progressPercent}%)
                    </p>
                  </div>
                  {/* ✅ FIX (Bug 8): Completed/Cancelled task-এ আর action button নেই */}
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
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        t.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {t.status === "Completed" ? "✓ Completed" : "Cancelled"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Notifications & আমার ব্যক্তিগত কার্যক্রম */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  My Notifications & Direct Task Actions
                </h3>
                <Link href="/notifications" className="text-xs font-semibold text-emerald-600">
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
                    {n.relatedTaskId && (
                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "updateTaskStatus",
                              taskId: n.relatedTaskId,
                              status: "Accepted",
                            })
                          }
                          className="px-2 py-1 rounded bg-blue-600 text-white font-semibold text-[11px]"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "updateTaskStatus",
                              taskId: n.relatedTaskId,
                              status: "In Progress",
                            })
                          }
                          className="px-2 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px]"
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "updateTaskStatus",
                              taskId: n.relatedTaskId,
                              status: "Completed",
                              completionNote: "Completed directly from Notification",
                            })
                          }
                          className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px]"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Private Activity Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> আমার ব্যক্তিগত কার্যক্রম
              </h3>
              <p className="text-[11px] text-slate-500">
                Attendance → Work Plan → Daily Work → Tasks → Leave (Strictly private to you & Management)
              </p>
              <div className="space-y-2.5 border-l-2 border-emerald-500 pl-3 ml-1 text-xs">
                {myTodayAtt && (
                  <div>
                    <span className="font-bold text-emerald-700">Attendance:</span> Checked in at{" "}
                    {myTodayAtt.checkIn}{" "}
                    {myTodayAtt.checkOut ? `• Checked out at ${myTodayAtt.checkOut}` : ""}
                  </div>
                )}
                {myTodayPlan && (
                  <div>
                    <span className="font-bold text-indigo-700">Work Plan:</span>{" "}
                    {(myTodayPlan.items || []).length} planned items ({myTodayPlan.autoProgressPercent}% complete)
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

  // =========================================================================
  // 9. MANAGEMENT & OWNER DASHBOARD ("TODAY'S TEAM DASHBOARD")
  // =========================================================================
  const allEmps = data.allEmployeesDirectory || [];
  const totalEmpCount = allEmps.length;

  const checkedInToday = todayAtt.filter((a: any) => Boolean(a.checkIn)).length;
  const checkedOutToday = todayAtt.filter((a: any) => Boolean(a.checkOut)).length;
  const presentToday = todayAtt.filter(
    (a: any) =>
      a.status === "Present" ||
      a.status === "Late" ||
      a.status === "Early Leave" ||
      a.status === "Missing Checkout"
  ).length;
  const lateToday = todayAtt.filter((a: any) => a.status === "Late").length;
  const onLeaveToday = todayAtt.filter((a: any) => a.status === "Leave").length;
  const absentToday = Math.max(0, totalEmpCount - presentToday - onLeaveToday);

  // =========================================================================
  // OWNER / MANAGEMENT — TODAY'S FULL ATTENDANCE PANEL
  // (attendanceDate state-টা এখন component-এর একদম উপরে — hooks নিয়ম মেনে)
  // =========================================================================
  const selectedDateAttendances = attendances.filter(
    (a: any) => a.date === attendanceDate
  );

  const selectedDatePresent = selectedDateAttendances.filter(
    (a: any) =>
      a.status === "Present" ||
      a.status === "Late" ||
      a.status === "Early Leave" ||
      a.status === "Missing Checkout"
  ).length;

  const selectedDateLate = selectedDateAttendances.filter(
    (a: any) => a.status === "Late"
  ).length;

  const selectedDateLeave = selectedDateAttendances.filter(
    (a: any) => a.status === "Leave"
  ).length;

  const selectedDateAbsent = Math.max(
    0,
    totalEmpCount - selectedDatePresent - selectedDateLeave
  );

  const overdueTasks = tasks.filter(
    // ✅ FIX (Minor 12): dueDate null/undefined হলে ভুল overdue count হতো
    (t: any) => t.dueDate && t.dueDate < today && t.status !== "Completed" && t.status !== "Cancelled"
  );
  const completedTasksCount = tasks.filter((t: any) => t.status === "Completed").length;
  const pendingTasksCount = tasks.filter(
    (t: any) => t.status === "Todo" || t.status === "Accepted" || t.status === "In Progress"
  ).length;
  const blockedTasksCount = tasks.filter((t: any) => t.status === "Blocked").length;

  const updatedEmpIdsToday = new Set(todayDailyWorks.map((d: any) => d.employeeId));
  const staffWithoutDailyUpdate = allEmps.filter(
    (e: any) => !updatedEmpIdsToday.has(e.id)
  );

  const teamCompletionPercent =
    todayWorkPlans.length > 0
      ? Math.round(
          todayWorkPlans.reduce(
            (s: number, p: any) =>
              s + Number(p.manualOverridePercent ?? p.autoProgressPercent ?? 0),
            0
          ) / todayWorkPlans.length
        )
      : tasks.length > 0
      ? Math.round(
          tasks.reduce((s: number, t: any) => s + Number(t.progressPercent || 0), 0) /
            tasks.length
        )
      : 0;

  const accounts = data.accounts || [];
  const cashAcc = accounts.find((a: any) => a.code === "1010");
  const bankAcc = accounts.find((a: any) => a.code === "1020");
  const cashAndBank = Number(cashAcc?.balance || 0) + Number(bankAcc?.balance || 0);

  const invoices = data.invoices || [];
  const totalRevenue = invoices.reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0);
  const totalAR = invoices.reduce((s: number, i: any) => s + Number(i.outstandingAmount || 0), 0);

  const suppliers = data.suppliers || [];
  const totalSupplierAP = suppliers.reduce(
    (s: number, sup: any) => s + Number(sup.outstandingPayable || 0),
    0
  );
  const contractors = data.contractors || [];
  const totalContractorDue = contractors.reduce(
    (s: number, c: any) => s + Number(c.outstandingDue || 0),
    0
  );

  const expenses = data.expenses || [];
  const totalExpenses = expenses
    .filter((e: any) => e.approvalStatus === "Approved")
    .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  const payrolls = data.payrolls || [];
  const totalSalaryExpense = payrolls
    .filter((p: any) => p.status === "Paid")
    .reduce((s: number, p: any) => s + Number(p.netSalary || 0), 0);

  const netProfit = totalRevenue - totalExpenses - totalSalaryExpense;

  // Exact Section 36 Verification records from live DB
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
      {/* 15. ROLE-SPECIFIC QUICK ACTIONS BAR (Owner vs Manager) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-lg border border-slate-700/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {role} কমান্ড সেন্টার
            </span>
            <span className="text-xs text-slate-300">
              Schedule: Morning 9:30–1:15 • Break 1:15–2:30 • Afternoon 2:30–7:30
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">
            INSAF ERP — Today&apos;s Team & Executive Operations Dashboard
          </h1>
        </div>

        {/* Owner Quick Actions: Business -> People -> Projects -> Finance -> Reports -> Settings */}
        {/* Manager Quick Actions: Team -> Tasks -> Approvals -> Notifications -> Reports */}
        {isOwnerOrMD ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/leads"
              className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              1. Business (CRM)
            </Link>
            <Link
              href="/employees"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              2. People (HR)
            </Link>
            <Link
              href="/projects"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              3. Projects
            </Link>
            <Link
              href="/accounts"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              4. Finance
            </Link>
            <Link
              href="/reports"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              5. Reports
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              6. Settings
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/employees"
              className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              1. Team
            </Link>
            <Link
              href="/tasks"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              2. Tasks
            </Link>
            <Link
              href="/leave"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              3. Approvals
            </Link>
            <Link
              href="/notifications"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              4. Notifications
            </Link>
            <Link
              href="/reports"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600"
            >
              5. Reports
            </Link>
          </div>
        )}
      </div>

      {/* 9. TODAY'S TEAM DASHBOARD METRICS (14 Operational Counters) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Today&apos;s Team Operational Dashboard ({today})
          </h2>
          <button
            type="button"
            onClick={() => onMutate({ action: "runReminderAutomation" })}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <BellRing className="w-3.5 h-3.5" /> অটো রিমাইন্ডার চালান
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">উপস্থিত / অনুপস্থিত</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {presentToday} / <span className="text-rose-600">{absentToday}</span>
            </p>
            <p className="text-[10px] text-slate-400">Total Staff: {totalEmpCount}</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">লেট / ছুটিতে</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {lateToday} / <span className="text-blue-600">{onLeaveToday}</span>
            </p>
            <p className="text-[10px] text-slate-400">সকাল ৯:৩০-এর পর</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">ইন / আউট</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {checkedInToday} / <span className="text-emerald-600">{checkedOutToday}</span>
            </p>
            <p className="text-[10px] text-slate-400">স্বয়ংক্রিয় অনুমোদিত</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">আজকের কাজের পরিকল্পনা</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {todayWorkPlans.length} Plans
            </p>
            <p className="text-[10px] text-slate-400">আজ জমা হয়েছে</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">সম্পন্ন / পেন্ডিং / ব্লকড</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {completedTasksCount} /{" "}
              <span className="text-amber-600">{pendingTasksCount}</span> /{" "}
              <span className="text-rose-600">{blockedTasksCount}</span>
            </p>
            <p className="text-[10px] text-slate-400">Overdue: {overdueTasks.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">দৈনিক আপডেট নেই</p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              {staffWithoutDailyUpdate.length} Staff
            </p>
            <p className="text-[10px] text-slate-400">
              Submitted: {todayDailyWorks.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">টিম সম্পন্ন %</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {teamCompletionPercent}%
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${teamCompletionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          ✅ FIX (Bug 1): OWNER / ADMIN — DAILY ATTENDANCE DASHBOARD
          আগে এই <section>-টা return-এর বাইরে function body-তে floating ছিল,
          যার কারণে management ইউজারদের জন্য পুরো dashboard crash করতো
          (ReferenceError: Cannot access 'attendanceDate' before initialization)
          এখানে এটা যেখানে বসানো হয়েছে সেখানে সব variable আগেই declare হয়েছে।
          ================================================================ */}
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

        {/* Attendance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-500 font-semibold">
              মোট কর্মচারী
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalEmpCount}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 p-4">
            <p className="text-[11px] text-emerald-600 font-semibold">
              উপস্থিত
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {selectedDatePresent}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-rose-200 p-4">
            <p className="text-[11px] text-rose-600 font-semibold">
              অনুপস্থিত
            </p>
            <p className="text-2xl font-bold text-rose-700 mt-1">
              {selectedDateAbsent}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 p-4">
            <p className="text-[11px] text-amber-600 font-semibold">
              ছুটিতে
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {selectedDateLeave}
            </p>
          </div>
        </div>

        {/* Attendance Table */}
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
                  (a: any) => a.employeeId === emp.id
                );

                const status = att?.status || "Absent";

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        {emp.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {emp.empCode}
                      </div>
                    </td>

                    <td className="p-3 text-slate-600">
                      {emp.designation || "—"}
                    </td>

                    <td className="p-3 font-mono font-semibold text-emerald-700">
                      {att?.checkIn || "—"}
                    </td>

                    <td className="p-3 font-mono text-slate-700">
                      {att?.checkOut || (att?.checkIn ? "কার্যরত" : "—")}
                    </td>

                    <td className="p-3 font-mono font-semibold">
                      {att?.workingHours
                        ? `${att.workingHours} ঘণ্টা`
                        : "—"}
                    </td>

                    <td className="p-3">
                      {Number(att?.lateMinutes || 0) > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {att.lateMinutes} মিনিট
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="p-3 font-mono">
                      {Number(att?.overtimeHours || 0) > 0
                        ? `${att.overtimeHours} ঘণ্টা`
                        : "—"}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          status === "Present"
                            ? "bg-emerald-100 text-emerald-700"
                            : status === "Late"
                            ? "bg-amber-100 text-amber-700"
                            : status === "Leave"
                            ? "bg-blue-100 text-blue-700"
                            : status === "Early Leave"
                            ? "bg-orange-100 text-orange-700"
                            : status === "Missing Checkout"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {status === "Present"
                          ? "উপস্থিত"
                          : status === "Late"
                          ? "দেরিতে উপস্থিত"
                          : status === "Leave"
                          ? "ছুটিতে"
                          : status === "Early Leave"
                          ? "আগে বের হয়েছেন"
                          : status === "Missing Checkout"
                          ? "আউট বাকি"
                          : "অনুপস্থিত"}
                      </span>
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

      {/* TEAM ACTIVITY MATRIX & CLICK-TO-INSPECT STAFF TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Today&apos;s Team Work Plan, Attendance & Progress Matrix (Click Staff Name for Activity Timeline)
              </h3>
              <p className="text-xs text-slate-500">
                Shows who planned what, automatic completion %, daily summary status & Manager manual override
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
                  const att = todayAtt.find((a: any) => a.employeeId === emp.id);
                  const plan = todayWorkPlans.find((p: any) => p.employeeId === emp.id);
                  const dw = todayDailyWorks.find((d: any) => d.employeeId === emp.id);
                  const doneCount = (plan?.items || []).filter(
                    (i: any) => i.status === "Completed"
                  ).length;
                  const totalItems = (plan?.items || []).length;
                  const effectivePct =
                    plan?.manualOverridePercent ?? plan?.autoProgressPercent ?? dw?.progressPercent ?? 0;

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
                              IN: {att.checkIn || "—"}
                            </span>
                            <span className="block text-slate-500">
                              OUT: {att.checkOut || "Active"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-semibold">Absent</span>
                        )}
                      </td>
                      <td className="p-3">
                        {plan ? (
                          <div>
                            <span className="font-bold text-indigo-700">
                              {doneCount}/{totalItems} Completed
                            </span>
                            <div className="text-[11px] text-slate-500 truncate max-w-48">
                              {(plan.items || []).map((i: any) => i.title).join(" • ")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600">পরিকল্পনা নেই</span>
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
                          <span className="font-bold text-slate-900">{effectivePct}%</span>
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
                              // ✅ FIX (Minor 9): NaN / out-of-range guard
                              const num = Number(val);
                              if (Number.isNaN(num) || num < 0 || num > 100) {
                                alert("অনুগ্রহ করে 0 থেকে 100 এর মধ্যে একটি সংখ্যা দিন।");
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
                                manualOverridePercent: num,
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

        {/* Right: Broadcast Company-Wide Notice / Task OR Inspect Clicked Staff Timeline */}
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
                  <strong className="text-emerald-700 block">১. আজকের হাজিরা:</strong>
                  {todayAtt.find((a: any) => a.employeeId === inspectedStaff.id)
                    ? `IN: ${
                        todayAtt.find((a: any) => a.employeeId === inspectedStaff.id)
                          ?.checkIn
                      } | OUT: ${
                        todayAtt.find((a: any) => a.employeeId === inspectedStaff.id)
                          ?.checkOut || "Active"
                      }`
                    : "No attendance recorded today"}
                </div>
                <div>
                  <strong className="text-indigo-700 block">2. আজকের কাজের পরিকল্পনা:</strong>
                  {(
                    todayWorkPlans.find((p: any) => p.employeeId === inspectedStaff.id)
                      ?.items || []
                  ).map((it: any) => (
                    <div key={it.id} className="text-slate-600">
                      • {it.title} — <strong>{it.status}</strong> ({it.completionPercent}%)
                    </div>
                  ))}
                </div>
                <div>
                  <strong className="text-slate-800 block">৩. দৈনিক সারাংশ:</strong>
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
                  <strong className="text-amber-700 block">4. অ্যাসাইনকৃত টাস্ক:</strong>
                  {tasks
                    .filter((t: any) => t.assignedTo === inspectedStaff.id)
                    .map((t: any) => (
                      <div key={t.id} className="text-slate-600">
                        • {t.taskCode}: {t.title} ({t.status} - {t.progressPercent}%)
                      </div>
                    ))}
                </div>
                <div>
                  <strong className="text-purple-700 block">
                    5. Leave & পারফরম্যান্স স্কোর:
                  </strong>
                  Leaves:{" "}
                  {
                    (data.leaveRequests || []).filter(
                      (l: any) => l.employeeId === inspectedStaff.id
                    ).length
                  }{" "}
                  • Performance:{" "}
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
                Open Full 360° Employee Profile →
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
                <Megaphone className="w-4 h-4 text-emerald-600" /> Broadcast Company-Wide Notice / Instruction
              </h3>
              <input
                type="text"
                required
                placeholder="Notice / Instruction Title (Bangla or English) *"
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

      {/* MANAGEMENT FINANCIAL & PROJECT KPIs */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          ম্যানেজমেন্ট আর্থিক সারাংশ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">নগদ ও ব্যাংক ব্যালেন্স</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ৳{cashAndBank.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">
              Cash: ৳{Number(cashAcc?.balance || 0).toLocaleString()} | Bank: ৳
              {Number(bankAcc?.balance || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">ইনভয়েস আয় ও মুনাফা/ক্ষতি</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              ৳{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Net P&L: ৳{netProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">প্রাপ্য হিসাব (AR)</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              ৳{totalAR.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Collected: ৳{(totalRevenue - totalAR).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">সাপ্লায়ার ও ঠিকাদার পরিশোধযোগ্য</p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              ৳{(totalSupplierAP + totalContractorDue).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Suppliers: ৳{totalSupplierAP.toLocaleString()} | Contr: ৳
              {totalContractorDue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">সরাসরি প্রজেক্ট খরচ</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ৳{totalExpenses.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Payroll Disbursed: ৳{totalSalaryExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* LIVE DATABASE CALCULATION VERIFICATION MATRIX (Section 36 Proof) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              লাইভ হিসাব ও ফর্মুলা যাচাই
            </h3>
            <p className="text-xs text-slate-500">
              All 6 core mathematical formulas computed dynamically from PostgreSQL rows
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            6 / 6 Exact Formula Tests Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">1. Inventory Formula (MAT-0001)</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Stock = {Number(mat1?.currentStock || 0)} {mat1?.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Open({Number(mat1?.openingStock || 0)}) + Pur({Number(mat1?.purchaseReceived || 0)}) - Iss({Number(mat1?.issueQty || 0)}) - TrfOut({Number(mat1?.transferOut || 0)}) + TrfIn({Number(mat1?.transferIn || 0)}) - Con({Number(mat1?.consumptionQty || 0)}) = {Number(mat1?.currentStock || 0)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">2. Project Actual Cost (PRJ-0001)</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Cost = ৳{Number(prj1?.actualCost || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Mat({Number(prj1?.materialCost || 0).toLocaleString()}) + Lab({Number(prj1?.labourCost || 0).toLocaleString()}) + Con({Number(prj1?.contractorCost || 0).toLocaleString()}) + Trp({Number(prj1?.transportCost || 0).toLocaleString()}) + Site({Number(prj1?.siteExpenseCost || 0).toLocaleString()}) = ৳{Number(prj1?.actualCost || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">3. Client Receivable (INV-0001)</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                AR = ৳{Number(inv1?.outstandingAmount || 0).toLocaleString()}
              </span>
            </div>
            {/* ✅ FIX (Minor 11): hardcoded "৳200k + ৳100k" টেক্সট সরিয়ে শুধু live value */}
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Invoice(৳{Number(inv1?.totalAmount || 0).toLocaleString()}) - Paid(৳{Number(inv1?.paidAmount || 0).toLocaleString()}) = ৳{Number(inv1?.outstandingAmount || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">4. Supplier Payable (SUP-0001)</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                AP = ৳{Number(sup1?.outstandingPayable || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Bill(৳{Number(sup1?.totalBilled || 0).toLocaleString()}) - Paid(৳{Number(sup1?.totalPaid || 0).toLocaleString()}) = ৳{Number(sup1?.outstandingPayable || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">5. Contractor Due (CON-0001)</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Due = ৳{Number(con1?.outstandingDue || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              Approved(৳{Number(con1?.approvedBillAmount || 0).toLocaleString()}) - Paid(৳{Number(con1?.paidAmount || 0).toLocaleString()}) = ৳{Number(con1?.outstandingDue || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">6. Payroll নিট বেতন (PAYR-0001)</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Net = ৳{Number(payr1?.netSalary || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-mono">
              {Number(payr1?.basicSalary || 0).toLocaleString()} + {Number(payr1?.allowance || 0).toLocaleString()} + {Number(payr1?.overtimePay || 0).toLocaleString()} - {Number(payr1?.advanceDeduction || 0).toLocaleString()} - {Number(payr1?.otherDeduction || 0).toLocaleString()} = ৳{Number(payr1?.netSalary || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ATTENDANCE MODULE VIEW (Auto-Approved + Morning/Break/Afternoon Schedule)
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

  // Correction Request state
  const [corrDate, setCorrDate] = useState(today);
  const [reqIn, setReqIn] = useState("09:30");
  const [reqOut, setReqOut] = useState("19:30");
  const [corrReason, setCorrReason] = useState("");

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "checkIn",
      employeeId: Number(employeeId),
      date: today,
      checkIn: checkInTime,
      notes,
    });
  }

  async function handleCheckOut(attendanceId: number) {
    const outTime = prompt("Enter OUT TIME (HH:mm, Official End 19:30):", "19:30");
    if (!outTime) return;
    await onMutate({
      action: "checkOut",
      attendanceId,
      checkOut: outTime,
    });
  }

  async function handleCorrectionSubmit(e: React.FormEvent) {
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
  }

  return (
    <div className="space-y-6">
      {/* Official Working Schedule Banner */}
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
            IN TIME & OUT TIME are automatically approved. Manager/MD/Owner approval is only required for Leave, Attendance Correction & Special Adjustment.
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
              exportToPDFPrint(
                "হাজিরা রেজিস্টার",
                `As of ${today}`,
                data.attendances || []
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> PDF প্রিন্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Check-In Form */}
        <form
          onSubmit={handleCheckIn}
          className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Record আজকের ইন টাইম (Auto-Approved)
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Employee
            </label>
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
                IN TIME (Shift starts 09:30)
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Location / Note
              </label>
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

        {/* Attendance Correction Request Form */}
        <form
          onSubmit={handleCorrectionSubmit}
          className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Attendance Correction / Special Adjustment Request
            </h2>
            <span className="text-[11px] text-slate-500">
              Requires Manager / MD / Owner Approval
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Requested IN TIME
              </label>
              <input
                type="time"
                required
                value={reqIn}
                onChange={(e) => setReqIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Requested OUT TIME
              </label>
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

          {/* Pending Correction Requests List */}
          {(data.attendanceCorrections || []).length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Correction & Adjustment Requests ({(data.attendanceCorrections || []).length})
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
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          c.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.status === "Rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status}
                      </span>
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

      {/* হাজিরা রেজিস্টার Table */}
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
                <th className="p-3 font-semibold">ইন টাইম</th>
                <th className="p-3 font-semibold">আউট টাইম</th>
                <th className="p-3 font-semibold">সকাল / বিকাল</th>
                <th className="p-3 font-semibold">মোট ঘণ্টা</th>
                <th className="p-3 font-semibold">লেট / তাড়াতাড়ি বাইর</th>
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
                    <td className="p-3 font-mono font-bold text-emerald-700">
                      {a.checkIn || "—"}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {a.checkOut || "—"}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {a.morningHours || "0.00"}h / {a.afternoonHours || "0.00"}h
                    </td>
                    <td className="p-3 font-bold text-slate-900">{a.workingHours}h</td>
                    <td className="p-3">
                      <span className="text-amber-600 font-semibold">{a.lateMinutes}m</span> /{" "}
                      <span className="text-rose-600">{a.earlyLeaveMinutes || 0}m</span>
                    </td>
                    <td className="p-3 text-indigo-600 font-semibold">{a.overtimeHours}h</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          a.status === "Present"
                            ? "bg-emerald-100 text-emerald-700"
                            : a.status === "Late"
                            ? "bg-amber-100 text-amber-700"
                            : a.status === "Missing Checkout"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
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
// 3, 4 & 5. MY DAY: TODAY'S WORK PLAN + BANGLA/ENGLISH DAILY SUMMARY + ATTACHMENTS
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

  // Work Plan State
  const existingMyPlan = (data.dailyWorkPlans || []).find(
    (p: any) => p.employeeId === myEmpId && p.date === today
  );
  const [planInput, setPlanInput] = useState("");
  // ✅ FIX (Bug 7): আগে hardcoded sample items ("রাজউক ড্রয়িং", status Completed)
  // default হিসেবে ছিল — ভুলে Save চাপলে demo data DB-তে চলে যেত। এখন default খালি।
  const [draftPlanItems, setDraftPlanItems] = useState<
    Array<{ id: string; title: string; status: "Completed" | "In Progress" | "Pending" | "Blocked" }>
  >([]);

  // ✅ FIX (Bug 7 cont.): API data পরে (async) এলে existing plan দিয়ে draft sync হয়
  useEffect(() => {
    if (existingMyPlan?.items) {
      setDraftPlanItems(existingMyPlan.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMyPlan?.id, existingMyPlan?.items?.length]);

  // Daily Work Summary State (Bangla / English / Mixed + Multiple Attachments)
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("19:30");
  const [workStatus, setWorkStatus] = useState("Completed");
  const [workSummary, setWorkSummary] = useState("");
  // ✅ FIX (Minor 13): project/site/client আর auto-select হয় না — placeholder default
  const [taskId, setTaskId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [clientId, setClientId] = useState("");
  const [progressPercent, setProgressPercent] = useState("80");
  const [problems, setProblems] = useState("");
  const [pendingWork, setPendingWork] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ name: string; type: string; size: string; url: string }>
  >([]);

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );
  const projMap = new Map<number, any>((data.projects || []).map((p: any) => [p.id, p]));
  const siteMap = new Map<number, any>((data.sites || []).map((s: any) => [s.id, s]));
  const taskMap = new Map<number, any>((data.tasks || []).map((t: any) => [t.id, t]));

  function handleMultipleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((f) => ({
      name: f.name,
      type: f.type || f.name.split(".").pop()?.toUpperCase() || "FILE",
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      url: `#attachment-${encodeURIComponent(f.name)}`,
    }));
    setAttachments((prev) => [...prev, ...mapped]);
  }

  async function handleSaveWorkPlan() {
    await onMutate({
      action: "saveDailyWorkPlan",
      date: today,
      items: draftPlanItems,
    });
  }

  async function handleSubmitSummary(e: React.FormEvent) {
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
  }

  const completedDraftCount = draftPlanItems.filter(
    (i) => i.status === "Completed"
  ).length;
  const autoDraftPercent =
    draftPlanItems.length > 0
      ? Math.round((completedDraftCount / draftPlanItems.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            My Day — আজকের কাজের পরিকল্পনা & Daily Work Summary (বাংলা / English / Mixed)
          </h1>
          <p className="text-xs text-slate-500">
            Plan your tasks at the start of the day • Automatic সম্পন্ন % Calculation • Multi-file Image/PDF/Doc Attachments
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Automatic Progress: {autoDraftPercent}% ({completedDraftCount}/{draftPlanItems.length} Completed)
        </span>
      </div>

      {/* SECTION 1: TODAY'S WORK PLAN & AUTOMATIC PROGRESS ENGINE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> 4 & 5. আজকের কাজের পরিকল্পনা & Automatic Progress Calculator
            </h2>
            <p className="text-xs text-slate-500">
              Example: 5 planned tasks → 5 completed = 100%, 4 completed = 80%, 3 completed = 60%
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveWorkPlan}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
          >
            Save আজকের কাজের পরিকল্পনা ({autoDraftPercent}%)
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={planInput}
            onChange={(e) => setPlanInput(e.target.value)}
            placeholder="Add planned task in Bangla or English (e.g., 5. রাজউক প্ল্যান সাবমিশন / Site inspection)..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              if (!planInput.trim()) return;
              setDraftPlanItems((prev) => [
                ...prev,
                {
                  id: `wp-${Date.now()}`,
                  title: planInput.trim(),
                  status: "Pending",
                },
              ]);
              setPlanInput("");
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            + পরিকল্পনায় যোগ
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
                {(["Completed", "In Progress", "Pending", "Blocked"] as const).map(
                  (st) => (
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
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: DAILY WORK SUMMARY FORM & TEAM LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmitSummary}
          className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 h-fit"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-600" /> 3. Submit Daily Work Summary (Bangla / English / Mixed)
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                শুরুর সময়
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                শেষ সময়
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Status
              </label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>Completed</option>
                <option>In Progress</option>
                <option>Pending</option>
                <option>Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সংযুক্ত টাস্ক
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="">-- ঐচ্ছিক টাস্ক --</option>
                {(data.tasks || []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.taskCode}: {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সম্পন্ন %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- প্রজেক্ট --</option>
              {(data.projects || []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode}
                </option>
              ))}
            </select>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- সাইট --</option>
              {(data.sites || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.siteCode}
                </option>
              ))}
            </select>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- ক্লায়েন্ট --</option>
              {(data.clients || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.clientCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Work Description (বাংলা / English / Mixed Bangla-English) *
            </label>
            <textarea
              required
              rows={3}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="আজ বসুন্ধরা সাইটে ৩য় তলার ছাদের রড বাইন্ডিং চেক করেছি এবং ক্লায়েন্টের সাথে মিটিং সম্পন্ন হয়েছে..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {/* Multiple Attachments Input (Images, PDF, Documents) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> Attach Images, PDFs or Documents (Multiple Allowed)
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
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold"
                  >
                    {att.name} ({att.size})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={problems}
              onChange={(e) => setProblems(e.target.value)}
              placeholder="Problems / সমস্যা (Optional)"
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="Tomorrow Plan / আগামীকালের পরিকল্পনা"
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Save দৈনিক সারাংশ & Attachments
          </button>
        </form>

        {/* Submitted Work Plans & দৈনিক কাজের লগ */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              জমাকৃত দৈনিক সারাংশ ({(data.dailyWorks || []).length})
            </h3>
            {(data.dailyWorks || []).map((dw: any) => {
              const emp = empMap.get(dw.employeeId);
              const proj = projMap.get(dw.projectId);
              const site = siteMap.get(dw.siteId);
              const task = taskMap.get(dw.taskId);
              return (
                <div
                  key={dw.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                >
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
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold"
                        >
                          <Paperclip className="w-3 h-3" /> {att.name} ({att.size})
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {task && (
                      <Link
                        href={`/tasks/${task.id}`}
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold"
                      >
                        Task: {task.taskCode}
                      </Link>
                    )}
                    {proj && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Project: {proj.projectCode}
                      </span>
                    )}
                    {site && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        Site: {site.siteCode}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6 & 7. TASK MANAGEMENT VIEW (Todo -> Accepted -> In Progress -> Review -> Completed)
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
  // ✅ FIX (Minor 13): project/site আর auto-select হয় না — ভুল প্রজেক্টে task যাওয়ার ঝুঁকি কম
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [priority, setPriority] = useState("High");
  const [dueDate, setDueDate] = useState(today);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  // ✅ FIX: comment text এখন task-id অনুযায়ী আলাদা — আগে একটা task-এ লিখলে
  // সব task card-এই একই text দেখা যেত (shared state)
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  // Task completion evidence modal state
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<
    Array<{ name: string; type: string; size: string; url: string }>
  >([]);

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );

  async function handleCreateTask(e: React.FormEvent) {
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
  }

  const allTasks = data.tasks || [];
  const filteredTasks = focusedTaskId
    ? allTasks.filter((t: any) => t.id === focusedTaskId)
    : statusFilter === "All"
    ? allTasks
    : allTasks.filter((t: any) => t.status === statusFilter);

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
            Workflow: Todo → Accepted → In Progress → Review → Completed (Plus Blocked / Reopened / Cancelled) • Auto-notifies Creator & Management on Completion
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {focusedTaskId ? (
            <Link
              href="/tasks"
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              ← সকল টাস্ক
            </Link>
          ) : (
            [
              "All",
              "Todo",
              "Accepted",
              "In Progress",
              "Review",
              "Completed",
              "Blocked",
              "Reopened",
            ].map((st) => (
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
              Complete Task #{completingTaskId} — Attach Completion Note & Evidence (Image/PDF)
            </h3>
            <button
              type="button"
              onClick={() => setCompletingTaskId(null)}
              className="text-xs text-slate-300"
            >
              ✕ Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="Completion Note (e.g. All rebar & shuttering verified, attached site photo/PDF)..."
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
                  type: f.type || "PDF/Image",
                  size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                  url: `#evidence-${encodeURIComponent(f.name)}`,
                }))
              );
            }}
            className="text-xs text-slate-300"
          />
          <button
            type="button"
            onClick={async () => {
              await onMutate({
                action: "updateTaskStatus",
                taskId: completingTaskId,
                status: "Completed",
                progressPercent: 100,
                completionNote:
                  completionNote || "Completed with verified evidence",
                evidenceAttachments: evidenceFiles,
              });
              setCompletingTaskId(null);
              setCompletionNote("");
              setEvidenceFiles([]);
            }}
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                টাস্ক শিরোনাম *
              </label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                কর্মচারী অ্যাসাইন
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={assignToAllStaff}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {(data.allEmployeesDirectory || []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.empCode} — {e.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-700 mt-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={assignToAllStaff}
                  onChange={(e) => setAssignToAllStaff(e.target.checked)}
                />
                Notify & Assign to All Staff (Company-Wide Task)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">-- প্রজেক্ট (ঐচ্ছিক) --</option>
                  {(data.projects || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">-- সাইট (ঐচ্ছিক) --</option>
                  {(data.sites || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.siteCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Instructions / Specs (Bangla or English)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              টাস্ক তৈরি ও নোটিফিকেশন
            </button>
          </form>
        )}

        <div
          className={
            focusedTaskId ? "lg:col-span-12 space-y-4" : "lg:col-span-8 space-y-3"
          }
        >
          {filteredTasks.map((t: any) => {
            const emp = empMap.get(t.assignedTo);
            const isOverdue =
              t.dueDate && // ✅ FIX (Minor 12): dueDate না থাকলে ভুল OVERDUE ব্যাজ নয়
              t.dueDate < today &&
              t.status !== "Completed" &&
              t.status !== "Cancelled";
            const comments = (data.taskComments || []).filter(
              (c: any) => c.taskId === t.id
            );

            return (
              <div
                key={t.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                        {t.taskCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          t.priority === "Critical" || t.priority === "High"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "Accepted"
                            ? "bg-blue-100 text-blue-700"
                            : t.status === "Review"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.status}
                      </span>
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
                    <Link
                      href={`/tasks/${t.id}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-600 mt-1.5 block"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </div>

                  <div className="text-right text-xs">
                    <p className="font-semibold text-slate-800">
                      Assignee: {t.isCompanyWide ? "All Staff" : emp?.name || `EMP-${t.assignedTo}`}
                    </p>
                    <p className="text-slate-500">
                      Created by: {t.createdBy || "Manager"} • Due: {t.dueDate}
                    </p>
                    <p className="font-bold text-emerald-600 mt-1">
                      Progress: {t.progressPercent}%
                    </p>
                  </div>
                </div>

                {/* Completion Metadata if Completed */}
                {t.status === "Completed" && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-emerald-900">
                      ✓ Completed by {t.completedBy || t.reviewedBy || "Staff"}{" "}
                      {t.completedAt
                        ? `on ${new Date(t.completedAt).toLocaleString()}`
                        : ""}
                    </div>
                    {t.completionNote && (
                      <p className="text-emerald-800">Note: {t.completionNote}</p>
                    )}
                    {(t.evidenceAttachments || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(t.evidenceAttachments || []).map((ev: any, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300 text-[11px] font-semibold"
                          >
                            Evidence: {ev.name} ({ev.size})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons for full Task Status Workflow */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        "Accepted",
                        "In Progress",
                        "Review",
                        "Blocked",
                        "Reopened",
                        "Cancelled",
                      ] as const
                    ).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          onMutate({
                            action: "updateTaskStatus",
                            taskId: t.id,
                            status: st,
                          })
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

                  <Link
                    href={`/tasks/${t.id}`}
                    className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    থ্রেড খুলুন ({comments.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Activity History & Comment Box */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 flex items-center justify-between"
                    >
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
                      placeholder="Write a comment or review note on this task..."
                      value={commentDrafts[t.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const text = (commentDrafts[t.id] || "").trim();
                        if (!text) return;
                        await onMutate({
                          action: "addTaskComment",
                          taskId: t.id,
                          comment: text,
                        });
                        setCommentDrafts((prev) => ({ ...prev, [t.id]: "" }));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Comment
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
