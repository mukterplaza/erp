"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Activity,
  BarChart3,
  Award,
  Search,
  Filter,
  FileText,
  UploadCloud,
  X,
  Camera,
  Pencil,
  ChevronRight,
  ShieldCheck,
  Hammer,
  Paperclip,
} from "lucide-react";
import { getRoleBangla } from "@/components/ErpAppShell";

 

function statusBangla(s: string) {
  switch (s) {
    case "Not Started":
      return "এখনও শুরু হয়নি";
    case "In Progress":
      return "চলমান";
    case "Pending":
      return "অপেক্ষমাণ";
    case "Completed":
      return "সম্পন্ন";
    case "Blocked":
      return "স্থগিত";
    case "Overdue":
      return "সময়সীমা উত্তীর্ণ";
    case "Review":
      return "পর্যালোচনাধীন";
    case "Accepted":
      return "গৃহীত";
    default:
      return s || "—";
  }
}

function priorityBadge(p: string) {
  const cls =
    p === "Critical"
      ? "bg-rose-100 text-rose-700"
      : p === "High"
      ? "bg-orange-100 text-orange-700"
      : p === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return `px-2 py-0.5 rounded font-bold text-[10px] ${cls}`;
}

function reviewStatusBadge(s: string) {
  if (!s) return null;
  if (s === "Approved") {
    return (
      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-700">
        অনুমোদিত (Approved)
      </span>
    );
  }
  if (s === "Correction Required") {
    return (
      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-700">
        সংশোধন প্রয়োজন
      </span>
    );
  }
  return null;
}

function calculateEmployeePerformance(empId: number, data: any) {
  // Transparent formula (out of 100):
  // 30 Task completion, 20 On-time, 20 Daily updates, 10 Attendance, 10 Daily work quality
  const empTasks = (data.tasks || []).filter((t: any) => t.assignedTo === empId);
  const completed = empTasks.filter((t: any) => t.status === "Completed");
  const overdue = empTasks.filter(
    (t: any) => t.dueDate < new Date().toISOString().split("T")[0] && t.status !== "Completed" && t.status !== "Cancelled"
  );
  const onTime = completed.filter((t: any) => t.dueDate >= t.completedAt || true);

  const dailyUpdates = (data.dailyWorks || []).filter((d: any) => d.employeeId === empId);
  const attendance = (data.attendances || []).filter((a: any) => a.employeeId === empId);

  const totalAssigned = empTasks.length || 1;
  const completedRate = (completed.length / totalAssigned) * 30;
  const onTimeRate = (Math.max(0, completed.length - overdue.length) / Math.max(1, completed.length)) * 20;
  const updateRate = Math.min(20, dailyUpdates.length * 2);
  const attendanceRate = Math.min(10, attendance.length);
  const workQualityRate = dailyUpdates.length > 0
    ? Math.min(10, dailyUpdates.filter((d: any) => (d.progressPercent || 0) >= 50).length * 2)
    : 0;

  const total = Math.round(
    completedRate + onTimeRate + updateRate + attendanceRate + workQualityRate
  );

  return {
    total,
    breakdown: {
      taskCompletion: Math.round(completedRate),
      onTimeDelivery: Math.round(onTimeRate),
      dailyUpdates: Math.round(updateRate),
      attendance: Math.round(attendanceRate),
      workQuality: Math.round(workQualityRate),
    },
  };
}

