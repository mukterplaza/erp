"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
} from "lucide-react";
import { exportToPDFPrint } from "@/lib/export-utils";

 

// ============================================================================
// CLIENTS & QUOTATIONS VIEW (/clients and /quotations)
// ============================================================================
export function ClientsAndQuotationsView({
  data,
  onMutate,
  mode = "clients",
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  mode?: "clients" | "quotations";
}) {
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Quotation state
  const [qClientId, setQClientId] = useState(String(data.clients?.[0]?.id || ""));
  const [qLeadId] = useState(String(data.leads?.[0]?.id || ""));
  const [service, setService] = useState("ফুল কনস্ট্রাকশন প্যাকেজ");
  const [itemDesc, setItemDesc] = useState("আরসিসি স্ট্রাকচারাল ফ্রেম ও ফাউন্ডেশন");
  const [itemQty, setItemQty] = useState("1000");
  const [itemRate, setItemRate] = useState("450");
  const [discount, setDiscount] = useState("10000");
  const [tax, setTax] = useState("0");

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createClient",
      name: clientName,
      companyName,
      phone,
      address,
    });
    setClientName("");
    setCompanyName("");
    setPhone("");
    setAddress("");
  }

  async function handleCreateQuotation(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createQuotation",
      clientId: qClientId ? Number(qClientId) : null,
      leadId: qLeadId ? Number(qLeadId) : null,
      service,
      items: [
        {
          description: itemDesc,
          unit: "বর্গফুট",
          quantity: Number(itemQty),
          rate: Number(itemRate),
        },
      ],
      discount: Number(discount),
      tax: Number(tax),
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === "quotations"
              ? "কোটেশন ও বিওকিউ প্রস্তাবনা ব্যবস্থাপনা (QUO-0001)"
              : "ক্লায়েন্ট তালিকা ও বকেয়া হিসাব লেজার (CLI-0001)"}
          </h1>
          <p className="text-xs text-slate-500">
            লিড → ফলো-আপ → কোটেশন → ক্লায়েন্ট → প্রজেক্ট → ইনভয়েস → পেমেন্ট সমন্বিত সিআরএম
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* বাম পাশের ফর্মসমূহ */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleCreateClient}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900">নতুন ক্লায়েন্ট নিবন্ধন করুন</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ক্লায়েন্টের পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: আলহাজ্ব আব্দুল করিম"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                প্রতিষ্ঠানের নাম
              </label>
              <input
                type="text"
                placeholder="যেমন: করিম প্রোপার্টিজ লি."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ফোন নম্বর *
              </label>
              <input
                type="text"
                required
                placeholder="01711-XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ঠিকানা
              </label>
              <input
                type="text"
                placeholder="প্লট ১৪, রোড ৭, বসুন্ধরা আ/এ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              ক্লায়েন্ট সংরক্ষণ করুন (CLI-XXXX)
            </button>
          </form>

          <form
            onSubmit={handleCreateQuotation}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900">নতুন বিওকিউ কোটেশন তৈরি করুন</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ক্লায়েন্ট নির্বাচন
              </label>
              <select
                value={qClientId}
                onChange={(e) => setQClientId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="">-- ক্লায়েন্ট নির্বাচন করুন --</option>
                {(data.clients || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.clientCode} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সেবার শিরোনাম
              </label>
              <input
                type="text"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="সেবার নাম লিখুন"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                কাজের বিবরণ / আইটেম
              </label>
              <input
                type="text"
                required
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="আইটেমের বিবরণ"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পরিমাণ</label>
                <input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="পরিমাণ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">দর (৳)</label>
                <input
                  type="number"
                  value={itemRate}
                  onChange={(e) => setItemRate(e.target.value)}
                  placeholder="দর"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ছাড় (৳)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="ছাড়"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ট্যাক্স (৳)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="ট্যাক্স"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              কোটেশন তৈরি করুন (QUO-XXXX)
            </button>
          </form>
        </div>

        {/* ডান পাশের ক্লায়েন্ট ও কোটেশন তালিকা */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                ক্লায়েন্ট ও বকেয়া পাওনা সারাংশ ({(data.clients || []).length} জন)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3 font-semibold">ক্লায়েন্ট আইডি</th>
                    <th className="p-3 font-semibold">নাম ও প্রতিষ্ঠান</th>
                    <th className="p-3 font-semibold">ফোন নম্বর</th>
                    <th className="p-3 font-semibold">মোট ইনভয়েসকৃত</th>
                    <th className="p-3 font-semibold">মোট পরিশোধিত</th>
                    <th className="p-3 font-semibold">বকেয়া পাওনা (AR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.clients || []).map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {c.clientCode}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.companyName}</div>
                      </td>
                      <td className="p-3 font-mono">{c.phone}</td>
                      <td className="p-3 font-semibold">
                        ৳{Number(c.totalInvoiced).toLocaleString()}
                      </td>
                      <td className="p-3 text-emerald-600 font-semibold">
                        ৳{Number(c.totalPaid).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-amber-600 text-sm">
                        ৳{Number(c.outstandingBalance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                কোটেশন তালিকা (খসড়া → প্রেরিত → অনুমোদিত → প্রজেক্ট/ইনভয়েস)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.quotations || []).map((q: any) => (
                <div
                  key={q.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                >
                  <div>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      {q.quotationNumber}
                    </span>
                    <span className="ml-2 font-bold text-slate-900">{q.service}</span>
                    <p className="text-slate-500 mt-1">
                      উপমোট: ৳{Number(q.subtotal).toLocaleString()} | ছাড়: ৳
                      {Number(q.discount).toLocaleString()} | ভ্যাট/ট্যাক্স: ৳
                      {Number(q.tax).toLocaleString()} →{" "}
                      <strong className="text-slate-900">
                        সর্বমোট: ৳{Number(q.totalAmount).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[11px]">
                      {q.status === "Accepted" ? "অনুমোদিত" : q.status === "Sent" ? "প্রেরিত" : q.status}
                    </span>
                    {q.status !== "Accepted" && (
                      <button
                        type="button"
                        onClick={() =>
                          onMutate({
                            action: "updateQuotationStatus",
                            quotationId: q.id,
                            status: "Accepted",
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold transition hover:bg-emerald-500"
                      >
                        কোটেশন অনুমোদন করুন
                      </button>
                    )}
                    {q.status === "Accepted" && q.clientId && (
                      <button
                        type="button"
                        onClick={() =>
                          onMutate({
                            action: "createInvoice",
                            clientId: q.clientId,
                            projectId: q.projectId,
                            quotationId: q.id,
                            totalAmount: Number(q.totalAmount),
                            notes: `অনুমোদিত কোটেশন ${q.quotationNumber} হতে প্রস্তুতকৃত ইনভয়েস`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800"
                      >
                        ইনভয়েস তৈরি করুন →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECTS & PROJECT 360 DASHBOARD (/projects and /projects/[id])
// ============================================================================
export function ProjectsView({
  data,
  onMutate,
  focusedProjectId,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  focusedProjectId?: number;
}) {
  const [clientId, setClientId] = useState(String(data.clients?.[0]?.id || 1));
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [landSize, setLandSize] = useState("১০ কাঠা");
  const [roadWidth, setRoadWidth] = useState("৪০ ফুট");
  const [budget, setBudget] = useState("2500000");

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createProject",
      clientId: Number(clientId),
      name,
      location,
      landSize,
      roadWidth,
      budget: Number(budget),
    });
    setName("");
    setLocation("");
  }

  const projectsList = focusedProjectId
    ? (data.projects || []).filter((p: any) => p.id === focusedProjectId)
    : data.projects || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {focusedProjectId
              ? `প্রজেক্ট ৩৬০° বিশ্লেষণ ড্যাশবোর্ড (#${focusedProjectId})`
              : "প্রজেক্ট ব্যবস্থাপনা ও লাভজনকতা বিশ্লেষণ (PRJ-0001)"}
          </h1>
          <p className="text-xs text-slate-500">
            বাজেট বনাম প্রকৃত খরচ (মালামাল + শ্রমিক + ঠিকাদার + পরিবহন + সাইট খরচ) বনাম মোট আয় ও লাভ/ক্ষতির হিসাব
          </p>
        </div>
        {focusedProjectId && (
          <Link
            href="/projects"
            className="px-3.5 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold transition hover:bg-slate-800"
          >
            ← সকল প্রজেক্ট
          </Link>
        )}
      </div>

      {!focusedProjectId && data.currentUser?.role !== "Staff" && (
        <form
          onSubmit={handleCreateProject}
          className="bg-white p-5 rounded-3xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end shadow-xs"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ক্লায়েন্ট
            </label>
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
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              প্রজেক্টের নাম *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ইনসাফ স্কাইলাইন টাওয়ার"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              অবস্থান / ঠিকানা *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="উত্তরা সেক্টর ১১"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              বাজেট (৳)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
          >
            + নতুন প্রজেক্ট শুরু করুন
          </button>
        </form>
      )}

      <div className="space-y-6">
        {projectsList.map((p: any) => {
          const pSites = (data.sites || []).filter((s: any) => s.projectId === p.id);
          const pTasks = (data.tasks || []).filter((t: any) => t.projectId === p.id);
          const pExpenses = (data.expenses || []).filter((e: any) => e.projectId === p.id);
          const pContractors = (data.contractors || []).filter(
            (c: any) => c.projectId === p.id
          );

          return (
            <div
              key={p.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                      {p.projectCode}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {p.projectType}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xl font-bold text-slate-900 hover:text-emerald-600 mt-1 block transition"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ঠিকানা: {p.location} • জমি: {p.landSize} • রাস্তা: {p.roadWidth} • সময়কাল:{" "}
                    {p.startDate} হতে {p.expectedCompletion}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">সার্বিক অগ্রগতি</span>
                  <p className="text-2xl font-bold text-emerald-600">{p.progressPercent}%</p>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs font-semibold text-slate-900 underline"
                  >
                    বিস্তারিত দেখুন →
                  </Link>
                </div>
              </div>

              {/* বাজেট বনাম খরচ বনাম আয় বনাম লাভ */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">প্রজেক্ট বাজেট</span>
                  <span className="text-base font-bold text-slate-900">
                    ৳{Number(p.budget).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs text-amber-800 block">প্রকৃত খরচ (মোট)</span>
                  <span className="text-base font-bold text-amber-700">
                    ৳{Number(p.actualCost).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-800 block">বিলকৃত আয়</span>
                  <span className="text-base font-bold text-emerald-700">
                    ৳{Number(p.totalRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <span className="text-xs text-blue-800 block">আদায়কৃত অর্থ</span>
                  <span className="text-base font-bold text-blue-700">
                    ৳{Number(p.collectedRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
                  <span className="text-xs text-slate-300 block">নিট লাভ / ক্ষতি</span>
                  <span className="text-base font-bold text-emerald-400">
                    ৳{Number(p.profitLoss).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ব্যয়ের বিস্তারিত বিভাজন */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-800 mb-2">
                  খরচের খাতভিত্তিক বিভাজন (অনুমোদিত খরচের ভিত্তিতে স্বয়ংক্রিয় হিসাব):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <span className="text-slate-500">মালামাল: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.materialCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">শ্রমিক মজুরি: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.labourCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ঠিকাদার বিল: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.contractorCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">পরিবহন: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.transportCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">সাইট খরচ: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.siteExpenseCost).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* সংযুক্ত সাইট, টাস্ক ও ঠিকাদার */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="border border-slate-200 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 mb-2">
                    প্রজেক্ট সাইটসমূহ ({pSites.length} টি)
                  </h4>
                  {pSites.map((s: any) => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 mb-2">
                      <div className="flex justify-between font-bold">
                        <span>
                          {s.siteCode}: {s.name}
                        </span>
                        <span className="text-emerald-600">{s.progressPercent}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        শ্রমিক: {s.workersCount} জন • সমস্যা: {s.problems || "কোনোটি নয়"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 mb-2">
                    প্রজেক্ট টাস্কসমূহ ({pTasks.length} টি)
                  </h4>
                  {pTasks.map((t: any) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-slate-50 mb-2">
                      <div className="flex justify-between font-bold">
                        <Link href={`/tasks/${t.id}`} className="hover:underline">
                          {t.taskCode}: {t.title}
                        </Link>
                        <span>{t.progressPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-2xl p-4">
                  <h4 className="font-bold text-slate-800 mb-2">
                    সাব-ঠিকাদার ও খরচ ({pContractors.length} / {pExpenses.length})
                  </h4>
                  {pContractors.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 mb-2">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        অনুমোদিত: ৳{Number(c.approvedBillAmount).toLocaleString()} | পরিশোধিত: ৳
                        {Number(c.paidAmount).toLocaleString()} | বকেয়া: ৳
                        {Number(c.outstandingDue).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SITES & DAILY SITE REPORTS VIEW (/sites and /site-reports)
// ============================================================================
export function SitesAndReportsView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [siteId, setSiteId] = useState(String(data.sites?.[0]?.id || 1));
  const [projectId, setProjectId] = useState(String(data.projects?.[0]?.id || 1));
  const [workDone, setWorkDone] = useState("");
  const [progressPercent, setProgressPercent] = useState("70");
  const [labourCount, setLabourCount] = useState("30");
  const [materialsUsedSummary, setMaterialsUsedSummary] = useState("");
  const [siteExpenseAmount, setSiteExpenseAmount] = useState("0");
  const [problems, setProblems] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "submitSiteReport",
      siteId: Number(siteId),
      projectId: Number(projectId),
      date: today,
      workDone,
      progressPercent: Number(progressPercent),
      labourCount: Number(labourCount),
      materialsUsedSummary,
      siteExpenseAmount: Number(siteExpenseAmount),
      problems,
      tomorrowPlan,
      photoUrl,
    });
    setWorkDone("");
    setMaterialsUsedSummary("");
    setTomorrowPlan("");
    setProblems("");
    setPhotoUrl("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            সাইট ব্যবস্থাপনা ও দৈনিক সাইট ইঞ্জিনিয়ারিং রিপোর্ট (SITE-0001)
          </h1>
          <p className="text-xs text-slate-500">
            সাইট রিপোর্ট দাখিলের সাথে সাথে তা সংশ্লিষ্ট মূল প্রজেক্টের অগ্রগতি ও খরচে যুক্ত হয়
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportToPDFPrint(
              "দৈনিক সাইট ইঞ্জিনিয়ারিং রিপোর্ট",
              today,
              data.siteReports || []
            )
          }
          className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Printer className="w-3.5 h-3.5" /> সাইট রিপোর্ট প্রিন্ট
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmitReport}
          className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 h-fit shadow-xs"
        >
          <h2 className="text-sm font-bold text-slate-900">
            আজকের সাইট রিপোর্ট দাখিল করুন ({today})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সাইট নির্বাচন
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.sites || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.siteCode} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                প্রজেক্ট নির্বাচন
              </label>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              আজকের সম্পাদিত কাজ *
            </label>
            <textarea
              required
              rows={2}
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              placeholder="যেমন: ৪র্থ তলার কলামের রড বাইন্ডিং ও শাটারিং সম্পন্ন হয়েছে"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                অগ্রগতি %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                শ্রমিক সংখ্যা
              </label>
              <input
                type="number"
                value={labourCount}
                onChange={(e) => setLabourCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সাইট খরচ (৳)
              </label>
              <input
                type="number"
                value={siteExpenseAmount}
                onChange={(e) => setSiteExpenseAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ব্যবহৃত কাঁচামাল / মালামালের বিবরণ
            </label>
            <input
              type="text"
              value={materialsUsedSummary}
              onChange={(e) => setMaterialsUsedSummary(e.target.value)}
              placeholder="যেমন: ২৫ ব্যাগ সিমেন্ট, ১.২ টন রড"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সাইটের সমস্যা / বাধা
              </label>
              <input
                type="text"
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                placeholder="সমস্যা থাকলে লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                আগামীকালের পরিকল্পনা *
              </label>
              <input
                type="text"
                required
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="পরবর্তী দিনের কর্মপরিকল্পনা"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              সাইট ফটোর ওয়েব লিংক (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
          >
            সাইট রিপোর্ট জমা দিন ও প্রজেক্টে যুক্ত করুন
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data.sites || []).map((s: any) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {s.siteCode}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {s.progressPercent}%
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                <p className="text-xs text-slate-500">{s.location}</p>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                  <span>কার্যরত শ্রমিক: {s.workersCount} জন</span>
                  <span className="text-amber-600 font-medium">{s.problems || "কোনো সমস্যা নেই"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              দাখিলকৃত দৈনিক সাইট ইঞ্জিনিয়ারিং রিপোর্ট ({(data.siteReports || []).length} টি)
            </h3>
            {(data.siteReports || []).map((sr: any) => (
              <div
                key={sr.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex justify-between font-bold text-slate-900">
                  <span>
                    {sr.reportCode} • {sr.date} (সাইট #{sr.siteId})
                  </span>
                  <span className="text-emerald-700">
                    অগ্রগতি: {sr.progressPercent}% | শ্রমিক: {sr.labourCount} জন
                  </span>
                </div>
                <p className="text-slate-800 font-medium">{sr.workDone}</p>
                <p className="text-slate-600">
                  <strong>ব্যবহৃত মালামাল:</strong> {sr.materialsUsedSummary || "প্রযোজ্য নয়"} |{" "}
                  <strong>সাইট খরচ:</strong> ৳
                  {Number(sr.siteExpenseAmount).toLocaleString()}
                </p>
                <p className="text-slate-500">
                  <strong>আগামীকালের কাজ:</strong> {sr.tomorrowPlan}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
