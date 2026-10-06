"use client";

import { Fragment } from "react";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";


export const STATUS_LABEL: Record<string, string> = {
  Todo: "শুরু হয়নি",
  Accepted: "গ্রহণ করা হয়েছে",
  "In Progress": "চলমান",
  Review: "রিভিউর অপেক্ষায়",
  Reopened: "সংশোধন প্রয়োজন",
  Blocked: "আটকে আছে",
  Completed: "সম্পন্ন",
  Cancelled: "বাতিল",
  Overdue: "ওভারডিউ",
};

const COMPANY_LABEL: Record<string, string> = {
  INSAF: "INSAF",
  IBDC: "INSAF BUILDING DESIGN & CONSULTANT LTD.",
  IREL: "INSAF REAL ESTATE LTD.",
};

const EVENT_LABEL: Record<string, string> = {
  Assigned: "টাস্ক দেওয়া হয়েছে",
  Accepted: "কর্মী গ্রহণ করেছেন",
  Started: "কাজ শুরু",
  ProgressUpdate: "অগ্রগতি আপডেট",
  ProofSubmitted: "প্রমাণ/ফাইল জমা",
  SubmittedForReview: "রিভিউর জন্য জমা",
  ReviewApproved: "ম্যানেজমেন্ট অনুমোদন",
  CorrectionRequired: "সংশোধন প্রয়োজন",
  StatusChange: "স্ট্যাটাস পরিবর্তন",
  Reassigned: "পুনঃবণ্টন",
  DeadlineChanged: "ডেডলাইন/অগ্রাধিকার পরিবর্তন",
  Comment: "মন্তব্য",
  Viewed: "টাস্ক দেখা হয়েছে",
  Overdue: "ডেডলাইন পার",
};

export const EVENT_CODE_LABEL: Record<string, string> = {
  TASK_ASSIGNED: "টাস্ক দেওয়া হয়েছে",
  TASK_VIEWED: "টাস্ক দেখা হয়েছে",
  TASK_ACCEPTED: "গ্রহণ করেছেন",
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
  TASK_COMMENT: "মন্তব্য",
};

export function eventLabel(c: any) {
  return (c.eventType && EVENT_CODE_LABEL[c.eventType]) || EVENT_LABEL[c.actionType] || c.actionType;
}

const MGMT_ROLES = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Project Manager"];

function today() {
  return new Date().toISOString().split("T")[0];
}
export function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
export function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
export function displayStatus(t: any) {
  if (t.status === "Completed" || t.status === "Cancelled") return t.status;
  const d = today();
  if (t.dueDate < d) return "Overdue";
  if (t.dueDate === d && t.dueTime && t.dueTime < new Date().toTimeString().slice(0, 5)) return "Overdue";
  return t.status;
}
export function statusCls(s: string) {
  if (s === "Completed") return "bg-emerald-100 text-emerald-800";
  if (s === "Overdue") return "bg-rose-600 text-white";
  if (s === "Review") return "bg-purple-100 text-purple-800";
  if (s === "Reopened") return "bg-orange-100 text-orange-800";
  if (s === "Blocked") return "bg-rose-100 text-rose-700";
  if (s === "In Progress") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}