export function EmployeeDirectory({
  data,
  onMutate,
  focusedEmployeeId,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  focusedEmployeeId?: number;
}) {
  // ফিল্টার স্টেট
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    focusedEmployeeId || data?.currentUser?.employeeId || 0
  );

  // Task progress form
  const [progressTask, setProgressTask] = useState<any | null>(null);
  const [progressPct, setProgressPct] = useState(50);
  const [progressNote, setProgressNote] = useState("");
  const [progressNextAction, setProgressNextAction] = useState("");
  const [progressDelayReason, setProgressDelayReason] = useState("");
  const [progressAttachments, setProgressAttachments] = useState<
    Array<{ name: string; type: string; size: string; url: string }>
  >([]);
  const [completionChoice, setCompletionChoice] = useState<"In Progress" | "Completed">("In Progress");
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Daily work submit (employee)
  const [dwForm, setDwForm] = useState({
    workDescription: "",
    resultObtained: "",
    problemsFaced: "",
    nextPlan: "",
    progressPercent: 50,
    taskId: "",
  });
  const [dwAttachments, setDwAttachments] = useState<
    Array<{ name: string; type: string; size: string; url: string }>
  >([]);
  const [submittingDaily, setSubmittingDaily] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "Overview" | "My Tasks" | "Daily Work" | "Attendance" | "Leave" | "Projects" | "Performance" | "Documents" | "Activity"
  >("Overview");

  const [reviewingTask, setReviewingTask] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"Approved" | "Correction Required">("Approved");
  const [correctionReason, setCorrectionReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // ==========================
  // Derived datasets
  // ==========================
  const allEmployees: any[] = data?.employees || [];
  const allTasks: any[] = data?.tasks || [];
  const allDaily: any[] = data?.dailyWorks || [];
  const allAttendance: any[] = data?.attendances || [];
  const allLeave: any[] = data?.leaveRequests || [];
  const allPerf: any[] = data?.performanceReviews || [];
  const allProjects: any[] = data?.projects || [];
  const allSites: any[] = data?.sites || [];
  const allDocs: any[] = data?.documents || [];
  const allComments: any[] = data?.taskComments || [];

  // Apply privacy filter: Staff sees ONLY themselves; Management sees ALL
  const currentUser = data?.currentUser;
  const isManagementView =
    currentUser?.role === "Owner" ||
    currentUser?.role === "MD" ||
    currentUser?.role === "Chairman" ||
    currentUser?.role === "Manager" ||
    currentUser?.role === "Admin";

  const visibleEmployees = useMemo(() => {
    let list = allEmployees;
    if (!isManagementView) {
      list = list.filter((e: any) => e.id === currentUser?.employeeId);
    }
    return list.filter((e: any) => {
      const matchesSearch = !searchTerm
        ? true
        : [e.name, e.empCode, e.designation, e.department, e.email, e.phone]
            .filter(Boolean)
            .some((v: string) => v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCompany =
        companyFilter === "all" ? true : e.company === companyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [allEmployees, isManagementView, currentUser, searchTerm, companyFilter]);

  // Management summary (top of page)
  const todayIso = new Date().toISOString().split("T")[0];
  const allEmpIds = new Set(allEmployees.map((e: any) => e.id));
  const todaysPresent = new Set(
    allAttendance
      .filter((a: any) => a.date === todayIso && a.checkIn)
      .map((a: any) => a.employeeId)
  );
  const todaysAbsent = [...allEmpIds].filter((id) => !todaysPresent.has(id)).length;
  const activeTasksCount = allTasks.filter(
    (t: any) => t.status !== "Completed" && t.status !== "Cancelled"
  ).length;
  const completedTodayCount = allTasks.filter(
    (t: any) =>
      t.status === "Completed" &&
      t.completedAt &&
      new Date(t.completedAt).toISOString().split("T")[0] === todayIso
  ).length;
  const pendingTasksCount = allTasks.filter(
    (t: any) => t.status !== "Completed" && t.status !== "Cancelled" && t.dueDate >= todayIso
  ).length;
  const overdueTasksCount = allTasks.filter(
    (t: any) => t.dueDate < todayIso && t.status !== "Completed" && t.status !== "Cancelled"
  ).length;
  const dailyUpdatesCount = allDaily.filter((d: any) => d.date === todayIso).length;

  // ==========================
  // Employee 360° data
  // ==========================
  const focusedEmpId = selectedEmpId || currentUser?.employeeId || 0;
  const focusedEmp: any = allEmployees.find((e: any) => e.id === focusedEmpId) || currentUser;

  const empTasks = useMemo(
    () => allTasks.filter((t: any) => t.assignedTo === focusedEmpId),
    [allTasks, focusedEmpId]
  );
  const empTasksToday = useMemo(() => {
    const today = todayIso;
    return empTasks.filter((t: any) => {
      const createdToday = t.createdAt
        ? new Date(t.createdAt).toISOString().split("T")[0] === today
        : false;
      const completedToday = t.completedAt
        ? new Date(t.completedAt).toISOString().split("T")[0] === today
        : false;
      const dueToday = t.dueDate === today;
      return createdToday || completedToday || dueToday;
    });
  }, [empTasks, todayIso]);
  const empTasksCompletedToday = empTasksToday.filter((t: any) => t.status === "Completed").length;
  const empTasksPendingToday = empTasksToday.filter((t: any) => t.status !== "Completed" && t.status !== "Cancelled").length;

  const empDaily = useMemo(
    () => allDaily.filter((d: any) => d.employeeId === focusedEmpId),
    [allDaily, focusedEmpId]
  );

  const empAttendance = useMemo(
    () => allAttendance.filter((a: any) => a.employeeId === focusedEmpId),
    [allAttendance, focusedEmpId]
  );

  const empLeave = useMemo(
    () => allLeave.filter((l: any) => l.employeeId === focusedEmpId),
    [allLeave, focusedEmpId]
  );

  const empPerf = useMemo(
    () => allPerf.filter((p: any) => p.employeeId === focusedEmpId),
    [allPerf, focusedEmpId]
  );

  const empDocs = useMemo(
    () => allDocs.filter(
      (d: any) => d.relatedEntityCode === focusedEmp?.empCode
    ),
    [allDocs, focusedEmp]
  );

  // This week / this month tasks
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setMonth(now.getMonth() - 1);

  const empTasksWeek = empTasks.filter((t: any) => {
    const ts = t.createdAt ? new Date(t.createdAt) : null;
    return ts && ts >= weekStart;
  });
  const empTasksMonth = empTasks.filter((t: any) => {
    const ts = t.createdAt ? new Date(t.createdAt) : null;
    return ts && ts >= monthStart;
  });

  // Tasks assigned to this employee grouped by status
  const groupedTasks = {
    notStarted: empTasks.filter((t: any) => t.progressPercent === 0 && t.status !== "Completed" && t.status !== "Cancelled"),
    inProgress: empTasks.filter((t: any) => t.status === "In Progress"),
    pending: empTasks.filter((t: any) => t.status === "Pending"),
    completed: empTasks.filter((t: any) => t.status === "Completed"),
    blocked: empTasks.filter((t: any) => t.status === "Blocked"),
    overdue: empTasks.filter(
      (t: any) => t.dueDate < todayIso && t.status !== "Completed" && t.status !== "Cancelled"
    ),
    correction: empTasks.filter((t: any) => t.managementReviewStatus === "Correction Required"),
  };

  const taskListToShow = useMemo(() => {
    let arr = groupedTasks.notStarted
      .concat(groupedTasks.inProgress)
      .concat(groupedTasks.pending)
      .concat(groupedTasks.blocked)
      .concat(groupedTasks.overdue)
      .concat(groupedTasks.completed)
      .concat(groupedTasks.correction);
    return arr;
  }, [groupedTasks]);

  const empPerformance = focusedEmp ? calculateEmployeePerformance(focusedEmp.id, data) : null;

  // Helper: project/site lookup
  const projectsMap = useMemo(
    () => new Map(allProjects.map((p: any) => [p.id, p])),
    [allProjects]
  );
  const sitesMap = useMemo(
    () => new Map(allSites.map((s: any) => [s.id, s])),
    [allSites]
  );

  // ==========================
  // Handlers
  // ==========================
  function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>, setter: (v: any) => void) {
    const files = Array.from(e.target.files || []);
    setter(
      files.map((f: File) => ({
        name: f.name,
        type: f.type || f.name.split(".").pop()?.toUpperCase() || "FILE",
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
        url: `#attachment-${encodeURIComponent(f.name)}`,
      }))
    );
  }

  async function handleSubmitProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!progressTask) return;
    setSubmittingProgress(true);
    try {
      await onMutate({
        action: "submitTaskProgress",
        taskId: progressTask.id,
        progressPercent: progressPct,
        nextAction: progressNextAction,
        delayReason: progressDelayReason,
        note: progressNote,
        attachments: progressAttachments,
        completionStatus: completionChoice,
      });
      setProgressTask(null);
      setProgressNote("");
      setProgressNextAction("");
      setProgressDelayReason("");
      setProgressAttachments([]);
    } finally {
      setSubmittingProgress(false);
    }
  }

  async function handleSubmitDailyWork(e: React.FormEvent) {
    e.preventDefault();
    if (!dwForm.workDescription.trim()) return;
    setSubmittingDaily(true);
    try {
      await onMutate({
        action: "submitDailyWork",
        workSummary: dwForm.workDescription,
        startTime: "09:30",
        endTime: new Date().toTimeString().slice(0, 5),
        progressPercent: dwForm.progressPercent,
        taskId: dwForm.taskId ? Number(dwForm.taskId) : null,
        problems: dwForm.problemsFaced,
        tomorrowPlan: dwForm.nextPlan,
        attachments: dwAttachments,
      });
      setDwForm({ workDescription: "", resultObtained: "", problemsFaced: "", nextPlan: "", progressPercent: 50, taskId: "" });
      setDwAttachments([]);
    } finally {
      setSubmittingDaily(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewingTask) return;
    setSubmittingReview(true);
    try {
      await onMutate({
        action: "managementReviewTask",
        taskId: reviewingTask.id,
        decision: reviewDecision,
        correctionReason: reviewDecision === "Correction Required" ? correctionReason : undefined,
      });
      setReviewingTask(null);
      setCorrectionReason("");
    } finally {
      setSubmittingReview(false);
    }
  }

  // ==========================
  // Render: Employee Profile
  // ==========================
  if (focusedEmployeeId && focusedEmp) {
    const profileProgressPercent =
      empTasks.length === 0
        ? 0
        : Math.round(
            empTasks.reduce(
              (s: number, t: any) => s + (t.progressPercent || 0),
              0
            ) / empTasks.length
          );

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/employees" className="hover:text-emerald-600 font-medium">
            কর্মকর্তা ডিরেক্টরি
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-800">{focusedEmp.name}</span>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 shadow-lg border border-slate-700/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-md">
                {focusedEmp.name?.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{focusedEmp.name}</h1>
                <p className="text-sm text-emerald-300 font-semibold">
                  {focusedEmp.designation}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {focusedEmp.empCode} • {focusedEmp.company} • {focusedEmp.department}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  সক্রিয় কাজ
                </p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">
                  {empTasks.length - groupedTasks.completed.length}
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  সম্পন্ন
                </p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">
                  {groupedTasks.completed.length}
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  মেয়াদোত্তীর্ণ
                </p>
                <p className="text-xl font-bold text-rose-400 mt-0.5">
                  {groupedTasks.overdue.length}
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  পারফরম্যান্স
                </p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">
                  {empPerformance?.total || 0}/১০০
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 px-2 py-2 overflow-x-auto shadow-xs">
          <div className="flex flex-nowrap gap-1 min-w-max">
            {(
              [
                { key: "Overview", icon: Activity, label: "সারসংক্ষেপ" },
                { key: "My Tasks", icon: Briefcase, label: `আমার কাজ (${empTasks.length})` },
                { key: "Daily Work", icon: Pencil, label: `দৈনিক কাজ (${empDaily.length})` },
                { key: "Attendance", icon: Clock, label: `উপস্থিতি (${empAttendance.length})` },
                { key: "Leave", icon: Calendar, label: `ছুটি (${empLeave.length})` },
                { key: "Projects", icon: Building2, label: `প্রজেক্ট (${empTasks.filter((t: any) => t.projectId).length})` },
                { key: "Performance", icon: Award, label: "পারফরম্যান্স" },
                { key: "Documents", icon: FileText, label: `ডকুমেন্ট (${empDocs.length})` },
                { key: "Activity", icon: Activity, label: "কার্যকলাপ টাইমলাইন" },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeTab === t.key
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">যোগাযোগ ও প্রোফাইল</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="font-mono">{focusedEmp.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{focusedEmp.email}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>যোগদান: {focusedEmp.joiningDate}</span></div>
                  <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>পদবী: {focusedEmp.designation}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>প্রতিষ্ঠান: {focusedEmp.company}</span></div>
                  <div className="flex items-center gap-2"><Hammer className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>বিভাগ: {focusedEmp.department}</span></div>
                  <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>অ্যাকাউন্ট স্ট্যাটাস: {focusedEmp.employmentStatus === "Active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">আজকের কাজের সারসংক্ষেপ ({todayIso})</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">আজকের কাজ</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{empTasksToday.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-[10px] text-blue-700 font-bold uppercase">আজ সম্পন্ন</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{empTasksCompletedToday}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-[10px] text-amber-700 font-bold uppercase">পেন্ডিং</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{empTasksPendingToday}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-600 font-bold uppercase">উপস্থিতি</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {empAttendance.find((a: any) => a.date === todayIso)?.checkIn
                        ? "উপস্থিত"
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">পারফরম্যান্স স্কোর (১০০ এর মধ্যে)</h3>
                <p className="text-4xl font-extrabold text-emerald-600 text-center my-2">
                  {empPerformance?.total || 0}
                </p>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{ width: `${empPerformance?.total || 0}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">কাজ সম্পন্ন:</span>{" "}
                    <strong>{empPerformance?.breakdown.taskCompletion}/৩০</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">সময়মতো:</span>{" "}
                    <strong>{empPerformance?.breakdown.onTimeDelivery}/২০</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">দৈনিক আপডেট:</span>{" "}
                    <strong>{empPerformance?.breakdown.dailyUpdates}/২০</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">উপস্থিতি:</span>{" "}
                    <strong>{empPerformance?.breakdown.attendance}/১০</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly / Monthly task distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                কাজের অবস্থা পরিসংখ্যান (এই সপ্তাহ ও এই মাস)
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">এই সপ্তাহ (গত ৭ দিন)</h4>
                  <div className="grid grid-cols-5 gap-1 text-[11px]">
                    <StatBox label="অর্পিত" value={empTasksWeek.length} />
                    <StatBox label="সম্পন্ন" value={empTasksWeek.filter((t: any) => t.status === "Completed").length} />
                    <StatBox label="চলমান" value={empTasksWeek.filter((t: any) => t.status === "In Progress").length} />
                    <StatBox label="পেন্ডিং" value={empTasksWeek.filter((t: any) => t.status === "Pending").length} />
                    <StatBox label="মেয়াদোত্তীর্ণ" value={empTasksWeek.filter((t: any) => t.dueDate < todayIso && t.status !== "Completed" && t.status !== "Cancelled").length} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">এই মাস (গত ৩০ দিন)</h4>
                  <div className="grid grid-cols-5 gap-1 text-[11px]">
                    <StatBox label="অর্পিত" value={empTasksMonth.length} />
                    <StatBox label="সম্পন্ন" value={empTasksMonth.filter((t: any) => t.status === "Completed").length} />
                    <StatBox label="চলমান" value={empTasksMonth.filter((t: any) => t.status === "In Progress").length} />
                    <StatBox label="পেন্ডিং" value={empTasksMonth.filter((t: any) => t.status === "Pending").length} />
                    <StatBox label="মেয়াদোত্তীর্ণ" value={empTasksMonth.filter((t: any) => t.dueDate < todayIso && t.status !== "Completed" && t.status !== "Cancelled").length} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: My Tasks (DETAILED WITH PROGRESS, ATTACHMENTS, REVIEW) */}
        {activeTab === "My Tasks" && (
          <div className="space-y-4">
            {taskListToShow.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 mt-3">কোনো টাস্ক নেই</p>
                <p className="text-xs text-slate-500 mt-1">এই কর্মকর্তার জন্য কোনো টাস্ক অর্পিত নেই।</p>
              </div>
            ) : (
              taskListToShow.map((t: any) => {
                const project = t.projectId ? projectsMap.get(t.projectId) : null;
                const site = t.siteId ? sitesMap.get(t.siteId) : null;
                const isOverdue =
                  t.dueDate < todayIso &&
                  t.status !== "Completed" &&
                  t.status !== "Cancelled";
                const taskCommentsForTask = allComments
                  .filter((c: any) => c.taskId === t.id)
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  );
                const evidenceAttachments = (t.evidenceAttachments || []) as Array<{
                  name: string;
                  type: string;
                  size: string;
                  url: string;
                }>;

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl border ${
                      t.managementReviewStatus === "Correction Required"
                        ? "border-rose-300 ring-1 ring-rose-200"
                        : isOverdue
                        ? "border-rose-300"
                        : "border-slate-200"
                    } p-5 shadow-xs hover:shadow-md transition`}
                  >
                    {/* Title Row */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                            {t.taskCode}
                          </span>
                          <span className={priorityBadge(t.priority)}>{t.priority}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {statusBangla(t.status)}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                              মেয়াদোত্তীর্ণ
                            </span>
                          )}
                          {reviewStatusBadge(t.managementReviewStatus)}
                          {t.visibility === "Management Only" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              গোপনীয়
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">{t.title}</h3>
                        {t.description && (
                          <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                        )}
                      </div>
                      {isManagementView && t.status === "Completed" && !t.managementReviewStatus && (
                        <button
                          type="button"
                          onClick={() => setReviewingTask(t)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          ম্যানেজমেন্ট রিভিউ
                        </button>
                      )}
                    </div>

                    {/* Project / Site Links */}
                    {(project || site) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600">
                        {project && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            প্রজেক্ট: {project.projectCode}
                          </span>
                        )}
                        {site && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            সাইট: {site.siteCode}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[11px]">
                      <div className="p-2 rounded bg-slate-50">
                        <span className="text-slate-500">অর্পণ:</span>{" "}
                        <strong>{t.createdAt ? new Date(t.createdAt).toLocaleDateString("bn-BD") : "—"}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50">
                        <span className="text-slate-500">সময়সীমা:</span>{" "}
                        <strong className={isOverdue ? "text-rose-600" : ""}>{t.dueDate}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50">
                        <span className="text-slate-500">প্রদানকারী:</span>{" "}
                        <strong>{t.createdBy || "—"}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50">
                        <span className="text-slate-500">দায়িত্বপ্রাপ্ত:</span>{" "}
                        <strong>
                          {isManagementView
                            ? focusedEmp.name
                            : (t.assignedTo === currentUser?.employeeId
                                ? currentUser.name
                                : focusEmpName(t.assignedTo, allEmployees))}
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">অগ্রগতি</span>
                        <span className="font-bold text-emerald-700">{t.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            (t.progressPercent || 0) >= 80
                              ? "bg-emerald-500"
                              : (t.progressPercent || 0) >= 40
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${t.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Action / Delay Reason */}
                    {(t.nextAction || t.delayReason) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        {t.nextAction && (
                          <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                            <span className="font-semibold text-emerald-800">পরবর্তী পদক্ষেপ:</span> {t.nextAction}
                          </div>
                        )}
                        {t.delayReason && (
                          <div className="p-2 rounded bg-rose-50 border border-rose-200">
                            <span className="font-semibold text-rose-800">বিলম্বের কারণ:</span> {t.delayReason}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evidence / Attachments */}
                    {evidenceAttachments.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> সংযুক্ত প্রমাণপত্র / ফাইল ({evidenceAttachments.length} টি):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {evidenceAttachments.map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-semibold text-slate-700"
                            >
                              {a.name} ({a.size})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline */}
                    {taskCommentsForTask.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-bold text-slate-700">
                          ⏱️ কার্যকলাপ টাইমলাইন ({taskCommentsForTask.length} টি)
                        </summary>
                        <div className="mt-2 space-y-1.5 border-l-2 border-emerald-500 pl-3 ml-1">
                          {taskCommentsForTask.map((c: any) => (
                            <div key={c.id} className="text-[11px] text-slate-700">
                              <span className="font-bold text-slate-800">{c.actionType}:</span>{" "}
                              {c.comment}{" "}
                              <span className="text-slate-400">
                                — {c.authorName} ({new Date(c.createdAt).toLocaleString("bn-BD")})
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Submit Progress / Update Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                      {!t.managementReviewStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            setProgressTask(t);
                            setProgressPct(t.progressPercent || 0);
                            setCompletionChoice(
                              t.progressPercent >= 100 ? "Completed" : "In Progress"
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Pencil className="w-3 h-3" /> অগ্রগতি ও সংযুক্তি জমা দিন
                        </button>
                      )}
                      {t.managementReviewStatus === "Correction Required" && (
                        <button
                          type="button"
                          onClick={() => {
                            setProgressTask(t);
                            setProgressPct(t.progressPercent || 0);
                            setCompletionChoice("In Progress");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                        >
                          ⚠️ সংশোধন পুনরায় দাখিল করুন
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab Content: Daily Work */}
        {activeTab === "Daily Work" && (
          <div className="space-y-5">
            <form
              onSubmit={handleSubmitDailyWork}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" /> আজকের কাজের আপডেট / দৈনিক বিবরণী দাখিল করুন
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">আজ কী কাজ করেছি? *</label>
                <textarea
                  required
                  rows={2}
                  value={dwForm.workDescription}
                  onChange={(e) => setDwForm({ ...dwForm, workDescription: e.target.value })}
                  placeholder="আজ যেসব কাজ সম্পন্ন করেছেন তার বিস্তারিত বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">কোন টাস্কের জন্য কাজ করেছেন?</label>
                <select
                  value={dwForm.taskId}
                  onChange={(e) => setDwForm({ ...dwForm, taskId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">— সাধারণ কাজ (টাস্ক ছাড়া) —</option>
                  {empTasks.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.taskCode}: {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">কত % সম্পন্ন হয়েছে?</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={dwForm.progressPercent}
                    onChange={(e) => setDwForm({ ...dwForm, progressPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">কী result পেয়েছেন?</label>
                  <input
                    type="text"
                    value={dwForm.resultObtained}
                    onChange={(e) => setDwForm({ ...dwForm, resultObtained: e.target.value })}
                    placeholder="যেমন: ৩টি ছাড়পত্র প্রস্তুত হয়েছে..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">কোনো সমস্যা হয়েছে?</label>
                  <input
                    type="text"
                    value={dwForm.problemsFaced}
                    onChange={(e) => setDwForm({ ...dwForm, problemsFaced: e.target.value })}
                    placeholder="কোনো বাধা বা সমস্যা থাকলে..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">আগামীকাল কী করবেন?</label>
                  <input
                    type="text"
                    value={dwForm.nextPlan}
                    onChange={(e) => setDwForm({ ...dwForm, nextPlan: e.target.value })}
                    placeholder="পরবর্তী দিনের কাজের পরিকল্পনা..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ছবি / পিডিএফ / ডকুমেন্ট সংযুক্তি
                </label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => handleAttachFiles(e, setDwAttachments)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
                />
                {dwAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dwAttachments.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold"
                      >
                        {a.name} ({a.size})
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={submittingDaily}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
              >
                {submittingDaily ? "দাখিল হচ্ছে..." : "আজকের কাজের আপডেট জমা দিন"}
              </button>
            </form>

            {/* Daily Work History for this employee */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" /> দৈনিক কাজের ইতিহাস (মোট {empDaily.length} টি)
              </h3>
              <div className="space-y-3">
                {empDaily.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">কোনো দৈনিক আপডেট এখনও দাখিল করা হয়নি।</p>
                ) : (
                  empDaily.slice(0, 10).map((d: any) => {
                    const relatedTask = d.taskId
                      ? empTasks.find((t: any) => t.id === d.taskId)
                      : null;
                    return (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                              {d.date}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                              {d.progressPercent}%
                            </span>
                          </div>
                          {relatedTask && (
                            <Link
                              href={`/tasks/${relatedTask.id}`}
                              className="text-[11px] text-emerald-700 font-semibold underline"
                            >
                              {relatedTask.taskCode}: {relatedTask.title}
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{d.workSummary}</p>
                        {(d.attachments || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(d.attachments || []).map((a: any, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold flex items-center gap-1"
                              >
                                <Paperclip className="w-2.5 h-2.5" /> {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {d.tomorrowPlan && (
                          <p className="text-[11px] text-emerald-700">
                            <strong>পরবর্তী:</strong> {d.tomorrowPlan}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Attendance */}
        {activeTab === "Attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> উপস্থিতির ইতিহাস (মোট {empAttendance.length} টি)
            </h3>
            {empAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">কোনো উপস্থিতির রেকর্ড নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5">তারিখ</th>
                      <th className="p-2.5">ইন</th>
                      <th className="p-2.5">আউট</th>
                      <th className="p-2.5">শিফট</th>
                      <th className="p-2.5">সময়</th>
                      <th className="p-2.5">ওভারটাইম</th>
                      <th className="p-2.5">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empAttendance.slice(0, 30).map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono">{a.date}</td>
                        <td className="p-2.5 font-mono text-emerald-700">{a.checkIn || "—"}</td>
                        <td className="p-2.5 font-mono">{a.checkOut || "—"}</td>
                        <td className="p-2.5">
                          {(a.morningHours || "0.00")}ঘণ্টা / {(a.afternoonHours || "0.00")}ঘণ্টা
                        </td>
                        <td className="p-2.5 font-bold">{a.workingHours} ঘণ্টা</td>
                        <td className="p-2.5 text-indigo-600 font-bold">{a.overtimeHours} ঘণ্টা</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            {statusBangla(a.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Leave */}
        {activeTab === "Leave" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> ছুটির ইতিহাস (মোট {empLeave.length} টি)
            </h3>
            {empLeave.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">কোনো ছুটির রেকর্ড নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5">কোড</th>
                      <th className="p-2.5">ধরন</th>
                      <th className="p-2.5">শুরু</th>
                      <th className="p-2.5">শেষ</th>
                      <th className="p-2.5">দিন</th>
                      <th className="p-2.5">কারণ</th>
                      <th className="p-2.5">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empLeave.map((lv: any) => (
                      <tr key={lv.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold">{lv.leaveCode}</td>
                        <td className="p-2.5">{lv.leaveType}</td>
                        <td className="p-2.5 font-mono">{lv.startDate}</td>
                        <td className="p-2.5 font-mono">{lv.endDate}</td>
                        <td className="p-2.5 font-bold">{lv.totalDays} দিন</td>
                        <td className="p-2.5 text-slate-600">{lv.reason}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              lv.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : lv.status === "Rejected"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {lv.status === "Approved" ? "অনুমোদিত" : lv.status === "Rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Projects & Sites */}
        {activeTab === "Projects" && (
          <div className="space-y-3">
            {(() => {
              const empProjects = Array.from(
                new Set(
                  empTasks
                    .filter((t: any) => t.projectId)
                    .map((t: any) => t.projectId)
                )
              )
                .map((id: number) => projectsMap.get(id))
                .filter(Boolean);
              if (empProjects.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 mt-3">কোনো প্রজেক্টে অর্পিত নয়</p>
                  </div>
                );
              }
              return empProjects.map((p: any) => {
                const empProjectTasks = empTasks.filter((t: any) => t.projectId === p.id);
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900">{p.projectCode}: {p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">অর্পিত কাজ: {empProjectTasks.length} টি</p>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Tab Content: Performance */}
        {activeTab === "Performance" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> পারফরম্যান্স মূল্যায়ন
            </h3>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">চলতি স্কোর (Transparent Formula):</span>
                <span className="text-3xl font-extrabold text-emerald-700">
                  {empPerformance?.total || 0}/১০০
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                সূত্র: কাজ সম্পন্ন (৩০) + সময়মতো (২০) + দৈনিক আপডেট (২০) + উপস্থিতি (১০) + কাজের গুণগত মান (১০)
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <ScoreBox label="কাজ সম্পন্ন" value={empPerformance?.breakdown.taskCompletion ?? 0} max={30} />
              <ScoreBox label="সময়মতো" value={empPerformance?.breakdown.onTimeDelivery ?? 0} max={20} />
              <ScoreBox label="দৈনিক আপডেট" value={empPerformance?.breakdown.dailyUpdates ?? 0} max={20} />
              <ScoreBox label="উপস্থিতি" value={empPerformance?.breakdown.attendance ?? 0} max={10} />
              <ScoreBox label="কাজের গুণগত মান" value={empPerformance?.breakdown.workQuality ?? 0} max={10} />
            </div>
            <div className="mt-3 text-xs text-slate-500">
              <strong>দ্রষ্টব্য:</strong> পারফরম্যান্স ম্যানেজমেন্ট কর্তৃক ম্যানুয়ালি বা কার্যক্রমের বাস্তব ডাটা বিশ্লেষণ করে স্বচ্ছভাবে হিসাব করা হয়। ম্যানেজমেন্ট চাইলে অতিরিক্ত ম্যানুয়াল স্কোর যোগ করতে পারবেন।
            </div>
            {empPerf.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2">পূর্ববর্তী মূল্যায়নসমূহ</h4>
                <div className="space-y-2">
                  {empPerf.map((p: any) => (
                    <div key={p.id} className="p-2.5 rounded-lg bg-slate-50 text-xs">
                      <div className="flex justify-between">
                        <strong>{p.period}</strong>
                        <span className="font-bold text-emerald-700">{p.totalPoints}/১০০</span>
                      </div>
                      {p.managerComments && (
                        <p className="text-slate-600 italic mt-0.5">{p.managerComments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Documents */}
        {activeTab === "Documents" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> ডকুমেন্ট ভল্ট (মোট {empDocs.length} টি)
            </h3>
            {empDocs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">কোনো ডকুমেন্ট এই কর্মকর্তার সাথে সংযুক্ত নেই।</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {empDocs.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{d.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {d.docCode} • {d.category} • {d.uploadedBy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Activity Timeline */}
        {activeTab === "Activity" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> সম্পূর্ণ কার্যকলাপ টাইমলাইন
            </h3>
            <p className="text-xs text-slate-500 mb-3">উপস্থিতি → দৈনিক কাজ → টাস্ক অর্পণ → টাস্ক অগ্রগতি → সংযুক্তি → ম্যানেজমেন্ট রিভিউ → সম্পন্ন</p>
            <div className="space-y-2 border-l-2 border-emerald-500 pl-4 ml-1">
              {(() => {
                const events: any[] = [];
                empAttendance.slice(0, 10).forEach((a: any) => {
                  if (a.checkIn) events.push({ date: a.date, time: a.checkIn, actor: "স্বয়ংক্রিয়", action: "উপস্থিতি (IN)", note: "—" });
                });
                empDaily.slice(0, 10).forEach((d: any) => {
                  events.push({ date: d.date, time: d.arrivalTime, actor: "স্বয়ং", action: "দৈনিক কাজের আপডেট", note: d.workSummary });
                });
                empTasks.slice(0, 10).forEach((t: any) => {
                  events.push({ date: t.dueDate, time: "", actor: t.createdBy || "ম্যানেজমেন্ট", action: `টাস্ক অর্পণ: ${t.title}`, note: t.priority });
                });
                empLeave.slice(0, 5).forEach((lv: any) => {
                  events.push({ date: lv.startDate, time: "", actor: "স্বয়ং", action: `ছুটির আবেদন (${lv.leaveType})`, note: lv.reason });
                });
                events.sort((a, b) => (b.date > a.date ? 1 : -1));
                return events.slice(0, 20).map((e, i) => (
                  <div key={i} className="text-[11px] text-slate-700 relative">
                    <span className="font-mono font-bold text-emerald-800">{e.date}</span>{" "}
                    <span className="text-slate-500">{e.time}</span>{" "}
                    <strong className="text-slate-800">{e.action}</strong>{" "}
                    <span className="text-slate-400">— {e.actor}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Progress Submission Modal */}
        {progressTask && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleSubmitProgress}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">অগ্রগতি ও প্রমাণপত্র দাখিল করুন</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {progressTask.taskCode}: {progressTask.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProgressTask(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">অগ্রগতি (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progressPct}
                      onChange={(e) => setProgressPct(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">চূড়ান্ত অবস্থা</label>
                    <select
                      value={completionChoice}
                      onChange={(e) => setCompletionChoice(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="In Progress">চলমান (In Progress)</option>
                      <option value="Completed">সম্পন্ন (Completed) – ম্যানেজমেন্ট রিভিউ প্রয়োজন</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পরবর্তী পদক্ষেপ</label>
                  <input
                    type="text"
                    value={progressNextAction}
                    onChange={(e) => setProgressNextAction(e.target.value)}
                    placeholder="পরবর্তী কাজের পরিকল্পনা..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">বিলম্বের কারণ (যদি থাকে)</label>
                  <input
                    type="text"
                    value={progressDelayReason}
                    onChange={(e) => setProgressDelayReason(e.target.value)}
                    placeholder="কোনো বিলম্বের কারণ লিখুন..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মন্তব্য / নোট</label>
                  <textarea
                    rows={2}
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="অতিরিক্ত নোট..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">সংযুক্তি (ছবি / পিডিএফ / ডকুমেন্ট)</label>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleAttachFiles(e, setProgressAttachments)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
                  />
                  {progressAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {progressAttachments.map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold"
                        >
                          {a.name} ({a.size})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setProgressTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingProgress}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submittingProgress ? "দাখিল হচ্ছে..." : "আপডেট জমা দিন"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Management Review Modal */}
        {reviewingTask && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleSubmitReview}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-base font-bold text-slate-900">ম্যানেজমেন্ট রিভিউ</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {reviewingTask.taskCode}: {reviewingTask.title}
                </p>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">সিদ্ধান্ত</label>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="Approved">✓ অনুমোদন (Approved)</option>
                    <option value="Correction Required">⚠ সংশোধন প্রয়োজন (Correction Required)</option>
                  </select>
                </div>
                {reviewDecision === "Correction Required" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">সংশোধনের কারণ *</label>
                    <textarea
                      required
                      rows={3}
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="যেমন: Drawing-এর structural detail আবার যাচাই করুন..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setReviewingTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 ${
                    reviewDecision === "Approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {submittingReview ? "সংরক্ষণ হচ্ছে..." : "সিদ্ধান্ত নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ==========================
  // Render: Employee Directory (Card List + Filter)
  // ==========================
  return (
    <div className="space-y-5">
      {/* Header + Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> কর্মকর্তা ও মানবসম্পদ ডিরেক্টরি
            </h1>
            <p className="text-xs text-slate-500">
              {allEmployees.length} জন active কর্মকর্তার কাজের অবস্থা, পারফরম্যান্স ও কার্যকলাপ
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="কর্মকর্তা খুঁজুন (নাম, কোড, পদবী)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs w-full sm:w-64"
              />
            </div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
            >
              <option value="all">সকল প্রতিষ্ঠান</option>
              <option value="INSAF">INSAF</option>
              <option value="INSAF BUILDING DESIGN & CONSULTANT LTD.">INSAF BUILDING DESIGN</option>
              <option value="INSAF REAL ESTATE LTD.">INSAF REAL ESTATE</option>
            </select>
          </div>
        </div>

        {/* Management Summary (only for Management roles) */}
        {isManagementView && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-2 border-t border-slate-100">
            <SummaryStat label="সক্রিয় কর্মকর্তা" value={allEmployees.length} cls="text-slate-900" />
            <SummaryStat label="আজকের উপস্থিত" value={todaysPresent.size} cls="text-emerald-600" />
            <SummaryStat label="আজকের অনুপস্থিত" value={todaysAbsent} cls="text-rose-600" />
            <SummaryStat label="সক্রিয় কাজ" value={activeTasksCount} cls="text-amber-600" />
            <SummaryStat label="আজ সম্পন্ন" value={completedTodayCount} cls="text-emerald-600" />
            <SummaryStat label="মেয়াদোত্তীর্ণ" value={overdueTasksCount} cls="text-rose-600" />
            <SummaryStat label="দৈনিক আপডেট" value={dailyUpdatesCount} cls="text-indigo-600" />
          </div>
        )}
      </div>

      {/* Filter status (can be extended) */}
      {statusFilter !== "all" && (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5" /> ফিল্টার সক্রিয়:
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
            {statusFilter}
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕ বন্ধ করুন
          </button>
        </div>
      )}

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleEmployees.map((emp: any) => {
          const empTasksArr = allTasks.filter((t: any) => t.assignedTo === emp.id);
          const completed = empTasksArr.filter((t: any) => t.status === "Completed").length;
          const inProgress = empTasksArr.filter((t: any) => t.status === "In Progress").length;
          const pending = empTasksArr.filter(
            (t: any) => t.status !== "Completed" && t.status !== "Cancelled"
          ).length;
          const overdue = empTasksArr.filter(
            (t: any) => t.dueDate < todayIso && t.status !== "Completed" && t.status !== "Cancelled"
          ).length;
          const completion =
            empTasksArr.length === 0
              ? 0
              : Math.round((completed / empTasksArr.length) * 100);
          const lastDaily = allDaily
            .filter((d: any) => d.employeeId === emp.id)
            .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))[0];
          const isPresent = todaysPresent.has(emp.id);
          const perf = calculateEmployeePerformance(emp.id, data);

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                  {emp.name?.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{emp.name}</h3>
                  <p className="text-[11px] text-emerald-700 font-semibold">{emp.designation}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{emp.empCode}</p>
                </div>
                <div className="text-right shrink-0">
                  {isPresent ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      উপস্থিত
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                      অনুপস্থিত
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.company?.split("INSAF")[1] || emp.company}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.department}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="font-mono truncate">{emp.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>যোগ: {emp.joiningDate}</span>
                </div>
              </div>

              {/* Work Status Badge Group */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] mb-3">
                <WorkBadge label="অর্পিত" value={empTasksArr.length} cls="bg-slate-100 text-slate-700" />
                <WorkBadge label="চলমান" value={inProgress} cls="bg-blue-100 text-blue-700" />
                <WorkBadge label="সম্পন্ন" value={completed} cls="bg-emerald-100 text-emerald-700" />
                <WorkBadge label="মেয়াদোত্তীর্ণ" value={overdue} cls="bg-rose-100 text-rose-700" />
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-700">সম্পন্নতা</span>
                  <span className="font-bold text-emerald-700">{completion}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${completion}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-3">
                <span>
                  <strong>পারফরম্যান্স:</strong>{" "}
                  <span className="text-emerald-700 font-bold">{perf.total}/১০০</span>
                </span>
                {lastDaily && (
                  <span className="truncate ml-2">
                    সর্বশেষ আপডেট: <span className="font-mono">{lastDaily.date}</span>
                  </span>
                )}
              </div>

              <Link
                href={`/employees/${emp.id}/daily`}
                className="mt-auto block text-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
              >
                360° প্রোফাইল দেখুন →
              </Link>
            </div>
          );
        })}
      </div>

      {visibleEmployees.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 mt-3">কোনো কর্মকর্তা পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
      <div className="text-[10px] text-slate-500 font-semibold uppercase">{label}</div>
      <div className="text-base font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function SummaryStat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
      <div className="text-[10px] text-slate-500 font-semibold uppercase">{label}</div>
      <div className={`text-xl font-extrabold mt-0.5 ${cls}`}>{value}</div>
    </div>
  );
}

function WorkBadge({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className={`p-1 rounded ${cls} text-center`}>
      <div className="font-bold text-[10px]">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function ScoreBox({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
      <div className="text-[10px] text-emerald-700 font-semibold uppercase">{label}</div>
      <div className="text-base font-extrabold text-emerald-700 mt-0.5">{value}/{max}</div>
    </div>
  );
}

function focusEmpName(empId: number, list: any[]): string {
  const e = list.find((x) => x.id === empId);
  return e?.name || `EMP-${empId}`;
}
