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
  FileSpreadsheet,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

 

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
  const [department, setবিভাগ] = useState("Engineering");
  const [designation, setDesignation] = useState("Site Engineer");
  const [basicSalary, setBasicSalary] = useState("35000");
  const [allowance, setAllowance] = useState("5000");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("City Bank PLC");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [role, setRole] = useState("Engineer");
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    focusedEmployeeId || data.employees?.[0]?.id || 1
  );

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createEmployee",
      name,
      department,
      designation,
      basicSalary: Number(basicSalary),
      allowance: Number(allowance),
      phone,
      email,
      bankName,
      bankAccountNo,
      role,
    });
    setName("");
    setPhone("");
    setEmail("");
  }

  const canViewAll =
    data.currentUser?.role === "Owner" ||
    data.currentUser?.role === "MD" ||
    data.currentUser?.role === "Admin" ||
    data.currentUser?.role === "Manager" ||
    data.currentUser?.role === "HR";

  if (
    focusedEmployeeId &&
    !canViewAll &&
    focusedEmployeeId !== data.currentUser?.employeeId
  ) {
    return (
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-rose-900">
          403 Forbidden — Staff Privacy & Access Control Enforced
        </h2>
        <p className="text-xs text-rose-700 max-w-xl mx-auto">
          Staff members can only view their own profile, attendance, salary, leave, performance, daily work history, documents, and activity timeline. Only Manager, MD, HR, and Owner/Super Admin can view other employees&apos; records.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Return to My Self-Service Dashboard
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কর্মচারী ও এইচআর ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-slate-500">
            360° Employee Profile: Attendance, Daily Work, Tasks, Leave, Performance, Salary, Advance & Assigned Projects
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportToCSV("INSAF_Employees", data.employees || [])}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
        >
          কর্মচারী CSV এক্সপোর্ট
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Employee Form */}
        {data.currentUser?.role !== "Staff" && !focusedEmployeeId && (
          <form
            onSubmit={handleCreateEmployee}
            className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> নতুন কর্মচারী যোগ করুন
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
                placeholder="Engr. Ashraful Islam"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  বিভাগ
                </label>
                <select
                  value={department}
                  onChange={(e) => setবিভাগ(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option>Engineering</option>
                  <option>Construction</option>
                  <option>CRM & Sales</option>
                  <option>HR & Admin</option>
                  <option>Accounts & Finance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  সিস্টেম রোল
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option>Engineer</option>
                  <option>Project Manager</option>
                  <option>Sales</option>
                  <option>Accounts</option>
                  <option>HR</option>
                  <option>Staff</option>
                  <option>Site Staff</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                পদবি *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  মূল বেতন (৳)
                </label>
                <input
                  type="number"
                  required
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ভাতা (৳)
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
                  ফোন *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  placeholder="ashraf@insaferp.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ব্যাংকের নাম
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ব্যাংক হিসাব নং
                </label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              কর্মচারী তৈরি ও ইউজার অ্যাকাউন্ট যুক্ত করুন
            </button>
          </form>
        )}

        {/* Employee Directory & 360 Profile */}
        <div
          className={
            data.currentUser?.role !== "Staff" && !focusedEmployeeId
              ? "lg:col-span-8 space-y-4"
              : "lg:col-span-12 space-y-4"
          }
        >
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-2">
            {(data.employees || []).map((emp: any) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setSelectedEmpId(emp.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  activeEmp?.id === emp.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {emp.empCode} • {emp.name}
              </button>
            ))}
          </div>

          {activeEmp && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                    {activeEmp.empCode}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {activeEmp.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeEmp.designation} — {activeEmp.department} • Joined:{" "}
                    {activeEmp.joiningDate}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: {activeEmp.phone} | Email: {activeEmp.email} | Bank:{" "}
                    {activeEmp.bankName} ({activeEmp.bankAccountNo})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">মাসিক বেসিক + ভাতা</p>
                  <p className="text-lg font-bold text-emerald-600">
                    ৳
                    {(
                      Number(activeEmp.basicSalary) + Number(activeEmp.allowance)
                    ).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Advance: ৳{Number(activeEmp.advanceBalance).toLocaleString()} |
                    Deduction: ৳{Number(activeEmp.deductionDefault).toLocaleString()}
                  </p>
                  <Link
                    href={`/employees/${activeEmp.id}/daily`}
                    className="inline-block mt-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                  >
                    দৈনিক লগ খুলুন →
                  </Link>
                </div>
              </div>

              {/* 360° Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">হাজিরা লগ</span>
                  <span className="text-base font-bold text-slate-900">
                    {empAtt.length} days
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">দৈনিক কাজের লগ</span>
                  <span className="text-base font-bold text-emerald-600">
                    {empDaily.length} updates
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">অ্যাসাইনকৃত টাস্ক</span>
                  <span className="text-base font-bold text-indigo-600">
                    {empTasks.length} tasks
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">নেওয়া ছুটি</span>
                  <span className="text-base font-bold text-amber-600">
                    {empLeaves.length} requests
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">পারফরম্যান্স স্কোর</span>
                  <span className="text-base font-bold text-purple-600">
                    {empPerf[0]?.totalPoints || 88} / 100
                  </span>
                </div>
              </div>

              {/* 8. কর্মচারীর ব্যক্তিগত কার্যক্রম টাইমলাইন */}
              <div className="border-2 border-emerald-500/30 bg-emerald-50/20 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      কর্মচারীর ব্যক্তিগত কার্যক্রম টাইমলাইন
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      Attendance → Work Plan → Daily Work → Tasks → Follow-up → Leave → Performance
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Visible only to {activeEmp.name} & Management (Manager/MD/Owner)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-emerald-700 block">
                      1. Attendance ({empAtt.length})
                    </span>
                    {empAtt.slice(0, 2).map((a: any) => (
                      <div key={a.id} className="text-slate-600">
                        {a.date}: IN {a.checkIn || "—"} / OUT {a.checkOut || "Active"} ({a.workingHours}h)
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-indigo-700 block">
                      2. Work Plan ({empPlans.length})
                    </span>
                    {empPlans.slice(0, 1).map((pl: any) => (
                      <div key={pl.id} className="text-slate-600">
                        {pl.date}: {(pl.items || []).length} planned items • Auto:{" "}
                        <strong>{pl.autoProgressPercent}%</strong>
                      </div>
                    ))}
                    {empPlans.length === 0 && (
                      <span className="text-slate-400">আজকের কাজের পরিকল্পনা নেই</span>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-amber-700 block">
                      3. Tasks & CRM ({empTasks.length} / {empFollowups.length})
                    </span>
                    {empTasks.slice(0, 2).map((t: any) => (
                      <div key={t.id} className="text-slate-600 truncate">
                        {t.taskCode}: {t.title} ({t.status})
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <span className="font-bold text-purple-700 block">
                      4. Leave & Performance
                    </span>
                    <div className="text-slate-600">
                      Leaves: {empLeaves.length} • Score:{" "}
                      <strong>{empPerf[0]?.totalPoints || 90}/100</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Daily Work & Task History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">
                    সাম্প্রতিক দৈনিক আপডেট ({empDaily.length})
                  </h3>
                  <div className="space-y-2">
                    {empDaily.map((d: any) => (
                      <div key={d.id} className="p-2.5 rounded-lg bg-slate-50 text-xs">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{d.date} (In: {d.arrivalTime})</span>
                          <span className="text-emerald-600">{d.progressPercent}%</span>
                        </div>
                        <p className="text-slate-600 mt-1">{d.workSummary}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tomorrow: {d.tomorrowPlan}
                        </p>
                      </div>
                    ))}
                    {empDaily.length === 0 && (
                      <p className="text-xs text-slate-400">এখনো দৈনিক আপডেট নেই।</p>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">
                    বেতন ও পে-রোল ইতিহাস ({empPayrolls.length})
                  </h3>
                  <div className="space-y-2">
                    {empPayrolls.map((pr: any) => (
                      <div key={pr.id} className="p-2.5 rounded-lg bg-slate-50 text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>
                            {pr.payrollCode} ({pr.salaryMonth})
                          </span>
                          <span className="text-emerald-600">
                            Net: ৳{Number(pr.netSalary).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Basic: ৳{Number(pr.basicSalary).toLocaleString()} + Allow: ৳
                          {Number(pr.allowance).toLocaleString()} + OT: ৳
                          {Number(pr.overtimePay).toLocaleString()} - Adv: ৳
                          {Number(pr.advanceDeduction).toLocaleString()} - Ded: ৳
                          {Number(pr.otherDeduction).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {empPayrolls.length === 0 && (
                      <p className="text-xs text-slate-400">এখনো পে-রোল তৈরি হয়নি।</p>
                    )}
                  </div>
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
// LEAVE MANAGEMENT VIEW (/leave)
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ছুটি ব্যবস্থাপনা ও হাজিরা সিঙ্ক
          </h1>
          <p className="text-xs text-slate-500">
            Casual, Sick, Annual Leave Quotas • Manager & HR Approval • Approved Leave Automatically Reflects in Attendance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleApply}
          className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 h-fit"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> ছুটির আবেদন
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ছুটির ধরন
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option>Casual</option>
              <option>Sick</option>
              <option>Annual</option>
              <option>Unpaid</option>
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
                শেষ তারিখ
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
              মোট দিন
            </label>
            <input
              type="number"
              min="1"
              value={totalDays}
              onChange={(e) => setTotalDays(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Reason *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
          >
            ছুটির আবেদন জমা দিন
          </button>
        </form>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              ছুটির আবেদন ও অনুমোদন ইতিহাস ({(data.leaveRequests || []).length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">কোড</th>
                  <th className="p-3">কর্মচারী</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">সময়কাল</th>
                  <th className="p-3">দিন</th>
                  <th className="p-3">কারণ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.leaveRequests || []).map((lv: any) => {
                  const emp = empMap.get(lv.employeeId);
                  return (
                    <tr key={lv.id}>
                      <td className="p-3 font-mono font-bold">{lv.leaveCode}</td>
                      <td className="p-3 font-semibold">
                        {emp?.name || `EMP-${lv.employeeId}`}
                      </td>
                      <td className="p-3">{lv.leaveType}</td>
                      <td className="p-3">
                        {lv.startDate} → {lv.endDate}
                      </td>
                      <td className="p-3 font-bold">{lv.totalDays}d</td>
                      <td className="p-3 text-slate-600">{lv.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            lv.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : lv.status === "Rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {lv.status}
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
                                className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
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
                                className="px-2 py-1 rounded bg-rose-600 text-white font-semibold flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> Reject
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
// PAYROLL MODULE VIEW (/payroll)
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
  const [basicSalary, setBasicSalary] = useState("30000");
  const [allowance, setAllowance] = useState("5000");
  const [overtimePay, setOvertimePay] = useState("2000");
  const [bonus, setBonus] = useState("0");
  const [advanceDeduction, setAdvanceDeduction] = useState("3000");
  const [otherDeduction, setOtherDeduction] = useState("1000");

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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            পে-রোল, বেতন শিট ও হিসাব বিতরণ
          </h1>
          <p className="text-xs text-slate-500">
            Formula: Basic + Allowance + Overtime + Bonus - Advance - Deduction = নিট বেতন • Auto-posts Journal Entry on Disbursement
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToCSV("INSAF_Payroll", data.payrolls || [])}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToPDFPrint(
                "Payroll Register & Payslips",
                "Verified Salary Sheet",
                data.payrolls || []
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> পে-স্লিপ PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {data.currentUser?.role !== "Staff" && (
          <form
            onSubmit={handleGenerate}
            className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> মাসিক পে-রোল তৈরি
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">
                নিট বেতন:
              </span>
              <span className="text-base font-bold text-emerald-700">
                ৳{previewNet.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              অনুমোদন ও পে-রোল তৈরি
            </button>
          </form>
        )}

        <div
          className={
            data.currentUser?.role !== "Staff"
              ? "lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden"
              : "lg:col-span-12 bg-white rounded-2xl border border-slate-200 overflow-hidden"
          }
        >
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              পে-রোল ও পে-স্লিপ ({(data.payrolls || []).length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">পে-রোল আইডি</th>
                  <th className="p-3">কর্মচারী</th>
                  <th className="p-3">মাস</th>
                  <th className="p-3">বেসিক + ভাতা</th>
                  <th className="p-3">ওভারটাইম</th>
                  <th className="p-3">অগ্রিম + কর্তন</th>
                  <th className="p-3">নিট বেতন</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.payrolls || []).map((pr: any) => {
                  const emp = empMap.get(pr.employeeId);
                  return (
                    <tr key={pr.id}>
                      <td className="p-3 font-mono font-bold">{pr.payrollCode}</td>
                      <td className="p-3 font-semibold">
                        {emp?.name || `EMP-${pr.employeeId}`}
                      </td>
                      <td className="p-3">{pr.salaryMonth}</td>
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
                          className={`px-2.5 py-0.5 rounded-full font-bold ${
                            pr.status === "Paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {pr.status}
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                            >
                              পরিশোধ ও জার্নাল
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
// PERFORMANCE MANAGEMENT VIEW (/performance)
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কর্মচারী পারফরম্যান্স (বাস্তব কার্যক্রম ভিত্তিক)
          </h1>
          <p className="text-xs text-slate-500">
            Calculated from Real Attendance, Daily Work Updates, Task Completion, Follow-ups & Manager Review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {data.currentUser?.role !== "Staff" && (
          <form
            onSubmit={handleEvaluate}
            className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> মাসিক পারফরম্যান্স হিসাব
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Employee
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  মূল্যায়ন সময়কাল
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ম্যানেজার মন্তব্য
              </label>
              <textarea
                rows={2}
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              বাস্তব স্কোর হিসাব করুন
            </button>
          </form>
        )}

        <div className="lg:col-span-8 space-y-3">
          {(data.performanceReviews || []).map((rev: any) => {
            const emp = empMap.get(rev.employeeId);
            return (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {emp?.name || `EMP-${rev.employeeId}`} ({emp?.empCode})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Period: {rev.period} • Reviewed by {rev.reviewedBy}
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      মোট স্কোর
                    </span>
                    <span className="text-xl font-bold text-emerald-700">
                      {rev.totalPoints} / 100
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Attendance</span>
                    <span className="font-bold">{rev.attendanceScore}/25</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">টাস্ক স্কোর</span>
                    <span className="font-bold">{rev.taskScore}/25</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">দৈনিক লগ</span>
                    <span className="font-bold">{rev.dailyUpdateScore}/20</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Follow-ups</span>
                    <span className="font-bold">{rev.followUpScore}/15</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Projects</span>
                    <span className="font-bold">{rev.projectContributionScore}/15</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">ম্যানেজার রিভিউ</span>
                    <span className="font-bold">{rev.managerReviewPoints}/10</span>
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
void FileSpreadsheet;