function scoreCls(n: number | null) {
  if (n === null) return "text-slate-400";
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
          <a key={id} href={`/api/files/${id}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold hover:underline">
            <Paperclip className="w-3 h-3" /> {f?.fileName || `ফাইল #${id}`}
          </a>
        );
      })}
    </div>
  );
}

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

  const departments = Array.from(new Set(employees.map((e) => e.department)));

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
    const sc = w?.performance.finalScore;
    if (perfFilter === "High" && !(sc !== null && sc >= 80)) return false;
    if (perfFilter === "Mid" && !(sc !== null && sc >= 60 && sc < 80)) return false;
    if (perfFilter === "Low" && !(sc !== null && sc < 60)) return false;
    return true;
  });

  const ov = data.workOverview || {};
  const openEmp = employees.find((e) => e.id === openId) || null;

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" /> কর্মকর্তা ও মানবসম্পদ ডিরেক্টরি
        </h1>
        <p className="text-xs text-slate-500">
          প্রতিটি কর্মীর দেওয়া কাজ, অগ্রগতি, প্রমাণ, দৈনিক আপডেট, হাজিরা ও পারফরম্যান্স — একই টাস্ক ডাটা থেকে।
        </p>
      </div>

      {isMgmt && (
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {[
            ["সক্রিয় কর্মী", ov.activeEmployees, "text-slate-900"],
            ["আজ উপস্থিত", ov.presentToday, "text-emerald-600"],
            ["আজ অনুপস্থিত", ov.absentToday, "text-rose-600"],
            ["চলমান টাস্ক", ov.activeTasks, "text-blue-600"],
            ["আজ সম্পন্ন", ov.completedToday, "text-emerald-600"],
            ["পেন্ডিং", ov.pending, "text-amber-600"],
            ["রিভিউর অপেক্ষায়", ov.awaitingReview, "text-purple-600"],
            ["ওভারডিউ", ov.overdue, "text-rose-600"],
            ["আজকের আপডেট", ov.dailyUpdatesToday, "text-indigo-600"],
          ].map(([l, v, c]) => (
            <div key={String(l)} className="bg-white p-3 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500">{l}</p>
              <p className={`text-xl font-bold ${c}`}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {isMgmt && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, আইডি, পদবি, ফোন খুঁজুন"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm" />
            </div>
            <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full min-w-0 sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব কোম্পানি</option>
              <option value="INSAF">INSAF</option>
              <option value="IBDC">INSAF BUILDING DESIGN</option>
              <option value="IREL">INSAF REAL ESTATE</option>
            </select>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full min-w-0 sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব বিভাগ</option>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={workFilter} onChange={(e) => setWorkFilter(e.target.value)} className="w-full min-w-0 sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব কাজের অবস্থা</option>
              <option value="Overdue">ওভারডিউ আছে</option>
              <option value="Pending">পেন্ডিং আছে</option>
              <option value="Review">রিভিউর অপেক্ষায়</option>
              <option value="NoUpdate">আজ আপডেট দেয়নি</option>
            </select>
            <select value={attFilter} onChange={(e) => setAttFilter(e.target.value)} className="w-full min-w-0 sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব হাজিরা</option>
              <option value="Present">আজ উপস্থিত</option>
              <option value="Absent">আজ অনুপস্থিত</option>
            </select>
            <select value={perfFilter} onChange={(e) => setPerfFilter(e.target.value)} className="w-full min-w-0 sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="All">সব পারফরম্যান্স</option>
              <option value="High">৮০+</option>
              <option value="Mid">৬০–৭৯</option>
              <option value="Low">৬০-এর নিচে</option>
            </select>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5">কর্মী</th>
                  <th className="p-2.5">দেওয়া</th>
                  <th className="p-2.5">চলমান</th>
                  <th className="p-2.5">সম্পন্ন</th>
                  <th className="p-2.5">পেন্ডিং</th>
                  <th className="p-2.5">রিভিউ</th>
                  <th className="p-2.5">ওভারডিউ</th>
                  <th className="p-2.5">সম্পন্ন %</th>
                  <th className="p-2.5">স্কোর</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const w = workMap.get(e.id);
                  return (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setOpenId(e.id)}>
                      <td className="p-2.5 font-bold text-slate-900">{e.name}<span className="block text-[10px] text-slate-400 font-normal">{e.designation}</span></td>
                      <td className="p-2.5">{w?.all.assigned ?? 0}</td>
                      <td className="p-2.5 text-blue-700">{w?.all.inProgress ?? 0}</td>
                      <td className="p-2.5 text-emerald-700">{w?.all.completed ?? 0}</td>
                      <td className="p-2.5 text-amber-700">{w?.all.notStarted ?? 0}</td>
                      <td className="p-2.5 text-purple-700">{w?.all.awaitingReview ?? 0}</td>
                      <td className="p-2.5 font-bold text-rose-600">
                        {w?.overdueCount ?? 0}
                        {w?.oldestOverdueDays > 0 && <span className="block text-[10px] font-normal">সবচেয়ে পুরনো {w.oldestOverdueDays} দিন</span>}
                      </td>
                      <td className="p-2.5">{w?.all.completionPercent ?? 0}%</td>
                      <td className={`p-2.5 font-bold ${scoreCls(w?.performance.finalScore ?? null)}`}>{w?.performance.finalScore ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLOYEE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((e) => {
          const w = workMap.get(e.id);
          const att = w?.today.attendance;
          const site = e.assignedSite || (projects.find((p) => (p.assignedStaffIds || []).includes(e.id))?.name ?? "");
          return (
            <Fragment key={e.id}>
            <button type="button" onClick={() => setOpenId(e.id)}
              className={`text-left bg-white p-4 rounded-2xl border-2 transition ${openId === e.id ? "border-emerald-500" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{e.empCode}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">{e.name}</h3>
                  <p className="text-[11px] text-slate-500">{e.designation} • {e.department}</p>
                  <p className="text-[10px] text-slate-400 truncate">{COMPANY_LABEL[e.companyId] || e.companyId}{site ? ` • ${site}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${scoreCls(w?.performance.finalScore ?? null)}`}>{w?.performance.finalScore ?? "—"}</p>
                  <p className="text-[10px] text-slate-400">স্কোর</p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>📞 {e.phone} • ✉️ {e.email}</p>
                <p>যোগদান: {fmtDate(e.joiningDate)} • অ্যাকাউন্ট: <strong>{e.employmentStatus}</strong></p>
                <p>
                  আজকের হাজিরা:{" "}
                  {att ? <strong className="text-emerald-700">{att.status} {att.checkIn ? `(${att.checkIn}${att.checkOut ? `–${att.checkOut}` : ""})` : ""}</strong> : <strong className="text-rose-600">রেকর্ড নেই</strong>}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2 text-center text-[10px]">
                <div className="bg-blue-50 rounded p-1"><p className="font-bold text-blue-700 text-sm">{w?.all.pending ?? 0}</p>চলমান</div>
                <div className="bg-emerald-50 rounded p-1"><p className="font-bold text-emerald-700 text-sm">{w?.all.completed ?? 0}</p>সম্পন্ন</div>
                <div className="bg-amber-50 rounded p-1"><p className="font-bold text-amber-700 text-sm">{w?.all.notStarted ?? 0}</p>পেন্ডিং</div>
                <div className="bg-rose-50 rounded p-1"><p className="font-bold text-rose-700 text-sm">{w?.overdueCount ?? 0}</p>ওভারডিউ</div>
              </div>
              <p className="mt-2 text-[11px] text-slate-600 truncate">আজকের আপডেট: {w?.today.dailyUpdate || <span className="text-slate-400">দেওয়া হয়নি</span>}</p>
              <p className="text-[10px] text-slate-400 truncate">সর্বশেষ কার্যক্রম: {w?.lastActivity ? `${w.lastActivity.text} • ${fmtDateTime(w.lastActivity.at)}` : "—"}</p>
            </button>
              {/* mobile-inline-employee-360 */}
              {openEmp && Number(openEmp.id) === Number(e.id) && (
                <div className="min-w-0 w-full md:hidden">
<Employee360
          key={openEmp.id}
          emp={openEmp}
          work={workMap.get(openEmp.id)}
          data={data}
          isMgmt={isMgmt}
          isSelf={openEmp.id === me?.employeeId}
          onClose={isMgmt ? () => setOpenId(null) : undefined}
          onMutate={onMutate}
          projects={projects}
          sites={sites}
        />
                </div>
              )}
            </Fragment>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-slate-400">কোনো কর্মী পাওয়া যায়নি।</p>}
      </div>

      <div className="hidden md:block">
        {openEmp && (
        <Employee360
          key={openEmp.id}
          emp={openEmp}
          work={workMap.get(openEmp.id)}
          data={data}
          isMgmt={isMgmt}
          isSelf={openEmp.id === me?.employeeId}
          onClose={isMgmt ? () => setOpenId(null) : undefined}
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
// EMPLOYEE 360°
// ============================================================================
const TABS = [
  ["overview", "ওভারভিউ", Activity],
  ["tasks", "দেওয়া কাজ", ClipboardList],
  ["daily", "দৈনিক কাজ", FileText],
  ["attendance", "হাজিরা", Clock],
  ["leave", "ছুটি", Calendar],
  ["projects", "প্রজেক্ট ও সাইট", Briefcase],
  ["performance", "পারফরম্যান্স", Award],
  ["documents", "ডকুমেন্ট", Paperclip],
  ["timeline", "কার্যক্রম টাইমলাইন", Activity],
] as const;

function Employee360({
  emp, work, data, isMgmt, isSelf, onClose, onMutate, projects, sites,
}: {
  emp: any; work: any; data: any; isMgmt: boolean; isSelf: boolean;
  onClose?: () => void; onMutate: (p: Record<string, unknown>) => Promise<any>;
  projects: any[]; sites: any[];
}) {
  const [tab, setTab] = useState<string>("overview");
  const t0 = today();
  const empTasks: any[] = (data.tasks || []).filter((t: any) => t.assignedTo === emp.id && t.status !== "Cancelled");
  const comments: any[] = data.taskComments || [];
  const files: any[] = data.workFiles || [];
  const dws: any[] = (data.dailyWorks || []).filter((d: any) => d.employeeId === emp.id);
  const atts: any[] = (data.attendances || []).filter((a: any) => a.employeeId === emp.id);
  const leaves: any[] = (data.leaveRequests || []).filter((l: any) => l.employeeId === emp.id);
  const perfReviews: any[] = (data.performanceReviews || []).filter((p: any) => p.employeeId === emp.id);
  const followups: any[] = (data.leadFollowups || []).filter((f: any) => f.staffId === emp.id);
  const docs: any[] = (data.documents || []).filter((d: any) => d.category === "Employee" && (d.relatedEntityId === emp.id || d.relatedEntityCode === emp.empCode));
  const empFiles = files.filter((f) => f.employeeId === emp.id);
  const projMap = new Map(projects.map((p) => [p.id, p]));
  const siteMap = new Map(sites.map((s) => [s.id, s]));

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-emerald-400">৩৬০° কর্মী ড্যাশবোর্ড • {emp.empCode}</p>
          <h2 className="text-lg font-bold">{emp.name}</h2>
          <p className="text-xs text-slate-300">{emp.designation} • {emp.department} • {COMPANY_LABEL[emp.companyId] || emp.companyId}{emp.assignedSite ? ` • ${emp.assignedSite}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-bold ${scoreCls(work?.performance.finalScore ?? null)}`}>{work?.performance.finalScore ?? "—"}</p>
            <p className="text-[10px] text-slate-400">এই মাসের স্কোর</p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700" aria-label="বন্ধ করুন">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
        {TABS.map(([k, l, Icon]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 ${tab === k ? "border-emerald-500 text-emerald-700 bg-white" : "border-transparent text-slate-600"}`}>
            <Icon className="w-3.5 h-3.5" /> {l}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === "overview" && work && (
          <>
            <Section title="আজ">
              <Card l="হাজিরা" v={work.today.attendance ? `${work.today.attendance.status}` : "নেই"} c={work.today.attendance ? "text-emerald-600" : "text-rose-600"} />
              <Card l="আজকের টাস্ক" v={work.today.tasks} />
              <Card l="আজ সম্পন্ন" v={work.today.completed} c="text-emerald-600" />
              <Card l="আজ পেন্ডিং" v={work.today.pending} c="text-amber-600" />
            </Section>
            <Section title="এই সপ্তাহ">
              <Card l="দেওয়া" v={work.week.assigned} />
              <Card l="সম্পন্ন" v={work.week.completed} c="text-emerald-600" />
              <Card l="চলমান" v={work.week.inProgress} c="text-blue-600" />
              <Card l="পেন্ডিং" v={work.week.notStarted} c="text-amber-600" />
              <Card l="ওভারডিউ" v={work.week.overdue} c="text-rose-600" />
            </Section>
            <Section title="এই মাস">
              <Card l="মোট দেওয়া" v={work.month.assigned} />
              <Card l="সম্পন্ন" v={work.month.completed} c="text-emerald-600" />
              <Card l="পেন্ডিং" v={work.month.pending} c="text-amber-600" />
              <Card l="ওভারডিউ" v={work.month.overdue} c="text-rose-600" />
              <Card l="সম্পন্ন %" v={`${work.month.completionPercent}%`} />
              <Card l="পারফরম্যান্স" v={work.performance.finalScore ?? "—"} c={scoreCls(work.performance.finalScore)} />
            </Section>
            {work.overdueCount > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {work.overdueCount}টি ওভারডিউ টাস্ক • সবচেয়ে পুরনো {work.oldestOverdueDays} দিন
              </div>
            )}
            <div className="text-xs text-slate-600">
              <p><strong>আজকের আপডেট:</strong> {work.today.dailyUpdate || "দেওয়া হয়নি"}</p>
              <p><strong>সর্বশেষ কার্যক্রম:</strong> {work.lastActivity ? `${work.lastActivity.text} • ${fmtDateTime(work.lastActivity.at)}` : "—"}</p>
            </div>
          </>
        )}

        {tab === "tasks" && (
          <TasksTab emp={emp} tasks={empTasks} comments={comments} files={files} isMgmt={isMgmt} isSelf={isSelf}
            onMutate={onMutate} projects={projects} sites={sites} employees={(data.employees || []).filter((e: any) => !e.archived)} />
        )}

        {tab === "daily" && (
          <DailyTab emp={emp} dws={dws} tasks={empTasks} files={files} isSelf={isSelf} onMutate={onMutate} />
        )}

        {tab === "attendance" && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="bg-slate-50 border-b text-slate-600">
                <th className="p-2">তারিখ</th><th className="p-2">ইন</th><th className="p-2">আউট</th><th className="p-2">কাজের ঘণ্টা</th><th className="p-2">লেট (মি.)</th><th className="p-2">ওভারটাইম</th><th className="p-2">স্ট্যাটাস</th>
              </tr></thead>
              <tbody>
                {atts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="p-2">{a.date}</td><td className="p-2">{a.checkIn || "—"}</td><td className="p-2">{a.checkOut || "—"}</td>
                    <td className="p-2">{a.workingHours}</td><td className="p-2">{a.lateMinutes}</td><td className="p-2">{a.overtimeHours}</td>
                    <td className="p-2 font-semibold">{a.status}</td>
                  </tr>
                ))}
                {atts.length === 0 && <tr><td colSpan={7} className="p-3 text-slate-400">হাজিরার রেকর্ড নেই</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "leave" && (
          <div className="space-y-2">
            {isSelf && <LeaveForm onMutate={onMutate} />}
            {leaves.map((l) => (
              <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap justify-between gap-2">
                <span><strong>{l.leaveCode}</strong> • {l.leaveType} • {l.startDate} → {l.endDate} ({l.totalDays} দিন) — {l.reason}</span>
                <span className="font-bold">{l.status}</span>
              </div>
            ))}
            {leaves.length === 0 && <p className="text-xs text-slate-400">ছুটির রেকর্ড নেই</p>}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-2 text-xs">
            {Array.from(new Set(empTasks.map((t) => `${t.projectId || 0}|${t.siteId || 0}`))).map((key) => {
              const [pid, sid] = key.split("|").map(Number);
              const list = empTasks.filter((t) => (t.projectId || 0) === pid && (t.siteId || 0) === sid);
              const p: any = projMap.get(pid);
              const s: any = siteMap.get(sid);
              return (
                <div key={key} className="p-3 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">{p ? `${p.projectCode} — ${p.name}` : "প্রজেক্ট ছাড়া"}{s ? ` • সাইট: ${s.name}` : ""}</p>
                  <ul className="mt-1 space-y-0.5">
                    {list.map((t) => (
                      <li key={t.id}>• {t.title} — <strong>{STATUS_LABEL[displayStatus(t)]}</strong> ({t.progressPercent}%) • ডেডলাইন {t.dueDate}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {emp.assignedSite && <p className="text-slate-600">নির্ধারিত সাইট: <strong>{emp.assignedSite}</strong></p>}
            {empTasks.length === 0 && <p className="text-slate-400">কোনো প্রজেক্ট/সাইট টাস্ক নেই</p>}
          </div>
        )}

        {tab === "performance" && work && (
          <PerformanceTab emp={emp} work={work} isMgmt={isMgmt} reviews={perfReviews} onMutate={onMutate} />
        )}

        {tab === "documents" && (
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-800">কাজের প্রমাণ ও ফাইল ({empFiles.length})</p>
            {empFiles.map((f) => {
              const t = empTasks.find((x) => x.id === f.taskId);
              return (
                <a key={f.id} href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                  className="flex flex-wrap justify-between gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50">
                  <span className="flex items-center gap-1.5 font-semibold text-blue-700"><Paperclip className="w-3.5 h-3.5" /> {f.fileName}</span>
                  <span className="text-slate-500">{t ? `${t.taskCode} • ` : ""}{Math.round(f.sizeBytes / 1024)} KB • {f.uploadedByName} • {fmtDateTime(f.createdAt)}</span>
                </a>
              );
            })}
            {docs.map((d) => (
              <div key={d.id} className="p-2.5 rounded-xl border border-slate-200">{d.docCode} — {d.name} ({d.fileType})</div>
            ))}
            {empFiles.length === 0 && docs.length === 0 && <p className="text-slate-400">কোনো ফাইল নেই</p>}
          </div>
        )}

        {tab === "timeline" && (
          <Timeline emp={emp} tasks={empTasks} comments={comments} dws={dws} atts={atts} leaves={leaves}
            followups={followups} reviews={perfReviews} files={files} />
        )}
      </div>
    </div>
  );
}

function Card({ l, v, c = "text-slate-900" }: { l: string; v: any; c?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
      <p className="text-[10px] text-slate-500">{l}</p>
      <p className={`text-lg font-bold ${c}`}>{v}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 mb-1.5">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{children}</div>
    </div>
  );
}

// ---------------- TASKS TAB ----------------
function TasksTab({
  emp, tasks, comments, files, isMgmt, isSelf, onMutate, projects, sites, employees,
}: any) {
  const [statusF, setStatusF] = useState("All");
  const [prioF, setPrioF] = useState("All");
  const [projF, setProjF] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showNew, setShowNew] = useState(false);

  const list = tasks
    .filter((t: any) => {
      const ds = displayStatus(t);
      if (statusF === "Open" && (t.status === "Completed")) return false;
      if (statusF !== "All" && statusF !== "Open" && ds !== statusF) return false;
      if (prioF !== "All" && t.priority !== prioF) return false;
      if (projF !== "All" && String(t.projectId || "") !== projF) return false;
      const c = String(t.createdAt).slice(0, 10);
      if (from && c < from && t.dueDate < from) return false;
      if (to && c > to) return false;
      return true;
    })
    .sort((a: any, b: any) => (a.dueDate < b.dueDate ? -1 : 1));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
          <option value="All">সব স্ট্যাটাস</option>
          <option value="Open">খোলা (অসম্পন্ন)</option>
          {Object.keys(STATUS_LABEL).filter((k) => k !== "Cancelled").map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
        <select value={prioF} onChange={(e) => setPrioF(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
          <option value="All">সব অগ্রাধিকার</option>
          {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={projF} onChange={(e) => setProjF(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
          <option value="All">সব প্রজেক্ট</option>
          {projects.map((p: any) => <option key={p.id} value={String(p.id)}>{p.projectCode}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" aria-label="শুরুর তারিখ" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" aria-label="শেষ তারিখ" />
        {isMgmt && (
          <button type="button" onClick={() => setShowNew(!showNew)} className="ml-auto px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> {emp.name.split(" ").slice(-1)[0]}-কে নতুন কাজ দিন
          </button>
        )}
      </div>

      {showNew && isMgmt && <NewTaskForm emp={emp} projects={projects} sites={sites} onMutate={onMutate} onDone={() => setShowNew(false)} />}

      <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
        {[
          ["মোট দেওয়া", tasks.length, "text-slate-900"],
          ["শুরু হয়নি", tasks.filter((t: any) => t.status === "Todo" || t.status === "Accepted").length, "text-slate-600"],
          ["চলমান", tasks.filter((t: any) => t.status === "In Progress" || t.status === "Reopened").length, "text-blue-600"],
          ["অনুমোদনের অপেক্ষায়", tasks.filter((t: any) => t.status === "Review").length, "text-purple-600"],
          ["সংশোধন প্রয়োজন", tasks.filter((t: any) => t.status === "Reopened").length, "text-orange-600"],
          ["সম্পন্ন", tasks.filter((t: any) => t.status === "Completed").length, "text-emerald-600"],
          ["ওভারডিউ", tasks.filter((t: any) => displayStatus(t) === "Overdue").length, "text-rose-600"],
          ["সম্পন্নের হার", `${tasks.length ? Math.round((tasks.filter((t: any) => t.status === "Completed").length / tasks.length) * 100) : 0}%`, "text-emerald-700"],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="bg-slate-50 rounded-xl p-2 border border-slate-200">
            <p className="text-[10px] text-slate-500">{l}</p>
            <p className={`text-base font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-slate-50 border-b text-slate-600">
            <th className="p-2">কাজ</th><th className="p-2">দিয়েছেন</th><th className="p-2">দেওয়া হয়েছে</th><th className="p-2">ডেডলাইন</th><th className="p-2 text-right">অগ্রগতি</th><th className="p-2">স্ট্যাটাস</th>
          </tr></thead>
          <tbody>
            {list.map((t: any) => {
              const ds = displayStatus(t);
              return (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="p-2 font-semibold"><a href={`/tasks/${t.id}`} className="hover:underline">{t.title}</a></td>
                  <td className="p-2">{t.assignedByName || t.createdBy}</td>
                  <td className="p-2">{fmtDateTime(t.createdAt)}</td>
                  <td className="p-2">{fmtDate(t.dueDate)}{t.dueTime ? ` ${t.dueTime}` : ""}</td>
                  <td className="p-2 text-right font-bold">{t.progressPercent}%</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusCls(ds)}`}>{STATUS_LABEL[ds] || ds}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {list.map((t: any) => (
        <TaskCard key={t.id} t={t} comments={comments.filter((c: any) => c.taskId === t.id)} files={files}
          isMgmt={isMgmt} isSelf={isSelf} onMutate={onMutate} projects={projects} sites={sites} employees={employees} />
      ))}
      {list.length === 0 && <p className="text-xs text-slate-400">এই ফিল্টারে কোনো টাস্ক নেই।</p>}
    </div>
  );
}

function NewTaskForm({ emp, projects, sites, onMutate, onDone }: any) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState(today());
  const [dueTime, setDueTime] = useState("17:00");
  const [prio, setPrio] = useState("High");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [category, setCategory] = useState("General");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await onMutate({
          action: "createTask", title, description: desc, assignedTo: emp.id, dueDate: due, dueTime, priority: prio,
          projectId: projectId || null, siteId: siteId || null, category, visibility: "Assigned",
        });
        if (r?.success) onDone();
      }}
      className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 grid grid-cols-1 sm:grid-cols-6 gap-2"
    >
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="কাজের শিরোনাম *" className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-300 text-xs" />
      <input type="date" required value={due} onChange={(e) => setDue(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" aria-label="ডেডলাইন" />
      <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" aria-label="ডেডলাইন সময়" />
      <select value={prio} onChange={(e) => setPrio(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
        {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
      </select>
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ক্যাটাগরি" className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="কাজের বিবরণ" rows={2} className="sm:col-span-4 px-3 py-2 rounded-xl border border-slate-300 text-xs" />
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
        <option value="">প্রজেক্ট ছাড়া</option>
        {projects.map((p: any) => <option key={p.id} value={p.id}>{p.projectCode}</option>)}
      </select>
      <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
        <option value="">সাইট ছাড়া</option>
        {sites.map((s: any) => <option key={s.id} value={s.id}>{s.siteCode}</option>)}
      </select>
      <button type="submit" className="sm:col-span-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">কাজ দিন</button>
    </form>
  );
}

export function TaskCard({ t, comments, files, isMgmt, isSelf, onMutate, projects, sites, employees, defaultTimeline = false }: any) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showTimeline, setShowTimeline] = useState(defaultTimeline);
  const ds = displayStatus(t);
  const p = projects.find((x: any) => x.id === t.projectId);
  const s = sites.find((x: any) => x.id === t.siteId);
  const taskFiles = files.filter((f: any) => f.taskId === t.id);
  const open = t.status !== "Completed" && t.status !== "Cancelled";
  const overdueDays = ds === "Overdue" ? Math.round((new Date(today()).getTime() - new Date(t.dueDate).getTime()) / 86400000) : 0;
  const sortedComments = [...comments].sort((a: any, b: any) => (a.createdAt < b.createdAt ? -1 : 1));

  return (
    <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{t.taskCode}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusCls(ds)}`}>{STATUS_LABEL[ds] || ds}{overdueDays ? ` ${overdueDays} দিন` : ""}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">{t.priority}</span>
            {t.category && t.category !== "General" && <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100">{t.category}</span>}
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1">{t.title}</h4>
          {t.description && <p className="text-xs text-slate-600">{t.description}</p>}
        </div>
        <div className="text-right text-[11px] text-slate-500 shrink-0">
          <p>দিয়েছেন: <strong className="text-slate-800">{t.assignedByName || t.createdBy}</strong>{t.assignedByDesignation ? ` (${t.assignedByDesignation})` : ""}</p>
          <p>পেয়েছেন: <strong className="text-slate-800">{t.assignedToName || "—"}</strong>{t.assignedToDesignation ? ` (${t.assignedToDesignation})` : ""}</p>
          <p>দেওয়ার সময়: {fmtDateTime(t.createdAt)}</p>
          <p>দেখেছেন: {t.viewedAt ? fmtDateTime(t.viewedAt) : "এখনো দেখেননি"}</p>
          <p>শুরু: {fmtDate(t.startDate)}</p>
          <p className={ds === "Overdue" ? "text-rose-600 font-bold" : ""}>ডেডলাইন: {fmtDate(t.dueDate)}{t.dueTime ? ` ${t.dueTime}` : ""}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-slate-600">
          <span>অগ্রগতি</span><span className="font-bold">{t.progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${t.progressPercent >= 100 ? "bg-emerald-500" : ds === "Overdue" ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${t.progressPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
        <p><strong>সর্বশেষ আপডেট:</strong> {fmtDateTime(t.lastUpdateAt || t.createdAt)}</p>
        <p><strong>পরবর্তী কাজ:</strong> {t.nextAction || "—"}</p>
        {t.delayReason && <p className="text-rose-700"><strong>বিলম্ব/সমস্যা:</strong> {t.delayReason}</p>}
        {(p || s) && <p><strong>প্রজেক্ট/সাইট:</strong> {p ? p.name : ""}{s ? ` • ${s.name}` : ""}</p>}
        {t.reviewStatus !== "None" && (
          <p className={t.reviewStatus === "Correction Required" ? "text-orange-700" : "text-purple-700"}>
            <strong>রিভিউ:</strong> {t.reviewStatus === "Approved" ? "অনুমোদিত" : t.reviewStatus === "Pending Review" ? "অপেক্ষমাণ" : "সংশোধন প্রয়োজন"}
            {t.reviewNote ? ` — ${t.reviewNote}` : ""}{t.correctionCount ? ` (সংশোধন ${t.correctionCount}বার)` : ""}
          </p>
        )}
      </div>

      {taskFiles.length > 0 && <FileLinks ids={taskFiles.map((f: any) => f.id)} files={files} />}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {isSelf && open && t.status === "Todo" && (
          <button type="button" onClick={() => onMutate({ action: "updateTaskStatus", taskId: t.id, status: "Accepted" })} className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold">গ্রহণ করুন</button>
        )}
        {isSelf && open && (t.status === "Todo" || t.status === "Accepted" || t.status === "Reopened") && (
          <button type="button" onClick={() => onMutate({ action: "updateTaskStatus", taskId: t.id, status: "In Progress" })} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold">কাজ শুরু করুন</button>
        )}
        {isSelf && open && t.status !== "Review" && (
          <button type="button" onClick={() => setShowUpdate(!showUpdate)} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">অগ্রগতি / প্রমাণ দিন</button>
        )}
        {isSelf && open && t.status !== "Review" && (
          <button type="button" onClick={() => onMutate({ action: "updateTaskStatus", taskId: t.id, status: "Completed", progressPercent: 100, completionNote: "কাজ সম্পন্ন — রিভিউর জন্য জমা" })}
            className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-bold">সম্পন্ন — রিভিউতে পাঠান</button>
        )}
        {isMgmt && t.status === "Review" && (
          <>
            <button type="button" onClick={() => onMutate({ action: "reviewTask", taskId: t.id, decision: "Approve" })} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">অনুমোদন</button>
            <button type="button" onClick={() => {
              const reason = prompt("সংশোধনের কারণ লিখুন:");
              if (reason && reason.trim()) onMutate({ action: "reviewTask", taskId: t.id, decision: "Correction", reason });
            }} className="px-2.5 py-1.5 rounded-lg bg-orange-600 text-white text-[11px] font-bold">সংশোধন প্রয়োজন</button>
          </>
        )}
        {isMgmt && open && (
          <button type="button" onClick={() => setShowAssign(!showAssign)} className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-bold">পুনঃবণ্টন / ডেডলাইন</button>
        )}
        <button type="button" onClick={() => setShowTimeline(!showTimeline)} className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold">
          টাইমলাইন ({comments.length})
        </button>
      </div>

      {showUpdate && <ProgressForm t={t} onMutate={onMutate} onDone={() => setShowUpdate(false)} />}
      {showAssign && <AssignForm t={t} employees={employees} onMutate={onMutate} onDone={() => setShowAssign(false)} />}

      {showTimeline && (
        <div className="border-l-2 border-emerald-500 pl-3 ml-1 space-y-2 pt-1">
          {sortedComments.map((c: any) => (
            <div key={c.id} className="text-[11px]">
              <p>
                <strong className="text-slate-900">{eventLabel(c)}</strong> • {fmtDateTime(c.createdAt)} • {c.authorName}
                {c.actorDesignation ? ` (${c.actorDesignation})` : ""}
                {c.progressPercent !== null && c.progressPercent !== undefined ? ` • ${c.progressPercent}%` : ""}
                {c.oldStatus && c.newStatus && c.oldStatus !== c.newStatus ? ` • ${STATUS_LABEL[c.oldStatus] || c.oldStatus} → ${STATUS_LABEL[c.newStatus] || c.newStatus}` : ""}
              </p>
              <p className="text-slate-600">{c.comment}</p>
              <FileLinks ids={c.fileIds || []} files={files} />
            </div>
          ))}
          {sortedComments.length === 0 && <p className="text-[11px] text-slate-400">এখনো কোনো ইভেন্ট নেই</p>}
        </div>
      )}
    </div>
  );
}

function ProgressForm({ t, onMutate, onDone }: any) {
  const [pct, setPct] = useState<number>(t.progressPercent);
  const [note, setNote] = useState("");
  const [next, setNext] = useState(t.nextAction || "");
  const [delay, setDelay] = useState(t.delayReason || "");
  const [remaining, setRemaining] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        try {
          const up = await uploadFiles(fileList, t.id);
          const r = await onMutate({
            action: "updateTaskProgress", taskId: t.id, progressPercent: pct, note, nextAction: next,
            delayReason: delay, blocked, remaining, fileIds: up.map((f: any) => f.id),
          });
          if (r?.success) onDone();
        } catch (ex: any) {
          setErr(ex.message || "ব্যর্থ");
        } finally { setBusy(false); }
      }}
      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
    >
      <label className="block text-[11px] font-semibold">অগ্রগতি: {pct}%</label>
      <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full" />
      <textarea required value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="কী করেছেন / কী ফলাফল পেয়েছেন *" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
      <input value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="কী কাজ বাকি আছে?" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="পরবর্তী কাজ" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
        <input value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="বিলম্বের কারণ / সমস্যা (থাকলে)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
      </div>
      <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} /> কাজটি আটকে আছে (Blocked)</label>
      <label className="flex items-center gap-2 text-[11px] font-semibold"><Upload className="w-3.5 h-3.5" /> ছবি / PDF / Word / Excel (সর্বোচ্চ ৫ MB প্রতিটি)</label>
      <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFileList(e.target.files)} className="text-[11px]" />
      {err && <p className="text-[11px] text-rose-600">{err}</p>}
      <button type="submit" disabled={busy} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">{busy ? "সংরক্ষণ হচ্ছে..." : "আপডেট সংরক্ষণ"}</button>
    </form>
  );
}

function AssignForm({ t, employees, onMutate, onDone }: any) {
  const [assignedTo, setAssignedTo] = useState(String(t.assignedTo));
  const [due, setDue] = useState(t.dueDate);
  const [prio, setPrio] = useState(t.priority);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const r = await onMutate({ action: "updateTaskAssignment", taskId: t.id, assignedTo: Number(assignedTo), dueDate: due, priority: prio });
      if (r?.success) onDone();
    }} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2">
      <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
        {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
      <select value={prio} onChange={(e) => setPrio(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
        {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
      </select>
      <button type="submit" className="py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">সংরক্ষণ</button>
    </form>
  );
}

// ---------------- DAILY TAB ----------------
function DailyTab({ dws, tasks, files, isSelf, onMutate }: any) {
  const [summary, setSummary] = useState("");
  const [taskId, setTaskId] = useState("");
  const [pct, setPct] = useState(50);
  const [result, setResult] = useState("");
  const [problems, setProblems] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const openTasks = tasks.filter((t: any) => t.status !== "Completed" && t.status !== "Cancelled");

  return (
    <div className="space-y-3">
      {isSelf && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setErr("");
          try {
            const up = await uploadFiles(fileList, taskId ? Number(taskId) : undefined);
            const r = await onMutate({
              action: "submitDailyWork", workSummary: summary, taskId: taskId ? Number(taskId) : null,
              progressPercent: pct, notes: result, problems, tomorrowPlan: tomorrow,
              attachments: up.map((f: any) => ({ name: f.fileName, type: f.mimeType, size: `${Math.round(f.sizeBytes / 1024)} KB`, url: `/api/files/${f.id}` })),
            });
            if (r?.success) { setSummary(""); setResult(""); setProblems(""); setTomorrow(""); setFileList(null); }
          } catch (ex: any) { setErr(ex.message || "ব্যর্থ"); } finally { setBusy(false); }
        }} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
          <p className="text-xs font-bold text-emerald-900">আজকের কাজের আপডেট দিন</p>
          <textarea required value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="আজ কী কাজ করেছি? *" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              <option value="">কোন টাস্কের জন্য? (ঐচ্ছিক)</option>
              {openTasks.map((t: any) => <option key={t.id} value={t.id}>{t.taskCode} — {t.title}</option>)}
            </select>
            <label className="text-[11px] flex items-center gap-2">কত % সম্পন্ন: <strong>{pct}%</strong>
              <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="flex-1" />
            </label>
            <input value={result} onChange={(e) => setResult(e.target.value)} placeholder="কী ফলাফল পেয়েছি?" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            <input value={problems} onChange={(e) => setProblems(e.target.value)} placeholder="কোনো সমস্যা হয়েছে?" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            <input value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} placeholder="আগামীকাল কী করব?" className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          </div>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFileList(e.target.files)} className="text-[11px]" />
          {err && <p className="text-[11px] text-rose-600">{err}</p>}
          <button type="submit" disabled={busy} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">{busy ? "সংরক্ষণ হচ্ছে..." : "আপডেট জমা দিন"}</button>
        </form>
      )}
      {dws.map((d: any) => {
        const t = tasks.find((x: any) => x.id === d.taskId);
        const ids = (d.attachments || []).map((a: any) => Number(String(a.url || "").split("/api/files/")[1])).filter((n: number) => n > 0);
        return (
          <div key={d.id} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{d.date}</strong>
              <span>{t ? `${t.taskCode} • ` : ""}{d.progressPercent}%</span>
            </div>
            <p className="text-slate-800">{d.workSummary}</p>
            {d.notes && <p className="text-slate-600"><strong>ফলাফল:</strong> {d.notes}</p>}
            {d.problems && <p className="text-rose-700"><strong>সমস্যা:</strong> {d.problems}</p>}
            {d.tomorrowPlan && <p className="text-slate-500"><strong>আগামীকাল:</strong> {d.tomorrowPlan}</p>}
            <FileLinks ids={ids} files={files} />
          </div>
        );
      })}
      {dws.length === 0 && <p className="text-xs text-slate-400">কোনো দৈনিক আপডেট নেই</p>}
    </div>
  );
}

function LeaveForm({ onMutate }: any) {
  const [type, setType] = useState("Casual");
  const [s, setS] = useState(today());
  const [e, setE] = useState(today());
  const [reason, setReason] = useState("");
  return (
    <form onSubmit={async (ev) => {
      ev.preventDefault();
      const days = Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);
      const r = await onMutate({ action: "applyLeave", leaveType: type, startDate: s, endDate: e, totalDays: days, reason });
      if (r?.success) setReason("");
    }} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2">
      <select value={type} onChange={(ev) => setType(ev.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
        {["Casual", "Sick", "Annual", "Unpaid"].map((x) => <option key={x}>{x}</option>)}
      </select>
      <input type="date" value={s} onChange={(ev) => setS(ev.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
      <input type="date" value={e} onChange={(ev) => setE(ev.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
      <input required value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="কারণ *" className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
      <button type="submit" className="py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">ছুটির আবেদন</button>
    </form>
  );
}

// ---------------- PERFORMANCE TAB ----------------
function PerformanceTab({ emp, work, isMgmt, reviews, onMutate }: any) {
  const [score, setScore] = useState("80");
  const [comment, setComment] = useState("");
  const p = work.performance;
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-50 border"><p className="text-slate-500">স্বয়ংক্রিয় স্কোর</p><p className={`text-2xl font-bold ${scoreCls(p.autoScore)}`}>{p.autoScore ?? "—"}</p></div>
        <div className="p-3 rounded-xl bg-slate-50 border"><p className="text-slate-500">ম্যানেজমেন্ট স্কোর</p><p className="text-2xl font-bold text-slate-800">{p.manualScore ?? "—"}</p></div>
        <div className="p-3 rounded-xl bg-slate-900 text-white"><p className="text-slate-300">চূড়ান্ত স্কোর</p><p className="text-2xl font-bold text-emerald-400">{p.finalScore ?? "—"}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 border-b text-slate-600">
            <th className="p-2">ফ্যাক্টর</th><th className="p-2">ওজন</th><th className="p-2">অনুপাত</th><th className="p-2">পয়েন্ট</th><th className="p-2">ভিত্তি (বাস্তব ডাটা)</th>
          </tr></thead>
          <tbody>
            {p.factors.map((f: any) => (
              <tr key={f.key} className="border-b border-slate-100">
                <td className="p-2 font-semibold">{f.label}</td>
                <td className="p-2">{f.weight}</td>
                <td className="p-2">{f.ratio === null ? "প্রযোজ্য নয়" : `${Math.round(f.ratio * 100)}%`}</td>
                <td className="p-2 font-bold">{f.points ?? "—"}</td>
                <td className="p-2 text-slate-500">{f.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">{p.formula}</p>
      {p.manualComment && <p className="text-slate-600">ম্যানেজমেন্ট মন্তব্য ({p.manualBy}): {p.manualComment}</p>}
      {isMgmt && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const r = await onMutate({ action: "addManualPerformanceScore", employeeId: emp.id, score: Number(score), comments: comment, period: new Date().toISOString().slice(0, 7) });
          if (r?.success) setComment("");
        }} className="p-3 rounded-xl bg-amber-50 border border-amber-200 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input type="number" min={0} max={100} required value={score} onChange={(e) => setScore(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300" aria-label="স্কোর" />
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="ম্যানেজমেন্ট রিভিউ মন্তব্য" className="sm:col-span-2 px-2 py-2 rounded-xl border border-slate-300" />
          <button type="submit" className="py-2 rounded-xl bg-slate-900 text-white font-bold">রিভিউ স্কোর দিন</button>
        </form>
      )}
      {reviews.length > 0 && (
        <div className="space-y-1">
          <p className="font-bold text-slate-700">রিভিউ ইতিহাস</p>
          {reviews.map((r: any) => <p key={r.id} className="text-slate-600">{r.period} • {r.totalPoints}/100 • {r.reviewedBy} — {r.managerComments}</p>)}
        </div>
      )}
    </div>
  );
}

// ---------------- ACTIVITY TIMELINE ----------------
function Timeline({ tasks, comments, dws, atts, leaves, followups, reviews, files }: any) {
  const taskIds = new Set(tasks.map((t: any) => t.id));
  const taskMap = new Map(tasks.map((t: any) => [t.id, t]));
  const events: Array<{ at: string; kind: string; text: string; ids?: number[] }> = [];
  atts.forEach((a: any) => {
    if (a.checkIn) events.push({ at: `${a.date}T${a.checkIn}:00`, kind: "হাজিরা", text: `ইন ${a.checkIn}${a.checkOut ? ` • আউট ${a.checkOut}` : ""} • ${a.status}` });
    else events.push({ at: `${a.date}T00:00:00`, kind: "হাজিরা", text: a.status });
  });
  comments.filter((c: any) => taskIds.has(c.taskId)).forEach((c: any) => {
    const t: any = taskMap.get(c.taskId);
    events.push({
      at: new Date(c.createdAt).toISOString(),
      kind: eventLabel(c),
      text: `${t?.taskCode || ""} ${t?.title || ""} — ${c.authorName}${c.actorDesignation ? ` (${c.actorDesignation})` : ""}: ${c.comment}${c.oldStatus && c.newStatus && c.oldStatus !== c.newStatus ? ` [${STATUS_LABEL[c.oldStatus] || c.oldStatus} → ${STATUS_LABEL[c.newStatus] || c.newStatus}]` : ""}`,
      ids: c.fileIds,
    });
  });
  dws.forEach((d: any) => events.push({ at: new Date(d.createdAt).toISOString(), kind: "দৈনিক আপডেট", text: `${d.workSummary} (${d.progressPercent}%)` }));
  leaves.forEach((l: any) => events.push({ at: new Date(l.createdAt).toISOString(), kind: "ছুটি", text: `${l.leaveType} ${l.startDate}→${l.endDate} • ${l.status}` }));
  followups.forEach((f: any) => events.push({ at: new Date(f.createdAt).toISOString(), kind: "লিড ফলো-আপ", text: `${f.contactMethod || ""} • ${f.outcome || f.result} — ${f.discussion}` }));
  reviews.forEach((r: any) => events.push({ at: new Date(r.createdAt).toISOString(), kind: "পারফরম্যান্স রিভিউ", text: `${r.period} • ${r.totalPoints}/100 • ${r.reviewedBy}` }));
  events.sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className="border-l-2 border-emerald-500 pl-3 ml-1 space-y-2">
      {events.slice(0, 150).map((e, i) => (
        <div key={i} className="text-[11px]">
          <p><strong className="text-slate-900">{e.kind}</strong> • <span className="text-slate-500">{fmtDateTime(e.at)}</span></p>
          <p className="text-slate-600">{e.text}</p>
          {e.ids && e.ids.length > 0 && <FileLinks ids={e.ids} files={files} />}
        </div>
      ))}
      {events.length === 0 && <p className="text-xs text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> কোনো কার্যক্রম নেই</p>}
    </div>
  );
}
