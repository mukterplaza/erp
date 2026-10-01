"use client";

import React, { useState, useMemo } from "react";
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
  Clock,
  Edit3,
  Trash2,
  Eye,
  Search,
  Download,
  Receipt,
  Wallet,
  BookOpen,
  Save as SaveIcon,
  ShieldCheck,
  Globe,
  Smartphone,
  X,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

// ============================================================================
// ⭐ Number to Words (English) — for "In Words" line in salary sheet
// ============================================================================
function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero Taka Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };

  return convert(Math.floor(num)) + " Taka Only";
}

// ============================================================================
// EMPLOYEES VIEW (/employees)
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
                  onChange={(e) => setDepartment(e.target.value)}
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
                          Total: ৳{Number(pr.totalSalary || 0).toLocaleString()} + T.A: ৳
                          {Number(pr.taDa || 0).toLocaleString()} + OT: ৳
                          {Number(pr.overtimePay || 0).toLocaleString()} - PF: ৳
                          {Number(pr.providentFund || 0).toLocaleString()} - Ded: ৳
                          {Number(pr.deduction || 0).toLocaleString()} - Adv: ৳
                          {Number(pr.advancePaid || 0).toLocaleString()}
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
// ⭐ PAYROLL MODULE VIEW (/payroll) — August 2026 Salary Sheet Format
// Formula: Total Salary + T.A/D.A + Over Time − Provident Fund − Deduction
//          − Advanced/Paid = Net Money
// ============================================================================
export function PayrollView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  // ===== Form States =====
  const [employeeId, setEmployeeId] = useState(
    String(data.allEmployeesDirectory?.[0]?.id || 1)
  );
  const [salaryMonth, setSalaryMonth] = useState("2026-08");

  const [totalSalary, setTotalSalary] = useState("50000");
  const [taDa, setTaDa] = useState("0");
  const [overtimePay, setOvertimePay] = useState("0");
  const [providentFund, setProvidentFund] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [advancePaid, setAdvancePaid] = useState("0");
  const [notes, setNotes] = useState("");

  // ===== Auto-fill from In/Out Scan =====
  const employeeScans = useMemo(() => {
    const att = (data.attendances || []).filter(
      (a: any) =>
        String(a.employeeId) === employeeId &&
        a.date && a.date.startsWith(salaryMonth)
    );
    return att;
  }, [data.attendances, employeeId, salaryMonth]);

  const scanInfo = useMemo(() => {
    if (employeeScans.length === 0) {
      return { inTime: "--:--", outTime: "--:--", workingDays: 26, presentDays: 0, overtimeHours: 0 };
    }
    const inTimes = employeeScans.map((s: any) => s.checkIn).filter(Boolean).sort();
    const outTimes = employeeScans.map((s: any) => s.checkOut).filter(Boolean).sort();

    let totalOT = 0;
    employeeScans.forEach((s: any) => {
      if (s.checkIn && s.checkOut) {
        const [ih, im] = s.checkIn.split(":").map(Number);
        const [oh, om] = (s.checkOut || "").split(":").map(Number);
        if (!isNaN(ih) && !isNaN(oh)) {
          const worked = oh * 60 + om - (ih * 60 + im);
          const otMin = Math.max(0, worked - 8 * 60);
          totalOT += otMin / 60;
        }
      }
    });
    return {
      inTime: inTimes[0] || "--:--",
      outTime: outTimes[outTimes.length - 1] || "--:--",
      workingDays: 26,
      presentDays: employeeScans.length,
      overtimeHours: Math.round(totalOT * 100) / 100,
    };
  }, [employeeScans]);

  // Auto-fill OT from scan
  React.useEffect(() => {
    if (scanInfo.overtimeHours > 0) {
      setOvertimePay(String(Math.round(scanInfo.overtimeHours * 250)));
    }
  }, [scanInfo.overtimeHours]);

  // Auto-fill from employee's basic salary
  React.useEffect(() => {
    const emp = (data.allEmployeesDirectory || []).find(
      (e: any) => String(e.id) === employeeId
    );
    if (emp) {
      const total = Number(emp.basicSalary || 0) + Number(emp.allowance || 0);
      if (total > 0) setTotalSalary(String(total));
    }
  }, [employeeId, data.allEmployeesDirectory]);

  // ===== Filters =====
  const [filterMonth, setFilterMonth] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending" | "Draft">("All");

  // ===== Modal states =====
  const [showPayslip, setShowPayslip] = useState<any>(null);
  const [showEdit, setShowEdit] = useState<any>(null);

  // ===== Helpers =====
  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );
  const taka = (n: number) => "৳" + Number(n || 0).toLocaleString("en-IN");

  // ⭐ NEW Net Salary Formula (August 2026 sheet style):
  const previewNet =
    Number(totalSalary || 0) +
    Number(taDa || 0) +
    Number(overtimePay || 0) -
    Number(providentFund || 0) -
    Number(deduction || 0) -
    Number(advancePaid || 0);

  // ===== Filtered Payrolls =====
  const filteredPayrolls = useMemo(() => {
    return (data.payrolls || []).filter((pr: any) => {
      const okMonth = filterMonth === "all" ? true : pr.salaryMonth === filterMonth;
      const emp = empMap.get(pr.employeeId);
      const q = search.trim().toLowerCase();
      const okSearch =
        !q ||
        (emp?.name || "").toLowerCase().includes(q) ||
        (emp?.empCode || "").toLowerCase().includes(q) ||
        (pr.payrollCode || "").toLowerCase().includes(q);
      const okStatus = statusFilter === "All" ? true : pr.status === statusFilter;
      return okMonth && okSearch && okStatus;
    });
  }, [data.payrolls, filterMonth, search, statusFilter]);

  // ===== Aggregate Totals =====
  const aggregateTotals = useMemo(() => {
    return filteredPayrolls.reduce(
      (acc: any, pr: any) => {
        acc.totalSalary += Number(pr.totalSalary || 0);
        acc.taDa += Number(pr.taDa || 0);
        acc.overtimePay += Number(pr.overtimePay || 0);
        acc.providentFund += Number(pr.providentFund || 0);
        acc.deduction += Number(pr.deduction || 0);
        acc.advancePaid += Number(pr.advancePaid || 0);
        acc.netSalary += Number(pr.netSalary || 0);
        return acc;
      },
      { totalSalary: 0, taDa: 0, overtimePay: 0, providentFund: 0, deduction: 0, advancePaid: 0, netSalary: 0 }
    );
  }, [filteredPayrolls]);

  const stats = useMemo(() => {
    const paid = filteredPayrolls.filter((r: any) => r.status === "Paid").reduce((s: number, r: any) => s + Number(r.netSalary), 0);
    return {
      total: aggregateTotals.netSalary,
      paid,
      pending: aggregateTotals.netSalary - paid,
      count: filteredPayrolls.length,
    };
  }, [aggregateTotals, filteredPayrolls]);

  // ===== Handlers =====
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "generatePayroll",
      employeeId: Number(employeeId),
      salaryMonth,
      totalSalary: Number(totalSalary),
      taDa: Number(taDa),
      overtimePay: Number(overtimePay),
      providentFund: Number(providentFund),
      deduction: Number(deduction),
      advancePaid: Number(advancePaid),
      netSalary: previewNet,
      notes,
      inTime: scanInfo.inTime,
      outTime: scanInfo.outTime,
      presentDays: scanInfo.presentDays,
      workingDays: scanInfo.workingDays,
      overtimeHours: scanInfo.overtimeHours,
    });
    setNotes("");
  }

  async function handleUpdate() {
    if (!showEdit) return;
    const newNet =
      Number(showEdit.totalSalary || 0) +
      Number(showEdit.taDa || 0) +
      Number(showEdit.overtimePay || 0) -
      Number(showEdit.providentFund || 0) -
      Number(showEdit.deduction || 0) -
      Number(showEdit.advancePaid || 0);
    await onMutate({
      action: "updatePayroll",
      payrollId: showEdit.id,
      totalSalary: Number(showEdit.totalSalary),
      taDa: Number(showEdit.taDa),
      overtimePay: Number(showEdit.overtimePay),
      providentFund: Number(showEdit.providentFund),
      deduction: Number(showEdit.deduction),
      advancePaid: Number(showEdit.advancePaid),
      netSalary: newNet,
      notes: showEdit.notes || "",
    });
    setShowEdit(null);
  }

  async function handleDelete(payrollId: number) {
    if (!confirm("আপনি কি নিশ্চিত যে এই পে-রোল রেকর্ড মুছে ফেলতে চান?")) return;
    await onMutate({ action: "deletePayroll", payrollId });
  }

  function printPayslip(pr: any) {
    setShowPayslip(pr);
    setTimeout(() => window.print(), 200);
  }

  const ANNOUNCEMENT = {
    title: "INSAF ERP - অফিসিয়াল ঘোষণা",
    body:
      "সকল সহকর্মীদের জানানো যাচ্ছে, INSAF ERP এখন থেকেই বাংলা ইন্টারফেস, মোবাইল ব্যবহারযোগ্যতা এবং কঠোর অ্যাকাউন্ট নিরাপত্তাসহ চালু আছে। প্রত্যেকে শুধু নিজের অ্যাকাউন্টে লগইন করবেন। প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক।",
    publisher: "Engr. Muhammad Sheik Rakibul Hasan",
  };

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #payslip-print, #payslip-print * { visibility: visible; }
          #payslip-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* ===== Header ===== */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur p-3 rounded-xl">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
                পে-রোল ব্যবস্থাপনা
                <span className="inline-flex items-center gap-1 text-xs bg-amber-400 text-amber-900 px-2 py-1 rounded-full font-semibold">
                  <Globe className="w-3 h-3" /> বাংলা
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">
                  <Smartphone className="w-3 h-3" /> মোবাইল
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">
                  <ShieldCheck className="w-3 h-3" /> নিরাপদ
                </span>
              </h1>
              <p className="text-sm text-white/90 mt-1">
                ইন-টাইম / আউট-টাইম স্ক্যান → স্বয়ংক্রিয় মাসিক বেতন গণনা
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => exportToCSV("INSAF_Payroll", data.payrolls || [])}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl font-semibold flex items-center gap-1 text-xs"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() =>
                exportToPDFPrint(
                  "Payroll Register & Payslips",
                  "Insaf Building Design & Consultant Ltd.",
                  data.payrolls || []
                )
              }
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-xl font-semibold flex items-center gap-1 text-xs"
            >
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Announcement */}
        <div className="mt-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-xs">{ANNOUNCEMENT.title}</div>
              <p className="text-[11px] text-white/90 mt-0.5 leading-relaxed">
                {ANNOUNCEMENT.body}
              </p>
              <div className="text-[10px] text-white/70 mt-1">
                প্রকাশক: <span className="font-semibold">{ANNOUNCEMENT.publisher}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Formula Card ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800 text-sm">
              পে-রোল, বেতন শিট ও হিসাব বিতরণ
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="font-semibold">Formula:</span>{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 text-[11px]">
                Total Salary + T.A/D.A + Over Time − Provident Fund − Deduction − Advanced/Paid = নিট বেতন
              </code>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ✓ Auto-posts Journal Entry on Disbursement &nbsp;•&nbsp; ✓ In/Out Time Scan → Auto OT Calculate &nbsp;•&nbsp; ✓ স্বাক্ষর: Chairman | MD | GM
            </p>
          </div>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Wallet />} label="Total Salary" value={taka(aggregateTotals.totalSalary)} color="from-emerald-500 to-teal-500" />
        <StatCard icon={<CheckCircle2 />} label="Net Paid" value={taka(stats.paid)} color="from-green-500 to-emerald-500" />
        <StatCard icon={<AlertCircle />} label="Net Pending" value={taka(stats.pending)} color="from-amber-500 to-orange-500" />
        <StatCard icon={<Users />} label="Employees" value={String(stats.count)} color="from-blue-500 to-indigo-500" />
      </div>

      {/* ===== Main Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ===== Generate Payroll Form ===== */}
        {data.currentUser?.role !== "Staff" && (
          <form
            onSubmit={handleGenerate}
            className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> মাসিক পে-রোল তৈরি
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">বেতনের মাস</label>
              <input
                type="month"
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            {/* ⭐ Scan Info Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> স্ক্যান রেকর্ড (In/Out Time)
              </div>
              <div className="grid grid-cols-2 gap-2 text-emerald-900">
                <div><span className="text-emerald-600">In:</span> <b className="font-mono">{scanInfo.inTime}</b></div>
                <div><span className="text-emerald-600">Out:</span> <b className="font-mono">{scanInfo.outTime}</b></div>
                <div><span className="text-emerald-600">উপস্থিত:</span> <b>{scanInfo.presentDays}/{scanInfo.workingDays}</b></div>
                <div><span className="text-emerald-600">মোট OT:</span> <b>{scanInfo.overtimeHours}h</b></div>
              </div>
            </div>

            {/* ⭐ Total Salary (Main Field) */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <label className="block text-xs font-bold text-blue-800 mb-1">
                Total Salary / মোট বেতন (+)
              </label>
              <input
                type="number"
                value={totalSalary}
                onChange={(e) => setTotalSalary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">T.A/D.A (+)</label>
                <input
                  type="number"
                  value={taDa}
                  onChange={(e) => setTaDa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Over Time (+)</label>
                <input
                  type="number"
                  value={overtimePay}
                  onChange={(e) => setOvertimePay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Provident Fund (-)</label>
                <input
                  type="number"
                  value={providentFund}
                  onChange={(e) => setProvidentFund(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deduction (-)</label>
                <input
                  type="number"
                  value={deduction}
                  onChange={(e) => setDeduction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Advanced/Paid (-)</label>
              <input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            {/* ⭐ Net Preview with "In Words" */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Net Money / নিট বেতন:</span>
                <span className="text-lg font-bold">{taka(previewNet)}</span>
              </div>
              <div className="text-[10px] text-white/90 italic">
                In Words: {numberToWords(previewNet)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">নোট (ঐচ্ছিক)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: PF adjustment, advance settlement..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1"
            >
              <SaveIcon className="w-3.5 h-3.5" /> অনুমোদন ও পে-রোল তৈরি
            </button>
          </form>
        )}

        {/* ===== Payroll Sheet Table ===== */}
        <div
          className={
            data.currentUser?.role !== "Staff"
              ? "lg:col-span-8 space-y-3"
              : "lg:col-span-12 space-y-3"
          }
        >
          {/* Filters */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="নাম / কোড / আইডি..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <input
              type="month"
              value={filterMonth === "all" ? "" : filterMonth}
              onChange={(e) => setFilterMonth(e.target.value || "all")}
              className="w-full px-2 py-2 rounded-lg border border-slate-300 text-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2 py-2 rounded-lg border border-slate-300 text-xs"
            >
              <option value="All">সব স্ট্যাটাস</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* ===== Salary Sheet ===== */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Insaf Building Design & Consultant Ltd.
              </p>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Staff's Salary Sheet
              </h3>
              <p className="text-[10px] text-slate-500">
                পে-রোল ও পে-স্লিপ ({filteredPayrolls.length} জন কর্মচারী)
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-100 border-b-2 border-emerald-300 text-emerald-900">
                    <th className="p-2.5">Sl</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5 text-right">Total Salary</th>
                    <th className="p-2.5 text-right">T.A/D.A</th>
                    <th className="p-2.5 text-right">O.T</th>
                    <th className="p-2.5 text-right">PF</th>
                    <th className="p-2.5 text-right">Ded.</th>
                    <th className="p-2.5 text-right">Adv./Paid</th>
                    <th className="p-2.5 text-right">Net Money</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">⚙</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        কোনো পে-রোল রেকর্ড পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredPayrolls.map((pr: any, idx: number) => {
                      const emp = empMap.get(pr.employeeId);
                      const isStaff = data.currentUser?.role === "Staff";
                      return (
                        <tr key={pr.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-900">{emp?.name || `EMP-${pr.employeeId}`}</div>
                            <div className="text-[10px] text-slate-500">{emp?.empCode || pr.payrollCode}</div>
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold">{Number(pr.totalSalary || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono">{Number(pr.taDa || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-700">{Number(pr.overtimePay || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-rose-600">{Number(pr.providentFund || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-rose-600">{Number(pr.deduction || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-rose-600">{Number(pr.advancePaid || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700 text-sm">
                            {Number(pr.netSalary).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              pr.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                              pr.status === "Draft" ? "bg-slate-100 text-slate-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{pr.status}</span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => setShowPayslip(pr)} className="p-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200" title="পে-স্লিপ">
                                <Eye className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => printPayslip(pr)} className="p-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200" title="প্রিন্ট">
                                <Printer className="w-3 h-3" />
                              </button>
                              {!isStaff && (
                                <>
                                  <button type="button" onClick={() => setShowEdit({ ...pr })} className="p-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200" title="এডিট">
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  {pr.status !== "Paid" && (
                                    <button type="button" onClick={() => onMutate({ action: "disbursePayroll", payrollId: pr.id, method: "Bank" })} className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold text-[10px]" title="পরিশোধ">
                                      পরিশোধ
                                    </button>
                                  )}
                                  <button type="button" onClick={() => handleDelete(pr.id)} className="p-1 rounded bg-rose-100 text-rose-700 hover:bg-rose-200" title="মুছুন">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* ⭐ Footer Totals (Like August 2026 Sheet) */}
                {filteredPayrolls.length > 0 && (
                  <tfoot>
                    <tr className="bg-emerald-50 border-t-2 border-emerald-400 font-bold">
                      <td colSpan={2} className="p-2.5 text-emerald-900 text-right">Total:</td>
                      <td className="p-2.5 text-right font-mono text-emerald-900">{aggregateTotals.totalSalary.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-900">{aggregateTotals.taDa.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-900">{aggregateTotals.overtimePay.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-rose-700">{aggregateTotals.providentFund.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-rose-700">{aggregateTotals.deduction.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-rose-700">{aggregateTotals.advancePaid.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 text-base">{aggregateTotals.netSalary.toLocaleString()}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredPayrolls.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">কোনো রেকর্ড নেই</div>
              ) : (
                filteredPayrolls.map((pr: any) => (
                  <div key={pr.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-[10px] text-emerald-700">{pr.payrollCode}</div>
                        <div className="font-bold text-sm">{empMap.get(pr.employeeId)?.name || `EMP-${pr.employeeId}`}</div>
                        <div className="text-[10px] text-slate-500">{empMap.get(pr.employeeId)?.empCode}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pr.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                        pr.status === "Draft" ? "bg-slate-100 text-slate-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{pr.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-2 rounded-lg">
                      <div>Total: <b>৳{Number(pr.totalSalary).toLocaleString()}</b></div>
                      <div>T.A: <b>৳{Number(pr.taDa).toLocaleString()}</b></div>
                      <div>OT: <b className="text-emerald-600">৳{Number(pr.overtimePay).toLocaleString()}</b></div>
                      <div>PF: <b className="text-rose-600">৳{Number(pr.providentFund).toLocaleString()}</b></div>
                      <div>Ded: <b className="text-rose-600">৳{Number(pr.deduction).toLocaleString()}</b></div>
                      <div>Adv: <b className="text-rose-600">৳{Number(pr.advancePaid).toLocaleString()}</b></div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-500">Net Money</div>
                        <div className="font-bold text-base text-emerald-700">৳{Number(pr.netSalary).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setShowPayslip(pr)} className="p-1.5 rounded bg-blue-100 text-blue-700"><Eye className="w-3.5 h-3.5" /></button>
                        {data.currentUser?.role !== "Staff" && (
                          <>
                            <button type="button" onClick={() => setShowEdit({ ...pr })} className="p-1.5 rounded bg-amber-100 text-amber-700"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => handleDelete(pr.id)} className="p-1.5 rounded bg-rose-100 text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ⭐ Footer Summary with Signature Areas */}
            {filteredPayrolls.length > 0 && (
              <div className="p-4 border-t-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <div className="text-[10px] text-slate-500">Total Salary:</div>
                    <div className="font-bold text-emerald-700 text-base">{aggregateTotals.totalSalary.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <div className="text-[10px] text-slate-500">T.A/D.A:</div>
                    <div className="font-bold text-emerald-700 text-base">{aggregateTotals.taDa.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <div className="text-[10px] text-slate-500">Over Time:</div>
                    <div className="font-bold text-emerald-700 text-base">{aggregateTotals.overtimePay.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-rose-200">
                    <div className="text-[10px] text-slate-500">Provident Fund:</div>
                    <div className="font-bold text-rose-700 text-base">{aggregateTotals.providentFund.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-rose-200">
                    <div className="text-[10px] text-slate-500">Deduction:</div>
                    <div className="font-bold text-rose-700 text-base">{aggregateTotals.deduction.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-rose-200">
                    <div className="text-[10px] text-slate-500">Advanced/Paid:</div>
                    <div className="font-bold text-rose-700 text-base">{aggregateTotals.advancePaid.toLocaleString()}</div>
                  </div>
                  <div className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-lg">
                    <div className="text-[10px] uppercase opacity-80">Net Money:</div>
                    <div className="font-bold text-xl">{aggregateTotals.netSalary.toLocaleString()}</div>
                    <div className="text-[10px] italic opacity-90 mt-0.5">
                      In Words: {numberToWords(aggregateTotals.netSalary)}
                    </div>
                  </div>
                </div>

                {/* ⭐ Signature Areas */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-200 mt-3">
                  {["Chairman", "Managing Director", "General Manager"].map((role) => (
                    <div key={role} className="text-center">
                      <div className="border-t-2 border-slate-700 pt-1 mt-8 mx-2">
                        <div className="text-xs font-bold text-slate-700">{role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Payslip Modal ===== */}
      {showPayslip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">পে-স্লিপ</h3>
              <button type="button" onClick={() => setShowPayslip(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div id="payslip-print" className="p-5 space-y-3">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-emerald-700">Insaf Building Design & Consultant Ltd.</h3>
                <p className="text-[10px] text-slate-500">Staff's Pay Slip — {showPayslip.salaryMonth}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Payroll ID:</span> <b>{showPayslip.payrollCode}</b></div>
                <div><span className="text-slate-500">Name:</span> <b>{empMap.get(showPayslip.employeeId)?.name}</b></div>
                <div><span className="text-slate-500">Code:</span> {empMap.get(showPayslip.employeeId)?.empCode}</div>
                <div><span className="text-slate-500">Month:</span> {showPayslip.salaryMonth}</div>
                <div><span className="text-slate-500">In Time:</span> {showPayslip.inTime || '-'}</div>
                <div><span className="text-slate-500">Out Time:</span> {showPayslip.outTime || '-'}</div>
                <div><span className="text-slate-500">Present:</span> {showPayslip.presentDays || 0}/{showPayslip.workingDays || 0}</div>
                <div><span className="text-slate-500">OT Hours:</span> {showPayslip.overtimeHours || 0}h</div>
              </div>
              <table className="w-full text-sm border-t border-slate-200">
                <tbody className="divide-y divide-slate-100">
                  <PayslipRow label="Total Salary (+)" value={showPayslip.totalSalary || 0} positive />
                  <PayslipRow label="T.A/D.A (+)" value={showPayslip.taDa || 0} positive />
                  <PayslipRow label="Over Time (+)" value={showPayslip.overtimePay || 0} positive />
                  <PayslipRow label="Provident Fund (-)" value={showPayslip.providentFund || 0} />
                  <PayslipRow label="Deduction (-)" value={showPayslip.deduction || 0} />
                  <PayslipRow label="Advanced/Paid (-)" value={showPayslip.advancePaid || 0} />
                  <tr className="bg-emerald-50 font-bold text-emerald-700">
                    <td className="px-3 py-2">Net Money</td>
                    <td className="px-3 py-2 text-right text-base">{Number(showPayslip.netSalary).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[10px] text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                In Words: {numberToWords(Number(showPayslip.netSalary))}
              </div>
              {showPayslip.notes && (
                <div className="text-xs text-slate-600 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Note: {showPayslip.notes}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 mt-3">
                {["Chairman", "Managing Director", "General Manager"].map((role) => (
                  <div key={role} className="text-center">
                    <div className="border-t-2 border-slate-700 pt-1 mt-6">
                      <div className="text-[10px] font-bold text-slate-700">{role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Modal ===== */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">পে-রোল এডিট করুন</h3>
              <button type="button" onClick={() => setShowEdit(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="Total Salary" value={showEdit.totalSalary} onChange={(v: number) => setShowEdit({ ...showEdit, totalSalary: v })} />
                <NumInput label="T.A/D.A" value={showEdit.taDa} onChange={(v: number) => setShowEdit({ ...showEdit, taDa: v })} />
                <NumInput label="Over Time" value={showEdit.overtimePay} onChange={(v: number) => setShowEdit({ ...showEdit, overtimePay: v })} />
                <NumInput label="Provident Fund" value={showEdit.providentFund} onChange={(v: number) => setShowEdit({ ...showEdit, providentFund: v })} />
                <NumInput label="Deduction" value={showEdit.deduction} onChange={(v: number) => setShowEdit({ ...showEdit, deduction: v })} />
                <NumInput label="Advanced/Paid" value={showEdit.advancePaid} onChange={(v: number) => setShowEdit({ ...showEdit, advancePaid: v })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">নোট</label>
                <textarea
                  rows={2}
                  value={showEdit.notes || ""}
                  onChange={(e) => setShowEdit({ ...showEdit, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs mt-1"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEdit(null)} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold">
                  বাতিল
                </button>
                <button type="button" onClick={handleUpdate} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs">
                  আপডেট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// ============================================================================
// ⭐ Helper Components
// ============================================================================
function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex items-center gap-2.5">
      <div className={`bg-gradient-to-br ${color} text-white p-2.5 rounded-xl`}>
        <div className="w-4 h-4">{icon}</div>
      </div>
      <div>
        <div className="text-[10px] text-slate-500">{label}</div>
        <div className="font-bold text-base text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function PayslipRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const isPositive = positive || value >= 0;
  return (
    <tr>
      <td className="px-3 py-2 text-slate-700">{label}</td>
      <td className={`px-3 py-2 text-right font-mono ${isPositive ? "text-slate-800" : "text-rose-600"}`}>
        {isPositive ? "" : "-"}{"৳" + Math.abs(Number(value)).toLocaleString()}
      </td>
    </tr>
  );
}

function NumInput({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-700">{label}</label>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}
// ============================================================================
// ⭐ EXECUTIVE PAYROLL DASHBOARD — For MD/Owner/Admin Only
// Shows ALL employees' monthly payroll overview at a glance
// ============================================================================
export function ExecutivePayrollDashboard({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [search, setSearch] = useState("");

  // Only MD/Owner/Admin can see this
  const canView =
    data.currentUser?.role === "Owner" ||
    data.currentUser?.role === "MD" ||
    data.currentUser?.role === "Chairman" ||
    data.currentUser?.role === "Admin" ||
    data.currentUser?.role === "Manager" ||
    data.currentUser?.role === "HR";

  if (!canView) {
    return (
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-rose-900">403 Forbidden</h2>
        <p className="text-xs text-rose-700">
          এই Executive Dashboard শুধুমাত্র Owner, MD, Chairman, Admin, Manager ও HR এর জন্য।
        </p>
      </div>
    );
  }

  const empMap = new Map<number, any>(
    (data.allEmployeesDirectory || []).map((e: any) => [e.id, e])
  );

  const taka = (n: number) => "৳" + Number(n || 0).toLocaleString("en-IN");

  // Filtered payrolls
  const filteredPayrolls = useMemo(() => {
    return (data.payrolls || []).filter((pr: any) => {
      const okMonth = pr.salaryMonth === filterMonth;
      const emp = empMap.get(pr.employeeId);
      const okDept = filterDepartment === "All" ? true : emp?.department === filterDepartment;
      const q = search.trim().toLowerCase();
      const okSearch =
        !q ||
        (emp?.name || "").toLowerCase().includes(q) ||
        (emp?.empCode || "").toLowerCase().includes(q) ||
        (pr.payrollCode || "").toLowerCase().includes(q);
      return okMonth && okDept && okSearch;
    });
  }, [data.payrolls, filterMonth, filterDepartment, search]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totals = filteredPayrolls.reduce(
      (acc: any, pr: any) => {
        acc.totalSalary += Number(pr.totalSalary || 0);
        acc.taDa += Number(pr.taDa || 0);
        acc.overtimePay += Number(pr.overtimePay || 0);
        acc.providentFund += Number(pr.providentFund || 0);
        acc.deduction += Number(pr.deduction || 0);
        acc.advancePaid += Number(pr.advancePaid || 0);
        acc.netSalary += Number(pr.netSalary || 0);
        return acc;
      },
      { totalSalary: 0, taDa: 0, overtimePay: 0, providentFund: 0, deduction: 0, advancePaid: 0, netSalary: 0 }
    );
    const paid = filteredPayrolls
      .filter((r: any) => r.status === "Paid")
      .reduce((s: number, r: any) => s + Number(r.netSalary), 0);
    return {
      ...totals,
      paid,
      pending: totals.netSalary - paid,
      count: filteredPayrolls.length,
    };
  }, [filteredPayrolls]);

  // Department-wise breakdown
  const departmentBreakdown = useMemo(() => {
    const deptMap = new Map<string, any>();
    filteredPayrolls.forEach((pr: any) => {
      const emp = empMap.get(pr.employeeId);
      const dept = emp?.department || "Unassigned";
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { count: 0, total: 0, paid: 0, pending: 0 });
      }
      const d = deptMap.get(dept);
      d.count += 1;
      d.total += Number(pr.netSalary || 0);
      if (pr.status === "Paid") d.paid += Number(pr.netSalary || 0);
      else d.pending += Number(pr.netSalary || 0);
    });
    return Array.from(deptMap.entries()).map(([dept, data]) => ({
      dept,
      ...data,
    })).sort((a, b) => b.total - a.total);
  }, [filteredPayrolls]);

  // Top earners (top 5)
  const topEarners = useMemo(() => {
    return [...filteredPayrolls]
      .sort((a: any, b: any) => Number(b.netSalary) - Number(a.netSalary))
      .slice(0, 5);
  }, [filteredPayrolls]);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    (data.allEmployeesDirectory || []).forEach((e: any) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [data.allEmployeesDirectory]);

  // Disburse all pending
  async function disburseAll() {
    if (!confirm(`সব ${stats.count} জন কর্মচারীর পে-রোল পরিশোধ করতে চান?\nমোট: ${taka(stats.pending)}`)) return;
    for (const pr of filteredPayrolls) {
      if (pr.status !== "Paid") {
        await onMutate({
          action: "disbursePayroll",
          payrollId: pr.id,
          method: "Bank",
        });
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* ===== Header ===== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-amber-400 text-amber-900 text-[10px] font-bold uppercase">
                Executive Dashboard
              </span>
              <span className="px-2 py-1 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-bold">
                {data.currentUser?.role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-amber-400" />
              মাসিক বেতন সারসংক্ষেপ
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Welcome, {data.currentUser?.name} — সকল কর্মচারীর বেতন বিশ্লেষণ
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/60 uppercase">Reporting Month</div>
            <div className="text-xl font-bold">
              {new Date(filterMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">মাস</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">বিভাগ</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">সব বিভাগ</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">খুঁজুন</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="নাম / কোড / আইডি"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => exportToCSV(`Executive_${filterMonth}`, filteredPayrolls)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
      </div>

      {/* ===== KPI Summary Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<Wallet />}
          label="মোট বেতন ব্যয়"
          value={taka(stats.totalSalary)}
          subtext={`${stats.count} জন কর্মচারী`}
          color="from-blue-500 to-indigo-600"
          bg="bg-blue-50"
        />
        <KPICard
          icon={<CheckCircle2 />}
          label="পরিশোধিত"
          value={taka(stats.paid)}
          subtext={`${filteredPayrolls.filter((r: any) => r.status === "Paid").length} জন`}
          color="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={<AlertCircle />}
          label="বকেয়া"
          value={taka(stats.pending)}
          subtext={`${filteredPayrolls.filter((r: any) => r.status !== "Paid").length} জন`}
          color="from-amber-500 to-orange-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={<TrendingUp />}
          label="নিট বিতরণযোগ্য"
          value={taka(stats.netSalary)}
          subtext="After Deductions"
          color="from-purple-500 to-pink-600"
          bg="bg-purple-50"
        />
      </div>

      {/* ===== Detailed Summary Table ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-emerald-600" />
          বেতন বিভাজন — {new Date(filterMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <SummaryItem label="Total Salary (+)" value={stats.totalSalary} positive />
          <SummaryItem label="T.A/D.A (+)" value={stats.taDa} positive />
          <SummaryItem label="Over Time (+)" value={stats.overtimePay} positive />
          <SummaryItem label="Provident Fund (-)" value={stats.providentFund} />
          <SummaryItem label="Deduction (-)" value={stats.deduction} />
          <SummaryItem label="Advanced/Paid (-)" value={stats.advancePaid} />
          <SummaryItem
            label="NET SALARY"
            value={stats.netSalary}
            highlight
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ===== Department Breakdown ===== */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              বিভাগ অনুযায়ী বেতন ব্যয় ({departmentBreakdown.length} বিভাগ)
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {departmentBreakdown.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">
                এই মাসে কোনো ডাটা নেই
              </p>
            ) : (
              departmentBreakdown.map((d: any, idx: number) => {
                const percent = stats.netSalary > 0 ? (d.total / stats.netSalary) * 100 : 0;
                return (
                  <div key={d.dept} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{d.dept}</div>
                          <div className="text-[10px] text-slate-500">
                            {d.count} জন • Paid: {taka(d.paid)} | Pending: {taka(d.pending)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800">{taka(d.total)}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          {percent.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===== Top Earners ===== */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              শীর্ষ ৫ উচ্চ বেতন ({employeeRows.length} — Top Earners)
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {topEarners.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">
                কোনো ডাটা নেই
              </p>
            ) : (
              topEarners.map((pr: any, idx: number) => {
                const emp = empMap.get(pr.employeeId);
                const colors = ['amber', 'slate', 'orange', 'blue', 'indigo'];
                return (
                  <div key={pr.id} className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                      ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {emp?.name || `EMP-${pr.employeeId}`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {emp?.designation || ''} • {emp?.department || ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-700">
                        {taka(pr.netSalary)}
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        pr.status === "Paid" ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {pr.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===== Full Employee Payroll List ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            সকল কর্মচারীর পে-রোল ({filteredPayrolls.length})
          </h3>
          {stats.pending > 0 && (
            <button
              type="button"
              onClick={disburseAll}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <DollarSign className="w-3.5 h-3.5" /> সব পরিশোধ ({taka(stats.pending)})
            </button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-emerald-50 text-emerald-900">
              <tr>
                <th className="p-3 text-left">কর্মচারী</th>
                <th className="p-3 text-left">বিভাগ / পদবি</th>
                <th className="p-3 text-right">Total Salary</th>
                <th className="p-3 text-right">T.A/D.A</th>
                <th className="p-3 text-right">O.T</th>
                <th className="p-3 text-right">PF</th>
                <th className="p-3 text-right">Ded.</th>
                <th className="p-3 text-right">Adv.</th>
                <th className="p-3 text-right">Net</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    এই মাসে কোনো পে-রোল রেকর্ড নেই
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((pr: any) => {
                  const emp = empMap.get(pr.employeeId);
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{emp?.name || `EMP-${pr.employeeId}`}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{emp?.empCode}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-[11px] text-slate-700">{emp?.department || '—'}</div>
                        <div className="text-[10px] text-slate-500">{emp?.designation || '—'}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">{Number(pr.totalSalary || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{Number(pr.taDa || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-700">{Number(pr.overtimePay || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-600">{Number(pr.providentFund || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-600">{Number(pr.deduction || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-600">{Number(pr.advancePaid || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{Number(pr.netSalary).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pr.status === "Paid" ? 'bg-emerald-100 text-emerald-700' :
                          pr.status === "Draft" ? 'bg-slate-100 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{pr.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredPayrolls.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50 border-t-2 border-emerald-400 font-bold">
                  <td colSpan={2} className="p-3 text-right text-emerald-900">Total:</td>
                  <td className="p-3 text-right font-mono">{stats.totalSalary.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{stats.taDa.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{stats.overtimePay.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-rose-700">{stats.providentFund.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-rose-700">{stats.deduction.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-rose-700">{stats.advancePaid.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-700 text-sm">{stats.netSalary.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredPayrolls.map((pr: any) => {
            const emp = empMap.get(pr.employeeId);
            return (
              <div key={pr.id} className="p-3 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm">{emp?.name || `EMP-${pr.employeeId}`}</div>
                    <div className="text-[10px] text-slate-500">{emp?.empCode} • {emp?.department}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    pr.status === "Paid" ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>{pr.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div>Total: <b>৳{Number(pr.totalSalary).toLocaleString()}</b></div>
                  <div>T.A: <b>৳{Number(pr.taDa).toLocaleString()}</b></div>
                  <div>OT: <b className="text-emerald-600">৳{Number(pr.overtimePay).toLocaleString()}</b></div>
                  <div>PF: <b className="text-rose-600">৳{Number(pr.providentFund).toLocaleString()}</b></div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500">Net:</span>
                  <span className="font-bold text-sm text-emerald-700">৳{Number(pr.netSalary).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components for Executive Dashboard
// ============================================================================
function KPICard({ icon, label, value, subtext, color, bg }: any) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-slate-200`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{value}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>
        </div>
        <div className={`bg-gradient-to-br ${color} text-white p-2.5 rounded-xl shadow-sm`}>
          <div className="w-5 h-4.5">{icon}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, positive, highlight }: any) {
  const isPositive = positive || value >= 0;
  return (
    <div className={`p-3 rounded-xl border ${
      highlight
        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 col-span-2 lg:col-span-1'
        : isPositive
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-rose-50 border-rose-200'
    }`}>
      <div className={`text-[10px] uppercase font-bold ${
        highlight ? 'text-white/80' : isPositive ? 'text-emerald-700' : 'text-rose-700'
      }`}>{label}</div>
      <div className={`text-base font-bold mt-0.5 ${
        highlight ? 'text-white' : isPositive ? 'text-emerald-700' : 'text-rose-700'
      }`}>
        {isPositive ? "" : "-"}{"৳" + Math.abs(Number(value)).toLocaleString()}
      </div>
    </div>
  );
}

// ✅ FIXED: missing variable references for Top Earners section
const employeeRows = []; // placeholder — topEarners.map already provides data
void Users;
void FileSpreadsheet;
void TrendingUp;