"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Phone,
  Building2,
  Printer,
  FileSpreadsheet,
  Flame,
  Sun,
  Snowflake,
  TrendingUp,
  Target,
  XCircle,
  Repeat,
  Filter,
  Home,
  Briefcase,
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDFPrint } from "@/lib/export-utils";

 

// ============================================================================
// COMPANY / BUSINESS-UNIT DEFINITIONS (STRICT DATA SEPARATION)
// ============================================================================
export const IBDC_SERVICES = [
  "Architectural Design",
  "Structural Design",
  "Electrical Design",
  "Plumbing Design",
  "Costing & Estimating",
  "RAJUK Plan Approval",
  "Plan Design + RAJUK Approval",
  "Interior Design",
  "3D Visualization & VR",
  "3D View",
  "Construction Management",
  "Package Building Work",
  "Documents",
  "Other",
] as const;

export const IREL_PROPERTY_TYPES = [
  "Flat",
  "Shop",
  "Office Space",
  "Commercial Space",
  "Apartment",
  "Land/Plot",
  "Investment",
  "Project",
  "Other",
] as const;

export const LEAD_SOURCES = [
  "Facebook",
  "Referral",
  "Website",
  "Direct",
  "Walk-in",
  "Instagram",
  "Existing Client",
  "Billboard",
] as const;

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Follow-up",
  "Qualified",
  "Quotation",
  "Won",
  "Lost",
] as const;

export const LEAD_PRIORITIES = ["Hot", "Warm", "Cold"] as const;

const COMPANIES = {
  IBDC: {
    id: "IBDC",
    label: "INSAF BUILDING DESIGN & CONSULTANT LTD.",
    short: "Insaf Building Design & Consultant",
    categoryLabel: "Service Type",
    categories: IBDC_SERVICES,
    accent: "emerald",
  },
  IREL: {
    id: "IREL",
    label: "INSAF REAL ESTATE LTD.",
    short: "Insaf Real Estate",
    categoryLabel: "Property Interest",
    categories: IREL_PROPERTY_TYPES,
    accent: "indigo",
  },
} as const;

type CompanyTab = "IBDC" | "IREL" | "ALL";

function priorityStyle(p: string) {
  if (p === "Hot")
    return { cls: "bg-rose-100 text-rose-700 border-rose-300", Icon: Flame };
  if (p === "Cold")
    return { cls: "bg-sky-100 text-sky-700 border-sky-300", Icon: Snowflake };
  return { cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: Sun };
}

function statusStyle(s: string) {
  if (s === "Won") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s === "Lost") return "bg-rose-100 text-rose-700 border-rose-300";
  if (s === "Follow-up" || s === "Follow-up Required")
    return "bg-amber-100 text-amber-800 border-amber-300";
  if (s === "Quotation" || s === "Qualified")
    return "bg-indigo-100 text-indigo-800 border-indigo-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

function budgetRangeLabel(amount: number): string {
  const lakh = amount / 100000; // 1 Lakh = 100,000
  if (lakh < 50) return "Below 50 Lakh";
  if (lakh < 100) return "50 Lakh – 1 Crore";
  if (lakh < 200) return "1 Crore – 2 Crore";
  if (lakh < 500) return "2 Crore – 5 Crore";
  return "Above 5 Crore";
}

function formatBudget(amount: number): string {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Crore`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)} Lakh`;
  return `৳${amount.toLocaleString()}`;
}

