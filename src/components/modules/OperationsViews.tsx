"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
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
  Bell,
  Eye,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";
function getRoleBangla(role?: string | null): string {
  switch (role) {
    case "Owner":
      return "প্রতিষ্ঠাতা ও সিইও (Founder & CEO)";
    case "Chairman":
      return "চেয়ারম্যান (Chairman)";
    case "Manager":
      return "জেনারেল ম্যানেজার (General Manager)";
    case "Project Manager":
      return "প্রজেক্ট ম্যানেজার";
    case "Engineer":
      return "সিভিল ইঞ্জিনিয়ার";
    case "Marketing":
      return "মার্কেটিং স্পেশালিস্ট";
    case "Site Staff":
      return "সাইট ম্যানেজার";
    case "Staff":
      return "অফিস স্টাফ";
    case "HR":
      return "মানবসম্পদ প্রধান (HR Head)";
    case "Accounts":
      return "প্রধান হিসাবরক্ষক";
    case "Sales":
      return "সেলস এক্সিকিউটিভ";
    default:
      return role || "কর্মকর্তা";
  }
}

 

export function DashboardView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const role = data.currentUser?.role || "Staff";
  const myEmpId = data.currentUser?.employeeId || 1;

  const isManagement =
    role === "Owner" ||
    role === "MD" ||
    role === "Admin" ||
    role === "Manager" ||
    role === "Chairman" ||
    role === "HR";

  const isOwnerOrMD = role === "Owner" || role === "MD" || role === "Admin";
  const isChairman = role === "Chairman";
  const canPublishAnnouncements = isManagement;

  const [selectedStaffTimelineId, setSelectedStaffTimelineId] = useState<number | null>(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticePriority, setNoticePriority] = useState("Normal");
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(today);

  const attendances = data.attendances || [];
  const todayAtt = attendances.filter((a: any) => a.date === today);
  const myTodayAtt = todayAtt.find((a: any) => a.employeeId === myEmpId);

  const workPlans = data.dailyWorkPlans || [];
  const todayWorkPlans = workPlans.filter((p: any) => p.date === today);
  const myTodayPlan =
    todayWorkPlans.find((p: any) => p.employeeId === myEmpId) ||
    workPlans.find((p: any) => p.employeeId === myEmpId);

  const dailyWorks = data.dailyWorks || [];
  const todayDailyWorks = dailyWorks.filter((d: any) => d.date === today);
  const myDailyWorks = dailyWorks.filter((d: any) => d.employeeId === myEmpId);

  const tasks = data.tasks || [];
  const myTasks = tasks.filter(
    (t: any) => t.assignedTo === myEmpId || t.isCompanyWide || t.visibility === "Everyone"
  );
  const myPendingTasks = myTasks.filter(
    (t: any) => t.status !== "Completed" && t.status !== "Cancelled"
  );
  const myCompletedTasks = myTasks.filter((t: any) => t.status === "Completed");

  const announcementsList: any[] = data.announcements || [];

  // =========================================================================
  // 10. STAFF SELF DASHBOARD ("MY DAY" FIRST EXPERIENCE - 100% BANGLA)
  // =========================================================================
  if (!isManagement && role !== "Accounts") {
    const myEffectiveCompletion =
      myTodayPlan?.manualOverridePercent ??
      myTodayPlan?.autoProgressPercent ??
      (myTasks.length > 0
        ? Math.round(
            myTasks.reduce((s: number, t: any) => s + Number(t.progressPercent || 0), 0) /
              myTasks.length
          )
        : 0);

    return (
      <div className="space-y-6">
        {/* দ্রুত পদক্ষেপ বার (IN -> কাজের পরিকল্পনা -> টাস্ক -> দৈনিক আপডেট -> OUT) */}
        <div className="sticky top-14 z-10 bg-slate-900 text-white rounded-3xl p-4 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ব্যক্তিগত সেলফ-সার্ভিস ড্যাশবোর্ড • {data.currentUser?.empCode || "EMP"}
            </span>
            <h1 className="text-lg font-bold mt-1">
              স্বাগতম, {data.currentUser?.name} — আজকের কর্মপরিকল্পনা ও অগ্রগতি
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onMutate({
                  action: "checkIn",
                  date: today,
                  checkIn: new Date().toTimeString().slice(0, 5),
                  notes: "মোবাইল/ডেস্কটপ সেলফ ইন টাইম",
                })
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <LogIn className="w-4 h-4" /> ১. ইন টাইম (IN)
            </button>
            <Link
              href="/my-day"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" /> ২. কাজের পরিকল্পনা
            </Link>
            <Link
              href="/tasks"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            >
              <CheckSquare className="w-4 h-4 text-indigo-400" /> ৩. টাস্ক ({myPendingTasks.length})
            </Link>
            <Link
              href="/my-day"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Send className="w-4 h-4 text-amber-400" /> ৪. দৈনিক বিবরণী
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!myTodayAtt) {
                  alert("অনুগ্রহ করে প্রথমে ইন টাইম (IN TIME) প্রদান করুন।");
                  return;
                }
                onMutate({
                  action: "checkOut",
                  attendanceId: myTodayAtt.id,
                  checkOut: new Date().toTimeString().slice(0, 5),
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <LogOut className="w-4 h-4" /> ৫. আউট টাইম (OUT)
            </button>
          </div>
        </div>

        {/* প্রাতিষ্ঠানিক নোটিশ ও ঘোষণা (Announcements for All Staff) */}
        {announcementsList.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Megaphone className="w-4 h-4 text-emerald-600 animate-bounce" />
                গুরুত্বপূর্ণ দাফতরিক ঘোষণা ও নোটিশ
              </span>
              <span className="text-[11px] text-slate-500">
                মোট {announcementsList.length} টি নোটিশ
              </span>
            </div>
            {announcementsList.slice(0, 2).map((ann: any) => (
              <div key={ann.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ann.priority === "Urgent" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {ann.priority === "Urgent" ? "জরুরি নোটিশ" : "সাধারণ নোটিশ"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ann.message}</p>
                <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                  <span>ঘোষক: {ann.createdBy}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* মাই ডে মূল পরিসংখ্যান কার্ডসমূহ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">আজকের ইন টাইম</p>
            <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">
              {myTodayAtt?.checkIn || "উপস্থিতি বাকি"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">স্বয়ংক্রিয় অনুমোদন • শিফট ০৯:৩০</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">আজকের আউট টাইম</p>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {myTodayAtt?.checkOut || "কার্যরত আছেন"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              কাজের সময়: {myTodayAtt?.workingHours || "০.০০"} ঘণ্টা
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">আজকের কাজের পরিকল্পনা</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {myTodayPlan?.items?.length || 0} টি কাজ
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              অগ্রগতি: {myTodayPlan?.autoProgressPercent || 0}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">চলমান/পেন্ডিং টাস্ক</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {myPendingTasks.length} টি
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              সম্পন্ন: {myCompletedTasks.length} টি
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">সার্বিক সম্পন্নতা %</p>
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
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">উপস্থিতি ও ছুটির হিসাব</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {attendances.length} দিন
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              অনুমোদিত ছুটি: {(data.leaveRequests || []).length} টি
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* আজকের কাজের পরিকল্পনা ও সক্রিয় টাস্ক */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    আজকের কাজের পরিকল্পনা (Today&apos;s Work Plan)
                  </h3>
                  <p className="text-xs text-slate-500">
                    স্ট্যাটাস বোতামে ক্লিক করে স্বয়ংক্রিয়ভাবে আপনার দৈনিক সম্পন্নতা % হিসাব করুন
                  </p>
                </div>
                <Link
                  href="/my-day"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                >
                  + পরিকল্পনা সম্পাদন
                </Link>
              </div>

              {myTodayPlan && (myTodayPlan.items || []).length > 0 ? (
                <div className="space-y-2">
                  {(myTodayPlan.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { key: "Completed", label: "সম্পন্ন" },
                          { key: "In Progress", label: "চলমান" },
                          { key: "Pending", label: "অপেক্ষমাণ" },
                          { key: "Blocked", label: "স্থগিত" },
                        ].map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() =>
                              onMutate({
                                action: "updateWorkPlanItemStatus",
                                planId: myTodayPlan.id,
                                itemId: item.id,
                                status: st.key,
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                              item.status === st.key
                                ? st.key === "Completed"
                                  ? "bg-emerald-600 text-white"
                                  : st.key === "Blocked"
                                  ? "bg-rose-600 text-white"
                                  : st.key === "In Progress"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-amber-500 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                  <p className="text-xs text-slate-500">
                    আজকের জন্য এখনও কোনো কর্মপরিকল্পনা যুক্ত করা হয়নি।
                  </p>
                  <Link
                    href="/my-day"
                    className="inline-block mt-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    + নতুন পরিকল্পনা যুক্ত করুন
                  </Link>
                </div>
              )}
            </div>

            {/* আমার অর্পিত টাস্কসমূহ */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  আমার অর্পিত দায়িত্ব ও টাস্ক ({myTasks.length} টি)
                </h3>
                <Link href="/tasks" className="text-xs font-semibold text-emerald-600 hover:underline">
                  সকল টাস্ক দেখুন →
                </Link>
              </div>
              {myTasks.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">আপাতত কোনো অর্পিত টাস্ক নেই।</p>
              ) : (
                myTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {t.taskCode}
                      </span>
                      <span className="ml-2 font-bold text-slate-900">{t.title}</span>
                      <p className="text-slate-500 mt-1">
                        সময়সীমা: {t.dueDate} • অগ্রগতি: <strong>{t.progressPercent}%</strong>
                      </p>
                    </div>
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
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
                      >
                        গ্রহণ করুন
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
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition"
                      >
                        শুরু করুন
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onMutate({
                            action: "updateTaskStatus",
                            taskId: t.id,
                            status: "Completed",
                            progressPercent: 100,
                            completionNote: "সেলফ ড্যাশবোর্ড হতে সম্পন্ন করা হয়েছে",
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition"
                      >
                        সম্পন্ন করুন
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ডান পাশ: নোটিফিকেশন ও ব্যক্তিগত একটিভিটি টাইমলাইন */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" /> আমার নোটিফিকেশনসমূহ
                </h3>
                <Link href="/notifications" className="text-xs font-semibold text-emerald-600 hover:underline">
                  সম্পূর্ণ সেন্টার →
                </Link>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {(data.notifications || []).slice(0, 5).map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-bold text-[10px]">
                        {n.type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {n.createdBy || "সিস্টেম"}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{n.title}</p>
                    <p className="text-slate-600">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ৮. ব্যক্তিগত অ্যাক্টিভিটি টাইমলাইন (Employee Activity Timeline) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> আমার ব্যক্তিগত অ্যাক্টিভিটি টাইমলাইন
              </h3>
              <p className="text-[11px] text-slate-500">
                উপস্থিতি → কাজের পরিকল্পনা → দৈনিক কাজের বিবরণ → টাস্ক → ছুটি (সম্পূর্ণ ব্যক্তিগত ও ম্যানেজমেন্টের জন্য সংরক্ষিত)
              </p>
              <div className="space-y-2.5 border-l-2 border-emerald-500 pl-3.5 ml-1 text-xs">
                {myTodayAtt && (
                  <div>
                    <span className="font-bold text-emerald-700">উপস্থিতি:</span> ইন টাইম দেওয়া হয়েছে{" "}
                    {myTodayAtt.checkIn}{" "}
                    {myTodayAtt.checkOut ? `• আউট টাইম: ${myTodayAtt.checkOut}` : ""}
                  </div>
                )}
                {myTodayPlan && (
                  <div>
                    <span className="font-bold text-indigo-700">কাজের পরিকল্পনা:</span>{" "}
                    {(myTodayPlan.items || []).length} টি পরিকল্পিত আইটেম ({myTodayPlan.autoProgressPercent}% সম্পন্ন)
                  </div>
                )}
                {myDailyWorks.slice(0, 2).map((dw: any) => (
                  <div key={dw.id}>
                    <span className="font-bold text-slate-800">
                      দৈনিক কাজের বিবরণ ({dw.date}):
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
  // ৯. ম্যানেজমেন্ট ও ওনার ড্যাশবোর্ড ("TODAY'S TEAM DASHBOARD" - 100% BANGLA)
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

  const selectedDateAtt = attendances.filter((a: any) => a.date === attendanceDate);
  const selectedDatePresent = selectedDateAtt.filter(
    (a: any) =>
      a.status === "Present" ||
      a.status === "Late" ||
      a.status === "Early Leave" ||
      a.status === "Missing Checkout"
  ).length;
  const selectedDateLate = selectedDateAtt.filter((a: any) => a.status === "Late").length;
  const selectedDateLeave = selectedDateAtt.filter((a: any) => a.status === "Leave").length;
  const selectedDateAbsent = Math.max(
    0,
    totalEmpCount - selectedDatePresent - selectedDateLeave
  );

  const overdueTasks = tasks.filter(
    (t: any) => t.dueDate < today && t.status !== "Completed" && t.status !== "Cancelled"
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

  const inspectedStaff = selectedStaffTimelineId
    ? allEmps.find((e: any) => e.id === selectedStaffTimelineId)
    : null;

  return (
    <div className="space-y-6">
      {/* ১৫. ভূমিকা-ভিত্তিক কুইক অ্যাকশন বার (ওনার/চেয়ারম্যান বনাম ম্যানেজার) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {getRoleBangla(role)} কমান্ড সেন্টার
            </span>
            <span className="text-xs text-slate-300">
              অফিস সময়সূচি: সকাল ৯:৩০–১:১৫ • বিরতি ১:১৫–২:৩০ • বিকাল ২:৩০–৭:৩০
            </span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1.5 font-sans">
            INSAF ERP — আজকের সামগ্রিক টিম অপারেশন ও ব্যবসায়িক ড্যাশবোর্ড
          </h1>
        </div>

        {/* কুইক একশন লিঙ্কসমূহ */}
        {isOwnerOrMD || isChairman ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/leads"
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              ১. বিজনেস (CRM)
            </Link>
            <Link
              href="/employees"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ২. কর্মকর্তা (HR)
            </Link>
            <Link
              href="/projects"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৩. প্রজেক্ট
            </Link>
            <Link
              href="/accounts"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৪. অর্থায়ন
            </Link>
            <Link
              href="/reports"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৫. রিপোর্ট
            </Link>
            <Link
              href="/settings"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৬. সেটিংস
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/employees"
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              ১. টিম তালিকা
            </Link>
            <Link
              href="/tasks"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ২. টাস্ক ব্যবস্থাপনা
            </Link>
            <Link
              href="/leave"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৩. অনুমোদন
            </Link>
            <Link
              href="/notifications"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৪. নোটিফিকেশন
            </Link>
            <Link
              href="/reports"
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
            >
              ৫. রিপোর্ট
            </Link>
          </div>
        )}
      </div>

      {/* ১৪. প্রাতিষ্ঠানিক নোটিশ ও ঘোষণা সেকশন (Announcements Display & Broadcast) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              দাফতরিক নোটিশ ও নির্দেশনা বোর্ড (Announcements)
            </h3>
          </div>
          {canPublishAnnouncements && (
            <button
              type="button"
              onClick={() => setShowNoticeForm(!showNoticeForm)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> {showNoticeForm ? "ফর্ম লুকান" : "নতুন নোটিশ প্রকাশ করুন"}
            </button>
          )}
        </div>

        {/* নোটিশ তৈরির ফর্ম (ম্যানেজমেন্টের জন্য) */}
        {showNoticeForm && canPublishAnnouncements && (
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
              setShowNoticeForm(false);
            }}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-800">
              সকল কর্মকর্তার উদ্দেশ্যে নোটিশ প্রকাশ করুন
            </h4>
            <input
              type="text"
              required
              placeholder="নোটিশের শিরোনাম লিখুন *"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <textarea
              rows={2}
              required
              placeholder="নোটিশের বিস্তারিত বার্তা লিখুন..."
              value={noticeMsg}
              onChange={(e) => setNoticeMsg(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="flex gap-2">
              <select
                value={noticePriority}
                onChange={(e) => setNoticePriority(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="Normal">সাধারণ নোটিশ</option>
                <option value="High">জরুরি নোটিশ</option>
                <option value="Urgent">অতীব জরুরি</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
              >
                সকল কর্মকর্তার কাছে নোটিশ পাঠান
              </button>
            </div>
          </form>
        )}

        {/* প্রকাশিত নোটিশসমূহ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {announcementsList.length === 0 ? (
            <p className="text-xs text-slate-400 p-2">কোনো সক্রিয় নোটিশ নেই।</p>
          ) : (
            announcementsList.map((ann: any) => (
              <div key={ann.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ann.priority === "Urgent" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {ann.priority === "Urgent" ? "জরুরি" : "সাধারণ"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ann.message}</p>
                <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                  <span>ঘোষক: {ann.createdBy}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ৯. টিম অপারেশনাল ড্যাশবোর্ড মেট্রিক্স (Today's Team Dashboard) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            আজকের টিম অপারেশনাল ওভারভিউ ({today})
          </h2>
          <button
            type="button"
            onClick={() => onMutate({ action: "runReminderAutomation" })}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <BellRing className="w-3.5 h-3.5" /> স্বয়ংক্রিয় রিমাইন্ডার চালু করুন
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">উপস্থিত / অনুপস্থিত</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {presentToday} / <span className="text-rose-600">{absentToday}</span>
            </p>
            <p className="text-[10px] text-slate-400">মোট টিম: {totalEmpCount} জন</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">দেরিতে আসা / ছুটিতে</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {lateToday} / <span className="text-blue-600">{onLeaveToday}</span>
            </p>
            <p className="text-[10px] text-slate-400">সকাল ০৯:৩০ এর পর</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">ইন / আউট সম্পন্ন</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {checkedInToday} / <span className="text-emerald-600">{checkedOutToday}</span>
            </p>
            <p className="text-[10px] text-slate-400">স্বয়ংক্রিয় অনুমোদন</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">আজকের কাজের পরিকল্পনা</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {todayWorkPlans.length} টি
            </p>
            <p className="text-[10px] text-slate-400">দাখিলকৃত কর্মপরিকল্পনা</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">সম্পন্ন / পেন্ডিং / স্থগিত</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              {completedTasksCount} /{" "}
              <span className="text-amber-600">{pendingTasksCount}</span> /{" "}
              <span className="text-rose-600">{blockedTasksCount}</span>
            </p>
            <p className="text-[10px] text-slate-400">মেয়াদোত্তীর্ণ: {overdueTasks.length} টি</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">আপডেট দেননি</p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              {staffWithoutDailyUpdate.length} জন
            </p>
            <p className="text-[10px] text-slate-400">
              জমা দিয়েছেন: {todayDailyWorks.length} জন
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-[11px] text-slate-500 font-medium">টিম সম্পন্নতা %</p>
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

      {/* দৈনিক সকল কর্মকর্তার উপস্থিতি — ম্যানেজমেন্ট */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">দৈনিক সকল কর্মকর্তার উপস্থিতি</h3>
            <p className="text-xs text-slate-500 mt-1">তারিখ নির্বাচন করে সকল কর্মকর্তার IN, OUT, কর্মঘণ্টা, দেরি ও ওভারটাইম দেখুন</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            তারিখ
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 border-b border-slate-100">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">মোট কর্মকর্তা</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalEmpCount}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-[11px] text-emerald-700">উপস্থিত</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{selectedDatePresent}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3">
            <p className="text-[11px] text-rose-700">অনুপস্থিত</p>
            <p className="text-xl font-bold text-rose-700 mt-1">{selectedDateAbsent}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
            <p className="text-[11px] text-amber-700">দেরিতে</p>
            <p className="text-xl font-bold text-amber-700 mt-1">{selectedDateLate}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-[11px] text-blue-700">ছুটিতে</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{selectedDateLeave}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">কর্মকর্তা</th>
                <th className="p-3 font-semibold">পদবি</th>
                <th className="p-3 font-semibold">IN</th>
                <th className="p-3 font-semibold">OUT</th>
                <th className="p-3 font-semibold">কর্মঘণ্টা</th>
                <th className="p-3 font-semibold">দেরি / Early</th>
                <th className="p-3 font-semibold">ওভারটাইম</th>
                <th className="p-3 font-semibold">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allEmps.map((emp: any) => {
                const att = selectedDateAtt.find((a: any) => a.employeeId === emp.id);
                const status = att?.status || (attendanceDate === today ? "Absent" : "রেকর্ড নেই");
                const statusClass =
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
                    : "bg-rose-100 text-rose-700";

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">
                      {emp.name}
                      <div className="text-[10px] text-slate-500 font-normal">{emp.empCode}</div>
                    </td>
                    <td className="p-3 text-slate-600">{emp.designation || "—"}</td>
                    <td className="p-3 font-mono text-emerald-700">{att?.checkIn || "—"}</td>
                    <td className="p-3 font-mono text-slate-600">{att?.checkOut || "—"}</td>
                    <td className="p-3 font-mono">{att?.workingHours ?? "0"}</td>
                    <td className="p-3">
                      {att ? `${Number(att.lateMinutes || 0)}m / ${Number(att.earlyLeaveMinutes || 0)}m` : "—"}
                    </td>
                    <td className="p-3 font-mono text-indigo-700">{att?.overtimeHours ?? "0"}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full font-bold ${statusClass}`}>
                        {status === "Present" ? "উপস্থিত" :
                         status === "Late" ? "দেরিতে" :
                         status === "Leave" ? "ছুটিতে" :
                         status === "Early Leave" ? "আগে বের হয়েছেন" :
                         status === "Missing Checkout" ? "OUT বাকি" :
                         status === "Absent" ? "অনুপস্থিত" : status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* টিম অ্যাক্টিভিটি ম্যাট্রিক্স ও কর্মকর্তা প্রোফাইল ইন্সপেকশন */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                আজকের টিম কর্মপরিকল্পনা, উপস্থিতি ও অগ্রগতি ম্যাট্রিক্স (কর্মকর্তার নামের উপর ক্লিক করুন)
              </h3>
              <p className="text-xs text-slate-500">
                কার কী পরিকল্পনা ছিল, কতটুকু সম্পন্ন হয়েছে, দৈনিক কাজের সারাংশ ও ম্যানেজমেন্টের ম্যানুয়াল সমন্বয়
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">কর্মকর্তার নাম (ক্লিক করুন)</th>
                  <th className="p-3 font-semibold">ইন / আউট (সময়)</th>
                  <th className="p-3 font-semibold">আজকের কাজের পরিকল্পনা</th>
                  <th className="p-3 font-semibold">দৈনিক সারাংশ</th>
                  <th className="p-3 font-semibold">সম্পন্নতা %</th>
                  <th className="p-3 font-semibold">সমন্বয়</th>
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
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffTimelineId(emp.id)}
                          className="font-bold text-slate-900 hover:text-emerald-600 text-left underline decoration-emerald-500/50"
                        >
                          {emp.name}
                        </button>
                        <div className="text-[11px] text-slate-500">
                          {emp.empCode} • {emp.designation}
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        {att ? (
                          <div>
                            <span className="text-emerald-700 font-bold">
                              ইন: {att.checkIn || "—"}
                            </span>
                            <span className="block text-slate-500">
                              আউট: {att.checkOut || "কার্যরত"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-semibold">উপস্থিতি বাকি</span>
                        )}
                      </td>
                      <td className="p-3">
                        {plan ? (
                          <div>
                            <span className="font-bold text-indigo-700">
                              {doneCount}/{totalItems} সম্পন্ন
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
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            দাখিলকৃত ({dw.status})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                            আপডেট দেননি
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{effectivePct}%</span>
                          {plan?.manualOverridePercent !== null &&
                            plan?.manualOverridePercent !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                                সমন্বিত
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
                                `${emp.name}-এর জন্য সম্পন্নতা % ম্যানুয়াল সমন্বয় করুন (স্বয়ংক্রিয় ছিল: ${plan.autoProgressPercent}%):`,
                                String(effectivePct)
                              );
                              if (val === null) return;
                              const reason =
                                prompt(
                                  "সমন্বয়ের কারণ লিখুন (অডিট লগে সংরক্ষিত হবে):",
                                  "সাইটের কাজের মান নিরীক্ষা সাপেক্ষে"
                                ) || "ম্যানেজমেন্ট মূল্যায়ন";
                              onMutate({
                                action: "overrideWorkPlanProgress",
                                planId: plan.id,
                                manualOverridePercent: Number(val),
                                overrideReason: reason,
                              });
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-semibold transition"
                          >
                            সমন্বয় %
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

        {/* ডান পাশ: নির্বাচিত কর্মকর্তার অ্যাক্টিভিটি টাইমলাইন নিরীক্ষা */}
        <div className="lg:col-span-4 space-y-6">
          {inspectedStaff ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 p-5 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    ৮. কর্মকর্তার অ্যাক্টিভিটি টাইমলাইন
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {inspectedStaff.name} ({inspectedStaff.empCode})
                  </h3>
                  <p className="text-xs text-slate-500">{inspectedStaff.designation}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffTimelineId(null)}
                  className="text-xs text-slate-400 hover:text-slate-800 p-1"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>

              <div className="space-y-3 border-l-2 border-emerald-500 pl-3.5 text-xs max-h-80 overflow-y-auto">
                <div>
                  <strong className="text-emerald-700 block">১. আজকের উপস্থিতি:</strong>
                  {todayAtt.find((a: any) => a.employeeId === inspectedStaff.id)
                    ? `ইন: ${
                        todayAtt.find((a: any) => a.employeeId === inspectedStaff.id)
                          ?.checkIn
                      } | আউট: ${
                        todayAtt.find((a: any) => a.employeeId === inspectedStaff.id)
                          ?.checkOut || "কার্যরত আছেন"
                      }`
                    : "আজ এখনও উপস্থিতি দেননি"}
                </div>
                <div>
                  <strong className="text-indigo-700 block">২. আজকের কাজের পরিকল্পনা:</strong>
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
                  <strong className="text-slate-800 block">৩. দৈনিক কাজের সারাংশ:</strong>
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
                  <strong className="text-amber-700 block">৪. অর্পিত টাস্কসমূহ:</strong>
                  {tasks
                    .filter((t: any) => t.assignedTo === inspectedStaff.id)
                    .map((t: any) => (
                      <div key={t.id} className="text-slate-600">
                        • {t.taskCode}: {t.title} ({t.status} - {t.progressPercent}%)
                      </div>
                    ))}
                </div>
              </div>

              <Link
                href={`/employees/${inspectedStaff.id}/daily`}
                className="block text-center py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
              >
                সম্পূর্ণ ৩৬০° প্রোফাইল দেখুন →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 text-center">
              <Eye className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">কর্মকর্তার টাইমলাইন পরিদর্শন</h4>
              <p className="text-xs text-slate-500">
                বাম পাশের টিম ম্যাট্রিক্স থেকে যেকোনো কর্মকর্তার নামের উপর ক্লিক করলে এখানে তার উপস্থিতি, কাজের পরিকল্পনা, দৈনিক সারাংশ এবং টাস্কের বিস্তারিত টাইমলাইন প্রদর্শিত হবে।
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ম্যানেজমেন্ট আর্থিক ও প্রজেক্ট সারসংক্ষেপ */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          সার্বিক আর্থিক ও প্রজেক্ট হিসাব নিরীক্ষা
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">নগদ ও ব্যাংক ব্যালেন্স</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ৳{cashAndBank.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              নগদ: ৳{Number(cashAcc?.balance || 0).toLocaleString()} | ব্যাংক: ৳
              {Number(bankAcc?.balance || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">মোট বিলকৃত আয় ও নিট লাভ</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              ৳{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              নিট লাভ/ক্ষতি: ৳{netProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">বকেয়া পাওনা (AR)</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              ৳{totalAR.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              আদায়কৃত: ৳{(totalRevenue - totalAR).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">সরবরাহকারী ও ঠিকাদার দেনা (AP)</p>
            <p className="text-xl font-bold text-rose-600 mt-1">
              ৳{(totalSupplierAP + totalContractorDue).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              সরবরাহকারী: ৳{totalSupplierAP.toLocaleString()} | ঠিকাদার: ৳
              {totalContractorDue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">প্রজেক্টের সরাসরি ব্যয়</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ৳{totalExpenses.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              বেতন পরিশোধ: ৳{totalSalaryExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ২. উপস্থিতি মডিউল ভিউ (ATTENDANCE VIEW - 100% BANGLA)
// ============================================================================
export function AttendanceView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [employeeId, setEmployeeId] = useState(
    String(data.currentUser?.employeeId || data.allEmployeesDirectory?.[0]?.id || 1)
  );
  const [checkInTime, setCheckInTime] = useState("09:30");
  const [notes, setNotes] = useState("অফিস / সাইট শিফট চেক-ইন");

  // উপস্থিতি সংশোধনের আবেদন
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
    const outTime = prompt("আউট টাইম দিন (HH:mm, শিফট সমাপ্তি ১৯:৩০):", "19:30");
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
      {/* অফিস সময়সূচি ব্যানার */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              স্বয়ংক্রিয় অনুমোদিত উপস্থিতি
            </span>
            <span className="text-xs font-semibold text-slate-600">
              সকাল: ৯:৩০ – ১:১৫ • বিরতি: ১:১৫ – ২:৩০ • বিকাল: ২:৩০ – ৭:৩০
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            উপস্থিতি ও কাজের সময় হিসাব ব্যবস্থাপনা (Attendance Module)
          </h1>
          <p className="text-xs text-slate-500">
            ইন টাইম ও আউট টাইম তাৎক্ষণিকভাবে অনুমোদিত হয়। শুধুমাত্র ছুটি ও বিশেষ সংশোধনের ক্ষেত্রে ম্যানেজমেন্টের অনুমোদনের প্রয়োজন হয়।
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToCSV("INSAF_Attendance", data.attendances || [])}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToPDFPrint(
                "উপস্থিতি খাতা ও সময়সূচি রেজিস্টার",
                `তারিখ: ${today}`,
                data.attendances || []
              )
            }
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> PDF প্রিন্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ইন টাইম দেওয়ার ফর্ম */}
        <form
          onSubmit={handleCheckIn}
          className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> আজকের ইন টাইম প্রদান করুন (স্বয়ংক্রিয় অনুমোদন)
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              কর্মকর্তা নির্বাচন
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
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
                ইন টাইম (শিফট ০৯:৩০)
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                অবস্থান / নোট
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
          >
            ইন টাইম রেকর্ড করুন (তাৎক্ষণিক অনুমোদন)
          </button>
        </form>

        {/* উপস্থিতি সংশোধনের আবেদন ফর্ম */}
        <form
          onSubmit={handleCorrectionSubmit}
          className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> উপস্থিতি সংশোধন / বিশেষ সমন্বয়ের আবেদন
            </h2>
            <span className="text-[11px] text-slate-500">
              ম্যানেজার / চেয়ারম্যান / সিইও অনুমোদন সাপেক্ষ
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                তারিখ
              </label>
              <input
                type="date"
                required
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                প্রস্তাবিত ইন টাইম
              </label>
              <input
                type="time"
                required
                value={reqIn}
                onChange={(e) => setReqIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                প্রস্তাবিত আউট টাইম
              </label>
              <input
                type="time"
                required
                value={reqOut}
                onChange={(e) => setReqOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              required
              placeholder="সংশোধনের কারণ লিখুন (যেমন: সাইটে দেরি হওয়া বা প্রযুক্তিগত সমস্যা)..."
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition shadow-xs"
            >
              আবেদন পাঠান
            </button>
          </div>

          {/* পেন্ডিং সংশোধনের তালিকা */}
          {(data.attendanceCorrections || []).length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-700">
                উপস্থিতি সংশোধনের আবেদনসমূহ ({(data.attendanceCorrections || []).length} টি)
              </p>
              {(data.attendanceCorrections || []).map((c: any) => {
                const emp = empMap.get(c.employeeId);
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
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
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          c.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.status === "Rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status === "Approved" ? "অনুমোদিত" : c.status === "Rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}
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
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              অনুমোদন
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
                              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                            >
                              বাতিল
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

      {/* উপস্থিতি রেজিস্টার টেবিল (100% Bangla Headers) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            উপস্থিতি খাতা রেজিস্টার (মোট {(data.attendances || []).length} টি এন্ট্রি)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">তারিখ</th>
                <th className="p-3 font-semibold">কর্মকর্তার নাম</th>
                <th className="p-3 font-semibold">ইন টাইম (IN)</th>
                <th className="p-3 font-semibold">আউট টাইম (OUT)</th>
                <th className="p-3 font-semibold">সকাল / বিকাল শিফট</th>
                <th className="p-3 font-semibold">মোট কাজের সময়</th>
                <th className="p-3 font-semibold">দেরি / পূর্বে প্রস্থান</th>
                <th className="p-3 font-semibold">ওভারটাইম</th>
                <th className="p-3 font-semibold">স্ট্যাটাস</th>
                <th className="p-3 font-semibold">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.attendances || []).map((a: any) => {
                const emp = empMap.get(a.employeeId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
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
                      {a.morningHours || "০.০০"}ঘণ্টা / {a.afternoonHours || "০.০০"}ঘণ্টা
                    </td>
                    <td className="p-3 font-bold text-slate-900">{a.workingHours} ঘণ্টা</td>
                    <td className="p-3">
                      <span className="text-amber-600 font-semibold">{a.lateMinutes} মি.</span> /{" "}
                      <span className="text-rose-600">{a.earlyLeaveMinutes || 0} মি.</span>
                    </td>
                    <td className="p-3 text-indigo-600 font-semibold">{a.overtimeHours} ঘণ্টা</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          a.status === "Present"
                            ? "bg-emerald-100 text-emerald-700"
                            : a.status === "Late"
                            ? "bg-amber-100 text-amber-700"
                            : a.status === "Missing Checkout"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {a.status === "Present" ? "উপস্থিত" : a.status === "Late" ? "দেরি" : a.status === "Missing Checkout" ? "আউট বাকি" : "ছুটিতে"}
                      </span>
                    </td>
                    <td className="p-3">
                      {!a.checkOut && a.status !== "Leave" && (
                        <button
                          type="button"
                          onClick={() => handleCheckOut(a.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs"
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
// ৩, ৪ ও ৫. মাই ডে: আজকের কর্মপরিকল্পনা ও কাজের বিবরণ (100% BANGLA)
// ============================================================================
export function MyDayAndDailyWorksView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const myEmpId = data.currentUser?.employeeId || 1;

  const existingMyPlan = (data.dailyWorkPlans || []).find(
    (p: any) => p.employeeId === myEmpId && p.date === today
  );
  const [planInput, setPlanInput] = useState("");
  const [draftPlanItems, setDraftPlanItems] = useState<
    Array<{ id: string; title: string; status: "Completed" | "In Progress" | "Pending" | "Blocked" }>
  >(
    existingMyPlan?.items || [
      { id: "p-1", title: "১. ক্লায়েন্ট ফলো-আপ সম্পন্ন করা", status: "Completed" },
      { id: "p-2", title: "২. রাজউক ড্রয়িং আপডেট সম্পন্ন করা", status: "Completed" },
      { id: "p-3", title: "৩. প্রজেক্ট রিপোর্ট প্রস্তুত", status: "Completed" },
      { id: "p-4", title: "৪. সাইট ভিজিট ও পরিদর্শন", status: "In Progress" },
    ]
  );

  // দৈনিক কাজের বিবরণ স্টেট
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("19:30");
  const [workStatus, setWorkStatus] = useState("Completed");
  const [workSummary, setWorkSummary] = useState("");
  const [taskId, setTaskId] = useState(String(data.tasks?.[0]?.id || ""));
  const [projectId, setProjectId] = useState(String(data.projects?.[0]?.id || ""));
  const [siteId, setSiteId] = useState(String(data.sites?.[0]?.id || ""));
  const [clientId, setClientId] = useState(String(data.clients?.[0]?.id || ""));
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
      tomorrowPlan: tomorrowPlan || "নিয়মিত কাজের ধারাবাহিকতা",
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
      {/* হেডার */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            মাই ডে — আজকের কাজের পরিকল্পনা ও কাজের বিবরণী (My Day)
          </h1>
          <p className="text-xs text-slate-500">
            দিনের শুরুতে কাজের পরিকল্পনা যুক্ত করুন • স্বয়ংক্রিয় অগ্রগতি হিসাব • ছবি, পিডিএফ ও একাধিক ফাইল সংযুক্তি সুবিধা
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          স্বয়ংক্রিয় অগ্রগতি: {autoDraftPercent}% ({completedDraftCount}/{draftPlanItems.length} টি সম্পন্ন)
        </span>
      </div>

      {/* সেকশন ১: কাজের পরিকল্পনা ও অটো প্রগ্রেস ক্যালকুলেটর */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> আজকের কাজের পরিকল্পনা ও স্বয়ংক্রিয় প্রগ্রেস ক্যালকুলেটর
            </h2>
            <p className="text-xs text-slate-500">
              উদাহরণ: ৫টি কাজের মধ্যে ৫টি সম্পন্ন = ১০০%, ৪টি = ৮০%, ৩টি = ৬০%
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveWorkPlan}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
          >
            আজকের পরিকল্পনা সংরক্ষণ করুন ({autoDraftPercent}%)
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={planInput}
            onChange={(e) => setPlanInput(e.target.value)}
            placeholder="আজকের পরিকল্পিত কাজের বিবরণ লিখুন (যেমন: ৫. রাজউক প্ল্যান সাবমিশন ও সাইট ভিজিট)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
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
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            + পরিকল্পনায় যোগ করুন
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {draftPlanItems.map((it, idx) => (
            <div
              key={it.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
            >
              <span className="font-semibold text-slate-800">
                {idx + 1}. {it.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { key: "Completed", label: "সম্পন্ন" },
                  { key: "In Progress", label: "চলমান" },
                  { key: "Pending", label: "অপেক্ষমাণ" },
                  { key: "Blocked", label: "স্থগিত" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() =>
                      setDraftPlanItems((prev) =>
                        prev.map((p) => (p.id === it.id ? { ...p, status: st.key as any } : p))
                      )
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      it.status === st.key
                        ? st.key === "Completed"
                          ? "bg-emerald-600 text-white"
                          : st.key === "Blocked"
                          ? "bg-rose-600 text-white"
                          : st.key === "In Progress"
                          ? "bg-indigo-600 text-white"
                          : "bg-amber-500 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* সেকশন ২: দৈনিক কাজের বিবরণ জমা দেওয়ার ফর্ম ও তালিকা */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmitSummary}
          className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 h-fit shadow-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-600" /> আজকের কাজের বিবরণী দাখিল করুন
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
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
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
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                কাজের স্ট্যাটাস
              </label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="Completed">সম্পন্ন (Completed)</option>
                <option value="In Progress">চলমান (In Progress)</option>
                <option value="Pending">অপেক্ষমাণ (Pending)</option>
                <option value="Blocked">স্থগিত (Blocked)</option>
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
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
                সম্পন্নতা %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
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
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
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
              className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
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
              কাজের বিস্তারিত বিবরণ *
            </label>
            <textarea
              required
              rows={3}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="আজ সাইটে কলামের কাজ পরিদর্শন সম্পন্ন করেছি এবং গ্রাহকের সাথে প্রয়োজনীয় আলোচনা হয়েছে..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
            />
          </div>

          {/* একাধিক ফাইল সংযুক্তি */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> ছবি, পিডিএফ বা ডকুমেন্ট সংযুক্তি (একাধিক অনুমোদিত)
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleMultipleFiles}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold"
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
              placeholder="কাজে কোনো বাধা বা সমস্যা ছিল?"
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="আগামীকালের কর্মপরিকল্পনা"
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" /> কাজের বিবরণী ও সংযুক্তি সংরক্ষণ করুন
          </button>
        </form>

        {/* দাখিলকৃত কাজের সারাংশ তালিকা */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              দাখিলকৃত কাজের বিবরণী তালিকা (মোট {(data.dailyWorks || []).length} টি)
            </h3>
            {(data.dailyWorks || []).map((dw: any) => {
              const emp = empMap.get(dw.employeeId);
              const proj = projMap.get(dw.projectId);
              const site = siteMap.get(dw.siteId);
              const task = taskMap.get(dw.taskId);
              return (
                <div
                  key={dw.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {emp?.name || `EMP-${dw.employeeId}`}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {dw.date} • {dw.startTime || dw.arrivalTime} – {dw.endTime || "১৯:৩০"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold">
                        {dw.status === "Completed" ? "সম্পন্ন" : dw.status === "In Progress" ? "চলমান" : dw.status === "Pending" ? "অপেক্ষমাণ" : "স্থগিত"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        {dw.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-800 font-medium leading-relaxed">
                    {dw.workSummary}
                  </p>

                  {(dw.attachments || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(dw.attachments || []).map((att: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold"
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
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold"
                      >
                        টাস্ক: {task.taskCode}
                      </Link>
                    )}
                    {proj && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        প্রজেক্ট: {proj.projectCode}
                      </span>
                    )}
                    {site && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        সাইট: {site.siteCode}
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
// ৬ ও ৭. টাস্ক ব্যবস্থাপনা ও দৃশ্যমানতা নিয়ন্ত্রণ (100% BANGLA)
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
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(
    String(data.allEmployeesDirectory?.[0]?.id || 1)
  );
  const [assignToAllStaff, setAssignToAllStaff] = useState(false);
  const [visibility, setVisibility] = useState("Assigned Staff");
  const [projectId, setProjectId] = useState(String(data.projects?.[0]?.id || ""));
  const [siteId, setSiteId] = useState(String(data.sites?.[0]?.id || ""));
  const [priority, setPriority] = useState("High");
  const [dueDate, setDueDate] = useState(today);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [commentText, setCommentText] = useState("");

  // ব্যবস্থাপক Team Task Monitoring Filters (Part 11 & 12 of the spec)
  const [fAssignedTo, setFAssignedTo] = useState<string>("All");
  const [fAssignedBy, setFAssignedBy] = useState<string>("All");
  const [fProject, setFProject] = useState<string>("All");
  const [fSite, setFSite] = useState<string>("All");
  const [fPriority, setFPriority] = useState<string>("All");
  const [fShowOnlyMine, setFShowOnlyMine] = useState<boolean>(false);

  // টাস্ক সম্পন্ন প্রমাণপত্র স্টেট
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
      visibility,
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
  // সার্ভার-সাইড RBAC: ব্যবস্থাপক সকল assignedTo টাস্ক দেখতে পারে; স্টাফ শুধু নিজের
  const baseTasks = focusedTaskId
    ? allTasks.filter((t: any) => t.id === focusedTaskId)
    : fShowOnlyMine
    ? allTasks.filter((t: any) => t.assignedTo === data.currentUser?.employeeId)
    : allTasks;

  const filteredTasks = baseTasks.filter((t: any) => {
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (fAssignedTo !== "All" && Number(fAssignedTo) !== t.assignedTo) return false;
    if (fAssignedBy !== "All" && t.createdBy !== fAssignedBy) return false;
    if (fProject !== "All" && t.projectId !== Number(fProject)) return false;
    if (fSite !== "All" && t.siteId !== Number(fSite)) return false;
    if (fPriority !== "All" && t.priority !== fPriority) return false;
    return true;
  });

  // Team Task Monitoring Summary metrics (Part 11 & 12)
  const teamMetrics = {
    total: baseTasks.length,
    assigned: baseTasks.filter((t: any) => ["Todo", "Accepted"].includes(t.status)).length,
    inProgress: baseTasks.filter((t: any) => t.status === "In Progress").length,
    pending: baseTasks.filter((t: any) => t.status === "Review" || t.status === "Reopened").length,
    blocked: baseTasks.filter((t: any) => t.status === "Blocked").length,
    completed: baseTasks.filter((t: any) => t.status === "Completed").length,
    overdue: baseTasks.filter((t: any) =>
      t.dueDate && t.dueDate < today && t.status !== "Completed" && t.status !== "Cancelled"
    ).length,
  };
  const teamCompletionPercent =
    teamMetrics.total > 0
      ? Math.round((teamMetrics.completed / teamMetrics.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {focusedTaskId
              ? `টাস্ক বিস্তারিত বিবরণী (#${focusedTaskId})`
              : "টাস্ক ও দাফতরিক দায়িত্ব ব্যবস্থাপনা"}
          </h1>
          <p className="text-xs text-slate-500">
            কর্মপ্রবাহ: অপেক্ষমাণ → গৃহীত → চলমান → পর্যালোচনা → সম্পন্ন • দৃশ্যমানতা নিয়ন্ত্রণ ও সম্পন্নতার প্রমাণপত্র সংযুক্তি
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {focusedTaskId ? (
            <Link
              href="/tasks"
              className="px-3.5 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold"
            >
              ← সকল টাস্ক তালিকা
            </Link>
          ) : (
            [
              { key: "All", label: "সকল টাস্ক" },
              { key: "Todo", label: "অপেক্ষমাণ" },
              { key: "Accepted", label: "গৃহীত" },
              { key: "In Progress", label: "চলমান" },
              { key: "Review", label: "পর্যালোচনা" },
              { key: "Completed", label: "সম্পন্ন" },
              { key: "Blocked", label: "স্থগিত" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st.key
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ১১ & ১২. Team Task Monitoring Summary + Filters (Management) */}
      {data.currentUser?.role &&
        ["Owner", "MD", "Chairman", "Manager", "Project Manager"].includes(
          data.currentUser.role
        ) && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            📊 টিম টাস্ক মনিটরিং (Team Task Monitoring)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">মোট</p>
              <p className="text-xl font-bold text-slate-900">{teamMetrics.total}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">অর্পিত</p>
              <p className="text-xl font-bold text-blue-600">{teamMetrics.assigned}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">চলমান</p>
              <p className="text-xl font-bold text-indigo-600">{teamMetrics.inProgress}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">পেন্ডিং/রিভিউ</p>
              <p className="text-xl font-bold text-amber-600">{teamMetrics.pending}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">স্থগিত</p>
              <p className="text-xl font-bold text-rose-500">{teamMetrics.blocked}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">সম্পন্ন</p>
              <p className="text-xl font-bold text-emerald-700">{teamMetrics.completed}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-slate-400 text-[11px]">মেয়াদোত্তীর্ণ</p>
              <p className={`text-xl font-bold ${teamMetrics.overdue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                {teamMetrics.overdue}
              </p>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <select
              value={fAssignedTo}
              onChange={(e) => setFAssignedTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
            >
              <option value="All">সকল প্রাপক</option>
              {(data.allEmployeesDirectory || []).map((e: any) => (
                <option key={e.id} value={String(e.id)}>
                  {e.name}
                </option>
              ))}
            </select>
            <select
              value={fProject}
              onChange={(e) => setFProject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
            >
              <option value="All">সকল প্রজেক্ট</option>
              {(data.projects || []).map((p: any) => (
                <option key={p.id} value={String(p.id)}>
                  {p.projectCode}
                </option>
              ))}
            </select>
            <select
              value={fSite}
              onChange={(e) => setFSite(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
            >
              <option value="All">সকল সাইট</option>
              {(data.sites || []).map((s: any) => (
                <option key={s.id} value={String(s.id)}>
                  {s.siteCode}
                </option>
              ))}
            </select>
            <select
              value={fPriority}
              onChange={(e) => setFPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
            >
              <option value="All">সকল অগ্রাধিকার</option>
              <option value="Critical">অতীব জরুরি</option>
              <option value="High">জরুরি</option>
              <option value="Medium">সাধারণ</option>
              <option value="Low">নিম্ন</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setFAssignedTo("All");
                setFProject("All");
                setFSite("All");
                setFPriority("All");
                setStatusFilter("All");
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
            >
              সব ফিল্টার মুছুন
            </button>
            <button
              type="button"
              onClick={() => setFShowOnlyMine(!fShowOnlyMine)}
              className={`px-3 py-1.5 rounded-lg font-semibold ${fShowOnlyMine ? "bg-emerald-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
            >
              {fShowOnlyMine ? "✓ শুধুমাত্র আমার টাস্ক" : "শুধুমাত্র আমার টাস্ক"}
            </button>
          </div>

          <p className="text-xs text-emerald-900 font-medium">
            ✅ সামগ্রিক সম্পন্নতা: {teamCompletionPercent}% • ফিল্টারকৃত টাস্ক: {filteredTasks.length} টি
          </p>
        </div>
      )}

      {/* সম্পন্নতার প্রমাণপত্র দাখিল মডাল */}
      {completingTaskId && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-700 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">
              টাস্ক #{completingTaskId} সম্পন্ন করুন — প্রমাণপত্র বা নোট সংযুক্ত করুন
            </h3>
            <button
              type="button"
              onClick={() => setCompletingTaskId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ বাতিল
            </button>
          </div>
          <input
            type="text"
            placeholder="সম্পন্নতার মন্তব্য লিখুন (যেমন: ড্রয়িং সাইটে ডেলিভারি সম্পন্ন হয়েছে)..."
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
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
                  completionNote || "যথাযথভাবে টাস্ক সম্পন্ন হয়েছে",
                evidenceAttachments: evidenceFiles,
              });
              setCompletingTaskId(null);
              setCompletionNote("");
              setEvidenceFiles([]);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
          >
            টাস্ক সম্পন্ন নিশ্চিত করুন ও নোটিফিকেশন পাঠান
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {!focusedTaskId && (
          <form
            onSubmit={handleCreateTask}
            className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 h-fit shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> নতুন টাস্ক বা নির্দেশনা জারি করুন
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                টাস্কের শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: ৪র্থ তলার কলামের রড বাইন্ডিং চেক করুন"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                টাস্ক দৃশ্যমানতা (Visibility) *
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="Assigned Staff">নির্দিষ্ট কর্মকর্তার জন্য (Assigned Staff)</option>
                <option value="Everyone">সকলের জন্য উন্মুক্ত (Everyone)</option>
                <option value="Management Only">শুধুমাত্র ম্যানেজমেন্ট (Management Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                দায়িত্বপ্রাপ্ত কর্মকর্তা
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={assignToAllStaff || visibility === "Everyone"}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
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
                সকল কর্মকর্তার কাছে অর্পণ করুন (Company-Wide Task)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রজেক্ট
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="">-- ঐচ্ছিক --</option>
                  {(data.projects || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  সাইট
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="">-- ঐচ্ছিক --</option>
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
                  অগ্রাধিকার
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="Critical">অতীব জরুরি (Critical)</option>
                  <option value="High">উচ্চ (High)</option>
                  <option value="Medium">সাধারণ (Medium)</option>
                  <option value="Low">নিম্ন (Low)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  সময়সীমা
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
                কাজের নির্দেশনার বিবরণী
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="কাজের বিস্তারিত নির্দেশ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
            >
              টাস্ক তৈরি ও নোটিফিকেশন প্রেরণ
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
              t.dueDate < today &&
              t.status !== "Completed" &&
              t.status !== "Cancelled";
            const comments = (data.taskComments || []).filter(
              (c: any) => c.taskId === t.id
            );

            return (
              <div
                key={t.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                        {t.taskCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          t.priority === "Critical" || t.priority === "High"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {t.priority === "Critical" ? "অতীব জরুরি" : t.priority === "High" ? "জরুরি" : "সাধারণ"}
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
                        {t.status === "Completed" ? "সম্পন্ন" : t.status === "Accepted" ? "গৃহীত" : t.status === "Review" ? "পর্যালোচনা" : t.status === "In Progress" ? "চলমান" : "অপেক্ষমাণ"}
                      </span>
                      {t.visibility === "Management Only" && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-bold">
                          গোপনীয় (ম্যানেজমেন্ট)
                        </span>
                      )}
                      {t.isCompanyWide && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          সকল কর্মকর্তা
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold">
                          সময়সীমা উত্তীর্ণ
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-600 mt-1.5 block transition"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </div>

                  <div className="text-right text-xs">
                    <p className="font-semibold text-slate-800">
                      দায়িত্বপ্রাপ্ত: {t.isCompanyWide ? "সকল স্টাফ" : emp?.name || `EMP-${t.assignedTo}`}
                    </p>
                    <p className="text-slate-500">
                      প্রস্তুতকারক: {t.createdBy || "ম্যানেজার"} • সময়সীমা: {t.dueDate}
                    </p>
                    <p className="font-bold text-emerald-600 mt-1">
                      অগ্রগতি: {t.progressPercent}%
                    </p>
                  </div>
                </div>

                {/* সম্পন্নতার প্রমাণপত্র ও তথ্য */}
                {t.status === "Completed" && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-emerald-900">
                      ✓ সম্পন্ন করেছেন: {t.completedBy || t.reviewedBy || "কর্মকর্তা"}{" "}
                      {t.completedAt
                        ? `(${new Date(t.completedAt).toLocaleDateString("bn-BD")})`
                        : ""}
                    </div>
                    {t.completionNote && (
                      <p className="text-emerald-800">মন্তব্য: {t.completionNote}</p>
                    )}
                    {(t.evidenceAttachments || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(t.evidenceAttachments || []).map((ev: any, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-lg bg-white text-emerald-800 border border-emerald-300 text-[11px] font-semibold"
                          >
                            প্রমাণপত্র: {ev.name} ({ev.size})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* টাস্কের স্ট্যাটাস পরিবর্তনের বোতামসমূহ */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "Accepted", label: "গ্রহণ করুন" },
                      { key: "In Progress", label: "চলমান" },
                      { key: "Review", label: "পর্যালোচনা" },
                      { key: "Blocked", label: "স্থগিত" },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() =>
                          onMutate({
                            action: "updateTaskStatus",
                            taskId: t.id,
                            status: st.key,
                          })
                        }
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        {st.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCompletingTaskId(t.id)}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                    >
                      ✓ সম্পন্ন ও প্রমাণপত্র সংযুক্তি
                    </button>
                  </div>

                  <Link
                    href={`/tasks/${t.id}`}
                    className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    আলোচনা থ্রেড ({comments.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* মন্তব্য ও ফিডব্যাক সেকশন */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  {comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between"
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
                      placeholder="টাস্কে কোনো মন্তব্য বা অগ্রগতি নোট লিখুন..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!commentText.trim()) return;
                        await onMutate({
                          action: "addTaskComment",
                          taskId: t.id,
                          comment: commentText,
                        });
                        setCommentText("");
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> মন্তব্য
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

void CheckCircle2;
void Briefcase;
void AlertTriangle;
void Printer;
