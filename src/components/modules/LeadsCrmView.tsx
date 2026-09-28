"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Building2,
  Home,
  Layers,
  Flame,
  TrendingUp,
  PhoneCall,
  Target,
  XCircle,
  CheckCircle2,
  MapPin,
  Wallet,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";
import {
  COMPANY_IBDC,
  COMPANY_IREL,
  IBDC_SERVICE_TYPES,
  IREL_PROPERTY_TYPES,
  IREL_PURPOSES,
  LEAD_SOURCES,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  getBudgetRangeLabel,
} from "@/lib/crm-constants";
import {
  FollowUpStatsBand,
  FollowUpQueues,
  AddFollowUpModal,
  FollowUpTimeline,
  ManagementFollowUpView,
} from "./FollowUpCenter";

 

function countBy(rows: any[], key: (r: any) => string) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const k = key(r) || "উল্লেখ নেই";
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function DistributionPanel({
  title,
  rows,
  total,
  accent = "emerald",
  icon: Icon,
}: {
  title: string;
  rows: Array<[string, number]>;
  total: number;
  accent?: "emerald" | "blue" | "amber" | "purple";
  icon?: React.ElementType;
}) {
  const barColor =
    accent === "blue"
      ? "bg-blue-500"
      : accent === "amber"
      ? "bg-amber-500"
      : accent === "purple"
      ? "bg-purple-500"
      : "bg-emerald-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">এই ক্যাটাগরিতে এখনও কোনো লিড নেই।</p>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {rows.map(([label, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 truncate pr-2">
                    {label}
                  </span>
                  <span className="font-bold text-slate-900 shrink-0">
                    {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KpiRow({ leads, accent }: { leads: any[]; accent: string }) {
  const total = leads.length;
  const active = leads.filter(
    (l) => l.status !== "Won" && l.status !== "Lost"
  ).length;
  const converted = leads.filter((l) => l.status === "Won").length;
  const lost = leads.filter((l) => l.status === "Lost").length;
  const hot = leads.filter((l) => l.priority === "Hot").length;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0";

  const cards = [
    { label: "মোট লিড", value: total, cls: "text-slate-900", icon: Layers },
    { label: "সক্রিয় ফলো-আপ", value: active, cls: "text-amber-600", icon: PhoneCall },
    { label: "সফল সমাপ্তি (Won)", value: converted, cls: "text-emerald-600", icon: CheckCircle2 },
    { label: "বাতিল লিড (Lost)", value: lost, cls: "text-rose-600", icon: XCircle },
    { label: "জরুরি লিড (Hot)", value: hot, cls: "text-orange-600", icon: Flame },
    {
      label: "রূপান্তর হার %",
      value: `${conversionRate}%`,
      cls: accent === "blue" ? "text-blue-600" : "text-emerald-600",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500 font-medium">{c.label}</p>
              <Icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className={`text-2xl font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        );
      })}
    </div>
  );
}

export function LeadsCrmView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];
  const companies: any[] = data.companies || [];
  const ibdc = companies.find((c) => c.code === COMPANY_IBDC);
  const irel = companies.find((c) => c.code === COMPANY_IREL);

  const [tab, setTab] = useState<"IBDC" | "IREL" | "ALL">("IBDC");

  // ---------------- Shared lead form state ----------------
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [source, setSource] = useState("Referral");
  const [priority, setPriority] = useState("Hot");
  const [status, setStatus] = useState("New");
  const [budget, setBudget] = useState("");
  const [requirement, setRequirement] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(today);
  const [formCompanyCode, setFormCompanyCode] = useState<"IBDC" | "IREL">("IBDC");

  // IBDC-only fields
  const [service, setService] = useState("RAJUK Plan Approval");
  const [location, setLocation] = useState("");
  const [landSize, setLandSize] = useState("5 Katha");
  const [roadWidth, setRoadWidth] = useState("25 ft");

  // IREL-only fields
  const [propertyType, setPropertyType] = useState("Flat");
  const [projectName, setProjectName] = useState("");
  const [unitNo, setUnitNo] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [propertySize, setPropertySize] = useState("");
  const [floor, setFloor] = useState("");
  const [bedrooms, setBedrooms] = useState("3 Bed");
  const [purpose, setPurpose] = useState("Own Use");
  const [expectedPurchaseDate, setExpectedPurchaseDate] = useState("");

  // Follow-up state
  const [activeLeadId, setActiveLeadId] = useState<number | null>(null);
  const [followUpModalLead, setFollowUpModalLead] = useState<any | null>(null);
  const [showManagementView, setShowManagementView] = useState(false);

  const rawLeads = data.leads;
  const allLeads: any[] = useMemo(() => rawLeads || [], [rawLeads]);

  const ibdcLeads = useMemo(
    () => allLeads.filter((l) => l.companyId === ibdc?.id),
    [allLeads, ibdc]
  );
  const irelLeads = useMemo(
    () => allLeads.filter((l) => l.companyId === irel?.id),
    [allLeads, irel]
  );

  const visibleLeads =
    tab === "IBDC" ? ibdcLeads : tab === "IREL" ? irelLeads : allLeads;

  // Staff directory for queue tables
  const staffMap = useMemo(() => {
    const m = new Map<number, any>();
    (data.allEmployeesDirectory || []).forEach((e: any) => m.set(e.id, e));
    return m;
  }, [data.allEmployeesDirectory]);

  const role = data.currentUser?.role;
  const canSeeManagementView =
    role === "Owner" || role === "MD" || role === "Admin" || role === "Manager";

  // Follow-up stats recalculated for the active business-unit tab
  const scopedFollowUpStats = useMemo(() => {
    const src = visibleLeads;
    const todayIso = today;
    const followupsToday = (data.leadFollowups || []).filter(
      (f: any) =>
        f.date === todayIso && src.some((l: any) => l.id === f.leadId)
    ).length;

    return {
      today: todayIso,
      dueToday: src.filter((l: any) => l.isDueToday).length,
      overdue: src.filter((l: any) => l.isOverdue).length,
      upcoming: src.filter((l: any) => l.followUpBucket === "Upcoming").length,
      completedToday: followupsToday,
      withoutNextFollowUp: src.filter(
        (l: any) => l.followUpBucket === "Unscheduled"
      ).length,
      noResponse: src.filter((l: any) => l.lastOutcome === "No Response").length,
      activeLeads: src.filter(
        (l: any) => l.status !== "Won" && l.status !== "Lost" && l.status !== "On Hold"
      ).length,
    };
  }, [visibleLeads, data.leadFollowups, today]);

  // Keep the form's business unit synced with the active tab
  const effectiveFormCompany: "IBDC" | "IREL" =
    tab === "ALL" ? formCompanyCode : tab;
  const isIbdcForm = effectiveFormCompany === "IBDC";

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    const targetCompany = isIbdcForm ? ibdc : irel;
    if (!targetCompany) return;

    const payload: Record<string, unknown> = {
      action: "createLead",
      companyId: targetCompany.id,
      name,
      phone,
      whatsapp: whatsapp || phone,
      source,
      priority,
      status,
      requirement,
      budget: Number(budget || 0),
      nextFollowUpDate,
    };

    if (isIbdcForm) {
      Object.assign(payload, {
        service,
        location,
        landSize,
        roadWidth,
      });
    } else {
      Object.assign(payload, {
        propertyType,
        projectName,
        unitNo,
        preferredLocation,
        location: preferredLocation,
        propertySize,
        floor,
        bedrooms,
        purpose,
        expectedPurchaseDate,
      });
    }

    const res = await onMutate(payload);
    if (res?.success) {
      setName("");
      setPhone("");
      setWhatsapp("");
      setBudget("");
      setRequirement("");
      setProjectName("");
      setUnitNo("");
      setPreferredLocation("");
      setPropertySize("");
      setFloor("");
      setLocation("");
    }
  }

  const activeLead = allLeads.find((l) => l.id === activeLeadId);
  const leadHistory = (data.leadFollowups || []).filter(
    (f: any) => f.leadId === activeLeadId
  );

  const companyOf = (l: any) =>
    l.companyId === irel?.id ? irel : ibdc;

  return (
    <div className="space-y-6">
      {/* ---------------- HEADER + BUSINESS UNIT TABS ---------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              লিড ব্যবস্থাপনা ও সিআরএম (Leads &amp; CRM)
            </h1>
            <p className="text-xs text-slate-500">
              উভয় প্রতিষ্ঠানের জন্য আলাদা ডাটাবেজ, ক্যাটাগরি, ড্যাশবোর্ড এবং ফিল্টারিং ব্যবস্থা
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                exportToCSV(
                  tab === "IBDC"
                    ? "INSAF_BuildingDesign_Leads"
                    : tab === "IREL"
                    ? "INSAF_RealEstate_Leads"
                    : "INSAF_All_Leads",
                  visibleLeads
                )
              }
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              CSV এক্সপোর্ট
            </button>
            <button
              type="button"
              onClick={() =>
                exportToPDFPrint(
                  tab === "IBDC"
                    ? "INSAF BUILDING DESIGN & CONSULTANT LTD. — লিড রিপোর্ট"
                    : tab === "IREL"
                    ? "INSAF REAL ESTATE LTD. — প্রপার্টি লিড রিপোর্ট"
                    : "INSAF GROUP — সকল লিডের সমন্বিত রিপোর্ট",
                  `তারিখ: ${today}`,
                  visibleLeads
                )
              }
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              PDF এক্সপোর্ট
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row">
          <button
            type="button"
            onClick={() => setTab("IBDC")}
            className={`flex-1 px-5 py-4 text-left border-b-4 transition ${
              tab === "IBDC"
                ? "border-emerald-500 bg-emerald-50/60"
                : "border-transparent hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2
                className={`w-4 h-4 ${
                  tab === "IBDC" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ট্যাব ১ • প্রতিষ্ঠান ১
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1 font-sans">
              INSAF BUILDING DESIGN &amp; CONSULTANT LTD.
            </p>
            <p className="text-[11px] text-slate-500">
              ডিজাইন, রাজউক অনুমোদন ও ইঞ্জিনিয়ারিং সেবা • {ibdcLeads.length} টি লিড
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab("IREL")}
            className={`flex-1 px-5 py-4 text-left border-b-4 transition ${
              tab === "IREL"
                ? "border-blue-500 bg-blue-50/60"
                : "border-transparent hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Home
                className={`w-4 h-4 ${
                  tab === "IREL" ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ট্যাব ২ • প্রতিষ্ঠান ২
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1 font-sans">
              INSAF REAL ESTATE LTD.
            </p>
            <p className="text-[11px] text-slate-500">
              ফ্ল্যাট, দোকান, প্লট ও প্রপার্টি সেলস অনুসন্ধান • {irelLeads.length} টি লিড
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab("ALL")}
            className={`flex-1 px-5 py-4 text-left border-b-4 transition ${
              tab === "ALL"
                ? "border-slate-900 bg-slate-50"
                : "border-transparent hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers
                className={`w-4 h-4 ${
                  tab === "ALL" ? "text-slate-900" : "text-slate-400"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ট্যাব ৩
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1">সকল লিড (ALL LEADS)</p>
            <p className="text-[11px] text-slate-500">
              গ্রুপের সমন্বিত সার্বিক পরিসংখ্যান • {allLeads.length} টি লিড
            </p>
          </button>
        </div>
      </div>

      {/* ---------------- FOLLOW-UP COMMAND CENTER (scoped to active tab) ---------------- */}
      <FollowUpStatsBand
        stats={scopedFollowUpStats}
        onRunReminders={() => onMutate({ action: "runFollowUpReminders" })}
        onJump={(bucket) => {
          const el = document.getElementById(`queue-${bucket}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <FollowUpQueues
        leads={visibleLeads}
        staffMap={staffMap}
        onFollowUpNow={(lead) => setFollowUpModalLead(lead)}
        onOpenLead={(lead) => setActiveLeadId(lead.id)}
      />

      {/* ---------------- MANAGEMENT VIEW (RBAC-gated) ---------------- */}
      {canSeeManagementView && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowManagementView(!showManagementView)}
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition shadow-sm"
          >
            <span>
              ম্যানেজমেন্ট ফলো-আপ নিরীক্ষা — ফলো-আপহীন, একাধিকবার ফলো-আপকৃত, সাড়া না পাওয়া এবং কর্মকর্তাদের কার্যক্ষমতা
            </span>
            <span>{showManagementView ? "▲ লুকান" : "▼ দেখুন"}</span>
          </button>
          {showManagementView && (
            <ManagementFollowUpView
              leads={visibleLeads}
              staffStats={data.staffFollowUpStats || []}
              onOpenLead={(lead) => setActiveLeadId(lead.id)}
            />
          )}
        </div>
      )}

      {/* ---------------- TAB 1: BUILDING DESIGN DASHBOARD ---------------- */}
      {tab === "IBDC" && (
        <>
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-5 shadow-sm">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              প্রতিষ্ঠান ১ ড্যাশবোর্ড
            </span>
            <h2 className="text-lg font-bold mt-1 font-sans">
              INSAF BUILDING DESIGN &amp; CONSULTANT LTD. — সেবা বিশ্লেষণ
            </h2>
            <p className="text-xs text-emerald-200/80">
              আর্কিটেকচারাল, স্ট্রাকচারাল, রাজউক অনুমোদন, এস্টিমেটিং ও কনস্ট্রাকশন ম্যানেজমেন্ট সেবা
            </p>
          </div>

          <KpiRow leads={ibdcLeads} accent="emerald" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <DistributionPanel
              title="সেবা ভিত্তিক লিড"
              icon={Briefcase}
              rows={countBy(ibdcLeads, (l) => l.service)}
              total={ibdcLeads.length}
              accent="emerald"
            />
            <DistributionPanel
              title="সোর্স ভিত্তিক লিড"
              icon={Target}
              rows={countBy(ibdcLeads, (l) => l.source)}
              total={ibdcLeads.length}
              accent="emerald"
            />
            <DistributionPanel
              title="স্ট্যাটাস ও অগ্রাধিকার অনুযায়ী লিড"
              icon={Flame}
              rows={[
                ...countBy(ibdcLeads, (l) => `স্ট্যাটাস: ${l.status}`),
                ...countBy(ibdcLeads, (l) => `অগ্রাধিকার: ${l.priority}`),
              ]}
              total={ibdcLeads.length}
              accent="amber"
            />
          </div>
        </>
      )}

      {/* ---------------- TAB 2: REAL ESTATE DASHBOARD ---------------- */}
      {tab === "IREL" && (
        <>
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-5 shadow-sm">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              প্রতিষ্ঠান ২ ড্যাশবোর্ড
            </span>
            <h2 className="text-lg font-bold mt-1 font-sans">
              INSAF REAL ESTATE LTD. — প্রপার্টি লিড বিশ্লেষণ
            </h2>
            <p className="text-xs text-blue-200/80">
              ফ্ল্যাট, দোকান, অফিস স্পেস, বাণিজ্যিক স্পেস, এপার্টমেন্ট, প্লট ও প্রজেক্ট অনুসন্ধান
            </p>
          </div>

          <KpiRow leads={irelLeads} accent="blue" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <DistributionPanel
              title="প্রপার্টির ধরন ভিত্তিক লিড"
              icon={Home}
              rows={countBy(irelLeads, (l) => l.propertyType)}
              total={irelLeads.length}
              accent="blue"
            />
            <DistributionPanel
              title="সোর্স ভিত্তিক লিড"
              icon={Target}
              rows={countBy(irelLeads, (l) => l.source)}
              total={irelLeads.length}
              accent="blue"
            />
            <DistributionPanel
              title="প্রজেক্ট ভিত্তিক লিড"
              icon={Building2}
              rows={countBy(irelLeads, (l) => l.projectName)}
              total={irelLeads.length}
              accent="purple"
            />
            <DistributionPanel
              title="পছন্দনীয় এলাকা ভিত্তিক লিড"
              icon={MapPin}
              rows={countBy(irelLeads, (l) => l.preferredLocation || l.location)}
              total={irelLeads.length}
              accent="blue"
            />
            <DistributionPanel
              title="বাজেট সীমা ভিত্তিক লিড"
              icon={Wallet}
              rows={countBy(irelLeads, (l) => getBudgetRangeLabel(Number(l.budget || 0)))}
              total={irelLeads.length}
              accent="emerald"
            />
            <DistributionPanel
              title="ক্রয়ের উদ্দেশ্য ও ফলো-আপ স্ট্যাটাস"
              icon={Flame}
              rows={[
                ...countBy(irelLeads, (l) => `উদ্দেশ্য: ${l.purpose}`),
                ...countBy(irelLeads, (l) => `স্ট্যাটাস: ${l.status}`),
              ]}
              total={irelLeads.length}
              accent="amber"
            />
          </div>
        </>
      )}

      {/* ---------------- TAB 3: ALL LEADS (COMBINED, IDENTITY VISIBLE) ---------------- */}
      {tab === "ALL" && (
        <>
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
              গ্রুপের সমন্বিত চিত্র
            </span>
            <h2 className="text-lg font-bold mt-1">
              ইনসাফ গ্রুপ — উভয় প্রতিষ্ঠানের সমন্বিত লিড তালিকা
            </h2>
            <p className="text-xs text-slate-300">
              প্রতিটি লিডে প্রতিষ্ঠানের পরিচয় স্পষ্টভাবে চিহ্নিত রয়েছে এবং উভয় প্রতিষ্ঠানের তথ্য পৃথক ডাটাবেজে সংরক্ষিত।
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border-l-4 border-emerald-500 border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  INSAF BUILDING DESIGN &amp; CONSULTANT LTD.
                </h3>
              </div>
              <KpiRow leads={ibdcLeads} accent="emerald" />
            </div>
            <div className="bg-white rounded-3xl border-l-4 border-blue-500 border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  INSAF REAL ESTATE LTD.
                </h3>
              </div>
              <KpiRow leads={irelLeads} accent="blue" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <DistributionPanel
              title="প্রতিষ্ঠান ভিত্তিক লিড বণ্টন"
              icon={Layers}
              rows={countBy(allLeads, (l) =>
                l.companyId === irel?.id
                  ? "INSAF REAL ESTATE LTD."
                  : "INSAF BUILDING DESIGN & CONSULTANT LTD."
              )}
              total={allLeads.length}
              accent="purple"
            />
            <DistributionPanel
              title="সোর্স ভিত্তিক লিড বণ্টন"
              icon={Target}
              rows={countBy(allLeads, (l) => l.source)}
              total={allLeads.length}
              accent="emerald"
            />
            <DistributionPanel
              title="স্ট্যাটাস ভিত্তিক লিড বণ্টন"
              icon={TrendingUp}
              rows={countBy(allLeads, (l) => l.status)}
              total={allLeads.length}
              accent="amber"
            />
          </div>
        </>
      )}

      {/* ---------------- DYNAMIC LEAD CAPTURE FORM + LEAD LIST ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateLead}
          className={`lg:col-span-4 bg-white p-5 rounded-3xl border-t-4 space-y-3.5 h-fit shadow-xs ${
            isIbdcForm
              ? "border-t-emerald-500 border border-slate-200"
              : "border-t-blue-500 border border-slate-200"
          }`}
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plus className={`w-4 h-4 ${isIbdcForm ? "text-emerald-600" : "text-blue-600"}`} />
            নতুন {isIbdcForm ? "বিল্ডিং ডিজাইন" : "রিয়েল এস্টেট"} লিড যোগ করুন
          </h2>

          {/* Business Unit selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              প্রতিষ্ঠান / বিজনেস ইউনিট *
            </label>
            <select
              value={effectiveFormCompany}
              onChange={(e) => {
                const v = e.target.value as "IBDC" | "IREL";
                setFormCompanyCode(v);
                if (tab !== "ALL") setTab(v);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <option value="IBDC">INSAF BUILDING DESIGN &amp; CONSULTANT LTD.</option>
              <option value="IREL">INSAF REAL ESTATE LTD.</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              {isIbdcForm
                ? "বিল্ডিং ডিজাইন সেবা প্রদর্শিত হচ্ছে (প্রপার্টি ফিল্ড লুকায়িত)।"
                : "রিয়েল এস্টেট প্রপার্টি ফিল্ড প্রদর্শিত হচ্ছে (ডিজাইন সেবা লুকায়িত)।"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                গ্রাহকের নাম *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isIbdcForm ? "যেমন: মোঃ রহিম" : "যেমন: করিম মিয়া"}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ফোন নম্বর *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setWhatsapp(e.target.value);
                }}
                placeholder="01712-XXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          {/* ========== DYNAMIC CATEGORY DROPDOWN ========== */}
          {isIbdcForm ? (
            <div>
              <label className="block text-xs font-semibold text-emerald-700 mb-1">
                সেবার ধরন * (বিল্ডিং ডিজাইন)
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-medium"
              >
                {IBDC_SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">
                আগ্রহী প্রপার্টি / প্রপার্টির ধরন * (রিয়েল এস্টেট)
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-blue-300 bg-blue-50/40 text-xs font-medium"
              >
                {IREL_PROPERTY_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ========== IBDC-ONLY FIELDS ========== */}
          {isIbdcForm && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্লট / সাইটের অবস্থান
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="মিরপুর ডিওএইচএস, রোড ১২, ঢাকা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    জমির পরিমাপ
                  </label>
                  <input
                    type="text"
                    value={landSize}
                    onChange={(e) => setLandSize(e.target.value)}
                    placeholder="৫ কাঠা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    রাস্তার প্রশস্ততা
                  </label>
                  <input
                    type="text"
                    value={roadWidth}
                    onChange={(e) => setRoadWidth(e.target.value)}
                    placeholder="২৫ ফুট"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* ========== IREL-ONLY FIELDS ========== */}
          {!isIbdcForm && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    প্রজেক্টের নাম
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="সালসাবিল / ভাই ভাই টাওয়ার"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ইউনিট / ফ্ল্যাট / দোকান
                  </label>
                  <input
                    type="text"
                    value={unitNo}
                    onChange={(e) => setUnitNo(e.target.value)}
                    placeholder="ফ্ল্যাট বি-৪ / দোকান জি-১২"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  পছন্দনীয় এলাকা / লোকেশন
                </label>
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  placeholder="বসুন্ধরা আ/এ, ব্লক-সি"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    আয়তন
                  </label>
                  <input
                    type="text"
                    value={propertySize}
                    onChange={(e) => setPropertySize(e.target.value)}
                    placeholder="১৬৫০ ব.ফু."
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    তলা / ফ্লোর
                  </label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="৪র্থ"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    বেডরুম
                  </label>
                  <input
                    type="text"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="৩ বেড"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    উদ্দেশ্য
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    {IREL_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p === "Own Use" ? "নিজস্ব ব্যবহার" : p === "Investment" ? "বিনিয়োগ" : p === "Resale" ? "পুনর্বিক্রয়" : "ভাড়া আয়"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    সম্ভাব্য ক্রয়ের সময়
                  </label>
                  <input
                    type="date"
                    value={expectedPurchaseDate}
                    onChange={(e) => setExpectedPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* ========== SHARED FIELDS ========== */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                উৎস
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                অগ্রাধিকার
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === "Hot" ? "জরুরি (Hot)" : p === "Cold" ? "ধীর (Cold)" : "মধ্যম (Warm)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                স্ট্যাটাস
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                বাজেট (৳)
              </label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={isIbdcForm ? "৪৫০,০০০" : "৮,০০০,০০০"}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                পরবর্তী ফলো-আপ
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              গ্রাহকের বিস্তারিত চাহিদা
            </label>
            <textarea
              rows={2}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder={
                isIbdcForm
                  ? "৬ তলা আবাসিক ভবনের রাজউক প্ল্যান অনুমোদন এবং সয়েল টেস্ট..."
                  : "দক্ষিণমুখী ৩ বেডরুমের ফ্ল্যাট, সাথে পার্কিং সুবিধা..."
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-2xl text-white font-bold text-xs transition shadow-sm ${
              isIbdcForm
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            লিড সংরক্ষণ করুন ({isIbdcForm ? "BDL-XXXX" : "REL-XXXX"})
          </button>
        </form>

        {/* ---------------- LEAD LIST (Bangla Cards) ---------------- */}
        <div className="lg:col-span-8 space-y-3">
          {visibleLeads.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                এই বিজনেস ইউনিটে এখনও কোনো লিড সংরক্ষিত নেই।
              </p>
              <p className="text-xs text-slate-500 mt-1">
                নতুন লিড যুক্ত করতে বাম পাশের ফর্মটি ব্যবহার করুন।
              </p>
            </div>
          )}

          {visibleLeads.map((l) => {
            const comp = companyOf(l);
            const isRealEstate = l.companyId === irel?.id;
            return (
              <div
                key={l.id}
                onClick={() => setActiveLeadId(l.id)}
                className={`bg-white rounded-3xl border p-4 cursor-pointer transition ${
                  activeLeadId === l.id
                    ? isRealEstate
                      ? "border-blue-500 ring-2 ring-blue-100 shadow-sm"
                      : "border-emerald-500 ring-2 ring-emerald-100 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                          isRealEstate
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {l.leadCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-sans ${
                          isRealEstate
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isRealEstate
                          ? "INSAF REAL ESTATE LTD."
                          : "INSAF BUILDING DESIGN & CONSULTANT LTD."}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          l.priority === "Hot"
                            ? "bg-orange-100 text-orange-700"
                            : l.priority === "Cold"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {l.priority === "Hot" ? "জরুরি" : l.priority === "Cold" ? "ধীর" : "মধ্যম"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-white">
                        {l.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-2">{l.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {l.phone} • সোর্স: {l.source} • পরবর্তী যোগাযোগ:{" "}
                      {l.nextFollowUpDate || "নির্ধারিত নেই"}
                    </p>

                    {/* Category line switches by business unit */}
                    {isRealEstate ? (
                      <p className="text-xs text-slate-700 mt-1.5">
                        <strong className="text-blue-700">
                          প্রপার্টি: {l.propertyType}
                        </strong>
                        {l.projectName && ` • প্রজেক্ট: ${l.projectName}`}
                        {l.unitNo && ` • ইউনিট: ${l.unitNo}`}
                        {l.propertySize && ` • আয়তন: ${l.propertySize}`}
                        {l.floor && ` • তলা: ${l.floor}`}
                        {l.bedrooms && ` • ${l.bedrooms}`}
                        {l.purpose && ` • উদ্দেশ্য: ${l.purpose}`}
                        {l.preferredLocation && ` • ${l.preferredLocation}`}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-700 mt-1.5">
                        <strong className="text-emerald-700">
                          সেবা: {l.service}
                        </strong>
                        {l.location && ` • অবস্থান: ${l.location}`}
                        {l.landSize && ` • জমি: ${l.landSize}`}
                        {l.roadWidth && ` • রাস্তা: ${l.roadWidth}`}
                      </p>
                    )}

                    {l.requirement && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">
                        &ldquo;{l.requirement}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      ৳{Number(l.budget || 0).toLocaleString()}
                    </p>
                    {isRealEstate && (
                      <p className="text-[10px] text-slate-500">
                        {getBudgetRangeLabel(Number(l.budget || 0))}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {comp?.shortName}
                    </p>
                  </div>
                </div>

                {/* 14. LEAD CARD FOLLOW-UP METRICS */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700">
                    শেষ যোগাযোগ: {l.lastContactDate || "কখনো নয়"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      l.isOverdue
                        ? "bg-rose-100 text-rose-700"
                        : l.isDueToday
                        ? "bg-emerald-100 text-emerald-700"
                        : l.followUpBucket === "Unscheduled"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    পরবর্তী ফলো-আপ: {l.nextFollowUpDate || "নির্ধারিত নেই"}
                    {l.isOverdue && ` 🔴 ${l.daysOverdue} দিন মেয়াদোত্তীর্ণ`}
                    {l.isDueToday && " 🔴 আজ"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-bold">
                    মোট ফলো-আপ: {l.followUpCount || 0} টি
                  </span>
                  {l.daysSinceLastContact !== null &&
                    l.daysSinceLastContact !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700">
                        {l.daysSinceLastContact} দিন পূর্বে
                      </span>
                    )}
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setFollowUpModalLead(l);
                    }}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs"
                  >
                    + ফলো-আপ যোগ করুন
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  {LEAD_PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onMutate({
                          action: "updateLeadStatusPriority",
                          leadId: l.id,
                          priority: p,
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        l.priority === p
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {p === "Hot" ? "জরুরি" : p === "Cold" ? "ধীর" : "মধ্যম"}
                    </button>
                  ))}
                  <span className="mx-1 text-slate-300">|</span>
                  {["Follow-up Required", "Qualified", "Quotation", "Won", "Lost"].map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onMutate({
                            action: "updateLeadStatusPriority",
                            leadId: l.id,
                            status: s,
                          });
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                          l.status === s
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    )
                  )}
                  {l.status !== "Won" && (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onMutate({ action: "convertLeadToClient", leadId: l.id });
                      }}
                      className="ml-auto px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      ক্লায়েন্টে রূপান্তর <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* -------- FOLLOW-UP TIMELINE (Lead 360 chronological history) -------- */}
          {activeLead && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs text-slate-500 font-sans">
                    {companyOf(activeLead)?.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      মোট ফলো-আপ: {activeLead.followUpCount || 0} টি
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      শেষ যোগাযোগ: {activeLead.lastContactDate || "কখনো নয়"}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      পরবর্তী তারিখ: {activeLead.nextFollowUpDate || "নির্ধারিত নেই"}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      যোগাযোগের ব্যবধান:{" "}
                      {activeLead.daysSinceLastContact === null ||
                      activeLead.daysSinceLastContact === undefined
                        ? "—"
                        : `${activeLead.daysSinceLastContact} দিন`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowUpModalLead(activeLead)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                >
                  + ফলো-আপ যোগ করুন
                </button>
              </div>

              <FollowUpTimeline lead={activeLead} history={leadHistory} />
            </div>
          )}
        </div>
      </div>

      {/* ---------------- QUICK ADD FOLLOW-UP MODAL ---------------- */}
      {followUpModalLead && (
        <AddFollowUpModal
          lead={
            allLeads.find((l) => l.id === followUpModalLead.id) || followUpModalLead
          }
          onClose={() => setFollowUpModalLead(null)}
          onSubmit={onMutate}
        />
      )}
    </div>
  );
}
