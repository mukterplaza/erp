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
import { getRoleBangla } from "@/components/ErpAppShell";

 

// ============================================================================
// ডাবল-এন্ট্রি খতিয়ান ও সাধারণ লেজার (/accounts - 100% BANGLA)
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
  const [description, setDescription] = useState("সিটি ব্যাংক কর্পোরেট একাউন্টে নগদ জমা");

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
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ডাবল-এন্ট্রি হিসাববিজ্ঞান, চার্ট অব একাউন্টস ও সাধারণ লেজার
          </h1>
          <p className="text-xs text-slate-500">
            প্রতিটি ইনভয়েস, পেমেন্ট, বাকি ক্রয়, ব্যয়, পে-রোল ও স্থানান্তর স্বয়ংক্রিয়ভাবে ব্যালেন্সড ডেবিট = ক্রেডিট জার্নাল তৈরি করে
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToExcel("INSAF_ChartOfAccounts", "হিসাবের চার্ট তালিকা", data.accounts || [])}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
          >
            Excel এক্সপোর্ট (.xls)
          </button>
          <button
            type="button"
            onClick={() => exportToPDFPrint("সাধারণ জার্নাল ও ট্রায়াল ব্যালেন্স", "ডাবল-এন্ট্রি হিসাব রেজিস্টার", data.journalEntries || [])}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> লেজার PDF প্রিন্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          {/* চার্ট অব একাউন্টস তালিকা */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" /> হিসাবের তালিকা ও লাইভ ব্যালেন্স (Chart of Accounts)
              </h2>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">কোড</th>
                  <th className="p-3 font-semibold">হিসাবের নাম</th>
                  <th className="p-3 font-semibold">ধরন</th>
                  <th className="p-3 font-semibold text-right">ব্যালেন্স (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.accounts || []).map((acc: any) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{acc.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{acc.name}</td>
                    <td className="p-3 text-slate-500">
                      {acc.type === "Asset" ? "সম্পদ (Asset)" : acc.type === "Liability" ? "দায় (Liability)" : acc.type === "Revenue" ? "আয় (Revenue)" : acc.type === "Expense" ? "ব্যয় (Expense)" : "মূলধন (Equity)"}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      ৳{Number(acc.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* নগদ ও ব্যাংক অভ্যন্তরীণ স্থানান্তর ফর্ম */}
          <form
            onSubmit={handleTransfer}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> নগদ ↔ ব্যাংক ডাবল-এন্ট্রি স্থানান্তর
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  হতে (Credit)
                </label>
                <select
                  value={fromAcc}
                  onChange={(e) => setFromAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="1010">১০১০ — হাতে নগদ (Cash in Hand)</option>
                  <option value="1020">১০২০ — সিটি ব্যাংক কর্পোরেট একাউন্ট</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  জমা (Debit)
                </label>
                <select
                  value={toAcc}
                  onChange={(e) => setToAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="1020">১০২০ — সিটি ব্যাংক কর্পোরেট একাউন্ট</option>
                  <option value="1010">১০১০ — হাতে নগদ (Cash in Hand)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                স্থানান্তরের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="পরিমাণ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                স্থানান্তরের বিবরণ *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="বিবরণ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              কন্ট্রা জার্নাল ভাউচার পোস্ট করুন
            </button>
          </form>
        </div>

        {/* ডাবল-এন্ট্রি জার্নাল ভাউচার তালিকা */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              ডাবল-এন্ট্রি জার্নাল ভাউচার তালিকা (মোট {(data.journalEntries || []).length} টি)
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">
              স্থায়ী অডিট ট্রেইল সংরক্ষিত
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
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>
                      {jv.voucherNo} • {jv.date} ({jv.referenceType}: {jv.referenceCode})
                    </span>
                    <span className="text-emerald-700 font-mono">
                      Dr ৳{Number(jv.totalDebit).toLocaleString()} = Cr ৳
                      {Number(jv.totalCredit).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700">{jv.description}</p>
                  <div className="border-t border-slate-200 pt-2 space-y-1">
                    {lines.map((ln: any) => (
                      <div key={ln.id} className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-800">{ln.accountName}</span>
                        <span className={Number(ln.debit) > 0 ? "text-emerald-700 font-bold" : "text-slate-600"}>
                          {Number(ln.debit) > 0
                            ? `ডেবিট: ৳${Number(ln.debit).toLocaleString()}`
                            : `ক্রেডিট: ৳${Number(ln.credit).toLocaleString()}`}
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
// ইনভয়েস, পেমেন্ট ও ব্যয় ব্যবস্থাপনা (/invoices, /income, /payments, /expenses - 100% BANGLA)
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
  const [invNotes, setInvNotes] = useState("স্ট্রাকচারাল নির্মাণ কাজের ১ম রানিং বিল");

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
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {tab === "expenses"
              ? "প্রজেক্ট ও দাফতরিক ব্যয় ব্যবস্থাপনা (EXP-0001)"
              : tab === "payments"
              ? "সেন্ট্রাল পেমেন্ট ও রসিদ ভাউচার সিস্টেম (PAY-0001)"
              : "প্রাপ্য হিসাব ও গ্রাহক ইনভয়েস ব্যবস্থাপনা (INV-0001)"}
          </h1>
          <p className="text-xs text-slate-500">
            আর্থিক নিরাপত্তা: ইনভয়েস + পেমেন্ট + ব্যালেন্স ও ডাবল-এন্ট্রি খতিয়ান সমন্বিতভাবে আপডেট হয়
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
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            CSV এক্সপোর্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ফর্মসমূহ */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> নতুন ক্লায়েন্ট ইনভয়েস তৈরি করুন (AR)
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ক্লায়েন্ট</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.clients || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.clientCode} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">প্রজেক্ট</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.projects || []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ইনভয়েসের পরিমাণ (৳) *</label>
              <input
                type="number"
                required
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                placeholder="ইনভয়েসের পরিমাণ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ইনভয়েসের বিবরণ</label>
              <input
                type="text"
                value={invNotes}
                onChange={(e) => setInvNotes(e.target.value)}
                placeholder="কাজের বিবরণ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              ইনভয়েস তৈরি ও প্রাপ্য জার্নাল পোস্ট করুন
            </button>
          </form>

          <form
            onSubmit={handleCreateExpense}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" /> প্রজেক্ট / অফিস ব্যয় সংরক্ষণ করুন
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যয়ের খাত</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="Material">মালামাল (Material)</option>
                  <option value="Labour">শ্রমিক মজুরি (Labour)</option>
                  <option value="Contractor">সাব-ঠিকাদার (Contractor)</option>
                  <option value="Transport">পরিবহন (Transport)</option>
                  <option value="Site Expense">সাইট খরচ (Site)</option>
                  <option value="Office">অফিস খরচ (Office)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পরিশোধ মাধ্যম</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="Cash">নগদ (Cash)</option>
                  <option value="Bank">ব্যাংক (Bank)</option>
                  <option value="Payable">বকেয়া (Payable)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যয়ের পরিমাণ (৳) *</label>
              <input
                type="number"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="টাকার পরিমাণ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যয়ের বিবরণ *</label>
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="খরচের বিবরণ লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              ব্যয় সংরক্ষণ করুন (প্রজেক্ট খরচ আপডেট হবে)
            </button>
          </form>
        </div>

        {/* টেবিলসমূহ */}
        <div className="lg:col-span-8 space-y-6">
          {/* ইনভয়েস তালিকা */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                গ্রাহক ইনভয়েস ও বকেয়া পাওনা ট্র্যাকার (মোট {(data.invoices || []).length} টি)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">ইনভয়েস কোড</th>
                  <th className="p-3 font-semibold">মোট বিল</th>
                  <th className="p-3 font-semibold">পরিশোধিত</th>
                  <th className="p-3 font-semibold">বকেয়া পাওনা (AR)</th>
                  <th className="p-3 font-semibold">স্ট্যাটাস</th>
                  <th className="p-3 font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.invoices || []).map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900">{inv.invoiceCode}</div>
                      <div className="text-[11px] text-slate-500">{inv.notes}</div>
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
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px]">
                        {inv.status === "Paid" ? "পরিশোধিত" : inv.status === "Partial" ? "আংশিক" : "বকেয়া"}
                      </span>
                    </td>
                    <td className="p-3">
                      {Number(inv.outstandingAmount) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const amt = prompt(
                              `${inv.invoiceCode}-এর বিপরীতে পেমেন্ট গ্রহণ করুন (বকেয়া: ৳${inv.outstandingAmount}):`,
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
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs text-[11px]"
                        >
                          পেমেন্ট গ্রহণ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ব্যয়ের তালিকা */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                প্রজেক্ট ও দাফতরিক খরচের হিসাব (মোট {(data.expenses || []).length} টি)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">ব্যয় কোড</th>
                  <th className="p-3 font-semibold">তারিখ</th>
                  <th className="p-3 font-semibold">খাত</th>
                  <th className="p-3 font-semibold">বিবরণ</th>
                  <th className="p-3 font-semibold">পরিমাণ</th>
                  <th className="p-3 font-semibold">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.expenses || []).map((ex: any) => (
                  <tr key={ex.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{ex.expenseCode}</td>
                    <td className="p-3">{ex.date}</td>
                    <td className="p-3 font-semibold">{ex.category}</td>
                    <td className="p-3 text-slate-600">{ex.description}</td>
                    <td className="p-3 font-bold text-slate-900">
                      ৳{Number(ex.amount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                        {ex.approvalStatus === "Approved" ? "অনুমোদিত" : ex.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* সকল পেমেন্টের খতিয়ান */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                পেমেন্ট ও রসিদ খতিয়ান রেজিস্টার (মোট {(data.payments || []).length} টি)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">ভাউচার কোড</th>
                  <th className="p-3 font-semibold">তারিখ</th>
                  <th className="p-3 font-semibold">লেনদেনের প্রকার</th>
                  <th className="p-3 font-semibold">মাধ্যম</th>
                  <th className="p-3 font-semibold">পরিমাণ</th>
                  <th className="p-3 font-semibold">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.payments || []).map((py: any) => (
                  <tr key={py.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{py.paymentCode}</td>
                    <td className="p-3">{py.date}</td>
                    <td className="p-3 font-bold">{py.paymentType}</td>
                    <td className="p-3">{py.method === "Bank" ? "ব্যাংক" : "নগদ"}</td>
                    <td className="p-3 font-bold text-emerald-700">
                      ৳{Number(py.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-500">{py.notes}</td>
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
// রিপোর্ট সেন্টার ও এক্সপোর্ট (/reports - 100% BANGLA)
// ============================================================================
export function ReportsCenterView({ data }: { data: any }) {
  const [category, setCategory] = useState<"HR" | "CRM" | "Project" | "Inventory" | "Accounts">("Accounts");
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState("2026-12-31");

  const getActiveDataset = (): Record<string, unknown>[] => {
    if (category === "HR") return data.attendances || [];
    if (category === "CRM") return data.leads || [];
    if (category === "Project") return data.projects || [];
    if (category === "Inventory") return data.materials || [];
    return data.accounts || [];
  };

  const rows = getActiveDataset();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            রিপোর্ট ও অ্যানালিটিক্স সেন্টার (মানবসম্পদ, সিআরএম, প্রজেক্ট, ইনভেন্টরি ও হিসাব)
          </h1>
          <p className="text-xs text-slate-500">
            তারিখ ও বিভাগ অনুযায়ী ফিল্টারিং • পিডিএফ, এক্সেল (.xls) এবং সিএসভি এক্সপোর্ট সুবিধা
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
          />
          <span className="text-xs text-slate-400">হতে</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => exportToCSV(`INSAF_${category}_Report`, rows)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            CSV এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToExcel(
                `INSAF_${category}_Report`,
                `${category} মাস্টার রিপোর্ট (${fromDate} হতে ${toDate})`,
                rows
              )
            }
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel এক্সপোর্ট
          </button>
          <button
            type="button"
            onClick={() =>
              exportToPDFPrint(
                `${category} অ্যানালিটিক্যাল রিপোর্ট`,
                `সময়কাল: ${fromDate} হতে ${toDate}`,
                rows
              )
            }
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> PDF প্রিন্ট
          </button>
        </div>
      </div>

      {/* ক্যাটাগরি ট্যাব */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "Accounts", label: "হিসাব ও অর্থায়ন" },
          { key: "Project", label: "প্রজেক্ট ও সাইট" },
          { key: "Inventory", label: "ইনভেন্টরি স্টক" },
          { key: "HR", label: "মানবসম্পদ ও উপস্থিতি" },
          { key: "CRM", label: "সিআরএম ও লিড" },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategory(cat.key as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              category === cat.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cat.label} ({category === cat.key ? rows.length : "সক্রিয়"})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 overflow-x-auto shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          রিপোর্ট প্রিভিউ (মোট {rows.length} টি যাচাইকৃত ডাটাবেজ রেকর্ড)
        </h3>
        {rows.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                {Object.keys(rows[0]).slice(0, 8).map((k) => (
                  <th key={k} className="p-3 font-semibold capitalize">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  {Object.keys(rows[0]).slice(0, 8).map((k) => (
                    <td key={k} className="p-3">
                      {typeof r[k] === "object" ? JSON.stringify(r[k]) : String(r[k] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-400 p-4 text-center">এই ক্যাটাগরিতে প্রদর্শনের মতো কোনো তথ্য নেই।</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// স্মার্ট নোটিফিকেশন সেন্টার (/notifications - 100% BANGLA)
// ============================================================================
const SMART_NOTIFICATION_CATEGORIES = [
  "সকল নোটিফিকেশন",
  "Task Assigned",
  "Task Completed",
  "Task Overdue",
  "Announcement",
  "Daily Work Reminder",
  "Work Plan Reminder",
  "Leave Approved/Rejected",
  "Attendance Correction",
  "Project Update",
  "Material Request",
  "Approval Required",
];

export function NotificationsView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [filter, setFilter] = useState<"All" | "Unread" | "Read">("All");
  const [categoryFilter, setCategoryFilter] = useState("সকল নোটিফিকেশন");

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
      categoryFilter === "সকল নোটিফিকেশন" ? true : n.type === categoryFilter;
    return readMatch && catMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" /> স্মার্ট নোটিফিকেশন ও দাফতরিক নির্দেশনা কেন্দ্র
          </h1>
          <p className="text-xs text-slate-500">
            অর্পিত টাস্ক নোটিফিকেশন হতে সরাসরি গ্রহণ, শুরু বা সম্পন্ন করুন • ম্যানেজার ও কর্তৃপক্ষের কাছে স্বয়ংক্রিয় অ্যালার্ট
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "All", label: "সবগুলো" },
            { key: "Unread", label: "অপঠিত" },
            { key: "Read", label: "পঠিত" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onMutate({ action: "runReminderAutomation" })}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-xs"
          >
            রিমাইন্ডার ট্রিগার করুন
          </button>
          <button
            type="button"
            onClick={() => onMutate({ action: "markAllNotificationsRead" })}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-xs"
          >
            সবগুলো পঠিত চিহ্নিত করুন
          </button>
        </div>
      </div>

      {/* ক্যাটাগরি ফিল্টার পিলস */}
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
            {cat}
          </button>
        ))}
      </div>

      {/* নোটিশ ও ঘোষণা জারি ফর্ম (ম্যানেজমেন্টের জন্য) */}
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
          className="bg-white p-5 rounded-3xl border border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-3 items-end shadow-xs"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              নোটিশের শিরোনাম *
            </label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="শিরোনাম লিখুন"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              বিস্তারিত বার্তা / নির্দেশনা *
            </label>
            <input
              type="text"
              required
              value={noticeDesc}
              onChange={(e) => setNoticeDesc(e.target.value)}
              placeholder="বিস্তারিত লিখুন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              প্রাপক ও অগ্রাধিকার
            </label>
            <div className="flex gap-1">
              <select
                value={noticeTarget}
                onChange={(e) => setNoticeTarget(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="All Staff">সকল কর্মকর্তা</option>
                {(data.allEmployeesDirectory || []).map((e: any) => (
                  <option key={e.id} value={`${e.name} (${e.empCode})`}>
                    {e.name}
                  </option>
                ))}
              </select>
              <select
                value={noticePriority}
                onChange={(e) => setNoticePriority(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="High">উচ্চ</option>
                <option value="Urgent">জরুরি</option>
                <option value="Normal">সাধারণ</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
          >
            নোটিশ পাঠান
          </button>
        </form>
      )}

      <div className="space-y-3">
        {list.map((n: any) => (
          <div
            key={n.id}
            className={`p-4 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition ${
              n.isRead
                ? "bg-white border-slate-200"
                : "bg-emerald-50/40 border-emerald-300 shadow-xs"
            }`}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold">
                  {n.type}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    n.priority === "Critical" || n.priority === "High"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  অগ্রাধিকার: {n.priority === "High" ? "জরুরি" : n.priority === "Critical" ? "অতীব জরুরি" : "সাধারণ"}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  প্রাপক: {n.assignedPersonOrTeam || "সকল কর্মকর্তা"}
                </span>
                <span className="text-xs text-slate-500">
                  প্রেরক: <strong>{n.createdBy || "সিস্টেম"}</strong>
                </span>
                {n.dueDate && (
                  <span className="text-xs text-amber-700 font-semibold">
                    সময়সীমা: {n.dueDate}
                  </span>
                )}
                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* নোটিফিকেশন থেকে সরাসরি টাস্ক গ্রহণ, শুরু বা সম্পন্ন করার সুবিধা */}
              {(n.relatedTaskId || n.type === "Task Assigned" || n.type === "New Task" || n.type === "Task Overdue") && (
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
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    গ্রহণ
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
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    শুরু
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onMutate({
                        action: "updateTaskStatus",
                        taskId: n.relatedTaskId || 1,
                        status: "Completed",
                        completionNote: "নোটিফিকেশন হতে সরাসরি সম্পন্ন করা হয়েছে",
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              )}

              <Link
                href={n.relatedUrl || "/dashboard"}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                দেখুন →
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
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
                >
                  পঠিত চিহ্নিত করুন
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ডকুমেন্ট ভল্ট, পাসওয়ার্ড পরিবর্তন ও অডিট লগ (/documents, /users, /settings - 100% BANGLA)
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
    setPwdMsg(d.message || d.error || "পাসওয়ার্ড হালনাগাদ সম্পন্ন হয়েছে।");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          {mode === "documents"
            ? "ডকুমেন্ট ভল্ট (PDF, JPG, PNG, DOCX, XLSX)"
            : "ব্যবহারকারী ও পদবী নিয়ন্ত্রণ, নিরাপত্তা সেটিংস ও অডিট ট্রেইল"}
        </h1>
        <p className="text-xs text-slate-500">
          সার্ভার-সাইড অনুমোদন নিয়ন্ত্রণ • কর্মকর্তা তথ্যের গোপনীয়তা • আর্থিক ও প্রশাসনিক অডিট লগ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ফর্মসমূহ: ডকুমেন্ট আপলোড, পাসওয়ার্ড পরিবর্তন ও রিমাইন্ডার সেটিংস */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleSaveDoc}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> নতুন ফাইল বা ডকুমেন্ট আপলোড
            </h2>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
            />
            <input
              type="text"
              required
              placeholder="ফাইলের নাম লিখুন *"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={docCat}
                onChange={(e) => setDocCat(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="Project">প্রজেক্ট</option>
                <option value="Employee">কর্মকর্তা</option>
                <option value="Client">ক্লায়েন্ট</option>
                <option value="Site">সাইট</option>
                <option value="Supplier">সরবরাহকারী</option>
                <option value="Contractor">ঠিকাদার</option>
                <option value="Invoice">ইনভয়েস</option>
                <option value="PO">পারচেজ অর্ডার</option>
                <option value="Payment">পেমেন্ট</option>
              </select>
              <input
                type="text"
                value={relatedCode}
                onChange={(e) => setRelatedCode(e.target.value)}
                placeholder="সংশ্লিষ্ট কোড"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              ডকুমেন্ট সংরক্ষণ ও ইনডেক্স করুন
            </button>
          </form>

          {/* পাসওয়ার্ড পরিবর্তন ফর্ম */}
          <form
            onSubmit={handlePasswordChange}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-800" /> একাউন্টের পাসওয়ার্ড পরিবর্তন
            </h2>
            {pwdMsg && (
              <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{pwdMsg}</p>
            )}
            <input
              type="password"
              required
              placeholder="বর্তমান পাসওয়ার্ড দিন"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="password"
              required
              placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              পাসওয়ার্ড হালনাগাদ করুন
            </button>
          </form>

          {/* ১২. স্বয়ংক্রিয় রিমাইন্ডার সেটিংস (ম্যানেজমেন্টের জন্য) */}
          {data.currentUser?.role !== "Staff" && (
            <form
              onSubmit={handleSaveReminders}
              className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
            >
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" /> ১২. স্বয়ংক্রিয় রিমাইন্ডার অটোমেশন সেটিংস
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    দেরি ইন
                  </label>
                  <input
                    type="time"
                    value={lateCheckInAfter}
                    onChange={(e) => setLateCheckInAfter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    কাজের প্ল্যান
                  </label>
                  <input
                    type="time"
                    value={workPlanReminderTime}
                    onChange={(e) => setWorkPlanReminderTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    দৈনিক সারাংশ
                  </label>
                  <input
                    type="time"
                    value={dailySummaryReminderTime}
                    onChange={(e) => setDailySummaryReminderTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={enableOverdueTaskReminder}
                  onChange={(e) => setEnableOverdueTaskReminder(e.target.checked)}
                />
                মেয়াদোত্তীর্ণ টাস্ক রিমাইন্ডার সক্রিয়
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={enablePendingTaskReminder}
                  onChange={(e) => setEnablePendingTaskReminder(e.target.checked)}
                />
                পেন্ডিং টাস্ক রিমাইন্ডার সক্রিয়
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
                >
                  রিমাইন্ডার সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={() => onMutate({ action: "runReminderAutomation" })}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-xs"
                >
                  চালু করুন
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ব্যবহারকারী ও অডিট ট্রেইল টেবিল */}
        <div className="lg:col-span-8 space-y-6">
          {(data.users || []).length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  সিস্টেম ব্যবহারকারী, ভূমিকা ও প্রবেশাধিকার নিয়ন্ত্রণ (মোট {(data.users || []).length} জন)
                </h3>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3 font-semibold">নাম ও ইমেইল</th>
                    <th className="p-3 font-semibold">সিস্টেম ভূমিকা / পদবী</th>
                    <th className="p-3 font-semibold">স্ট্যাটাস</th>
                    <th className="p-3 font-semibold">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.users || []).map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">
                        {getRoleBangla(u.role)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            u.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {u.status === "Active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
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
                            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition text-[11px]"
                          >
                            {u.status === "Active" ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ডকুমেন্ট ভল্ট */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                আপলোডকৃত ডকুমেন্ট ভল্ট (মোট {(data.documents || []).length} টি ফাইল)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">কোড</th>
                  <th className="p-3 font-semibold">ফাইলের নাম</th>
                  <th className="p-3 font-semibold">ক্যাটাগরি</th>
                  <th className="p-3 font-semibold">সংশ্লিষ্ট রেকর্ড</th>
                  <th className="p-3 font-semibold">আপলোডকারী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.documents || []).map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-emerald-800">{doc.docCode}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {doc.name} ({doc.fileType})
                    </td>
                    <td className="p-3">{doc.category}</td>
                    <td className="p-3 font-mono">{doc.relatedEntityCode}</td>
                    <td className="p-3 text-slate-500">{doc.uploadedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* অপবর্তনযোগ্য অডিট ট্রেইল লগ */}
          {(data.auditLogs || []).length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">
                  নিরাপত্তা ও আর্থিক অডিট ট্রেইল রেজিস্টার (মোট {(data.auditLogs || []).length} টি লগ)
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5 font-semibold">ব্যবহারকারী ও পদবী</th>
                      <th className="p-2.5 font-semibold">সম্পাদিত কাজ</th>
                      <th className="p-2.5 font-semibold">মডিউল / এনটিটি</th>
                      <th className="p-2.5 font-semibold">রেকর্ড কোড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.auditLogs || []).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5">
                          <strong>{log.userName}</strong> ({getRoleBangla(log.userRole)})
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">
                          {log.action}
                        </td>
                        <td className="p-2.5">{log.entity}</td>
                        <td className="p-2.5 font-mono text-slate-500">{log.recordId}</td>
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
