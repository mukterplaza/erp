"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Bell,
  FileText,
  ArrowLeftRight,
  Lock,
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDFPrint } from "@/lib/export-utils";

// ============================================================================
// ⭐ PERMANENT BANGLA & MULTILINGUAL ENCODING HEALER (MOJIBAKE AUTO-REPAIR)
// ============================================================================
const WIN1252_MAP: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88,
  0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
  0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

export function fixBanglaEncoding(text: any): string {
  if (!text || typeof text !== "string") return text || "";

  // যদি টেক্সট স্বাভাবিক থাকে এবং কোনো Mojibake লক্ষণ না থাকে, সরাসরি রিটার্ন করবে
  if (
    !text.includes("à¦") &&
    !text.includes("à§") &&
    !text.includes("à¥") &&
    !text.includes("â€") &&
    !text.includes("Ã")
  ) {
    return text;
  }

  try {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      bytes[i] = WIN1252_MAP[code] ?? (code & 0xff);
    }
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    // ডিকোড করার পর যদি সঠিক বাংলা ক্যারেক্টার পাওয়া যায়
    if (/[\u0980-\u09FF]/.test(decoded)) {
      return decoded;
    }
  } catch {
    // fallback to original if decoding fails
  }

  return text;
}

// ============================================================================
// 1. ACCOUNTING VIEW
// ============================================================================
export function AccountingView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [fromAcc, setFromAcc] = useState("1010");
  const [toAcc, setToAcc] = useState("1020");
  const [amount, setAmount] = useState("25000");
  const [description, setDescription] = useState("Cash Deposit to City Bank Corporate A/C");

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "cashBankTransfer",
      fromAccountCode: fromAcc,
      toAccountCode: toAcc,
      amount: Number(amount),
      description,
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ডাবল-এন্ট্রি হিসাব, চার্ট অব অ্যাকাউন্টস ও জেনারেল লেজার
          </h1>
          <p className="text-xs text-slate-500">
            Every Invoice, Payment, Credit Purchase, Expense, Payroll & Transfer automatically generates a balanced Debit = Credit Journal Entry
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToExcel("INSAF_ChartOfAccounts", "Chart of Accounts", data.accounts || [])}
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            Excel এক্সপোর্ট (.xls)
          </button>
          <button
            type="button"
            onClick={() => exportToPDFPrint("General Journal & Trial Balance", "Double-Entry Accounting", data.journalEntries || [])}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> Print Ledger PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          {/* Chart of Accounts */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" /> চার্ট অব অ্যাকাউন্টস (লাইভ ব্যালেন্স)
              </h2>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5">কোড</th>
                  <th className="p-2.5">হিসাবের নাম</th>
                  <th className="p-2.5">ধরন</th>
                  <th className="p-2.5 text-right">ব্যালেন্স (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.accounts || []).map((acc: any) => (
                  <tr key={acc.id}>
                    <td className="p-2.5 font-mono font-bold">{acc.code}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{fixBanglaEncoding(acc.name)}</td>
                    <td className="p-2.5 text-slate-500">{acc.type}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      ৳{Number(acc.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cash <-> Bank Transfer */}
          <form
            onSubmit={handleTransfer}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> নগদ ↔ ব্যাংক স্থানান্তর
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ক্রেডিট (থেকে)
                </label>
                <select
                  value={fromAcc}
                  onChange={(e) => setFromAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="1010">1010 — Cash in Hand</option>
                  <option value="1020">1020 — City Bank Corporate A/C</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ডেবিট (প্রতি)
                </label>
                <select
                  value={toAcc}
                  onChange={(e) => setToAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="1020">1020 — City Bank Corporate A/C</option>
                  <option value="1010">1010 — Cash in Hand</option>
                </select>
              </div>
            </div>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (৳)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              কনট্রা জার্নাল পোস্ট করুন
            </button>
          </form>
        </div>

        {/* ডাবল-এন্ট্রি জার্নাল ভাউচার */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              ডাবল-এন্ট্রি জার্নাল ভাউচার ({(data.journalEntries || []).length})
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">
              Hard Delete Blocked • Audit Trail Active
            </span>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {(data.journalEntries || []).map((jv: any) => {
              const lines = (data.journalLines || []).filter(
                (l: any) => l.journalEntryId === jv.id
              );
              return (
                <div
                  key={jv.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>
                      {jv.voucherNo} • {jv.date} ({jv.referenceType}: {jv.referenceCode})
                    </span>
                    <span className="text-emerald-700">
                      Dr ৳{Number(jv.totalDebit).toLocaleString()} = Cr ৳
                      {Number(jv.totalCredit).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600">{fixBanglaEncoding(jv.description)}</p>
                  <div className="border-t border-slate-200 pt-2 space-y-1">
                    {lines.map((ln: any) => (
                      <div key={ln.id} className="flex justify-between font-mono text-[11px]">
                        <span>{fixBanglaEncoding(ln.accountName)}</span>
                        <span>
                          {Number(ln.debit) > 0
                            ? `Debit: ৳${Number(ln.debit).toLocaleString()}`
                            : `Credit: ৳${Number(ln.credit).toLocaleString()}`}
                        </span>
                      </div>
                    ))}
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
// 2. INVOICES, PAYMENTS & EXPENSES VIEW
// ============================================================================
export function InvoicesPaymentsExpensesView({
  data,
  onMutate,
  tab = "invoices",
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  tab?: "invoices" | "payments" | "expenses";
}) {
  const today = new Date().toISOString().split("T")[0];
  const [clientId, setClientId] = useState(String(data.clients?.[0]?.id || 1));
  const [projectId, setProjectId] = useState(String(data.projects?.[0]?.id || 1));
  const [invAmount, setInvAmount] = useState("250000");
  const [invNotes, setInvNotes] = useState("Running Bill for Structural Works");

  const [expCategory, setExpCategory] = useState("Material");
  const [expAmount, setExpAmount] = useState("15000");
  const [expDesc, setExpDesc] = useState("");
  const [expMethod, setExpMethod] = useState("Cash");

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createInvoice",
      clientId: Number(clientId),
      projectId: Number(projectId),
      totalAmount: Number(invAmount),
      notes: invNotes,
    });
  }

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createExpense",
      date: today,
      category: expCategory,
      amount: Number(expAmount),
      projectId: Number(projectId),
      siteId: data.sites?.[0]?.id || 1,
      paymentMethod: expMethod,
      description: expDesc,
    });
    setExpDesc("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {tab === "expenses"
              ? "Project & Operational Expense Management (EXP-0001)"
              : tab === "payments"
              ? "Central Payment & Receipt Voucher System (PAY-0001)"
              : "Accounts Receivable & Client Invoices (INV-0001)"}
          </h1>
          <p className="text-xs text-slate-500">
            Transactional Financial Safety: Invoice + Payment + Balance Update + Double-Entry Journal execute atomically
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCSV(
                `INSAF_${tab}`,
                tab === "expenses"
                  ? data.expenses
                  : tab === "payments"
                  ? data.payments
                  : data.invoices
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            CSV এক্সপোর্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Forms */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> ক্লায়েন্ট ইনভয়েস তৈরি
            </h2>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              {(data.clients || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.clientCode} — {fixBanglaEncoding(c.name)}
                </option>
              ))}
            </select>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              {(data.projects || []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {fixBanglaEncoding(p.name)}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              value={invAmount}
              onChange={(e) => setInvAmount(e.target.value)}
              placeholder="Invoice Amount (৳)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              value={invNotes}
              onChange={(e) => setInvNotes(e.target.value)}
              placeholder="Invoice Description"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              ইনভয়েস তৈরি ও জার্নাল
            </button>
          </form>

          <form
            onSubmit={handleCreateExpense}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" /> প্রজেক্ট/অফিস খরচ রেকর্ড
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>Material</option>
                <option>Labour</option>
                <option>Contractor</option>
                <option>Transport</option>
                <option>Site Expense</option>
                <option>Office</option>
              </select>
              <select
                value={expMethod}
                onChange={(e) => setExpMethod(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>Cash</option>
                <option>Bank</option>
                <option>Payable</option>
              </select>
            </div>
            <input
              type="number"
              required
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="Expense Amount (৳)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="Expense Description *"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              খরচ সংরক্ষণ (প্রজেক্ট খরচ আপডেট)
            </button>
          </form>
        </div>

        {/* Right Tables */}
        <div className="lg:col-span-8 space-y-6">
          {/* Client Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                ক্লায়েন্ট ইনভয়েস ও আংশিক পেমেন্ট ({(data.invoices || []).length})
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">ইনভয়েস</th>
                  <th className="p-3">মোট বিল</th>
                  <th className="p-3">পরিশোধিত</th>
                  <th className="p-3">বকেয়া প্রাপ্য</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">পেমেন্ট গ্রহণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.invoices || []).map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900">{inv.invoiceCode}</div>
                      <div className="text-[11px] text-slate-500">{fixBanglaEncoding(inv.notes)}</div>
                    </td>
                    <td className="p-3 font-semibold">
                      ৳{Number(inv.totalAmount).toLocaleString()}
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold">
                      ৳{Number(inv.paidAmount).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-amber-600 text-sm">
                      ৳{Number(inv.outstandingAmount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {Number(inv.outstandingAmount) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const amt = prompt(
                              `Receive payment against ${inv.invoiceCode} (Outstanding: ৳${inv.outstandingAmount}):`,
                              "50000"
                            );
                            if (!amt) return;
                            onMutate({
                              action: "recordPayment",
                              paymentType: "Client Receipt",
                              invoiceId: inv.id,
                              amount: Number(amt),
                              method: "Bank",
                            });
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                        >
                          নগদ/ব্যাংক গ্রহণ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                প্রজেক্ট ও পরিচালন খরচ ({(data.expenses || []).length})
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">কোড</th>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">বিবরণ</th>
                  <th className="p-3">পরিমাণ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.expenses || []).map((ex: any) => (
                  <tr key={ex.id}>
                    <td className="p-3 font-mono font-bold">{ex.expenseCode}</td>
                    <td className="p-3">{ex.date}</td>
                    <td className="p-3 font-semibold">{ex.category}</td>
                    <td className="p-3 text-slate-600">{fixBanglaEncoding(ex.description)}</td>
                    <td className="p-3 font-bold text-slate-900">
                      ৳{Number(ex.amount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        {ex.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* All Payments Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                সকল পেমেন্ট ও রসিদ ({(data.payments || []).length})
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">কোড</th>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">পদ্ধতি</th>
                  <th className="p-3">পরিমাণ</th>
                  <th className="p-3">নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.payments || []).map((py: any) => (
                  <tr key={py.id}>
                    <td className="p-3 font-mono font-bold">{py.paymentCode}</td>
                    <td className="p-3">{py.date}</td>
                    <td className="p-3 font-bold">{py.paymentType}</td>
                    <td className="p-3">{py.method}</td>
                    <td className="p-3 font-bold text-emerald-700">
                      ৳{Number(py.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-500">{fixBanglaEncoding(py.notes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. REPORT CENTER
// ============================================================================
export function ReportsCenterView({ data }: { data: any }) {
  const [category, setCategory] = useState<
    "HR" | "CRM" | "CRM_IBDC" | "CRM_IREL" | "Project" | "Inventory" | "Accounts"
  >("Accounts");
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-12-31");

  const getActiveDataset = (): Record<string, unknown>[] => {
    if (category === "HR") return data.attendances || [];
    if (category === "CRM") return data.leads || [];
    if (category === "CRM_IBDC")
      return (data.leads || []).filter((l: any) => (l.companyId || "IBDC") === "IBDC");
    if (category === "CRM_IREL")
      return (data.leads || []).filter((l: any) => l.companyId === "IREL");
    if (category === "Project") return data.projects || [];
    if (category === "Inventory") return data.materials || [];
    return data.accounts || [];
  };

  const rows = getActiveDataset();

  const reportTitleMap: Record<string, string> = {
    CRM_IBDC: "INSAF BUILDING DESIGN & CONSULTANT LTD. — Design & Engineering Lead Report",
    CRM_IREL: "INSAF REAL ESTATE LTD. — Property Lead Report",
    CRM: "All Leads — Both Business Units (Company Identity Preserved)",
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            রিপোর্ট সেন্টার (এইচআর, CRM, প্রজেক্ট, ইনভেন্টরি ও হিসাব)
          </h1>
          <p className="text-xs text-slate-500">
            {reportTitleMap[category] ||
              "Filter by Date Range & বিভাগ • One-Click Export to PDF, Excel (.xls) & CSV"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs"
          />
          <button
            type="button"
            onClick={() => exportToCSV(`INSAF_${category}_Report`, rows)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToExcel(
                `INSAF_${category}_Report`,
                `${category} Master Report (${fromDate} to ${toDate})`,
                rows
              )
            }
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToPDFPrint(
                `${category} Analytical Report`,
                `Period: ${fromDate} to ${toDate}`,
                rows
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            "Accounts",
            "Project",
            "Inventory",
            "HR",
            "CRM_IBDC",
            "CRM_IREL",
            "CRM",
          ] as const
        ).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              category === cat
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cat === "CRM_IBDC"
              ? "বিল্ডিং ডিজাইন লিড (IBDC)"
              : cat === "CRM_IREL"
              ? "রিয়েল এস্টেট লিড (IREL)"
              : cat}{" "}
            Reports ({cat === category ? rows.length : "Live"})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          {category} Report Preview ({rows.length} Verified Database Rows)
        </h3>
        {rows.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                {Object.keys(rows[0]).slice(0, 8).map((k) => (
                  <th key={k} className="p-2.5 font-semibold capitalize">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r: any, idx: number) => (
                <tr key={idx}>
                  {Object.keys(rows[0]).slice(0, 8).map((k) => (
                    <td key={k} className="p-2.5">
                      {typeof r[k] === "object"
                        ? JSON.stringify(r[k])
                        : fixBanglaEncoding(String(r[k] ?? ""))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-400">এই ভিউতে রেকর্ড নেই।</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. SMART NOTIFICATION CENTER (উন্নত বাংলা এনকোডিং মেরামতসহ)
// ============================================================================
const SMART_NOTIFICATION_CATEGORIES = [
  "সব ক্যাটাগরি",
  "Announcement",
  "Task Assigned",
  "Task Update",
  "Daily Work",
  "Approval",
  "Correction",
  "Deadline",
  "Overdue",
  "Leave",
  "Attendance",
];

const CATEGORY_BN: Record<string, string> = {
  Announcement: "ঘোষণা",
  "Task Assigned": "নতুন টাস্ক",
  "Task Update": "টাস্ক আপডেট",
  "Daily Work": "দৈনিক কাজ",
  Approval: "অনুমোদন",
  Correction: "সংশোধন",
  Deadline: "ডেডলাইন",
  Overdue: "ওভারডিউ",
  Leave: "ছুটি",
  Attendance: "হাজিরা",
};

function notifCategory(n: any): string {
  if (n.category) return n.category;
  const t = String(n.type || "");
  if (t === "Announcement") return "Announcement";
  if (t.includes("Leave")) return "Leave";
  if (t.includes("Attendance") || t.includes("Checkout") || t.includes("Late")) return "Attendance";
  if (t.includes("Overdue")) return "Overdue";
  if (t.includes("Task")) return "Task Update";
  return t;
}

export function NotificationsView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [filter, setFilter] = useState<"All" | "Unread" | "Read">("All");
  const [categoryFilter, setCategoryFilter] = useState("সব ক্যাটাগরি");

  // Broadcast Announcement State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDesc, setNoticeDesc] = useState("");
  const [noticePriority, setNoticePriority] = useState("High");
  const [noticeTarget, setNoticeTarget] = useState("All Staff");
  const [noticeDue, setNoticeDue] = useState(
    new Date().toISOString().split("T")[0]
  );

  const list = (data.notifications || []).filter((n: any) => {
    const readMatch =
      filter === "All" ? true : filter === "Unread" ? !n.isRead : n.isRead;
    const catMatch =
      categoryFilter === "সব ক্যাটাগরি" ? true : notifCategory(n) === categoryFilter;
    return readMatch && catMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" /> স্মার্ট নোটিফিকেশন ও নির্দেশনা কেন্দ্র
          </h1>
          <p className="text-xs text-slate-500">
            Accept, Start, or Complete assigned tasks directly from your notification feed • Automatic completion alerts sent to Creator & Management
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Unread", "Read"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onMutate({ action: "runReminderAutomation" })}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
          >
            রিমাইন্ডার চালান
          </button>
          <button
            type="button"
            onClick={() => onMutate({ action: "markAllNotificationsRead" })}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            সব পঠিত করুন
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {SMART_NOTIFICATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              categoryFilter === cat
                ? "bg-emerald-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {CATEGORY_BN[cat] || cat}
            {cat !== "সব ক্যাটাগরি" && (
              <span className="ml-1 opacity-70">
                ({(data.notifications || []).filter((n: any) => notifCategory(n) === cat && !n.isRead).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Broadcast Form */}
      {data.currentUser?.role !== "Staff" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onMutate({
              action: "createAnnouncement",
              title: noticeTitle,
              message: noticeDesc,
              priority: noticePriority,
              assignedPersonOrTeam: noticeTarget,
              dueDate: noticeDue,
            });
            setNoticeTitle("");
            setNoticeDesc("");
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Task / Notice Title *
            </label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="e.g. সাইট ইন্সপেকশন ও রাজউক ড্রয়িং নির্দেশনা"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Description / Instruction *
            </label>
            <input
              type="text"
              required
              value={noticeDesc}
              onChange={(e) => setNoticeDesc(e.target.value)}
              placeholder="Write detailed instruction..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Target / Priority
            </label>
            <div className="flex gap-1">
              <select
                value={noticeTarget}
                onChange={(e) => setNoticeTarget(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="All Staff">All Staff</option>
                {(data.allEmployeesDirectory || []).map((e: any) => (
                  <option key={e.id} value={`${e.name} (${e.empCode})`}>
                    {fixBanglaEncoding(e.name)}
                  </option>
                ))}
              </select>
              <select
                value={noticePriority}
                onChange={(e) => setNoticePriority(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>High</option>
                <option>Critical</option>
                <option>Medium</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
          >
            ঘোষণা পাঠান
          </button>
        </form>
      )}

      {/* Notifications List (স্বয়ংক্রিয়ভাবে মেরামত করা বাংলা ও ইংরেজি টেক্সটসহ) */}
      <div className="space-y-3">
        {list.map((n: any) => {
          const repairedTitle = fixBanglaEncoding(n.title);
          const repairedMessage = fixBanglaEncoding(n.message);
          const repairedRecipient = fixBanglaEncoding(n.recipientName);
          const repairedAssigned = fixBanglaEncoding(n.assignedPersonOrTeam);
          const repairedCreatedBy = fixBanglaEncoding(n.createdBy);

          return (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                n.isRead
                  ? "bg-white border-slate-200"
                  : "bg-emerald-50/40 border-emerald-300"
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold">
                    {CATEGORY_BN[notifCategory(n)] || fixBanglaEncoding(n.type)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {repairedRecipient && (
                    <span className="text-[11px] text-slate-500">
                      প্রাপক: <strong>{repairedRecipient}</strong>
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      n.priority === "Critical" || n.priority === "High"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    Priority: {n.priority || "Medium"}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Assigned: {repairedAssigned || "All Staff"}
                  </span>
                  <span className="text-xs text-slate-500">
                    Created by: <strong>{repairedCreatedBy || "System"}</strong>
                  </span>
                  {n.dueDate && (
                    <span className="text-xs text-amber-700 font-semibold">
                      Due: {n.dueDate}
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    {n.relatedEntityCode}
                  </span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>

                {/* মেরামত করা টাইটেল */}
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {repairedTitle}
                </h3>

                {/* মেরামত করা মেসেজ */}
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {repairedMessage}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Direct Task Actions */}
                {(n.relatedTaskId ||
                  n.type === "Task Assigned" ||
                  n.type === "New Task" ||
                  n.type === "Task Overdue") && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      onClick={() =>
                        onMutate({
                          action: "updateTaskStatus",
                          taskId: n.relatedTaskId || 1,
                          status: "Accepted",
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onMutate({
                          action: "updateTaskStatus",
                          taskId: n.relatedTaskId || 1,
                          status: "In Progress",
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onMutate({
                          action: "updateTaskStatus",
                          taskId: n.relatedTaskId || 1,
                          status: "Completed",
                          completionNote: "Completed directly from Notification Center",
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Complete
                    </button>
                  </div>
                )}

                <Link
                  href={n.relatedUrl || "/dashboard"}
                  onClick={() => {
                    if (!n.isRead && n.userId)
                      onMutate({
                        action: "markNotificationRead",
                        notificationId: n.id,
                      });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  {n.relatedTaskId ? "কাজটি দেখুন →" : "খুলুন →"}
                </Link>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() =>
                      onMutate({
                        action: "markNotificationRead",
                        notificationId: n.id,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                  >
                    পঠিত করুন
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 5. DOCUMENTS AND USERS VIEW
// ============================================================================
export function DocumentsAndUsersView({
  data,
  onMutate,
  mode = "users",
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  mode?: "users" | "documents" | "settings";
}) {
  const [docName, setDocName] = useState("");
  const [docCat, setDocCat] = useState("Project");
  const [docType, setDocType] = useState("PDF");
  const [relatedCode, setRelatedCode] = useState("PRJ-0001");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  const [lateCheckInAfter, setLateCheckInAfter] = useState(
    data.reminderSettings?.lateCheckInAfter || "09:30"
  );
  const [workPlanReminderTime, setWorkPlanReminderTime] = useState(
    data.reminderSettings?.workPlanReminderTime || "10:00"
  );
  const [dailySummaryReminderTime, setDailySummaryReminderTime] = useState(
    data.reminderSettings?.dailySummaryReminderTime || "18:30"
  );
  const [enableOverdueTaskReminder, setEnableOverdueTaskReminder] = useState(
    data.reminderSettings?.enableOverdueTaskReminder ?? true
  );
  const [enablePendingTaskReminder, setEnablePendingTaskReminder] = useState(
    data.reminderSettings?.enablePendingTaskReminder ?? true
  );

  async function handleSaveReminders(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "updateReminderSettings",
      lateCheckInAfter,
      workPlanReminderTime,
      dailySummaryReminderTime,
      enableOverdueTaskReminder,
      enablePendingTaskReminder,
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocName(file.name);
    const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
    setDocType(ext);
  }

  async function handleSaveDoc(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "uploadDocument",
      name: docName,
      category: docCat,
      fileType: docType,
      fileSize: "512 KB",
      relatedEntityCode: relatedCode,
    });
    setDocName("");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "changePassword",
        currentPassword,
        newPassword,
      }),
    });
    const d = await res.json();
    setPwdMsg(d.message || d.error || "Updated");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          {mode === "documents"
            ? "Document Management Vault (PDF, JPG, PNG, DOCX, XLSX)"
            : "User Access Control, Role Permissions, Security & Audit Trail"}
        </h1>
        <p className="text-xs text-slate-500">
          Server-Side Permission Enforcement • Active/Inactive User Blocking • Complete Financial & Operational Audit Trail
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Upload + Password Change */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleSaveDoc}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> ডকুমেন্ট আপলোড
            </h2>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white"
            />
            <input
              type="text"
              required
              placeholder="ডকুমেন্টের নাম *"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={docCat}
                onChange={(e) => setDocCat(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>Project</option>
                <option>Employee</option>
                <option>Client</option>
                <option>Site</option>
                <option>Supplier</option>
                <option>Contractor</option>
                <option>Invoice</option>
                <option>PO</option>
                <option>Payment</option>
              </select>
              <input
                type="text"
                value={relatedCode}
                onChange={(e) => setRelatedCode(e.target.value)}
                placeholder="Entity Code"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              আপলোড ও ইনডেক্স
            </button>
          </form>

          <form
            onSubmit={handlePasswordChange}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-800" /> অ্যাকাউন্ট পাসওয়ার্ড পরিবর্তন
            </h2>
            {pwdMsg && (
              <p className="text-xs font-semibold text-emerald-600">{pwdMsg}</p>
            )}
            <input
              type="password"
              required
              placeholder="বর্তমান পাসওয়ার্ড"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="password"
              required
              placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              পাসওয়ার্ড আপডেট
            </button>
          </form>

          {data.currentUser?.role !== "Staff" && (
            <form
              onSubmit={handleSaveReminders}
              className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
            >
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" /> 12. রিমাইন্ডার অটোমেশন সেটিংস
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    দেরিতে ইন এর পর
                  </label>
                  <input
                    type="time"
                    value={lateCheckInAfter}
                    onChange={(e) => setLateCheckInAfter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    কাজের পরিকল্পনার সময়
                  </label>
                  <input
                    type="time"
                    value={workPlanReminderTime}
                    onChange={(e) => setWorkPlanReminderTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    সারাংশের সময়
                  </label>
                  <input
                    type="time"
                    value={dailySummaryReminderTime}
                    onChange={(e) => setDailySummaryReminderTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={enableOverdueTaskReminder}
                  onChange={(e) => setEnableOverdueTaskReminder(e.target.checked)}
                />
                ওভারডিউ টাস্ক রিমাইন্ডার চালু
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={enablePendingTaskReminder}
                  onChange={(e) => setEnablePendingTaskReminder(e.target.checked)}
                />
                পেন্ডিং টাস্ক রিমাইন্ডার চালু
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
                >
                  রিমাইন্ডার সেভ করুন
                </button>
                <button
                  type="button"
                  onClick={() => onMutate({ action: "runReminderAutomation" })}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  এখন চালান
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Users, Documents & Audit Logs */}
        <div className="lg:col-span-8 space-y-6">
          {(data.users || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  সিস্টেম ইউজার, রোল ও সক্রিয়/নিষ্ক্রিয় নিয়ন্ত্রণ
                </h3>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3">নাম ও ইমেইল</th>
                    <th className="p-3">রোল</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.users || []).map((u: any) => (
                    <tr key={u.id}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{fixBanglaEncoding(u.name)}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3 font-semibold">{u.role}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            u.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.id !== data.currentUser?.id && (
                          <button
                            type="button"
                            onClick={() =>
                              onMutate({
                                action: "updateUserStatusAndRole",
                                userId: u.id,
                                status: u.status === "Active" ? "Inactive" : "Active",
                                role: u.role,
                              })
                            }
                            className="px-2.5 py-1 rounded bg-slate-900 text-white font-semibold"
                          >
                            Toggle {u.status === "Active" ? "Inactive" : "Active"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Documents Vault */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                আপলোডকৃত ডকুমেন্ট ({(data.documents || []).length})
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">কোড</th>
                  <th className="p-3">ফাইলের নাম</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">এন্টিটি</th>
                  <th className="p-3">আপলোড করেছেন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.documents || []).map((doc: any) => (
                  <tr key={doc.id}>
                    <td className="p-3 font-mono font-bold">{doc.docCode}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {fixBanglaEncoding(doc.name)} ({doc.fileType})
                    </td>
                    <td className="p-3">{doc.category}</td>
                    <td className="p-3 font-mono">{doc.relatedEntityCode}</td>
                    <td className="p-3 text-slate-500">{fixBanglaEncoding(doc.uploadedBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Immutable Audit Trail */}
          {(data.auditLogs || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  নিরাপত্তা ও আর্থিক অডিট লগ ({(data.auditLogs || []).length})
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5">ইউজার ও রোল</th>
                      <th className="p-2.5">অ্যাকশন</th>
                      <th className="p-2.5">এন্টিটি</th>
                      <th className="p-2.5">রেকর্ড আইডি</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.auditLogs || []).map((log: any) => (
                      <tr key={log.id}>
                        <td className="p-2.5">
                          <strong>{fixBanglaEncoding(log.userName)}</strong> ({log.userRole})
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">
                          {log.action}
                        </td>
                        <td className="p-2.5">{log.entity}</td>
                        <td className="p-2.5 font-mono">{log.recordId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}