"use client";

import React, { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Paperclip,
  Activity,
  Award,
  Briefcase,
  Calendar,
  FileText,
  X,
  Upload,
  Plus,
  Star,
  Printer,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { fixBanglaEncoding } from "./FinanceAdminViews";

export const STATUS_LABEL: Record<string, string> = {
  "Pending Acceptance": "গ্রহণের অপেক্ষায়",
  Todo: "গ্রহণের অপেক্ষায়",
  Accepted: "গৃহীত",
  "In Progress": "চলমান",
  Review: "অনুমোদনের অপেক্ষায়",
  Reopened: "সংশোধন প্রয়োজন",
  Blocked: "আটকে আছে",
  Completed: "সম্পন্ন",
  Declined: "প্রত্যাখ্যাত",
  Cancelled: "বাতিল",
  Overdue: "ওভারডিউ",
};

const RATING_BN: Record<string, { label: string; cls: string }> = {
  Best: { label: "সেরা (Best)", cls: "bg-emerald-100 text-emerald-800" },
  Better: { label: "খুব ভালো (Better)", cls: "bg-blue-100 text-blue-800" },
  Good: { label: "ভালো (Good)", cls: "bg-teal-100 text-teal-800" },
  "Needs Improvement": { label: "উন্নতি প্রয়োজন", cls: "bg-amber-100 text-amber-800" },
  Penalty: { label: "পেনাল্টি / ভুল", cls: "bg-rose-100 text-rose-800" },
};

const COMPANY_LABEL: Record<string, string> = {
  INSAF: "INSAF",
  IBDC: "INSAF BUILDING DESIGN & CONSULTANT LTD.",
  IREL: "INSAF REAL ESTATE LTD.",
};

export const EVENT_CODE_LABEL: Record<string, string> = {
  TASK_ASSIGNED: "টাস্ক দেওয়া হয়েছে",
  TASK_VIEWED: "টাস্ক দেখা হয়েছে",
  TASK_ACCEPTED: "কর্মী গ্রহণ করেছেন",
  TASK_DECLINED: "কর্মী প্রত্যাখ্যান করেছেন",
  TASK_STARTED: "কাজ শুরু",
  TASK_PROGRESS_UPDATED: "অগ্রগতি আপডেট",
  DAILY_WORK_SUBMITTED: "দৈনিক কাজ জমা",
  TASK_PROBLEM_REPORTED: "সমস্যা রিপোর্ট",
  TASK_ATTACHMENT_ADDED: "প্রমাণ/ফাইল জমা",
  TASK_COMPLETED: "সম্পন্ন — অনুমোদনের জন্য জমা",
  TASK_CORRECTION_REQUIRED: "সংশোধন প্রয়োজন",
  TASK_RESUBMITTED: "সংশোধনের পর পুনরায় জমা",
  TASK_APPROVED: "ম্যানেজমেন্ট অনুমোদন",
  TASK_REASSIGNED: "পুনঃবণ্টন",
  TASK_DEADLINE_CHANGED: "ডেডলাইন পরিবর্তন",
  TASK_OVERDUE: "ডেডলাইন পার",
  TASK_STATUS_CHANGED: "স্ট্যাটাস পরিবর্তন",
  TASK_CANCELLED: "বাতিল করা হয়েছে",
  TASK_COMMENT: "মন্তব্য",
};

export function eventLabel(c: any) {
  return (c.eventType && EVENT_CODE_LABEL[c.eventType]) || c.actionType || "কার্যক্রম";
}

const MGMT_ROLES = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Project Manager"];

const num = (v: any, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function today() {
  return new Date().toISOString().split("T")[0];
}

export function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function displayStatus(t: any) {
  if (t.status === "Completed" || t.status === "Cancelled" || t.status === "Declined") return t.status;
  const d = today();
  if (t.dueDate && t.dueDate < d) return "Overdue";
  return t.status;
}

export function statusCls(s: string) {
  if (s === "Completed") return "bg-emerald-100 text-emerald-800";
  if (s === "Overdue") return "bg-rose-600 text-white";
  if (s === "Review") return "bg-purple-100 text-purple-800";
  if (s === "Reopened") return "bg-orange-100 text-orange-800";
  if (s === "Blocked") return "bg-rose-100 text-rose-700";
  if (s === "In Progress") return "bg-blue-100 text-blue-800";
  if (s === "Accepted") return "bg-indigo-100 text-indigo-800";
  if (s === "Pending Acceptance" || s === "Todo") return "bg-amber-100 text-amber-800";
  if (s === "Declined") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

function scoreCls(n: number | null) {
  if (n === null || n === undefined) return "text-slate-400";
  if (n >= 80) return "text-emerald-600";
  if (n >= 60) return "text-amber-600";
  return "text-rose-600";
}

async function uploadFiles(files: FileList | null, taskId?: number) {
  if (!files || files.length === 0) return [] as any[];
  const fd = new FormData();
  if (taskId) fd.append("taskId", String(taskId));
  Array.from(files).forEach((f) => fd.append("files", f));
  const res = await fetch("/api/files", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "ফাইল আপলোড ব্যর্থ");
  return json.files as any[];
}

function FileLinks({ ids, files }: { ids: number[]; files: any[] }) {
  if (!ids || ids.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {ids.map((id) => {
        const f = files.find((x) => x.id === id);
        return (
          <a
            key={id}
            href={`/api/files/${id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold hover:underline"
          >
            <Paperclip className="w-3 h-3" /> {f?.fileName || `ফাইল #${id}`}
          </a>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN VIEW: EMPLOYEE DIRECTORY
// ============================================================================
export function EmployeeDirectoryView({
  data,
  onMutate,
  focusedEmployeeId,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  focusedEmployeeId?: number;
}) {
  const me = data.currentUser;
  const isMgmt = MGMT_ROLES.includes(me?.role);
  const employees: any[] = (data.employees || []).filter((e: any) => !e.archived);
  const work: any[] = useMemo(() => data.employeeWork || [], [data.employeeWork]);
  const workMap = useMemo(() => new Map(work.map((w: any) => [w.employeeId, w])), [work]);
  const projects: any[] = data.projects || [];
  const sites: any[] = data.sites || [];

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("All");
  const [department, setDepartment] = useState("All");
  const [workFilter, setWorkFilter] = useState("All");
  const [attFilter, setAttFilter] = useState("All");
  const [perfFilter, setPerfFilter] = useState("All");
  const [openId, setOpenId] = useState<number | null>(
    focusedEmployeeId || (!isMgmt ? me?.employeeId : null) || null
  );

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const filtered = employees.filter((e) => {
    const w = workMap.get(e.id);
    const q = search.trim().toLowerCase();
    if (q && ![e.name, e.empCode, e.designation, e.phone, e.email].join(" ").toLowerCase().includes(q)) return false;
    if (company !== "All" && e.companyId !== company) return false;
    if (department !== "All" && e.department !== department) return false;
    if (workFilter === "Overdue" && !(w?.overdueCount > 0)) return false;
    if (workFilter === "Pending" && !(w?.all.pending > 0)) return false;
    if (workFilter === "Review" && !(w?.all.awaitingReview > 0)) return false;
    if (workFilter === "NoUpdate" && w?.today.dailyUpdates > 0) return false;
    if (attFilter === "Present" && !(w?.today.attendance && w.today.attendance.status !== "Absent")) return false;
    if (attFilter === "Absent" && w?.today.attendance && w.today.attendance.status !== "Absent") return false;
    const sc = w?.performance?.finalScore;
    if (perfFilter === "High" && !(sc !== null && sc >= 80)) return false;
    if (perfFilter === "Mid" && !(sc !== null && sc >= 60 && sc < 80)) return false;
    if (perfFilter === "Low" && !(sc !== null && sc < 60)) return false;
    return true;
  });

  const ov = data.workOverview || {};
  const openEmp = employees.find((e) => e.id === openId) || null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> কর্মকর্তা ও মানবসম্পদ ৩৬০° ডিরেক্টরি
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            প্রতিটি কর্মীর লাইভ কাজ, প্রগ্রেস স্লাইডার, রেটিং, হাজিরা, ছুটি ও পূর্ণাঙ্গ পারফরম্যান্স
          </p>
        </div>
        <Link
          href="/work-center"
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition"
        >
          <Briefcase className="w-4 h-4" /> কাজ ও কার্যক্রম কেন্দ্র →
        </Link>
      </div>

      {/* Summary KPI Counters */}
      {isMgmt && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            ["সক্রিয় কর্মী", ov.activeEmployees, "text-slate-900"],
            ["আজ উপস্থিত", ov.presentToday, "text-emerald-600"],
            ["আজ অনুপস্থিত", ov.absentToday, "text-rose-600"],
            ["চলমান কাজ", ov.activeTasks, "text-blue-600"],
            ["আজ সম্পন্ন", ov.completedToday, "text-emerald-600"],
            ["অনুমোদন বাকি", ov.awaitingReview, "text-purple-600"],
            ["ওভারডিউ", ov.overdue, "text-rose-600"],
            ["আজকের আপডেট", ov.dailyUpdatesToday, "text-indigo-600"],
          ].map(([l, v, c]) => (
            <div key={String(l)} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[10px] text-slate-500">{l}</p>
              <p className={`text-xl font-extrabold ${c}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      {isMgmt && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম, কোড (EMP), পদবি বা ফোন নম্বর খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select value={company} onChange={(e) => setCompany(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব কোম্পানি</option>
              <option value="INSAF">INSAF</option>
              <option value="IBDC">INSAF BUILDING DESIGN</option>
              <option value="IREL">INSAF REAL ESTATE</option>
            </select>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব বিভাগ</option>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={workFilter} onChange={(e) => setWorkFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব কাজের অবস্থা</option>
              <option value="Overdue">ওভারডিউ আছে</option>
              <option value="Pending">পেন্ডিং কাজ</option>
              <option value="Review">অনুমোদন বাকি</option>
              <option value="NoUpdate">আজ আপডেট নেই</option>
            </select>
            <select value={attFilter} onChange={(e) => setAttFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব হাজিরা</option>
              <option value="Present">আজ উপস্থিত</option>
              <option value="Absent">আজ অনুপস্থিত</option>
            </select>
            <select value={perfFilter} onChange={(e) => setPerfFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব পারফরম্যান্স</option>
              <option value="High">সেরা (৮০+)</option>
              <option value="Mid">ভালো (৬০–৭৯)</option>
              <option value="Low">উন্নতি দরকার (&lt;৬০)</option>
            </select>
          </div>
        </div>
      )}

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((e) => {
          const w = workMap.get(e.id);
          const att = w?.today?.attendance;
          const site = e.assignedSite || (projects.find((p) => (p.assignedStaffIds || []).includes(e.id))?.name ?? "");
          const isSelected = openId === e.id;

          return (
            <Fragment key={e.id}>
              <button
                type="button"
                onClick={() => setOpenId(isSelected ? null : e.id)}
                className={`text-left bg-white p-4 rounded-2xl border-2 transition shadow-xs ${
                  isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                      {e.empCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">{fixBanglaEncoding(e.name)}</h3>
                    <p className="text-[11px] text-slate-500">{fixBanglaEncoding(e.designation)} • {fixBanglaEncoding(e.department)}</p>
                    <p className="text-[10px] text-slate-400 truncate">{COMPANY_LABEL[e.companyId] || e.companyId}{site ? ` • ${site}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-extrabold ${scoreCls(w?.performance?.finalScore ?? null)}`}>
                      {w?.performance?.finalScore ?? "—"}
                    </p>
                    <p className="text-[10px] text-slate-400">স্কোর</p>
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100 pt-2">
                  <p>📞 {e.phone} • ✉️ {e.email}</p>
                  <p>
                    আজকের হাজিরা:{" "}
                    {att && att.status !== "Absent" ? (
                      <strong className="text-emerald-700">
                        {att.status} {att.checkIn ? `(${att.checkIn}${att.checkOut ? `–${att.checkOut}` : " • সক্রিয়"})` : ""}
                      </strong>
                    ) : (
                      <strong className="text-rose-600">অনুপস্থিত</strong>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-1 mt-2.5 text-center text-[10px]">
                  <div className="bg-blue-50 rounded p-1"><p className="font-bold text-blue-700 text-sm">{w?.all?.pending ?? 0}</p>চলমান</div>
                  <div className="bg-emerald-50 rounded p-1"><p className="font-bold text-emerald-700 text-sm">{w?.all?.completed ?? 0}</p>সম্পন্ন</div>
                  <div className="bg-purple-50 rounded p-1"><p className="font-bold text-purple-700 text-sm">{w?.all?.awaitingReview ?? 0}</p>রিভিউ</div>
                  <div className="bg-rose-50 rounded p-1"><p className="font-bold text-rose-700 text-sm">{w?.overdueCount ?? 0}</p>ওভারডিউ</div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                  <span>৩৬০° সম্পূর্ণ প্রোফাইল দেখুন</span>
                  <span>{isSelected ? "▲ বন্ধ করুন" : "▼ খুলুন"}</span>
                </div>
              </button>

              {/* Mobile Inline 360 View */}
              {openEmp && Number(openEmp.id) === Number(e.id) && (
                <div className="min-w-0 w-full md:hidden my-2">
                  <Employee360
                    emp={openEmp}
                    work={workMap.get(openEmp.id)}
                    data={data}
                    isMgmt={isMgmt}
                    isSelf={openEmp.id === me?.employeeId}
                    onClose={() => setOpenId(null)}
                    onMutate={onMutate}
                    projects={projects}
                    sites={sites}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            কোনো কর্মী পাওয়া যায়নি।
          </div>
        )}
      </div>

      {/* Desktop 360 View Panel */}
      <div className="hidden md:block">
        {openEmp && (
          <Employee360
            emp={openEmp}
            work={workMap.get(openEmp.id)}
            data={data}
            isMgmt={isMgmt}
            isSelf={openEmp.id === me?.employeeId}
            onClose={() => setOpenId(null)}
            onMutate={onMutate}
            projects={projects}
            sites={sites}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEE 360° PROFILE VIEW
// ============================================================================
const TABS = [
  ["overview", "সারাংশ (Overview)", Activity],
  ["tasks", "কাজের তালিকা ও প্রগ্রেস", ClipboardList],
  ["daily", "দৈনিক আপডেট", FileText],
  ["attendance", "হাজিরা", Clock],
  ["leave", "ছুটি", Calendar],
  ["projects", "প্রজেক্ট ও সাইট", Briefcase],
  ["performance", "পারফরম্যান্স স্কোর", Award],
  ["documents", "ডকুমেন্ট ও প্রমাণ", Paperclip],
  ["timeline", "কার্যক্রম টাইমলাইন", Activity],
] as const;

function Employee360({
  emp,
  work,
  data,
  isMgmt,
  isSelf,
  onClose,
  onMutate,
  projects,
  sites,
}: {
  emp: any;
  work: any;
  data: any;
  isMgmt: boolean;
  isSelf: boolean;
  onClose?: () => void;
  onMutate: (p: Record<string, unknown>) => Promise<any>;
  projects: any[];
  sites: any[];
}) {
  const [tab, setTab] = useState<string>("overview");
  const empTasks: any[] = (data.tasks || []).filter((t: any) => Number(t.assignedTo) === Number(emp.id) && t.status !== "Cancelled");
  const comments: any[] = data.taskComments || [];
  const files: any[] = data.workFiles || [];
  const dws: any[] = (data.dailyWorks || []).filter((d: any) => Number(d.employeeId) === Number(emp.id));
  const atts: any[] = (data.attendances || []).filter((a: any) => Number(a.employeeId) === Number(emp.id));
  const leaves: any[] = (data.leaveRequests || []).filter((l: any) => Number(l.employeeId) === Number(emp.id));
  const perfReviews: any[] = (data.performanceReviews || []).filter((p: any) => Number(p.employeeId) === Number(emp.id));
  const docs: any[] = (data.documents || []).filter((d: any) => d.category === "Employee" && (Number(d.relatedEntityId) === Number(emp.id) || d.relatedEntityCode === emp.empCode));
  const empFiles = files.filter((f) => Number(f.employeeId) === Number(emp.id));
  const projMap = new Map(projects.map((p) => [p.id, p]));
  const siteMap = new Map(sites.map((s) => [s.id, s]));

  const runningTasks = empTasks.filter((t) => ["Accepted", "In Progress", "Reopened"].includes(t.status));
  const completedTasks = empTasks.filter((t) => t.status === "Completed");

  // Ratings Summary
  const ratingCounts = {
    Best: completedTasks.filter((t) => t.rating === "Best").length,
    Better: completedTasks.filter((t) => t.rating === "Better").length,
    Good: completedTasks.filter((t) => t.rating === "Good").length,
    NeedsImprovement: completedTasks.filter((t) => t.rating === "Needs Improvement").length,
    Penalty: completedTasks.filter((t) => t.rating === "Penalty").length,
  };

  const printProfile = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-500 overflow-hidden shadow-xl mt-4">
      {/* 360 Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
            EMPLOYEE 360° PROFILE • {emp.empCode}
          </span>
          <h2 className="text-xl font-extrabold mt-1">{fixBanglaEncoding(emp.name)}</h2>
          <p className="text-xs text-slate-300">
            {fixBanglaEncoding(emp.designation)} • {fixBanglaEncoding(emp.department)} • {COMPANY_LABEL[emp.companyId] || emp.companyId}
            {emp.assignedSite ? ` • সাইট: ${emp.assignedSite}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-extrabold ${scoreCls(work?.performance?.finalScore ?? null)}`}>
              {work?.performance?.finalScore ?? "—"}
            </p>
            <p className="text-[10px] text-slate-400">পারফরম্যান্স স্কোর</p>
          </div>

          <button
            type="button"
            onClick={printProfile}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
            title="প্রোফাইল প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 p-1">
        {TABS.map(([k, l, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
              tab === k ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {l}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* ==================== 1. OVERVIEW TAB ==================== */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* 4 Core Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Live Tasks */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-600" /> চলমান কাজ
                  </span>
                  <span className="text-lg font-extrabold text-indigo-700">{runningTasks.length}টি</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>মোট অ্যাসাইন: <strong>{empTasks.length}</strong>টি</p>
                  <p>অনুমোদন বাকি: <strong>{empTasks.filter((t) => t.status === "Review").length}</strong>টি</p>
                  <p>সংশোধন প্রয়োজন: <strong>{empTasks.filter((t) => t.status === "Reopened").length}</strong>টি</p>
                </div>
              </div>

              {/* Card 2: Attendance */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" /> হাজিরা ও শিফট
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {work?.today?.attendance?.status || "রেকর্ড নেই"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>আজকের ইন: <strong>{work?.today?.attendance?.checkIn || "—"}</strong></p>
                  <p>আজকের আউট: <strong>{work?.today?.attendance?.checkOut || (work?.today?.attendance?.checkIn ? "কার্যরত" : "—")}</strong></p>
                  <p>দেরি: <strong>{num(work?.today?.attendance?.lateMinutes)} মিনিট</strong></p>
                </div>
              </div>

              {/* Card 3: Ratings */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" /> কাজের মান ও রেটিং
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700">{completedTasks.length}টি শেষ</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>সেরা (Best): <strong className="text-emerald-700">{ratingCounts.Best}টি</strong></p>
                  <p>ভালো (Good/Better): <strong className="text-blue-700">{ratingCounts.Better + ratingCounts.Good}টি</strong></p>
                  <p>পেনাল্টি / ভুল: <strong className="text-rose-600">{ratingCounts.Penalty}টি</strong></p>
                </div>
              </div>

              {/* Card 4: HR & Leaves */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" /> এইচআর ও ছুটি
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">{emp.employmentStatus}</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>মূল বেতন: <strong>৳{num(emp.basicSalary).toLocaleString()}</strong></p>
                  <p>অনুমোদিত ছুটি: <strong>{leaves.filter((l) => l.status === "Approved").length}টি</strong></p>
                  <p>যোগদান: <strong>{fmtDate(emp.joiningDate)}</strong></p>
                </div>
              </div>
            </div>

            {/* Live Running Tasks Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" /> বর্তমানে চলমান কাজের লাইভ প্রগ্রেস ({runningTasks.length})
                </h3>
                <Link href="/work-center" className="text-xs font-bold text-emerald-600 hover:underline">
                  কাজ ও কার্যক্রম কেন্দ্রে যান →
                </Link>
              </div>

              {runningTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">বর্তমানে কোনো কাজ চলমান নেই।</p>
              ) : (
                <div className="space-y-2.5">
                  {runningTasks.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{fixBanglaEncoding(t.title)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-indigo-700">{t.progressPercent || 0}%</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusCls(t.status)}`}>
                            {STATUS_LABEL[t.status] || t.status}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                          style={{ width: `${t.progressPercent || 0}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500">
                        <span>দিয়েছেন: {t.assignedByName || t.createdBy || "—"}</span>
                        <span>শুরু: {t.startDate || "—"} • শেষ তারিখ: {t.dueDate || "—"}</span>
                      </div>

                      {t.status === "Reopened" && (
                        <p className="p-2 rounded bg-rose-100 text-[11px] text-rose-800 font-semibold">
                          সংশোধনের নির্দেশ ({t.reviewedBy || "ম্যানেজমেন্ট"}): {t.reviewNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 2. TASKS TAB ==================== */}
        {tab === "tasks" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">সকল অ্যাসাইনকৃত কাজের তালিকা ({empTasks.length})</h3>
              <Link href="/work-center" className="text-xs font-bold text-emerald-600 hover:underline">
                নতুন কাজ দিন / আপডেট করুন →
              </Link>
            </div>

            <div className="space-y-2.5">
              {empTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {t.taskCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{fixBanglaEncoding(t.title)}</h4>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {t.rating && RATING_BN[t.rating] && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${RATING_BN[t.rating].cls}`}>
                          ★ {RATING_BN[t.rating].label}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusCls(t.status)}`}>
                        {STATUS_LABEL[t.status] || t.status}
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${t.progressPercent >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${t.progressPercent || 0}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>দিয়েছেন: <strong>{t.assignedByName || t.createdBy}</strong></span>
                    <span>অগ্রগতি: <strong>{t.progressPercent}%</strong> • ডেডলাইন: {t.dueDate}</span>
                  </div>

                  {t.completionNote && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                      নোট: {t.completionNote}
                    </p>
                  )}
                </div>
              ))}
              {empTasks.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">কোনো টাস্ক পাওয়া যায়নি।</p>}
            </div>
          </div>
        )}

        {/* ==================== 3. DAILY WORKS TAB ==================== */}
        {tab === "daily" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">জমাকৃত দৈনিক সারাংশ ও কাজের রিপোর্ট ({dws.length})</h3>
            <div className="space-y-2">
              {dws.map((d) => (
                <div key={d.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{d.date}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      প্রগ্রেস: {d.progressPercent}%
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{fixBanglaEncoding(d.workSummary)}</p>
                  {d.problems && <p className="text-rose-700"><strong>সমস্যা:</strong> {d.problems}</p>}
                  {d.tomorrowPlan && <p className="text-indigo-700"><strong>আগামীকালের পরিকল্পনা:</strong> {d.tomorrowPlan}</p>}
                </div>
              ))}
              {dws.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">কোনো দৈনিক আপডেট পাওয়া যায়নি।</p>}
            </div>
          </div>
        )}

        {/* ==================== 4. ATTENDANCE TAB ==================== */}
        {tab === "attendance" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">হাজিরা রেজিস্টার ও শিফট রেকর্ড ({atts.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5">তারিখ</th>
                    <th className="p-2.5">সকাল IN</th>
                    <th className="p-2.5">সকাল OUT</th>
                    <th className="p-2.5">বিকাল IN</th>
                    <th className="p-2.5">বিকাল OUT</th>
                    <th className="p-2.5">ঘণ্টা</th>
                    <th className="p-2.5">লেট</th>
                    <th className="p-2.5">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {atts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-slate-800">{a.date}</td>
                      <td className="p-2.5 font-mono text-emerald-700">{a.checkIn || "—"}</td>
                      <td className="p-2.5 font-mono text-blue-700">{a.checkOut || "—"}</td>
                      <td className="p-2.5 font-mono text-emerald-700">{a.checkIn2 || "—"}</td>
                      <td className="p-2.5 font-mono text-blue-700">{a.checkOut2 || "—"}</td>
                      <td className="p-2.5 font-semibold">{num(a.workingHours).toFixed(1)}h</td>
                      <td className="p-2.5 text-amber-700">{num(a.lateMinutes)} মি.</td>
                      <td className="p-2.5 font-bold">{a.status}</td>
                    </tr>
                  ))}
                  {atts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">হাজিরার কোনো রেকর্ড নেই।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 5. LEAVES TAB ==================== */}
        {tab === "leave" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">ছুটির আবেদন ও অনুমোদনের ইতিহাস ({leaves.length})</h3>
            <div className="space-y-2">
              {leaves.map((l) => (
                <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{l.leaveCode}</span>
                    <span className="ml-2 font-semibold text-slate-700">{l.leaveType} ছুটি</span>
                    <p className="text-slate-500 mt-0.5">{l.startDate} থেকে {l.endDate} ({l.totalDays} দিন) — কারণ: {l.reason}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    l.status === "Approved" ? "bg-emerald-100 text-emerald-800" : l.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
              {leaves.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">কোনো ছুটির রেকর্ড নেই।</p>}
            </div>
          </div>
        )}

        {/* ==================== 6. PROJECTS TAB ==================== */}
        {tab === "projects" && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">সংযুক্ত প্রজেক্ট ও সাইট টাস্ক</h3>
            {Array.from(new Set(empTasks.map((t) => `${t.projectId || 0}|${t.siteId || 0}`))).map((key) => {
              const [pid, sid] = key.split("|").map(Number);
              const list = empTasks.filter((t) => (t.projectId || 0) === pid && (t.siteId || 0) === sid);
              const p: any = projMap.get(pid);
              const s: any = siteMap.get(sid);
              return (
                <div key={key} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <p className="font-bold text-slate-900 text-sm">
                    {p ? `${p.projectCode} — ${p.name}` : "সাধারণ অফিসিয়াল কাজ"}
                    {s ? ` • সাইট: ${s.name}` : ""}
                  </p>
                  <ul className="space-y-1 pl-2">
                    {list.map((t) => (
                      <li key={t.id} className="text-slate-700">
                        • {fixBanglaEncoding(t.title)} — <strong>{STATUS_LABEL[displayStatus(t)] || t.status}</strong> ({t.progressPercent}%)
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {empTasks.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">কোনো প্রজেক্ট বা সাইটের কাজ নেই।</p>}
          </div>
        )}

        {/* ==================== 7. PERFORMANCE SCORE TAB ==================== */}
        {tab === "performance" && work && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-bold">স্বয়ংক্রিয় সিস্টেম স্কোর</p>
                <p className={`text-2xl font-extrabold mt-1 ${scoreCls(work.performance?.autoScore)}`}>
                  {work.performance?.autoScore ?? "—"}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-bold">ম্যানেজমেন্ট রিভিউ স্কোর</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">
                  {work.performance?.manualScore ?? "—"}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 text-white">
                <p className="text-emerald-400 font-bold">চূড়ান্ত কার্যকর স্কোর</p>
                <p className="text-2xl font-extrabold text-emerald-300 mt-1">
                  {work.performance?.finalScore ?? "—"}/১০০
                </p>
              </div>
            </div>

            {isMgmt && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const scoreVal = target.score.value;
                  const commentVal = target.comment.value;
                  const r = await onMutate({
                    action: "addManualPerformanceScore",
                    employeeId: emp.id,
                    score: Number(scoreVal),
                    comments: commentVal,
                    period: new Date().toISOString().slice(0, 7),
                  });
                  if (r?.success) {
                    alert("পারফরম্যান্স স্কোর সংরক্ষণ হয়েছে");
                    target.reset();
                  }
                }}
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2"
              >
                <p className="font-bold text-amber-900">ম্যানেজমেন্ট মূল্যায়ন স্কোর ও মন্তব্য দিন</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    name="score"
                    type="number"
                    min={0}
                    max={100}
                    required
                    placeholder="স্কোর (০-১০০)"
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <input
                    name="comment"
                    placeholder="মূল্যায়ন মন্তব্য লিখুন..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <button type="submit" className="py-2 rounded-xl bg-slate-900 text-white font-bold">
                    স্কোর সংরক্ষণ
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==================== 8. DOCUMENTS & EVIDENCE TAB ==================== */}
        {tab === "documents" && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">কাজের ফাইল ও প্রমাণপত্র ({empFiles.length + docs.length})</h3>
            <div className="space-y-2">
              {empFiles.map((f) => (
                <a
                  key={f.id}
                  href={`/api/files/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap justify-between items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
                >
                  <span className="flex items-center gap-2 font-bold text-blue-700">
                    <Paperclip className="w-4 h-4" /> {f.fileName}
                  </span>
                  <span className="text-slate-500">
                    {Math.round(f.sizeBytes / 1024)} KB • {fmtDateTime(f.createdAt)}
                  </span>
                </a>
              ))}
              {empFiles.length === 0 && docs.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">কোনো সংযুক্ত ফাইল নেই।</p>
              )}
            </div>
          </div>
        )}

        {/* ==================== 9. TIMELINE TAB ==================== */}
        {tab === "timeline" && (
          <Timeline
            tasks={empTasks}
            comments={comments}
            dws={dws}
            atts={atts}
            leaves={leaves}
            followups={data.leadFollowups || []}
            reviews={perfReviews}
            files={files}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE COMPONENT
// ============================================================================
function Timeline({ tasks, comments, dws, atts, leaves, followups, reviews, files }: any) {
  const taskIds = new Set(tasks.map((t: any) => t.id));
  const taskMap = new Map(tasks.map((t: any) => [t.id, t]));
  const events: Array<{ at: string; kind: string; text: string; ids?: number[] }> = [];

  atts.forEach((a: any) => {
    if (a.checkIn) {
      events.push({
        at: `${a.date}T${a.checkIn}:00`,
        kind: "হাজিরা",
        text: `ইন ${a.checkIn}${a.checkOut ? ` • আউট ${a.checkOut}` : " (কার্যরত)"} • স্ট্যাটাস: ${a.status}`,
      });
    }
  });

  comments
    .filter((c: any) => taskIds.has(c.taskId))
    .forEach((c: any) => {
      const t: any = taskMap.get(c.taskId);
      events.push({
        at: new Date(c.createdAt).toISOString(),
        kind: eventLabel(c),
        text: `${t?.taskCode ? `[${t.taskCode}] ` : ""}${t?.title || ""}: ${c.comment}`,
        ids: c.fileIds,
      });
    });

  dws.forEach((d: any) => {
    events.push({
      at: new Date(d.createdAt).toISOString(),
      kind: "দৈনিক আপডেট",
      text: `${d.workSummary} (প্রগ্রেস: ${d.progressPercent}%)`,
    });
  });

  leaves.forEach((l: any) => {
    events.push({
      at: new Date(l.createdAt).toISOString(),
      kind: "ছুটি",
      text: `${l.leaveType} ছুটি (${l.startDate} হতে ${l.endDate}) • অবস্থা: ${l.status}`,
    });
  });

  events.sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className="border-l-2 border-emerald-500 pl-4 space-y-3">
      {events.slice(0, 100).map((e, i) => (
        <div key={i} className="text-xs space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{e.kind}</span>
            <span className="text-[11px] text-slate-400">{fmtDateTime(e.at)}</span>
          </div>
          <p className="text-slate-700">{e.text}</p>
          {e.ids && e.ids.length > 0 && <FileLinks ids={e.ids} files={files} />}
        </div>
      ))}
      {events.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">কোনো টাইমলাইন রেকর্ড নেই।</p>}
    </div>
  );
}
// ============================================================================
// TASK CARD (TeamTaskMonitorView এটি ব্যবহার করে)
// ============================================================================
export function TaskCard({
  t, comments, files, isMgmt, isSelf, onMutate, projects, sites, employees, defaultTimeline = false,
}: any) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showTimeline, setShowTimeline] = useState(defaultTimeline);
  const ds = displayStatus(t);
  const p = (projects || []).find((x: any) => x.id === t.projectId);
  const s = (sites || []).find((x: any) => x.id === t.siteId);
  const taskFiles = (files || []).filter((f: any) => f.taskId === t.id);
  const open = t.status !== "Completed" && t.status !== "Cancelled";
  const overdueDays =
    ds === "Overdue"
      ? Math.round((new Date(today()).getTime() - new Date(t.dueDate).getTime()) / 86400000)
      : 0;
  const sortedComments = [...(comments || [])].sort((a: any, b: any) =>
    a.createdAt < b.createdAt ? -1 : 1
  );

  return (
    <div className="p-4 rounded-2xl border border-slate-200 space-y-2 bg-white">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{t.taskCode}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusCls(ds)}`}>
              {STATUS_LABEL[ds] || ds}{overdueDays ? ` ${overdueDays} দিন` : ""}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {t.priority}
            </span>
            {t.rating && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ★ {t.rating}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1">{t.title}</h4>
          {t.description && <p className="text-xs text-slate-600">{t.description}</p>}
        </div>
        <div className="text-right text-[11px] text-slate-500 shrink-0">
          <p>দিয়েছেন: <strong className="text-slate-800">{t.assignedByName || t.createdBy}</strong></p>
          <p>শুরু: {fmtDate(t.startDate)}</p>
          <p className={ds === "Overdue" ? "text-rose-600 font-bold" : ""}>
            ডেডলাইন: {fmtDate(t.dueDate)}{t.dueTime ? ` ${t.dueTime}` : ""}
          </p>
          <p>দেখেছেন: {t.viewedAt ? fmtDateTime(t.viewedAt) : "এখনো দেখেননি"}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-slate-600">
          <span>অগ্রগতি</span>
          <span className="font-bold">{t.progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${t.progressPercent >= 100 ? "bg-emerald-500" : ds === "Overdue" ? "bg-rose-500" : "bg-blue-500"}`}
            style={{ width: `${t.progressPercent}%` }}
          />
        </div>
      </div>

      {t.reviewNote && (
        <p className={`p-2 rounded-lg text-[11px] ${
          t.status === "Reopened" ? "bg-rose-50 text-rose-800" : "bg-purple-50 text-purple-800"
        }`}>
          <strong>{t.status === "Reopened" ? "সংশোধনের নির্দেশ" : "রিভিউ নোট"}:</strong> {t.reviewNote}
          {t.correctionCount ? ` (সংশোধন ${t.correctionCount}বার)` : ""}
        </p>
      )}

      {taskFiles.length > 0 && <FileLinks ids={taskFiles.map((f: any) => f.id)} files={files} />}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {isSelf && open && (t.status === "Todo" || t.status === "Pending Acceptance") && (
          <button
            type="button"
            onClick={() => onMutate({ action: "updateTaskStatus", taskId: t.id, status: "Accepted" })}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold"
          >
            গ্রহণ করুন
          </button>
        )}
        {isSelf && open && (t.status === "Accepted" || t.status === "Reopened") && (
          <button
            type="button"
            onClick={() => onMutate({ action: "updateTaskStatus", taskId: t.id, status: "In Progress" })}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold"
          >
            কাজ শুরু করুন
          </button>
        )}
        {isSelf && open && t.status !== "Review" && (
          <button
            type="button"
            onClick={() =>
              onMutate({
                action: "updateTaskStatus",
                taskId: t.id,
                status: "Completed",
                progressPercent: 100,
                completionNote: "কাজ সম্পন্ন — রিভিউর জন্য জমা",
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-bold"
          >
            সম্পন্ন — রিভিউতে পাঠান
          </button>
        )}
        {isMgmt && t.status === "Review" && (
          <>
            <button
              type="button"
              onClick={() => onMutate({ action: "reviewTask", taskId: t.id, decision: "Approve" })}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
            >
              অনুমোদন
            </button>
            <button
              type="button"
              onClick={() => {
                const reason = prompt("সংশোধনের কারণ লিখুন:");
                if (reason && reason.trim()) onMutate({ action: "reviewTask", taskId: t.id, decision: "Correction", reason });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-orange-600 text-white text-[11px] font-bold"
            >
              সংশোধন প্রয়োজন
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowTimeline(!showTimeline)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold"
        >
          টাইমলাইন ({(comments || []).length})
        </button>
      </div>

      {showTimeline && (
        <div className="border-l-2 border-emerald-500 pl-3 ml-1 space-y-2 pt-1">
          {sortedComments.map((c: any) => (
            <div key={c.id} className="text-[11px]">
              <p>
                <strong className="text-slate-900">{eventLabel(c)}</strong> • {fmtDateTime(c.createdAt)} • {c.authorName}
                {c.actorDesignation ? ` (${c.actorDesignation})` : ""}
                {c.progressPercent !== null && c.progressPercent !== undefined ? ` • ${c.progressPercent}%` : ""}
              </p>
              <p className="text-slate-600">{c.comment}</p>
              <FileLinks ids={c.fileIds || []} files={files} />
            </div>
          ))}
          {sortedComments.length === 0 && (
            <p className="text-[11px] text-slate-400">এখনো কোনো ইভেন্ট নেই</p>
          )}
        </div>
      )}
    </div>
  );
}