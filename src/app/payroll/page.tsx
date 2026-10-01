'use client';

import { useState, useEffect, useMemo } from 'react';
import ErpAppShell from "@/components/ErpAppShell";
import {
  Clock, DollarSign, FileDown, FileText, Plus, Edit3, Save,
  X, CheckCircle2, AlertCircle, Search, Calendar, Users, TrendingUp,
  Download, Eye, Receipt, Wallet, BookOpen,
  ShieldCheck, Globe, Smartphone,
  Printer, Trash2,
} from 'lucide-react';

type OvertimeRow = { hours: number; rate: number };

type PayrollRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  month: string;            // YYYY-MM
  basic: number;
  allowance: number;
  overtime: number;
  bonus: number;
  advance: number;
  deduction: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Paid';
  inTime?: string;
  outTime?: string;
  workingDays?: number;
  presentDays?: number;
  notes?: string;
  createdAt: string;
};

type ScanRecord = {
  employeeId: string;
  date: string;    // YYYY-MM-DD
  inTime: string;
  outTime: string;
};

type Announcement = {
  title: string;
  body: string;
  publisher: string;
};

const ANNOUNCEMENT: Announcement = {
  title: 'INSAF ERP - অফিসিয়াল ঘোষণা',
  body:
    'সকল সহকর্মীদের জানানো যাচ্ছে, INSAF ERP এখন থেকেই বাংলা ইন্টারফেস, মোবাইল ব্যবহারযোগ্যতা এবং কঠোর অ্যাকাউন্ট নিরাপত্তাসহ চালু আছে। প্রত্যেকে শুধু নিজের অ্যাকাউন্টে লগইন করবেন। প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক।',
  publisher: 'Engr. Muhammad Sheik Rakibul Hasan',
};

// ===== Helpers =====
const taka = (n: number) =>
  '৳' + Number(n || 0).toLocaleString('en-IN');

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MOCK_EMPLOYEES = [
  { id: 'EMP-0001', name: 'Md Talha',        code: 'EMP-0001', designation: 'Site Engineer' },
  { id: 'EMP-0002', name: 'Rakib Hasan',     code: 'EMP-0002', designation: 'Project Manager' },
  { id: 'EMP-0003', name: 'Nazmul Huda',     code: 'EMP-0003', designation: 'Accountant' },
  { id: 'EMP-0004', name: 'Sabbir Ahmed',    code: 'EMP-0004', designation: 'Supervisor' },
  { id: 'EMP-0005', name: 'Tania Akter',     code: 'EMP-0005', designation: 'HR Executive' },
];

const MOCK_SCANS: ScanRecord[] = [
  { employeeId: 'EMP-0001', date: '2026-04-01', inTime: '09:02', outTime: '18:35' },
  { employeeId: 'EMP-0001', date: '2026-04-02', inTime: '08:55', outTime: '20:10' },
  { employeeId: 'EMP-0001', date: '2026-04-03', inTime: '09:10', outTime: '18:00' },
  { employeeId: 'EMP-0001', date: '2026-04-04', inTime: '09:00', outTime: '21:00' },
];

const LS_KEY = 'insaf_payroll_v1';

