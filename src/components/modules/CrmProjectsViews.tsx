"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Building2,
  CheckCircle2,
  ArrowRight,
  Printer,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

 

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
  const [qLeadId, setQLeadId] = useState(String(data.leads?.[0]?.id || ""));
  const [service, setService] = useState("Full Construction Package");
  const [itemDesc, setItemDesc] = useState("RCC Structural Framing & Foundation");
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
          unit: "SqFt",
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === "quotations"
              ? "Quotations & BOQ Proposal System (QUO-0001)"
              : "Client Directory & Receivable Ledger (CLI-0001)"}
          </h1>
          <p className="text-xs text-slate-500">
            End-to-End CRM Integration: Lead → Quotation → Client → Project → Invoice → Payment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Forms */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleCreateClient}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900">নতুন ক্লায়েন্ট নিবন্ধন</h2>
            <input
              type="text"
              required
              placeholder="Client পূর্ণ নাম *"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              ক্লায়েন্ট তৈরি (CLI-XXXX)
            </button>
          </form>

          <form
            onSubmit={handleCreateQuotation}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900">BOQ কোটেশন তৈরি</h2>
            <select
              value={qClientId}
              onChange={(e) => setQClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- Select Client --</option>
              {(data.clients || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.clientCode} — {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Service Title"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="BOQ Item Description"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                placeholder="Qty"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={itemRate}
                onChange={(e) => setItemRate(e.target.value)}
                placeholder="Rate"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Discount"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="Tax"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              কোটেশন তৈরি (QUO-XXXX)
            </button>
          </form>
        </div>

        {/* Right Clients & Quotations Tables */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                ক্লায়েন্ট ও প্রাপ্য সারাংশ ({(data.clients || []).length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3">ক্লায়েন্ট আইডি</th>
                    <th className="p-3">নাম ও কোম্পানি</th>
                    <th className="p-3">ফোন</th>
                    <th className="p-3">মোট ইনভয়েস</th>
                    <th className="p-3">মোট পরিশোধ</th>
                    <th className="p-3">বকেয়া প্রাপ্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.clients || []).map((c: any) => (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {c.clientCode}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.companyName}</div>
                      </td>
                      <td className="p-3">{c.phone}</td>
                      <td className="p-3 font-semibold">
                        ৳{Number(c.totalInvoiced).toLocaleString()}
                      </td>
                      <td className="p-3 text-emerald-600 font-semibold">
                        ৳{Number(c.totalPaid).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-amber-600">
                        ৳{Number(c.outstandingBalance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Quotations (Draft → Sent → Accepted → Project/Invoice)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.quotations || []).map((q: any) => (
                <div
                  key={q.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {q.quotationNumber}
                    </span>
                    <span className="ml-2 font-bold text-slate-900">{q.service}</span>
                    <p className="text-slate-500 mt-1">
                      Subtotal: ৳{Number(q.subtotal).toLocaleString()} | Discount: ৳
                      {Number(q.discount).toLocaleString()} | Tax: ৳
                      {Number(q.tax).toLocaleString()} →{" "}
                      <strong className="text-slate-900">
                        Total: ৳{Number(q.totalAmount).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      {q.status}
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
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                      >
                        কোটেশন গ্রহণ
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
                            notes: `Generated from Accepted Quotation ${q.quotationNumber}`,
                          })
                        }
                        className="px-2.5 py-1 rounded bg-slate-900 text-white font-semibold"
                      >
                        ইনভয়েস তৈরি →
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
  const [landSize, setLandSize] = useState("10 Katha");
  const [roadWidth, setRoadWidth] = useState("40 ft");
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {focusedProjectId
              ? `Project 360° Command Dashboard (#${focusedProjectId})`
              : "প্রজেক্ট ব্যবস্থাপনা ও মুনাফা কেন্দ্র"}
          </h1>
          <p className="text-xs text-slate-500">
            Live Comparison: Budget vs Actual Cost (Material + Labour + Contractor + Transport + Site Expense) vs Revenue vs Profit/Loss
          </p>
        </div>
        {focusedProjectId && (
          <Link
            href="/projects"
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            ← সকল প্রজেক্ট
          </Link>
        )}
      </div>

      {!focusedProjectId && data.currentUser?.role !== "Staff" && (
        <form
          onSubmit={handleCreateProject}
          className="bg-white p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              placeholder="INSAF Skyline Tower"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              লোকেশন *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Uttara Sector 11"
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
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            + প্রজেক্ট চালু
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
              className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {p.projectCode}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {p.projectType}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xl font-bold text-slate-900 hover:text-emerald-600 mt-1 block"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Location: {p.location} • Land: {p.landSize} • Road: {p.roadWidth} • Timeline:{" "}
                    {p.startDate} to {p.expectedCompletion}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">সার্বিক অগ্রগতি</span>
                  <p className="text-2xl font-bold text-emerald-600">{p.progressPercent}%</p>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs font-semibold text-slate-900 underline"
                  >
                    প্রজেক্ট বিস্তারিত →
                  </Link>
                </div>
              </div>

              {/* Budget vs Actual Cost vs Revenue vs Profit/Loss */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block">প্রজেক্ট বাজেট</span>
                  <span className="text-base font-bold text-slate-900">
                    ৳{Number(p.budget).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs text-amber-800 block">প্রকৃত খরচ (মোট)</span>
                  <span className="text-base font-bold text-amber-700">
                    ৳{Number(p.actualCost).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-800 block">বিল করা আয়</span>
                  <span className="text-base font-bold text-emerald-700">
                    ৳{Number(p.totalRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-xs text-blue-800 block">সংগৃহীত অর্থ</span>
                  <span className="text-base font-bold text-blue-700">
                    ৳{Number(p.collectedRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                  <span className="text-xs text-slate-300 block">নিট মুনাফা / ক্ষতি</span>
                  <span className="text-base font-bold text-emerald-400">
                    ৳{Number(p.profitLoss).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Exact Cost Breakdown (Material + Labour + Contractor + Transport + Site Expense) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-slate-800 mb-2">
                  Actual Cost Breakdown (Real-Time Aggregation from Approved Project Expenses):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <span className="text-slate-500">Material: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.materialCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Labour: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.labourCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Contractor: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.contractorCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Transport: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.transportCost).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Site Expense: </span>
                    <strong className="text-slate-900">
                      ৳{Number(p.siteExpenseCost).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Linked Sites, Tasks, ঠিকাদার ও খরচ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="border border-slate-200 rounded-xl p-3.5">
                  <h4 className="font-bold text-slate-800 mb-2">
                    প্রজেক্ট সাইট ({pSites.length})
                  </h4>
                  {pSites.map((s: any) => (
                    <div key={s.id} className="p-2 rounded bg-slate-50 mb-1.5">
                      <div className="flex justify-between font-bold">
                        <span>
                          {s.siteCode}: {s.name}
                        </span>
                        <span className="text-emerald-600">{s.progressPercent}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Workers: {s.workersCount} • Issues: {s.problems || "নেই"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5">
                  <h4 className="font-bold text-slate-800 mb-2">
                    প্রজেক্ট টাস্ক ({pTasks.length})
                  </h4>
                  {pTasks.map((t: any) => (
                    <div key={t.id} className="p-2 rounded bg-slate-50 mb-1.5">
                      <div className="flex justify-between font-bold">
                        <Link href={`/tasks/${t.id}`} className="hover:underline">
                          {t.taskCode}: {t.title}
                        </Link>
                        <span>{t.progressPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5">
                  <h4 className="font-bold text-slate-800 mb-2">
                    ঠিকাদার ও খরচ ({pContractors.length} / {pExpenses.length})
                  </h4>
                  {pContractors.map((c: any) => (
                    <div key={c.id} className="p-2 rounded bg-slate-50 mb-1.5">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-slate-600">
                        Approved: ৳{Number(c.approvedBillAmount).toLocaleString()} | Paid: ৳
                        {Number(c.paidAmount).toLocaleString()} | Due: ৳
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
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            সাইট ব্যবস্থাপনা ও দৈনিক সাইট রিপোর্ট
          </h1>
          <p className="text-xs text-slate-500">
            Site Reports automatically aggregate progress and labour count to the parent Project Dashboard
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
          className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
        >
          <Printer className="w-3.5 h-3.5" /> সাইট রিপোর্ট প্রিন্ট
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmitReport}
          className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit"
        >
          <h2 className="text-sm font-bold text-slate-900">
            দৈনিক সাইট রিপোর্ট জমা ({today})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Site
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              আজকের কাজ *
            </label>
            <textarea
              required
              rows={2}
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              placeholder="e.g. Completed 4th floor column shuttering & concrete pouring"
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
              ব্যবহৃত মালামাল
            </label>
            <input
              type="text"
              value={materialsUsedSummary}
              onChange={(e) => setMaterialsUsedSummary(e.target.value)}
              placeholder="25 Bags Cement, 1.2 Ton 16mm Rod"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সাইট সমস্যা
              </label>
              <input
                type="text"
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tomorrow&apos;s Plan *
              </label>
              <input
                type="text"
                required
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Site Photo URL (Optional)
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
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
          >
            সাইট রিপোর্ট জমা ও প্রজেক্টে যোগ
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data.sites || []).map((s: any) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2"
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
                  <span>Active Workers: {s.workersCount}</span>
                  <span className="text-amber-600">{s.problems || "No issues"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              দৈনিক সাইট ইঞ্জিনিয়ারিং রিপোর্ট ({(data.siteReports || []).length})
            </h3>
            {(data.siteReports || []).map((sr: any) => (
              <div
                key={sr.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex justify-between font-bold text-slate-900">
                  <span>
                    {sr.reportCode} • {sr.date} (Site #{sr.siteId})
                  </span>
                  <span className="text-emerald-700">
                    Progress: {sr.progressPercent}% | Labour: {sr.labourCount}
                  </span>
                </div>
                <p className="text-slate-800 font-medium">{sr.workDone}</p>
                <p className="text-slate-600">
                  <strong>Materials Used:</strong> {sr.materialsUsedSummary || "N/A"} |{" "}
                  <strong>Site Expense:</strong> ৳
                  {Number(sr.siteExpenseAmount).toLocaleString()}
                </p>
                <p className="text-slate-500">
                  <strong>Tomorrow Plan:</strong> {sr.tomorrowPlan}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

void Phone;
void MapPin;
void FileText;
void Briefcase;
void Building2;
void CheckCircle2;
void ArrowRight;
