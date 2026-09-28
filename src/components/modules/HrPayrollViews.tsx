"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Calendar,
  DollarSign,
  Award,
  Printer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";
import { getRoleBangla } from "@/components/ErpAppShell";

 

// ============================================================================
// কর্মকর্তা ও মানবসম্পদ ব্যবস্থাপনা (/employees and /employees/[id]/daily)
// ============================================================================
export function EmployeesView({
  data,
  onMutate,
  focusedEmployeeId,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  focusedEmployeeId?: number;
}) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [company, setCompany] = useState("INSAF");
  const [designation, setDesignation] = useState("Civil Engineer");
  const [assignedSite, setAssignedSite] = useState("");
  const [basicSalary, setBasicSalary] = useState("45000");
  const [allowance, setAllowance] = useState("10000");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Engineer");
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    focusedEmployeeId || data.employees?.[0]?.id || 1
  );

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createEmployee",
      name,
      company,
      department,
      designation,
      assignedSite,
      basicSalary: Number(basicSalary),
      allowance: Number(allowance),
      phone,
      email,
      role,
    });
    setName("");
    setPhone("");
    setEmail("");
    setAssignedSite("");
  }

  const canViewAll =
    data.currentUser?.role === "Owner" ||
    data.currentUser?.role === "MD" ||
    data.currentUser?.role === "Admin" ||
    data.currentUser?.role === "Manager" ||
    data.currentUser?.role === "Chairman" ||
    data.currentUser?.role === "HR";

  if (
    focusedEmployeeId &&
    !canViewAll &&
    focusedEmployeeId !== data.currentUser?.employeeId
  ) {
    return (
      <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-8 text-center space-y-3 max-w-xl mx-auto my-12 shadow-sm">
        <h2 className="text-xl font-bold text-rose-900">
          ৪০৩ অননুমোদিত — কর্মকর্তা তথ্যের গোপনীয়তা সুরক্ষিত
        </h2>
        <p className="text-xs text-rose-700 leading-relaxed">
          কর্মকর্তারা শুধুমাত্র নিজের ব্যক্তিগত প্রোফাইল, উপস্থিতি, বেতন, ছুটি ও কাজের ইতিহাস দেখতে পারেন। অন্য কর্মকর্তার তথ্য দেখার অনুমতি আপনার নেই।
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition"
        >
          ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>
    );
  }

  const activeEmp =
    (data.employees || []).find((e: any) => e.id === selectedEmpId) ||
    data.employees?.[0];

  const empAtt = (data.attendances || []).filter(
    (a: any) => a.employeeId === activeEmp?.id
  );
  const empPlans = (data.dailyWorkPlans || []).filter(
    (p: any) => p.employeeId === activeEmp?.id
  );
  const empDaily = (data.dailyWorks || []).filter(
    (d: any) => d.employeeId === activeEmp?.id
  );
  const empTasks = (data.tasks || []).filter(
    (t: any) => t.assignedTo === activeEmp?.id
  );
  const empFollowups = (data.leadFollowups || []).filter(
    (f: any) => f.staffId === activeEmp?.id
  );
  const empLeaves = (data.leaveRequests || []).filter(
    (l: any) => l.employeeId === activeEmp?.id
  );
  const empPayrolls = (data.payrolls || []).filter(
    (p: any) => p.employeeId === activeEmp?.id
  );
  const empPerf = (data.performanceReviews || []).filter(
    (p: any) => p.employeeId === activeEmp?.id
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কর্মকর্তা ও মানবসম্পদ ডিরেক্টরি (EMP-0001 Standard)
          </h1>
          <p className="text-xs text-slate-500">
            কর্মকর্তার ৩৬০° প্রোফাইল: উপস্থিতি, কাজের পরিকল্পনা, টাস্ক, ছুটি, পারফরম্যান্স মূল্যায়ন ও পদবী
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportToCSV("INSAF_Employees", data.employees || [])}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
        >
          কর্মকর্তা তালিকা CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* নতুন কর্মকর্তা অনবোর্ডিং ফর্ম (ম্যানেজমেন্ট ও এইচআর এর জন্য) */}
        {canViewAll && !focusedEmployeeId && (
          <form
            onSubmit={handleCreateEmployee}
            className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 space-y-3 h-fit shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> নতুন কর্মকর্তা অনবোর্ডিং
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: মোঃ সাকিব হাসান"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রতিষ্ঠান
                </label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="INSAF">INSAF</option>
                  <option value="INSAF BUILDING DESIGN & CONSULTANT LTD.">INSAF BUILDING DESIGN</option>
                  <option value="INSAF REAL ESTATE LTD.">INSAF REAL ESTATE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  বিভাগ
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option>Engineering</option>
                  <option>Operations</option>
                  <option>CRM & Marketing</option>
                  <option>Site Operations</option>
                  <option>Management</option>
                  <option>General Admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                পদবী (Designation) *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="যেমন: সিভিল ইঞ্জিনিয়ার"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সিস্টেম অ্যাক্সেস রোল
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="Engineer">ইঞ্জিনিয়ার (Engineer)</option>
                <option value="Project Manager">প্রজেক্ট ম্যানেজার</option>
                <option value="Marketing">মার্কেটিং স্পেশালিস্ট</option>
                <option value="Site Staff">সাইট ম্যানেজার / সাইট স্টাফ</option>
                <option value="Staff">সাধারণ স্টাফ</option>
                <option value="Manager">ম্যানেজার</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                বরাদ্দকৃত সাইট (প্রযোজ্য ক্ষেত্রে)
              </label>
              <input
                type="text"
                value={assignedSite}
                onChange={(e) => setAssignedSite(e.target.value)}
                placeholder="যেমন: মুক্তার প্লাজা"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ফোন নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ইমেইল *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@insaferp.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              কর্মকর্তা ও একাউন্ট তৈরি করুন
            </button>
          </form>
        )}

        {/* কর্মকর্তা ডিরেক্টরি কার্ড ও ৩৬০ প্রোফাইল */}
        <div
          className={
            canViewAll && !focusedEmployeeId
              ? "lg:col-span-8 space-y-4"
              : "lg:col-span-12 space-y-4"
          }
        >
          {/* ২৩. কর্মকর্তা ডিরেক্টরি কার্ডসমূহ (মোবাইল ও ডেস্কটপ ফ্রেন্ডলি) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              সক্রিয় কর্মকর্তাদের তালিকা (মোট {(data.employees || []).length} জন)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(data.employees || []).map((emp: any) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-3.5 rounded-2xl text-left border transition ${
                    activeEmp?.id === emp.id
                      ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-200 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      {emp.empCode}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold">
                      {emp.employmentStatus === "Active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm mt-1.5 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-600 truncate">{emp.designation}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{emp.company}</p>
                  {emp.assignedSite && (
                    <p className="text-[10px] text-indigo-700 font-semibold mt-1">
                      সাইট: {emp.assignedSite}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeEmp && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                    {activeEmp.empCode}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {activeEmp.name}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    {activeEmp.designation} — {activeEmp.department} • প্রতিষ্ঠান: {activeEmp.company}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ফোন: {activeEmp.phone} • ইমেইল: {activeEmp.email}
                    {activeEmp.assignedSite ? ` • সাইট: ${activeEmp.assignedSite}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">যোগদানের তারিখ</p>
                  <p className="text-sm font-bold text-slate-800 font-mono">{activeEmp.joiningDate}</p>
                  <Link
                    href={`/employees/${activeEmp.id}/daily`}
                    className="inline-block mt-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
                  >
                    দৈনিক কাজের লগ দেখুন →
                  </Link>
                </div>
              </div>

              {/* ৩৬০° সংক্ষিপ্ত পরিসংখ্যান কার্ডসমূহ */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">উপস্থিতি রেকর্ড</span>
                  <span className="text-base font-bold text-slate-900">
                    {empAtt.length} দিন
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">দৈনিক বিবরণী</span>
                  <span className="text-base font-bold text-emerald-600">
                    {empDaily.length} টি
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">অর্পিত টাস্ক</span>
                  <span className="text-base font-bold text-indigo-600">
                    {empTasks.length} টি
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">ছুটির রেকর্ড</span>
                  <span className="text-base font-bold text-amber-600">
                    {empLeaves.length} টি
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">পারফরম্যান্স স্কোর</span>
                  <span className="text-base font-bold text-purple-600">
                    {empPerf[0]?.totalPoints || 90} / ১০০
                  </span>
                </div>
              </div>

              {/* ৮. ব্যক্তিগত অ্যাক্টিভিটি টাইমলাইন (Private Activity Timeline) */}
              <div className="border-2 border-emerald-500/30 bg-emerald-50/20 rounded-3xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      কর্মকর্তার সার্বিক অ্যাক্টিভিটি টাইমলাইন
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      উপস্থিতি → কাজের পরিকল্পনা → দৈনিক বিবরণ → টাস্ক → ফলো-আপ → ছুটি → পারফরম্যান্স
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    শুধুমাত্র {activeEmp.name} ও ম্যানেজমেন্টের জন্য সংরক্ষিত
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-emerald-700 block">
                      ১. উপস্থিতি ({empAtt.length} দিন)
                    </span>
                    {empAtt.slice(0, 2).map((a: any) => (
                      <div key={a.id} className="text-slate-600">
                        {a.date}: ইন {a.checkIn || "—"} / আউট {a.checkOut || "কার্যরত"}
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-indigo-700 block">
                      ২. কাজের পরিকল্পনা ({empPlans.length} টি)
                    </span>
                    {empPlans.slice(0, 1).map((pl: any) => (
                      <div key={pl.id} className="text-slate-600">
                        {pl.date}: {(pl.items || []).length} টি আইটেম • সম্পন্নতা:{" "}
                        <strong>{pl.autoProgressPercent}%</strong>
                      </div>
                    ))}
                    {empPlans.length === 0 && (
                      <span className="text-slate-400">পরিকল্পনা নেই</span>
                    )}
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-amber-700 block">
                      ৩. টাস্ক ও লিড ({empTasks.length} / {empFollowups.length})
                    </span>
                    {empTasks.slice(0, 2).map((t: any) => (
                      <div key={t.id} className="text-slate-600 truncate">
                        {t.taskCode}: {t.title}
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-purple-700 block">
                      ৪. ছুটি ও পারফরম্যান্স
                    </span>
                    <div className="text-slate-600">
                      ছুটি: {empLeaves.length} টি • স্কোর:{" "}
                      <strong>{empPerf[0]?.totalPoints || 90}/১০০</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* দৈনিক কাজের বিবরণ ইতিহাস */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  সাম্প্রতিক দাখিলকৃত কাজের বিবরণ ({empDaily.length} টি)
                </h3>
                <div className="space-y-2">
                  {empDaily.map((d: any) => (
                    <div key={d.id} className="p-3 rounded-xl bg-slate-50 text-xs">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{d.date} (ইন: {d.arrivalTime})</span>
                        <span className="text-emerald-600 font-bold">{d.progressPercent}%</span>
                      </div>
                      <p className="text-slate-700 mt-1">{d.workSummary}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        আগামীকালের কাজ: {d.tomorrowPlan}
                      </p>
                    </div>
                  ))}
                  {empDaily.length === 0 && (
                    <p className="text-xs text-slate-400">এখনও কোনো কাজের বিবরণী জমা পড়েনি।</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ছুটির আবেদন ও হিসাব মডিউল (/leave - 100% BANGLA)
// ============================================================================
export function LeaveView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [totalDays, setTotalDays] = useState("1");
  const [reason, setReason] = useState("");

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "applyLeave",
      leaveType,
      startDate,
      endDate,
      totalDays: Number(totalDays),
      reason,
    });
    setReason("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ছুটির আবেদন ও উপস্থিতি সমন্বয় ব্যবস্থাপনা (Leave Module)
          </h1>
          <p className="text-xs text-slate-500">
            নৈমিত্তিক, অসুস্থতাজনিত ও বার্ষিক ছুটি • অনুমোদিত ছুটি স্বয়ংক্রিয়ভাবে উপস্থিতি খাতায় প্রতিফলিত হয়
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleApply}
          className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 h-fit shadow-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> ছুটির আবেদন দাখিল করুন
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ছুটির ধরন
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            >
              <option value="Casual">নৈমিত্তিক ছুটি (Casual Leave)</option>
              <option value="Sick">অসুস্থতাজনিত ছুটি (Sick Leave)</option>
              <option value="Annual">বার্ষিক ছুটি (Annual Leave)</option>
              <option value="Unpaid">বিনা বেতনে ছুটি (Unpaid Leave)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                শুরুর তারিখ
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                শেষের তারিখ
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              মোট দিনের সংখ্যা
            </label>
            <input
              type="number"
              min="1"
              value={totalDays}
              onChange={(e) => setTotalDays(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ছুটির কারণ *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ছুটি গ্রহণের সঠিক কারণ উল্লেখ করুন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
          >
            ছুটির আবেদন পাঠান
          </button>
        </form>

        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              ছুটির আবেদন ও অনুমোদন ইতিহাস (মোট {(data.leaveRequests || []).length} টি)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">আবেদন কোড</th>
                  <th className="p-3 font-semibold">কর্মকর্তা</th>
                  <th className="p-3 font-semibold">ধরন</th>
                  <th className="p-3 font-semibold">সময়কাল</th>
                  <th className="p-3 font-semibold text-center">দিন</th>
                  <th className="p-3 font-semibold">কারণ</th>
                  <th className="p-3 font-semibold">স্ট্যাটাস</th>
                  <th className="p-3 font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.leaveRequests || []).map((lv: any) => {
                  const emp = empMap.get(lv.employeeId);
                  return (
                    <tr key={lv.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-800">{lv.leaveCode}</td>
                      <td className="p-3 font-semibold">
                        {emp?.name || `EMP-${lv.employeeId}`}
                      </td>
                      <td className="p-3">
                        {lv.leaveType === "Casual" ? "নৈমিত্তিক" : lv.leaveType === "Sick" ? "অসুস্থতাজনিত" : lv.leaveType}
                      </td>
                      <td className="p-3 font-mono">
                        {lv.startDate} → {lv.endDate}
                      </td>
                      <td className="p-3 font-bold text-center">{lv.totalDays} দিন</td>
                      <td className="p-3 text-slate-600">{lv.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
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
                      <td className="p-3">
                        {lv.status === "Pending" &&
                          data.currentUser?.role !== "Staff" && (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onMutate({
                                    action: "approveLeave",
                                    leaveId: lv.id,
                                    decision: "Approved",
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[11px]"
                              >
                                <CheckCircle2 className="w-3 h-3" /> অনুমোদন
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onMutate({
                                    action: "approveLeave",
                                    leaveId: lv.id,
                                    decision: "Rejected",
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 text-[11px]"
                              >
                                <XCircle className="w-3 h-3" /> বাতিল
                              </button>
                            </div>
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
    </div>
  );
}

// ============================================================================
// বেতন ও পে-রোল মডিউল (/payroll - 100% BANGLA)
// ============================================================================
export function PayrollView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [employeeId, setEmployeeId] = useState(
    String(data.allEmployeesDirectory?.[4]?.id || 1)
  );
  const [salaryMonth, setSalaryMonth] = useState("2026-04");
  const [basicSalary, setBasicSalary] = useState("45000");
  const [allowance, setAllowance] = useState("10000");
  const [overtimePay, setOvertimePay] = useState("2000");
  const [bonus, setBonus] = useState("0");
  const [advanceDeduction, setAdvanceDeduction] = useState("0");
  const [otherDeduction, setOtherDeduction] = useState("0");

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );

  const previewNet =
    Number(basicSalary || 0) +
    Number(allowance || 0) +
    Number(overtimePay || 0) +
    Number(bonus || 0) -
    Number(advanceDeduction || 0) -
    Number(otherDeduction || 0);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "generatePayroll",
      employeeId: Number(employeeId),
      salaryMonth,
      basicSalary: Number(basicSalary),
      allowance: Number(allowance),
      overtimePay: Number(overtimePay),
      bonus: Number(bonus),
      advanceDeduction: Number(advanceDeduction),
      otherDeduction: Number(otherDeduction),
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            বেতন শিট ও ডাবল-এন্ট্রি প্রদান ব্যবস্থাপনা (Payroll &amp; Payslip)
          </h1>
          <p className="text-xs text-slate-500">
            সূত্র: মূল বেতন + বাড়িভাড়া/ভাতা + ওভারটাইম + বোনাস - অগ্রিম - কর্তন = নিট বেতন • ডিসবার্সমেন্টের সাথে সাথে স্বয়ংক্রিয় জার্নাল ভাউচার পোস্ট হয়
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToCSV("INSAF_Payroll", data.payrolls || [])}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToPDFPrint(
                "কর্মকর্তা বেতন রেজিস্টার ও পে-স্লিপ",
                "ইনসাফ বিজনেস পে-রোল তালিকা",
                data.payrolls || []
              )
            }
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> পে-স্লিপ PDF প্রিন্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {data.currentUser?.role !== "Staff" && (
          <form
            onSubmit={handleGenerate}
            className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 space-y-3 h-fit shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> মাসিক পে-রোল নির্ধারণ করুন
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                কর্মকর্তা নির্বাচন
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.allEmployeesDirectory || []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.empCode} — {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                বেতনের মাস
              </label>
              <input
                type="month"
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  মূল বেতন (+)
                </label>
                <input
                  type="number"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ভাতা (+)
                </label>
                <input
                  type="number"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ওভারটাইম (+)
                </label>
                <input
                  type="number"
                  value={overtimePay}
                  onChange={(e) => setOvertimePay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  বোনাস (+)
                </label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  অগ্রিম কর্তন (-)
                </label>
                <input
                  type="number"
                  value={advanceDeduction}
                  onChange={(e) => setAdvanceDeduction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  অন্যান্য কর্তন (-)
                </label>
                <input
                  type="number"
                  value={otherDeduction}
                  onChange={(e) => setOtherDeduction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">
                নিট প্রদেয় বেতন:
              </span>
              <span className="text-base font-bold text-emerald-700">
                ৳{previewNet.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              অনুমোদন ও পে-রোল তৈরি করুন
            </button>
          </form>
        )}

        <div
          className={
            data.currentUser?.role !== "Staff"
              ? "lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs"
              : "lg:col-span-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs"
          }
        >
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              বেতন শিট ও পে-স্লিপ রেজিস্টার (মোট {(data.payrolls || []).length} টি)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">পে-রোল কোড</th>
                  <th className="p-3 font-semibold">কর্মকর্তার নাম</th>
                  <th className="p-3 font-semibold">মাস</th>
                  <th className="p-3 font-semibold">মূল বেতন ও ভাতা</th>
                  <th className="p-3 font-semibold">ওভারটাইম</th>
                  <th className="p-3 font-semibold">অগ্রিম ও কর্তন</th>
                  <th className="p-3 font-semibold">নিট বেতন</th>
                  <th className="p-3 font-semibold">স্ট্যাটাস</th>
                  <th className="p-3 font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.payrolls || []).map((pr: any) => {
                  const emp = empMap.get(pr.employeeId);
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-800">{pr.payrollCode}</td>
                      <td className="p-3 font-semibold">
                        {emp?.name || `EMP-${pr.employeeId}`}
                      </td>
                      <td className="p-3 font-mono">{pr.salaryMonth}</td>
                      <td className="p-3">
                        ৳{Number(pr.basicSalary).toLocaleString()} + ৳
                        {Number(pr.allowance).toLocaleString()}
                      </td>
                      <td className="p-3 text-emerald-600 font-semibold">
                        +৳{Number(pr.overtimePay).toLocaleString()}
                      </td>
                      <td className="p-3 text-rose-600">
                        -৳{Number(pr.advanceDeduction).toLocaleString()} / -৳
                        {Number(pr.otherDeduction).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-slate-900 text-sm">
                        ৳{Number(pr.netSalary).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            pr.status === "Paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {pr.status === "Paid" ? "পরিশোধিত" : "অনুমোদিত"}
                        </span>
                      </td>
                      <td className="p-3">
                        {pr.status !== "Paid" &&
                          data.currentUser?.role !== "Staff" && (
                            <button
                              type="button"
                              onClick={() =>
                                onMutate({
                                  action: "disbursePayroll",
                                  payrollId: pr.id,
                                  method: "Bank",
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs"
                            >
                              ডিসবার্স ও ভাউচার পোস্ট
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
    </div>
  );
}

// ============================================================================
// পারফরম্যান্স মূল্যায়ন মডিউল (/performance - 100% BANGLA)
// ============================================================================
export function PerformanceView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [employeeId, setEmployeeId] = useState(
    String(data.allEmployeesDirectory?.[4]?.id || 1)
  );
  const [period, setPeriod] = useState("2026-04");
  const [managerReviewPoints, setManagerReviewPoints] = useState("9");
  const [managerComments, setManagerComments] = useState("");

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "generatePerformanceReview",
      employeeId: Number(employeeId),
      period,
      managerReviewPoints: Number(managerReviewPoints),
      managerComments,
    });
    setManagerComments("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কর্মকর্তাদের পারফরম্যান্স মূল্যায়ন (বাস্তব কার্যক্রম নির্ভর)
          </h1>
          <p className="text-xs text-slate-500">
            উপস্থিতি, দৈনিক কাজের অগ্রগতি, টাস্ক সম্পন্নতা, ফলো-আপ ও ম্যানেজমেন্ট মূল্যায়নের সমন্বিত পয়েন্ট
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {data.currentUser?.role !== "Staff" && (
          <form
            onSubmit={handleEvaluate}
            className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 h-fit shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> মাসিক পারফরম্যান্স নির্ধারণ করুন
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                কর্মকর্তা নির্বাচন
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.allEmployeesDirectory || []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.empCode} — {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  মূল্যায়ন মাস
                </label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ম্যানেজার পয়েন্ট (০-১০)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={managerReviewPoints}
                  onChange={(e) => setManagerReviewPoints(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ম্যানেজমেন্ট মন্তব্য ও মূল্যায়ন নোট
              </label>
              <textarea
                rows={2}
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                placeholder="কর্মকর্তার কাজের গুণগত মান সম্পর্কিত মন্তব্য লিখুন..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              স্বয়ংক্রিয় কার্যক্রম স্কোর হিসাব করুন
            </button>
          </form>
        )}

        <div className="lg:col-span-8 space-y-3">
          {(data.performanceReviews || []).map((rev: any) => {
            const emp = empMap.get(rev.employeeId);
            return (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {emp?.name || `EMP-${rev.employeeId}`} ({emp?.empCode})
                    </h3>
                    <p className="text-xs text-slate-500">
                      মাস: {rev.period} • মূল্যায়নকারী: {rev.reviewedBy}
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      মোট স্কোর
                    </span>
                    <span className="text-xl font-bold text-emerald-700">
                      {rev.totalPoints} / ১০০
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-400 block text-[11px]">উপস্থিতি</span>
                    <span className="font-bold">{rev.attendanceScore}/২৫</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-400 block text-[11px]">টাস্ক সম্পন্ন</span>
                    <span className="font-bold">{rev.taskScore}/২৫</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-400 block text-[11px]">দৈনিক লগ</span>
                    <span className="font-bold">{rev.dailyUpdateScore}/২০</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-400 block text-[11px]">ফলো-আপ</span>
                    <span className="font-bold">{rev.followUpScore}/১৫</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-400 block text-[11px]">প্রজেক্ট</span>
                    <span className="font-bold">{rev.projectContributionScore}/১৫</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-400 block text-[11px]">ম্যানেজার পয়েন্ট</span>
                    <span className="font-bold">{rev.managerReviewPoints}/১০</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic">
                  &ldquo;{rev.managerComments}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

void Users;
void getRoleBangla;