const loadFromStorage = (): PayrollRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveToStorage = (data: PayrollRecord[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
};

// ===== Inner Payroll Content Component =====
function PayrollContent() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [filterMonth, setFilterMonth] = useState(currentMonthValue());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PayrollRecord['status']>('All');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPayslip, setShowPayslip] = useState<PayrollRecord | null>(null);

  const [form, setForm] = useState<Partial<PayrollRecord>>({
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    month: currentMonthValue(),
    basic: 0,
    allowance: 0,
    overtime: 0,
    bonus: 0,
    advance: 0,
    deduction: 0,
    status: 'Draft',
    notes: '',
  });

  const [overtimeRows, setOvertimeRows] = useState<OvertimeRow[]>([{ hours: 0, rate: 0 }]);

  useEffect(() => {
    const data = loadFromStorage();
    if (data.length === 0) {
      const seed: PayrollRecord = {
        id: 'PAYR-0001',
        employeeId: 'EMP-0007',
        employeeCode: 'EMP-0007',
        employeeName: 'Md Talha',
        month: '2026-09',
        basic: 23000,
        allowance: 0,
        overtime: 0,
        bonus: 0,
        advance: 0,
        deduction: 0,
        netSalary: 23000,
        status: 'Approved',
        workingDays: 26,
        presentDays: 26,
        notes: '',
        createdAt: new Date().toISOString(),
      };
      setRecords([seed]);
      saveToStorage([seed]);
    } else {
      setRecords(data);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(records);
  }, [records, hydrated]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const okMonth = filterMonth === 'all' ? true : r.month === filterMonth;
      const okStatus = statusFilter === 'All' ? true : r.status === statusFilter;
      const q = search.trim().toLowerCase();
      const okSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return okMonth && okStatus && okSearch;
    });
  }, [records, filterMonth, statusFilter, search]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.netSalary, 0);
    const paid = filtered.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.netSalary, 0);
    const pending = filtered.filter((r) => r.status !== 'Paid').reduce((s, r) => s + r.netSalary, 0);
    return { total, paid, pending, count: filtered.length };
  }, [filtered]);

  const calcNet = (f: Partial<PayrollRecord>) => {
    const net =
      (Number(f.basic) || 0) +
      (Number(f.allowance) || 0) +
      (Number(f.overtime) || 0) +
      (Number(f.bonus) || 0) -
      (Number(f.advance) || 0) -
      (Number(f.deduction) || 0);
    return Math.max(0, net);
  };

  const autoFillFromScan = (employeeId: string, month: string) => {
    const [y, m] = month.split('-');
    const monthScans = MOCK_SCANS.filter((s) => {
      const [sy, sm] = s.date.split('-');
      return s.employeeId === employeeId && sy === y && sm === m;
    });

    if (monthScans.length === 0) {
      return { inTime: '--:--', outTime: '--:--', workingDays: 26, presentDays: 0, overtime: 0 };
    }

    const inTimes = monthScans.map((s) => s.inTime).sort();
    const outTimes = monthScans.map((s) => s.outTime).sort();

    let totalOT = 0;
    monthScans.forEach((s) => {
      const [ih, im] = s.inTime.split(':').map(Number);
      const [oh, om] = s.outTime.split(':').map(Number);
      const worked = oh * 60 + om - (ih * 60 + im);
      const otMin = Math.max(0, worked - 8 * 60);
      totalOT += otMin / 60;
    });

    return {
      inTime: inTimes[0],
      outTime: outTimes[outTimes.length - 1],
      workingDays: 26,
      presentDays: monthScans.length,
      overtime: Math.round(totalOT * 100) / 100,
    };
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      employeeId: '',
      employeeName: '',
      employeeCode: '',
      month: currentMonthValue(),
      basic: 0,
      allowance: 0,
      overtime: 0,
      bonus: 0,
      advance: 0,
      deduction: 0,
      status: 'Draft',
      notes: '',
    });
    setOvertimeRows([{ hours: 0, rate: 0 }]);
    setShowForm(true);
  };

  const openEdit = (rec: PayrollRecord) => {
    setEditingId(rec.id);
    setForm({ ...rec });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.employeeId || !form.employeeName) {
      alert('কর্মচারী নির্বাচন করুন!');
      return;
    }

    const scan = autoFillFromScan(form.employeeId, form.month || currentMonthValue());

    if (editingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                ...form,
                netSalary: calcNet(form),
                inTime: scan.inTime,
                outTime: scan.outTime,
                workingDays: scan.workingDays,
                presentDays: scan.presentDays,
                overtime: form.overtime || scan.overtime,
              } as PayrollRecord
            : r
        )
      );
    } else {
      const newId = `PAYR-${String(records.length + 1).padStart(4, '0')}`;
      const newRec: PayrollRecord = {
        id: newId,
        employeeId: form.employeeId!,
        employeeCode: form.employeeCode || form.employeeId!,
        employeeName: form.employeeName!,
        month: form.month || currentMonthValue(),
        basic: Number(form.basic) || 0,
        allowance: Number(form.allowance) || 0,
        overtime: Number(form.overtime) || scan.overtime,
        bonus: Number(form.bonus) || 0,
        advance: Number(form.advance) || 0,
        deduction: Number(form.deduction) || 0,
        netSalary: calcNet(form),
        status: (form.status as PayrollRecord['status']) || 'Draft',
        inTime: scan.inTime,
        outTime: scan.outTime,
        workingDays: scan.workingDays,
        presentDays: scan.presentDays,
        notes: form.notes || '',
        createdAt: new Date().toISOString(),
      };
      setRecords((prev) => [newRec, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পে-রোল রেকর্ড মুছে ফেলতে চান?')) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const changeStatus = (id: string, status: PayrollRecord['status']) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const exportCSV = () => {
    const headers = [
      'Payroll ID',
      'Employee Code',
      'Employee Name',
      'Month',
      'Basic',
      'Allowance',
      'Overtime',
      'Bonus',
      'Advance',
      'Deduction',
      'Net Salary',
      'Status',
      'In Time',
      'Out Time',
      'Present Days',
    ];
    const rows = filtered.map((r) => [
      r.id, r.employeeCode, r.employeeName, r.month,
      r.basic, r.allowance, r.overtime, r.bonus,
      r.advance, r.deduction, r.netSalary, r.status,
      r.inTime || '', r.outTime || '', r.presentDays || 0,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${filterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPayslip = (rec: PayrollRecord) => {
    setShowPayslip(rec);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-3 sm:p-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #payslip-print, #payslip-print * { visibility: visible; }
          #payslip-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-xl p-5 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-3">
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
                      <Smartphone className="w-3 h-3" /> মোবাইল-ফ্রেন্ডলি
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
              <button
                onClick={openCreate}
                className="bg-white text-emerald-700 hover:bg-emerald-50 transition px-4 py-2.5 rounded-xl font-semibold shadow-lg flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> নতুন পে-রোল
              </button>
            </div>

            {/* Announcement */}
            <div className="mt-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm">{ANNOUNCEMENT.title}</div>
                  <p className="text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                    {ANNOUNCEMENT.body}
                  </p>
                  <div className="text-xs text-white/70 mt-2">
                    প্রকাশক: <span className="font-semibold">{ANNOUNCEMENT.publisher}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formula */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                পে-রোল, বেতন শিট ও হিসাব বিতরণ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                <span className="font-semibold">Formula:</span>{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700">
                  Basic + Allowance + Overtime + Bonus − Advance − Deduction = নিট বেতন
                </code>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ✓ Auto-posts Journal Entry on Disbursement &nbsp;•&nbsp; ✓ CSV এক্সপোর্ট &nbsp;•&nbsp; ✓ পে-স্লিপ PDF
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={<Wallet />} label="মোট বেতন" value={taka(stats.total)} color="from-emerald-500 to-teal-500" />
          <StatCard icon={<CheckCircle2 />} label="পরিশোধিত" value={taka(stats.paid)} color="from-green-500 to-emerald-500" />
          <StatCard icon={<AlertCircle />} label="বকেয়া" value={taka(stats.pending)} color="from-amber-500 to-orange-500" />
          <StatCard icon={<Users />} label="কর্মচারী" value={String(stats.count)} color="from-blue-500 to-indigo-500" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="নাম / কোড / আইডি খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              <option value="All">সব স্ট্যাটাস</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
            </select>
            <button
              onClick={exportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> CSV এক্সপোর্ট
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              পে-রোল ও পে-স্লিপ ({filtered.length})
            </h2>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">পে-রোল আইডি</th>
                  <th className="px-4 py-3 text-left">কর্মচারী</th>
                  <th className="px-4 py-3 text-left">মাস</th>
                  <th className="px-4 py-3 text-right">বেসিক + ভাতা</th>
                  <th className="px-4 py-3 text-right">ওভারটাইম</th>
                  <th className="px-4 py-3 text-right">অগ্রিম / কর্তন</th>
                  <th className="px-4 py-3 text-right">নিট বেতন</th>
                  <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                      কোনো পে-রোল রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-emerald-700">{r.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{r.employeeName}</div>
                        <div className="text-xs text-slate-500">{r.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(r.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {taka(r.basic)} + {taka(r.allowance)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">+{taka(r.overtime)}</td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        -{taka(r.advance)} / -{taka(r.deduction)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{taka(r.netSalary)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <ActionBtn icon={<Eye />} onClick={() => setShowPayslip(r)} color="blue" />
                          <ActionBtn icon={<Edit3 />} onClick={() => openEdit(r)} color="amber" />
                          <ActionBtn icon={<Printer />} onClick={() => printPayslip(r)} color="indigo" />
                          {r.status === 'Draft' && (
                            <ActionBtn icon={<CheckCircle2 />} onClick={() => changeStatus(r.id, 'Approved')} color="green" />
                          )}
                          {r.status === 'Approved' && (
                            <ActionBtn icon={<DollarSign />} onClick={() => changeStatus(r.id, 'Paid')} color="emerald" />
                          )}
                          <ActionBtn icon={<Trash2 />} onClick={() => handleDelete(r.id)} color="rose" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">কোনো রেকর্ড নেই</div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-emerald-700">{r.id}</div>
                      <div className="font-bold text-slate-800">{r.employeeName}</div>
                      <div className="text-xs text-slate-500">{r.employeeCode}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">মাস:</span> {r.month}</div>
                    <div><span className="text-slate-500">উপস্থিত:</span> {r.presentDays || 0}/{r.workingDays || 0}</div>
                    <div><span className="text-slate-500">বেসিক+ভাতা:</span> {taka(r.basic + r.allowance)}</div>
                    <div><span className="text-slate-500">ওভারটাইম:</span> {taka(r.overtime)}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">নিট বেতন</div>
                      <div className="font-bold text-lg text-emerald-700">{taka(r.netSalary)}</div>
                    </div>
                    <div className="flex gap-1">
                      <ActionBtn icon={<Eye />} onClick={() => setShowPayslip(r)} color="blue" />
                      <ActionBtn icon={<Edit3 />} onClick={() => openEdit(r)} color="amber" />
                      <ActionBtn icon={<Trash2 />} onClick={() => handleDelete(r.id)} color="rose" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pb-6">
          © {new Date().getFullYear()} INSAF ERP — Payroll System
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editingId ? 'পে-রোল এডিট করুন' : 'নতুন পে-রোল তৈরি করুন'}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">কর্মচারী *</label>
                <select
                  value={form.employeeId || ''}
                  onChange={(e) => {
                    const emp = MOCK_EMPLOYEES.find((x) => x.id === e.target.value);
                    setForm({ ...form, employeeId: e.target.value, employeeCode: e.target.value, employeeName: emp?.name || '' });
                  }}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- নির্বাচন করুন --</option>
                  {MOCK_EMPLOYEES.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.code} — {emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">বেতনের মাস *</label>
                <input
                  type="month"
                  value={form.month || ''}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {form.employeeId && form.month && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs">
                <div className="font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> স্ক্যান রেকর্ড (In/Out Time)
                </div>
                {(() => {
                  const scan = autoFillFromScan(form.employeeId, form.month);
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-emerald-900">
                      <div>In: <b>{scan.inTime}</b></div>
                      <div>Out: <b>{scan.outTime}</b></div>
                      <div>উপস্থিত: <b>{scan.presentDays}/{scan.workingDays}</b></div>
                      <div>মোট OT: <b>{scan.overtime} ঘণ্টা</b></div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumField label="মূল বেতন (+)" value={form.basic} onChange={(v) => setForm({ ...form, basic: v })} />
              <NumField label="ভাতা (+)" value={form.allowance} onChange={(v) => setForm({ ...form, allowance: v })} />
              <NumField label="ওভারটাইম (+)" value={form.overtime} onChange={(v) => setForm({ ...form, overtime: v })} />
              <NumField label="বোনাস (+)" value={form.bonus} onChange={(v) => setForm({ ...form, bonus: v })} />
              <NumField label="অগ্রিম কর্তন (-)" value={form.advance} onChange={(v) => setForm({ ...form, advance: v })} />
              <NumField label="অন্যান্য কর্তন (-)" value={form.deduction} onChange={(v) => setForm({ ...form, deduction: v })} />
            </div>

            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 flex items-center justify-between">
              <div className="font-semibold">নিট বেতন:</div>
              <div className="text-2xl font-bold">{taka(calcNet(form))}</div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">স্ট্যাটাস</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">নোট</label>
              <textarea
                rows={2}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="ঐচ্ছিক নোট..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payslip Modal */}
      {showPayslip && (
        <Modal onClose={() => setShowPayslip(null)} title="পে-স্লিপ" wide>
          <div id="payslip-print" className="space-y-4">
            <div className="text-center border-b border-slate-200 pb-3">
              <h3 className="text-xl font-bold text-emerald-700">INSAF ERP</h3>
              <p className="text-xs text-slate-500">পে-স্লিপ</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">পে-রোল আইডি:</span> <b>{showPayslip.id}</b></div>
              <div><span className="text-slate-500">কর্মচারী:</span> <b>{showPayslip.employeeName}</b></div>
              <div><span className="text-slate-500">কোড:</span> {showPayslip.employeeCode}</div>
              <div><span className="text-slate-500">মাস:</span> {showPayslip.month}</div>
              <div><span className="text-slate-500">In Time:</span> {showPayslip.inTime || '-'}</div>
              <div><span className="text-slate-500">Out Time:</span> {showPayslip.outTime || '-'}</div>
            </div>
            <table className="w-full text-sm border-t border-slate-200">
              <tbody className="divide-y divide-slate-100">
                <Row label="মূল বেতন (+)" value={showPayslip.basic} />
                <Row label="ভাতা (+)" value={showPayslip.allowance} />
                <Row label="ওভারটাইম (+)" value={showPayslip.overtime} />
                <Row label="বোনাস (+)" value={showPayslip.bonus} />
                <Row label="অগ্রিম কর্তন (-)" value={-showPayslip.advance} />
                <Row label="অন্যান্য কর্তন (-)" value={-showPayslip.deduction} />
                <tr className="bg-emerald-50 font-bold text-emerald-700">
                  <td className="px-3 py-2">নিট বেতন</td>
                  <td className="px-3 py-2 text-right text-lg">{taka(showPayslip.netSalary)}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-200">
              এটি কম্পিউটার-জেনারেটেড পে-স্লিপ। কোনো স্বাক্ষর প্রয়োজন নেই।
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ===== Main Page (with ErpAppShell) =====
export default function Page() {
  return (
    <ErpAppShell routeKey="/payroll">
      <PayrollContent />
    </ErpAppShell>
  );
}

// ===== Sub-components =====
function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 flex items-center gap-3">
      <div className={`bg-gradient-to-br ${color} text-white p-3 rounded-xl shadow-md`}>
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-bold text-lg text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PayrollRecord['status'] }) {
  const map = {
    Draft: 'bg-slate-100 text-slate-700',
    Approved: 'bg-blue-100 text-blue-700',
    Paid: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {status === 'Draft' ? 'ড্রাফট' : status === 'Approved' ? 'অনুমোদিত' : 'পরিশোধিত'}
    </span>
  );
}

function ActionBtn({ icon, onClick, color, title }: any) {
  const map: any = {
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    amber: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    emerald: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    rose: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition ${map[color] || 'bg-slate-100 text-slate-700'}`}
    >
      <div className="w-3.5 h-3.5">{icon}</div>
    </button>
  );
}

function NumField({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        placeholder="0"
      />
    </div>
  );
}

function Modal({ children, onClose, title, wide }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-xl'} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td className="px-3 py-2 text-slate-700">{label}</td>
      <td className={`px-3 py-2 text-right font-mono ${value < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
        {value < 0 ? '-' : ''}{taka(Math.abs(value))}
      </td>
    </tr>
  );
}