function tally(items: string[]): Array<{ label: string; count: number; pct: number }> {
  const total = items.length;
  const map = new Map<string, number>();
  items.forEach((i) => {
    const key = i && String(i).trim() ? String(i).trim() : "Unspecified";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({
      label,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}


// ============================================================================
// FOLLOW-UP METHOD / OUTCOME LABELS
// ============================================================================
const FU_METHODS = [
  "Phone Call", "WhatsApp", "Facebook", "SMS", "Email",
  "Meeting", "Office Visit", "Site Visit", "Other",
];

const FU_OUTCOMES = [
  "No Response", "Contacted", "Interested", "Qualified", "Need More Information",
  "Quotation Sent", "Negotiating", "Call Back Later", "Not Interested",
  "Won", "Lost", "Other",
];

const CLOSED_FU = ["Won", "Lost", "Not Interested"];

const LEAD_STATUSES_FULL = [
  "New", "Contacted", "Follow-up", "Qualified", "Quotation",
  "Negotiating", "Won", "Lost", "On Hold",
];

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function bucketBadge(bucket: string) {
  switch (bucket) {
    case "Overdue": return { cls: "bg-rose-600 text-white", label: "OVERDUE" };
    case "Today": return { cls: "bg-amber-500 text-white", label: "TODAY" };
    case "Tomorrow": return { cls: "bg-blue-600 text-white", label: "TOMORROW" };
    case "Next 3 Days": return { cls: "bg-indigo-600 text-white", label: "3 DAYS" };
    case "Next 7 Days": return { cls: "bg-teal-600 text-white", label: "7 DAYS" };
    case "No পরবর্তী ফলো-আপ": return { cls: "bg-slate-500 text-white", label: "NO NEXT FU" };
    default: return { cls: "bg-slate-300 text-slate-800", label: "LATER" };
  }
}

// ============================================================================
// MAIN LEADS / CRM VIEW — TWO COMPANIES + UNLIMITED FOLLOW-UP ENGINE
// ============================================================================
export function LeadsView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const board = data.followUpBoard;

  const allLeads: any[] = useMemo(() => data.leads || [], [data.leads]);
  const followUps: any[] = useMemo(() => data.leadFollowups || [], [data.leadFollowups]);

  const [activeTab, setActiveTab] = useState<CompanyTab>("IBDC");
  const [boardTab, setBoardTab] = useState<"Today" | "Overdue" | "Upcoming" | "Management">("Today");

  // ---- New Lead Form ----
  const [formCompany, setFormCompany] = useState<"IBDC" | "IREL">("IBDC");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState<string>("Referral");
  const [budget, setBudget] = useState("8000000");
  const [priority, setPriority] = useState<string>("Hot");
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [service, setService] = useState<string>("RAJUK Plan Approval");
  const [requirement, setRequirement] = useState("");
  const [landSize, setLandSize] = useState("8 Katha");
  const [roadWidth, setRoadWidth] = useState("30 ft");
  const [propertyType, setPropertyType] = useState<string>("Flat");
  const [projectName, setProjectName] = useState("Salsabil");
  const [unitFlatShop, setUnitFlatShop] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [size, setSize] = useState("1450 Sft");
  const [floor, setFloor] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [purpose, setPurpose] = useState("Own Use");
  const [expectedPurchaseDate, setExpectedPurchaseDate] = useState("");
  const [clientRequirement, setClientRequirement] = useState("");

  // ---- Filters ----
  const [filterSource, setFilterSource] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // ---- Lead 360 / Timeline ----
  const [openLeadId, setOpenLeadId] = useState<number | null>(null);

  // ---- Quick Follow-up Modal ----
  const [fuLeadId, setFuLeadId] = useState<number | null>(null);
  const [fuMethod, setFuMethod] = useState("Phone Call");
  const [fuOutcome, setFuOutcome] = useState("Contacted");
  const [fuClientResponse, setFuClientResponse] = useState("");
  const [fuNote, setFuNote] = useState("");
  const [fuNextDate, setFuNextDate] = useState("");
  const [fuNextTime, setFuNextTime] = useState("10:00");
  const [fuAttachment, setFuAttachment] = useState<{ name: string; type: string; size: string; url: string } | null>(null);
  const [fuNewStatus, setFuNewStatus] = useState<string>("");

  const scopedLeads = useMemo(() => {
    const base =
      activeTab === "IBDC" ? allLeads.filter((l) => (l.companyId || "IBDC") === "IBDC")
      : activeTab === "IREL" ? allLeads.filter((l) => l.companyId === "IREL")
      : allLeads;
    return base;
  }, [allLeads, activeTab]);

  const filteredLeads = scopedLeads.filter((l) => {
    if (filterSource !== "All" && l.source !== filterSource) return false;
    if (filterStatus !== "All" && l.status !== filterStatus) return false;
    if (filterPriority !== "All" && l.priority !== filterPriority) return false;
    if (filterCategory !== "All") {
      const cat = activeTab === "IREL" ? l.propertyType : l.service;
      if (cat !== filterCategory) return false;
    }
    return true;
  });

  const fuByLead = useMemo(() => {
    const m = new Map<number, any[]>();
    followUps.forEach((f) => {
      const arr = m.get(f.leadId) || [];
      arr.push(f);
      m.set(f.leadId, arr);
    });
    m.forEach((arr) => arr.sort((a, b) => (a.followUpNumber || a.id) - (b.followUpNumber || b.id)));
    return m;
  }, [followUps]);

  const openLead = allLeads.find((l) => l.id === openLeadId) || null;
  const fuLead = allLeads.find((l) => l.id === fuLeadId) || null;
  const closedOutcome = CLOSED_FU.includes(fuOutcome);

  function switchTab(tab: CompanyTab) {
    setActiveTab(tab);
    setFilterSource("All"); setFilterStatus("All"); setFilterPriority("All"); setFilterCategory("All");
    setFormCompany(tab === "IREL" ? "IREL" : "IBDC");
  }

  function openFollowUpModal(leadId: number) {
    const lead = allLeads.find((l) => l.id === leadId);
    setFuLeadId(leadId);
    setFuMethod("Phone Call");
    setFuOutcome("Contacted");
    setFuClientResponse("");
    setFuNote("");
    setFuNextDate(lead?.nextFollowUpDate || today);
    setFuNextTime(lead?.nextFollowUpTime || "10:00");
    setFuAttachment(null);
    setFuNewStatus("");
  }

  async function saveFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!fuLeadId) return;
    if (!closedOutcome && fuLead?.status !== "On Hold" && !fuNextDate) {
      alert("পরবর্তী ফলো-আপ Date is required for active leads.");
      return;
    }
    await onMutate({
      action: "addLeadFollowup",
      leadId: fuLeadId,
      contactMethod: fuMethod,
      outcome: fuOutcome,
      clientResponse: fuClientResponse,
      note: fuNote,
      nextAction: closedOutcome ? "No further follow-up" : "Follow up as scheduled",
      nextFollowUpDate: closedOutcome ? null : fuNextDate,
      nextFollowUpTime: fuNextTime,
      attachment: fuAttachment,
      newStatus: fuNewStatus || undefined,
    });
    setFuLeadId(null);
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      action: "createLead", companyId: formCompany, name, phone,
      whatsapp: whatsapp || phone, location, source, budget: Number(budget || 0),
      priority, assignedStaffId: assignedStaffId ? Number(assignedStaffId) : null,
      nextFollowUpDate: today,
    };
    if (formCompany === "IBDC") {
      payload.service = service; payload.requirement = requirement;
      payload.landSize = landSize; payload.roadWidth = roadWidth;
    } else {
      payload.propertyType = propertyType; payload.projectName = projectName;
      payload.unitFlatShop = unitFlatShop; payload.preferredLocation = preferredLocation || location;
      payload.size = size; payload.floor = floor; payload.bedrooms = bedrooms;
      payload.purpose = purpose; payload.expectedPurchaseDate = expectedPurchaseDate;
      payload.clientRequirement = clientRequirement;
    }
    await onMutate(payload);
    setName(""); setPhone(""); setWhatsapp(""); setLocation(""); setRequirement("");
    setUnitFlatShop(""); setClientRequirement("");
  }

  const upcoming = useMemo(
    () => [...(board?.tomorrow || []), ...(board?.next3Days || []), ...(board?.next7Days || [])],
    [board]
  );

  function boardRow(r: any) {
    const b = bucketBadge(r.bucket);
    return (
      <tr key={r.leadId} className="hover:bg-slate-50 border-b border-slate-100">
        <td className="p-2.5">
          <button type="button" onClick={() => setOpenLeadId(r.leadId)} className="text-left">
            <span className="font-bold text-slate-900 hover:text-emerald-600">{r.clientName}</span>
            <span className="block text-[11px] text-slate-400 font-mono">{r.leadCode}</span>
          </button>
        </td>
        <td className="p-2.5 font-mono text-[11px]">{r.phone}</td>
        <td className="p-2.5 text-[11px]">{r.category}{r.projectName ? ` • ${r.projectName}` : ""}</td>
        <td className="p-2.5 text-[11px]">{r.assignedStaffName}</td>
        <td className="p-2.5 text-[11px]">
          {fmtDate(r.lastContactDate)}
          <span className="block text-slate-400">
            {r.daysSinceLastContact === null ? "never" : `${r.daysSinceLastContact}d ago`}
          </span>
        </td>
        <td className="p-2.5 text-[11px]">
          {fmtDate(r.nextFollowUpDate)} {r.nextFollowUpTime}
          {r.bucket === "Overdue" && (
            <span className="block font-bold text-rose-600">🔴 {r.daysOverdue}d overdue</span>
          )}
          {r.bucket === "Today" && <span className="block font-bold text-amber-600">TODAY</span>}
        </td>
        <td className="p-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.cls}`}>{b.label}</span></td>
        <td className="p-2.5 text-[11px] font-semibold">{r.priority}</td>
        <td className="p-2.5 text-[11px]">{r.totalFollowUps}</td>
        <td className="p-2.5">
          <button type="button" onClick={() => openFollowUpModal(r.leadId)}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">এখন ফলো-আপ</button>
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER + TABS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" /> Leads & CRM — Dual Business Unit + Unlimited Follow-Ups
            </h1>
            <p className="text-xs text-slate-500">
              Repeated follow-ups until Won / Lost / On Hold • Append-only history • Auto reminders for today &amp; overdue
            </p>
          </div>
          <button type="button" onClick={() => onMutate({ action: "sendFollowUpReminders" })}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold">
            Send Follow-up Reminders
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {([
            { id: "IBDC" as CompanyTab, sub: "Design • Approval • Engineering" },
            { id: "IREL" as CompanyTab, sub: "Flat • Shop • Land • Investment" },
            { id: "ALL" as CompanyTab, sub: "Combined statistics (both companies)" },
          ]).map((tab) => {
            const count = tab.id === "IBDC" ? allLeads.filter((l) => (l.companyId || "IBDC") === "IBDC").length
              : tab.id === "IREL" ? allLeads.filter((l) => l.companyId === "IREL").length : allLeads.length;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => switchTab(tab.id)}
                className={`text-left p-3 rounded-2xl border-2 transition ${isActive
                  ? tab.id === "IREL" ? "border-indigo-500 bg-indigo-50" : tab.id === "IBDC" ? "border-emerald-500 bg-emerald-50" : "border-slate-900 bg-slate-100"
                  : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">
                    {tab.id === "ALL" ? "TAB 3 — ALL LEADS" : `TAB ${tab.id === "IBDC" ? "1" : "2"} — ${COMPANIES[tab.id as "IBDC" | "IREL"].label}`}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${tab.id === "IREL" ? "bg-indigo-600 text-white" : tab.id === "IBDC" ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>{count}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{tab.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* FOLLOW-UP BOARD */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">ফলো-আপ কমান্ড বোর্ড</h2>
          <div className="flex flex-wrap gap-1.5">
            {(["Today", "Overdue", "Upcoming", "Management"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setBoardTab(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${boardTab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                {t}
                {t === "Today" && ` (${board?.summary?.todaysFollowUps ?? 0})`}
                {t === "Overdue" && ` (${board?.summary?.overdueFollowUps ?? 0})`}
                {t === "Upcoming" && ` (${board?.summary?.upcomingFollowUps ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-4 bg-slate-50 border-b border-slate-200">
          {[
            { l: "আজকের ফলো-আপ", v: board?.summary?.todaysFollowUps, c: "text-amber-600" },
            { l: "Overdue", v: board?.summary?.overdueFollowUps, c: "text-rose-600" },
            { l: "Upcoming", v: board?.summary?.upcomingFollowUps, c: "text-indigo-600" },
            { l: "Completed Today", v: board?.summary?.followUpsCompletedToday, c: "text-emerald-600" },
            { l: "No পরবর্তী ফলো-আপ", v: board?.summary?.leadsWithoutNextFollowUp, c: "text-slate-700" },
            { l: "No Response Leads", v: board?.summary?.leadsWithNoResponse, c: "text-orange-600" },
            { l: "Active Leads", v: board?.summary?.activeLeads, c: "text-slate-900" },
          ].map((k) => (
            <div key={k.l} className="bg-white p-2.5 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">{k.l}</p>
              <p className={`text-lg font-bold ${k.c}`}>{k.v ?? 0}</p>
            </div>
          ))}
        </div>

        {/* BOARD CONTENT */}
        {boardTab === "Management" ? (
          <div className="p-4 space-y-5">
            <div className="overflow-x-auto">
              <h3 className="text-xs font-bold text-slate-800 mb-2">স্টাফ ফলো-আপ পারফরম্যান্স</h3>
              <table className="w-full text-left text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5">স্টাফ</th><th className="p-2.5">সক্রিয় লিড</th>
                  <th className="p-2.5">Today&apos;s Follow-ups</th><th className="p-2.5">সম্পন্ন ফলো-আপ</th>
                  <th className="p-2.5">ওভারডিউ</th>
                </tr></thead>
                <tbody>
                  {(board?.staffPerformance || []).map((s: any) => (
                    <tr key={s.staffId} className="border-b border-slate-100">
                      <td className="p-2.5 font-bold">{s.staffName}</td>
                      <td className="p-2.5">{s.activeLeads}</td>
                      <td className="p-2.5 text-amber-600 font-semibold">{s.todaysFollowUps}</td>
                      <td className="p-2.5">{s.totalFollowUps}</td>
                      <td className="p-2.5 text-rose-600 font-bold">{s.overdueFollowUps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MiniList title="কখনো ফলো-আপ হয়নি" rows={(board?.neverFollowedUp || []).map((r: any) => `${r.clientName} (${r.leadCode})`)} />
              <MiniList title="একাধিক ফলো-আপ" rows={(board?.multipleFollowUps || []).map((r: any) => `${r.clientName} — ${r.totalFollowUps} follow-ups`)} />
              <MiniList title="কোনো সাড়া নেই" rows={(board?.noResponseLeads || []).map((r: any) => `${r.clientName} — ${r.totalFollowUps} attempt(s)`)} />
              <MiniList title="ক্লায়েন্টের সাড়ার অপেক্ষা" rows={(board?.awaitingClientResponse || []).map((r: any) => `${r.clientName} — ${r.lastOutcome}`)} />
              <MiniList title="পরবর্তী ফলো-আপ নির্ধারিত নয়" rows={(board?.noNextFollowUp || []).map((r: any) => `${r.clientName} (${r.status})`)} />
              <MiniList title="স্থগিত লিড" rows={allLeads.filter((l) => l.status === "On Hold").map((l) => `${l.name} (${l.leadCode})`)} />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-2.5">ক্লায়েন্ট</th><th className="p-2.5">ফোন</th>
                <th className="p-2.5">সার্ভিস / প্রপার্টি</th><th className="p-2.5">দায়িত্বপ্রাপ্ত স্টাফ</th>
                <th className="p-2.5">শেষ ফলো-আপ</th><th className="p-2.5">পরবর্তী ফলো-আপ</th>
                <th className="p-2.5">গ্রুপ</th><th className="p-2.5">অগ্রাধিকার</th>
                <th className="p-2.5">ফলো-আপ</th><th className="p-2.5">অ্যাকশন</th>
              </tr></thead>
              <tbody>
                {(boardTab === "Today" ? board?.today || [] : boardTab === "Overdue" ? board?.overdue || [] : upcoming).map(boardRow)}
                {((boardTab === "Today" ? board?.today : boardTab === "Overdue" ? board?.overdue : upcoming) || []).length === 0 && (
                  <tr><td colSpan={10} className="p-4 text-center text-slate-400">এই তালিকায় লিড নেই।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEAD LIST + FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-end gap-2">
            <span className="text-xs font-bold text-slate-700 mr-1">Filters:</span>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
              <option value="All">সকল সোর্স</option>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
              <option value="All">সকল স্ট্যাটাস</option>{LEAD_STATUSES_FULL.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
              <option value="All">সকল অগ্রাধিকার</option>{LEAD_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {activeTab !== "ALL" && (
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
                <option value="All">All {activeTab === "IREL" ? "Property Types" : "Services"}</option>
                {(activeTab === "IREL" ? IREL_PROPERTY_TYPES : IBDC_SERVICES).map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
            <button type="button" onClick={() => { setFilterSource("All"); setFilterStatus("All"); setFilterPriority("All"); setFilterCategory("All"); }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold">Reset</button>
          </div>

          {filteredLeads.map((l) => {
            const isIREL = (l.companyId || "IBDC") === "IREL";
            const fus = fuByLead.get(l.id) || [];
            const last = fus[fus.length - 1];
            const pStyle = priorityStyle(l.priority || "Warm");
            const PIcon = pStyle.Icon;
            const bucket = board ? (board.today.find((r: any) => r.leadId === l.id) ? "Today"
              : board.overdue.find((r: any) => r.leadId === l.id) ? "Overdue" : "") : "";
            const daysSince = l.lastContactDate ? daysBetween(l.lastContactDate, today) : null;
            return (
              <div key={l.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{l.leadCode}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isIREL ? "bg-indigo-100 text-indigo-800 border-indigo-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"}`}>
                        {isIREL ? "REAL ESTATE" : "BUILDING DESIGN"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle(l.status)}`}>
                        {l.status === "Follow-up" ? "Follow-up Required" : l.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{l.name}</h3>
                    <p className="text-[11px] text-slate-500">{l.phone} • {l.location || l.preferredLocation || "—"}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {isIREL
                        ? <>Property: <strong className="text-indigo-700">{l.propertyType}</strong>{l.projectName ? ` • Project: ${l.projectName}` : ""}{l.size ? ` • ${l.size}` : ""}{l.purpose ? ` • ${l.purpose}` : ""}</>
                        : <>Service: <strong className="text-emerald-700">{l.service}</strong>{l.landSize ? ` • ${l.landSize}` : ""}</>}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${pStyle.cls}`}>
                      <PIcon className="w-3 h-3" /> {l.priority || "Warm"}
                    </span>
                    <p className="text-[11px] text-slate-500">শেষ যোগাযোগ: <strong>{fmtDate(l.lastContactDate)}</strong></p>
                    <p className="text-[11px]">
                      Next: <strong>{fmtDate(l.nextFollowUpDate)}</strong>{" "}
                      {bucket === "Today" && <span className="text-amber-600 font-bold">🔴 TODAY</span>}
                      {bucket === "Overdue" && (
                        <span className="text-rose-600 font-bold">
                          🔴 {daysBetween(l.nextFollowUpDate, today)}d Overdue
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Total Follow-ups: <strong>{fus.length}</strong>
                      {daysSince !== null && ` • ${daysSince}d since contact`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {!["Won", "Lost", "On Hold"].includes(l.status) && (
                    <button type="button" onClick={() => openFollowUpModal(l.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                      + Add Follow-up
                    </button>
                  )}
                  <button type="button" onClick={() => setOpenLeadId(l.id === openLeadId ? null : l.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold">
                    {l.id === openLeadId ? "টাইমলাইন লুকান" : `Timeline (${fus.length})`}
                  </button>
                  {l.status !== "On Hold" && l.status !== "Won" && l.status !== "Lost" && (
                    <button type="button" onClick={() => onMutate({ action: "updateLeadStatus", leadId: l.id, status: "On Hold" })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">স্থগিত রাখুন</button>
                  )}
                  {l.status === "On Hold" && (
                    <button type="button" onClick={() => onMutate({ action: "updateLeadStatus", leadId: l.id, status: "Follow-up" })}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">ফলো-আপ চালু করুন</button>
                  )}
                  {l.status !== "Won" && (
                    <button type="button" onClick={() => onMutate({ action: "convertLeadToClient", leadId: l.id })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">রূপান্তর →</button>
                  )}
                  {last && <span className="text-[11px] text-slate-500 ml-auto">শেষ ফলাফল: <strong>{last.outcome}</strong> via {last.contactMethod}</span>}
                </div>

                {/* TIMELINE */}
                {l.id === openLeadId && (
                  <div className="border-l-2 border-emerald-500 pl-4 ml-1 space-y-3 py-2">
                    <div className="text-[11px]">
                      <span className="font-bold text-slate-800">লিড তৈরি</span>
                      <span className="text-slate-500"> — {new Date(l.createdAt).toLocaleDateString("en-GB")} • {l.source}</span>
                    </div>
                    {fus.map((f) => (
                      <div key={f.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">Follow-up #{f.followUpNumber}</span>
                            <span className="font-mono text-slate-500">{f.date} {f.time}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{f.contactMethod}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{f.outcome}</span>
                            {f.attachmentName && (
                              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">📎 {f.attachmentName}</span>
                            )}
                          </div>
                          <p className="text-slate-700"><strong>Staff:</strong> {f.staffName}</p>
                          {f.clientResponse && <p className="text-slate-700"><strong>ক্লায়েন্টের সাড়া:</strong> {f.clientResponse}</p>}
                          <p className="text-slate-700"><strong>Note:</strong> {f.discussion}</p>
                          <p className="text-slate-500">
                            <strong>পরবর্তী ফলো-আপ:</strong>{" "}
                            {f.nextFollowUpDate ? `${f.nextFollowUpDate} ${f.nextFollowUpTime}` : "নেই (closed)"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {fus.length === 0 && <p className="text-[11px] text-slate-400">এখনো ফলো-আপ নেই।</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* NEW LEAD FORM */}
        <form onSubmit={handleCreateLead} className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> নতুন লিড নিন
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <label className={`px-2 py-2 rounded-xl border-2 cursor-pointer text-center text-[11px] font-bold ${formCompany === "IBDC" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-500"}`}>
              <input type="radio" className="hidden" checked={formCompany === "IBDC"} onChange={() => { setFormCompany("IBDC"); setService("RAJUK Plan Approval"); }} /> BUILDING DESIGN
            </label>
            <label className={`px-2 py-2 rounded-xl border-2 cursor-pointer text-center text-[11px] font-bold ${formCompany === "IREL" ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-500"}`}>
              <input type="radio" className="hidden" checked={formCompany === "IREL"} onChange={() => { setFormCompany("IREL"); setPropertyType("Flat"); }} /> REAL ESTATE
            </label>
          </div>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="ক্লায়েন্টের নাম *" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          <input type="text" required value={phone} onChange={(e) => { setPhone(e.target.value); setWhatsapp(e.target.value); }} placeholder="ফোন / WhatsApp *" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          {formCompany === "IBDC" ? (
            <>
              <select value={service} onChange={(e) => setService(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-medium">
                {IBDC_SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={landSize} onChange={(e) => setLandSize(e.target.value)} placeholder="জমির পরিমাণ" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={roadWidth} onChange={(e) => setRoadWidth(e.target.value)} placeholder="রাস্তার প্রস্থ" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
              <input type="text" value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder="ডিজাইন চাহিদা" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </>
          ) : (
            <>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-50/40 text-xs font-medium">
                {IREL_PROPERTY_TYPES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project (Salsabil)" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={unitFlatShop} onChange={(e) => setUnitFlatShop(e.target.value)} placeholder="Unit/Flat/Shop" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} placeholder="পছন্দের লোকেশন" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className="px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
                <input type="text" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="Bed" className="px-2 py-2 rounded-xl border border-slate-300 text-xs" />
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-xs">
                  <option>Own Use</option><option>Investment</option>
                </select>
              </div>
              <input type="date" value={expectedPurchaseDate} onChange={(e) => setExpectedPurchaseDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              <input type="text" value={clientRequirement} onChange={(e) => setClientRequirement(e.target.value)} placeholder="ক্লায়েন্টের চাহিদা" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </>
          )}
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs">
              {LEAD_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <select value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
            <option value="">অনির্ধারিত</option>
            {(data.allEmployeesDirectory || []).map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button type="submit" className={`w-full py-2.5 rounded-xl text-white font-semibold text-xs ${formCompany === "IREL" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
            Save Lead (next follow-up defaults to today)
          </button>
        </form>
      </div>

      {/* QUICK FOLLOW-UP MODAL */}
      {fuLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center p-3 overflow-y-auto">
          <form onSubmit={saveFollowUp} className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">ফলো-আপ — {fuLead.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {fuLead.leadCode} • Existing follow-ups: <strong>{(fuByLead.get(fuLead.id) || []).length}</strong>
                  {" • "}Next one will be #{(fuByLead.get(fuLead.id) || []).length + 1}
                </p>
              </div>
              <button type="button" onClick={() => setFuLeadId(null)} className="text-slate-400 hover:text-slate-800 text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">যোগাযোগের মাধ্যম *</label>
                <select value={fuMethod} onChange={(e) => setFuMethod(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  {FU_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">ফলাফল *</label>
                <select value={fuOutcome} onChange={(e) => setFuOutcome(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  {FU_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {fuOutcome === "No Response" && (
              <p className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2">
                Lead stays active. Schedule another follow-up below — it will NOT be marked Lost.
              </p>
            )}
            {fuOutcome === "Call Back Later" && (
              <p className="text-[11px] bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-2">
                Client asked to call later — পরবর্তী ফলো-আপ Date is mandatory below.
              </p>
            )}
            {closedOutcome && (
              <p className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2">
                This closes the lead. পরবর্তী ফলো-আপ will be cleared.
              </p>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ক্লায়েন্টের সাড়া</label>
              <input type="text" value={fuClientResponse} onChange={(e) => setFuClientResponse(e.target.value)}
                placeholder="e.g. ক্লায়েন্ট ব্যস্ত বলেছেন / Client wants quotation" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">স্টাফ নোট *</label>
              <textarea required rows={2} value={fuNote} onChange={(e) => setFuNote(e.target.value)}
                placeholder="Called client, no answer..." className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  পরবর্তী ফলো-আপ Date {!closedOutcome && fuLead.status !== "On Hold" ? "*" : "(optional)"}
                </label>
                <input type="date" required={!closedOutcome && fuLead.status !== "On Hold"} value={fuNextDate}
                  onChange={(e) => setFuNextDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">পরবর্তী ফলো-আপ Time</label>
                <input type="time" value={fuNextTime} onChange={(e) => setFuNextTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">সংযুক্তি / প্রমাণ</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return setFuAttachment(null);
                    setFuAttachment({ name: f.name, type: f.type || "File", size: `${Math.max(1, Math.round(f.size / 1024))} KB`, url: `#fu-${encodeURIComponent(f.name)}` });
                  }}
                  className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">লিড স্ট্যাটাস আপডেট</label>
                <select value={fuNewStatus} onChange={(e) => setFuNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs">
                  <option value="">Auto (from outcome)</option>
                  {LEAD_STATUSES_FULL.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              ফলো-আপ সেভ
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MiniList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4">
      <h4 className="text-xs font-bold text-slate-800 mb-2">{title} ({rows.length})</h4>
      {rows.length === 0 ? (
        <p className="text-[11px] text-slate-400">নেই</p>
      ) : (
        <ul className="space-y-1 text-[11px] text-slate-700">
          {rows.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      )}
    </div>
  );
}
