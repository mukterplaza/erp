"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Phone,
  Printer,
  FileSpreadsheet,
  Flame,
  Sun,
  Snowflake,
  Repeat,
  Search,
  Users,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Pencil,
  XCircle,
  Trash2,
  Undo2,
  Clock,
  CalendarDays,
  ListFilter,
  ArrowUpAZ,
  ArrowDownAZ,
  Check,
  Eraser,
} from "lucide-react";
import { exportToCSV as exportRecordsToCSV, exportToExcel, exportToPDFPrint as exportRecordsToPDFPrint } from "@/lib/export-utils";

// ============================================================================
// COMPANY / BUSINESS-UNIT DEFINITIONS
// ============================================================================
export const IBDC_SERVICES = [
  "Architectural Design",
  "Structural Design",
  "Electrical Design",
  "Plumbing Design",
  "Costing & Estimating",
  "Costing & Estimation",
  "RAJUK Approval",
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
  "WhatsApp",
  "Referral",
  "Website",
  "Google",
  "Direct",
  "Walk-in",
  "Instagram",
  "Existing Client",
  "Billboard",
  "Other",
] as const;

export const LEAD_PRIORITIES = ["Hot", "Warm", "Cold"] as const;
export const LEAD_PRIORITY_OPTIONS = ["Hot", "Warm", "Cold", "Lost"] as const;

const LEAD_STATUSES_FULL = [
  "New",
  "Contacted",
  "Follow-up",
  "Qualified",
  "Quotation",
  "Negotiating",
  "Won",
  "Lost",
  "On Hold",
  "Conversation Started",
  "Mid Stage",
  "Proposal Sent",
  "No Response",
] as const;

const COMPANIES = {
  IBDC: {
    id: "IBDC",
    label: "INSAF BUILDING DESIGN & CONSULTANT LTD.",
    short: "Insaf Building Design",
    categoryLabel: "Service Type",
    categories: IBDC_SERVICES,
  },
  IREL: {
    id: "IREL",
    label: "INSAF REAL ESTATE LTD.",
    short: "Insaf Real Estate",
    categoryLabel: "Property Interest",
    categories: IREL_PROPERTY_TYPES,
  },
} as const;

type CompanyTab = "IBDC" | "IREL" | "ALL";

// Undo করার সময় (১০ সেকেন্ড)
const UNDO_WINDOW_MS = 10000;

// ============================================================================
// PROVIDED LEADS (YOUR SHARED LEADS)
// ============================================================================
const PROVIDED_SAMPLE_LEADS = [
  {
    leadCode: "L-0001",
    leadDate: "2026-08-19",
    companyId: "IBDC",
    name: "Md. Abu Sayed",
    phone: "01753224744",
    whatsapp: "01753224744",
    location: "Mirpur",
    source: "Facebook",
    service: "RAJUK Plan Approval",
    priority: "Warm",
    status: "Mid Stage",
    requirement: "Rajuk plan pass দরকার কোটেশন দিতে হবে",
    insafResponse: "৭ তলা পাবে, কোটেশন দেওয়া হইছে",
    remarks: "",
    nextFollowUpDate: "2026-08-27",
    reminder1: "ফোনে কথা হয়েছে কোটেশন দেখে জানাবে",
    reminder2: "আপডেট জানার জন্য ম্যাসেজ করা হয়েছে",
    reminder3: "Extra date noted: 2026-09-07",
    budget: 0,
  },
  {
    leadCode: "L-0002",
    leadDate: "2026-08-19",
    companyId: "IBDC",
    name: "Evergreen Multi Source Limited",
    phone: "01302236363",
    whatsapp: "01302236363",
    location: "Romna",
    source: "Facebook",
    service: "RAJUK Plan Approval",
    priority: "Warm",
    status: "Conversation Started",
    requirement: "কত তলা পাবে জানতে চাইছে",
    insafResponse: "৪/৫ তলা",
    remarks:
      "তাদের জায়গা সরকারি গণপূর্ত মধ্যে পড়ছে, এখন তারা চাচ্ছে গণপূর্ত থেকে কিছু জায়গা পাবে সেটি নিয়ে দেওয়ার জন্য। আমরা বলেছি জমি উনি নিয়ে দিলে আমরা রাজউকের প্ল্যান করে দিতে পারবো। কেমন ইউনিট পাবে এই সব বিষয়ে কথা হয়েছে।",
    nextFollowUpDate: "",
    reminder1: "",
    reminder2: "",
    reminder3: "",
    budget: 0,
  },
  {
    leadCode: "L-0003",
    leadDate: "2026-08-19",
    companyId: "IBDC",
    name: "Nexora Structure Limited",
    phone: "01766913185",
    whatsapp: "01766913185",
    location: "",
    source: "Facebook",
    service: "RAJUK Plan Approval",
    priority: "Lost",
    status: "No Response",
    requirement: "12.80 শতাংশে ১০ তলা চায়",
    insafResponse: "পাবে না বলে দিয়েছি",
    remarks: "কত তলা জানানো হয়েছে",
    nextFollowUpDate: "",
    reminder1: "",
    reminder2: "",
    reminder3: "",
    budget: 0,
  },
  {
    leadCode: "L-0004",
    leadDate: "2026-08-19",
    companyId: "IBDC",
    name: "Sajib",
    phone: "01681392440",
    whatsapp: "01681392440",
    location: "Konapara",
    source: "Facebook",
    service: "RAJUK Plan Approval",
    priority: "Warm",
    status: "Proposal Sent",
    requirement: "Rajuk plan Design",
    insafResponse: "",
    remarks: "অফিসে এসে কোটেশন নিয়ে গিয়েছে",
    nextFollowUpDate: "2026-08-29",
    reminder1: "কল দিয়েছি পাইনি ভয়েস দিয়ে রাখছি",
    reminder2: "পরে কল দিবে",
    reminder3: "Extra date noted: 2026-09-07",
    budget: 0,
  },
];

// ============================================================================
// FOLLOW-UP CONSTANTS
// ============================================================================
const FU_METHODS = [
  "Phone Call",
  "WhatsApp",
  "Facebook",
  "SMS",
  "Email",
  "Meeting",
  "Office Visit",
  "Site Visit",
  "Other",
];

const FU_OUTCOMES = [
  "No Response",
  "Contacted",
  "Interested",
  "Qualified",
  "Need More Information",
  "Quotation Sent",
  "Negotiating",
  "Call Back Later",
  "Not Interested",
  "Won",
  "Lost",
  "Other",
];

const CLOSED_FU = ["Won", "Lost", "Not Interested"];

// ============================================================================
// HELPERS
// ============================================================================
function priorityStyle(p: string) {
  if (p === "Hot") {
    return {
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
      Icon: Flame,
    };
  }
  if (p === "Cold") {
    return {
      cls: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500",
      Icon: Snowflake,
    };
  }
  if (p === "Lost") {
    return {
      cls: "bg-slate-200 text-slate-800 border-slate-300",
      dot: "bg-rose-600",
      Icon: XCircle,
    };
  }
  return {
    cls: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    Icon: Sun,
  };
}

function statusStyle(s: string) {
  if (s === "Won" || s === "Converted") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "Lost") return "bg-rose-50 text-rose-700 border-rose-200";
  if (s === "No Response") return "bg-orange-50 text-orange-800 border-orange-200";
  if (s === "Mid Stage") return "bg-amber-50 text-amber-800 border-amber-200";
  if (s === "Proposal Sent") return "bg-yellow-50 text-yellow-800 border-yellow-200";
  if (s === "Conversation Started") return "bg-slate-50 text-slate-700 border-slate-200";
  if (s === "Follow-up") return "bg-amber-50 text-amber-800 border-amber-200";
  if (s === "Quotation" || s === "Qualified") return "bg-indigo-50 text-indigo-800 border-indigo-200";
  if (s === "On Hold") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function formatBudget(amount: number): string {
  if (!amount) return "—";
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)} L`;
  return `৳${amount.toLocaleString()}`;
}

function tally(items: string[]): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const key = i && String(i).trim() ? String(i).trim() : "Other";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function categoryOfLead(l: any): string {
  const isIREL = (l.companyId || "IBDC") === "IREL";
  return (isIREL ? l.propertyType : l.service) || "Other";
}
function isImportDump(text?: string | null) {
  const t = String(text || "");
  return (
    /\[Import Source ID:/i.test(t) ||
    /Original source date:/i.test(t) ||
    /Original service type:/i.test(t) ||
    /Original status:/i.test(t)
  );
}

function extractSection(text: string, labels: string[], stopLabels: string[]) {
  const src = String(text || "").replace(/\r/g, "");
  const lower = src.toLowerCase();
  let start = -1;
  let labelLen = 0;

  for (const label of labels) {
    const i = lower.indexOf(label.toLowerCase());
    if (i >= 0 && (start < 0 || i < start)) {
      start = i;
      labelLen = label.length;
    }
  }
  if (start < 0) return "";

  const from = start + labelLen;
  let end = src.length;
  for (const stop of stopLabels) {
    const i = lower.indexOf(stop.toLowerCase(), from);
    if (i >= 0 && i < end) end = i;
  }

  return src
    .slice(from, end)
    .replace(/^[\s:–—-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Excel-এর মতো পরিষ্কার Requirement / Response / Remarks */
function leadDisplayTexts(l: any) {
  const storedClientReq = String(l.clientRequirement || "").trim();
  const storedReq = String(l.requirement || "").trim();
  const storedInsaf = String(l.insafResponse || "").trim();
  const storedRemarks = String(l.remarks || "").trim();

  const dump = isImportDump(storedClientReq)
    ? storedClientReq
    : isImportDump(storedReq)
    ? storedReq
    : "";

  // নতুন লিড — বক্সে যা লেখা, হুবহু সেটাই
  if (!dump) {
    return {
      requirement: storedClientReq || storedReq,
      insafResponse: storedInsaf,
      remarks: storedRemarks,
    };
  }

  let requirement = extractSection(
    dump,
    ["Client Requirement:"],
    ["INSAF Response:", "Insaf Response:", "Remarks:", "Source notes:", "Review required:", "[অতিরিক্ত তথ্য]"]
  );

  let insafResponse =
    storedInsaf ||
    extractSection(dump, ["INSAF Response:", "Insaf Response:"], ["Remarks:", "Source notes:", "Review required:", "[অতিরিক্ত তথ্য]"]);

  let remarks =
    storedRemarks ||
    extractSection(dump, ["Remarks:"], ["Source notes:", "Review required:", "[অতিরিক্ত তথ্য]"]);

  // dump-এর আবর্জনা বাদ
  if (
    !requirement ||
    isImportDump(requirement) ||
    /^(original |source notes:|review required:|remarks:)/i.test(requirement)
  ) {
    requirement = "";
  }

  if (isImportDump(insafResponse)) insafResponse = "";
  if (isImportDump(remarks) || /^source notes:/i.test(remarks)) remarks = "";

  return { requirement, insafResponse, remarks };
}

function dash(v?: string | null) {
  const s = String(v || "").trim();
  return s ? s : "—";
}

function colorForLabel(label: string, i: number) {
  const named: Record<string, string> = {
    Facebook: "#10b981",
    WhatsApp: "#22c55e",
    Website: "#f59e0b",
    Google: "#8b5cf6",
    Direct: "#ef4444",
    Referral: "#3b82f6",
    Instagram: "#ec4899",
    "Walk-in": "#6b7280",
    "Existing Client": "#14b8a6",
    Billboard: "#f97316",
    Other: "#94a3b8",
  };
  const palette = ["#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6", "#22c55e", "#ec4899", "#6b7280"];
  return named[label] || palette[i % palette.length];
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function fmtISO(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d).slice(0, 10);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toInputDate(d?: string | null, fallback = "") {
  if (!d) return fallback;
  const x = fmtISO(d);
  return x === "—" ? fallback : x;
}

function normalizeYmd(s?: string | null) {
  if (!s) return "";
  const m = String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function activeLeadCompany(l: any): "IBDC" | "IREL" {
  const value = String(l?.companyId ?? l?.companyCode ?? "IBDC").toUpperCase();
  return value === "IREL" || value === "2" ? "IREL" : "IBDC";
}

function leadCreatedYmd(l: any) {
  return normalizeYmd(l?.leadDate || l?.date || l?.createdAt) || "";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function LeadsView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const today = new Date().toISOString().split("T")[0];

  const allLeads: any[] = useMemo(() => {
    const raw = data.leads || [];
    return raw.map((l: any) => {
      const cid = l.companyId;
      let company: "IBDC" | "IREL" = "IBDC";
      if (cid === 2 || cid === "2" || cid === "IREL") company = "IREL";
      return { ...l, companyId: company };
    });
  }, [data.leads]);

  const followUps: any[] = useMemo(() => data.leadFollowups || [], [data.leadFollowups]);
  const employees: any[] = useMemo(() => data.allEmployeesDirectory || [], [data.allEmployeesDirectory]);

  const [activeTab, setActiveTab] = useState<CompanyTab>("IBDC");
  const [boardTab, setBoardTab] = useState<"Today" | "Overdue" | "Upcoming" | "Management">("Today");
  const [viewMode, setViewMode] = useState<"cards" | "sheet">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [importingProvided, setImportingProvided] = useState(false);
  const [onlyToday, setOnlyToday] = useState(false);

  // ---- Undo Delete System ----
  const [pendingDeletes, setPendingDeletes] = useState<
    Record<number, { lead: any; expiresAt: number }>
  >({});
  const deleteTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [, forceTick] = useState(0);

  // কাউন্টডাউন রিফ্রেশ
  useEffect(() => {
    if (Object.keys(pendingDeletes).length === 0) return;
    const timer = setInterval(() => forceTick((t) => t + 1), 300);
    return () => clearInterval(timer);
  }, [pendingDeletes]);

  // সব টাইমার পরিষ্কার
  useEffect(() => {
    const timers = deleteTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // এক ক্লিকে ডিলিট — আসল ডিলিট ১০ সেকেন্ড পরে
  function softDeleteLead(lead: any) {
    const id = Number(lead.id);
    if (deleteTimers.current[id]) return;

    setPendingDeletes((prev) => ({
      ...prev,
      [id]: { lead, expiresAt: Date.now() + UNDO_WINDOW_MS },
    }));

    deleteTimers.current[id] = setTimeout(async () => {
      delete deleteTimers.current[id];
      setPendingDeletes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      try {
        await onMutate({ action: "deleteLead", leadId: id });
      } catch {
        /* AppShell টোস্ট দেখাবে */
      }
    }, UNDO_WINDOW_MS);
  }

  function undoDelete(leadId?: number) {
    const ids = Object.keys(pendingDeletes).map(Number);
    if (ids.length === 0) return;

    const target = leadId ?? ids[ids.length - 1];
    const timer = deleteTimers.current[target];
    if (timer) clearTimeout(timer);
    delete deleteTimers.current[target];

    setPendingDeletes((prev) => {
      const next = { ...prev };
      delete next[target];
      return next;
    });
  }

  function undoAllDeletes() {
    Object.keys(pendingDeletes).forEach((k) => {
      const id = Number(k);
      const timer = deleteTimers.current[id];
      if (timer) clearTimeout(timer);
      delete deleteTimers.current[id];
    });
    setPendingDeletes({});
  }

  // ⌨️ Ctrl+Z / Cmd+Z
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndo) return;

      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

      if (Object.keys(pendingDeletes).length === 0) return;
      e.preventDefault();
      undoDelete();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingDeletes]);

  // ---- Create Lead Form ----
  const [formCompany, setFormCompany] = useState<"IBDC" | "IREL">("IBDC");
  const [leadDate, setLeadDate] = useState(today);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState<string>("Facebook");
  const [budget, setBudget] = useState("0");
  const [priority, setPriority] = useState<string>("Warm");
  const [leadStatus, setLeadStatus] = useState<string>("New");
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
  const [insafResponse, setInsafResponse] = useState("");
  const [leadRemarks, setLeadRemarks] = useState("");
  const [nextFollowUpInput, setNextFollowUpInput] = useState(today);
  const [reminder1Input, setReminder1Input] = useState("");
  const [reminder2Input, setReminder2Input] = useState("");
  const [reminder3Input, setReminder3Input] = useState("");
  const [customLeadFields, setCustomLeadFields] = useState<Array<{ id: string; label: string; value: string }>>([]);

  // ---- Filters ----
  const [filterSource, setFilterSource] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // ---- Timeline ----
  const [openLeadId, setOpenLeadId] = useState<number | null>(null);

  // ---- Edit Lead Modal ----
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  // ---- Follow-up Modal ----
  const [fuLeadId, setFuLeadId] = useState<number | null>(null);
  const [fuMethod, setFuMethod] = useState("Phone Call");
  const [fuOutcome, setFuOutcome] = useState("Contacted");
  const [fuClientResponse, setFuClientResponse] = useState("");
  const [fuNote, setFuNote] = useState("");
  const [fuNextDate, setFuNextDate] = useState("");
  const [fuNextTime, setFuNextTime] = useState("10:00");
  const [fuAttachment, setFuAttachment] = useState<{ name: string; type: string; size: string; url: string } | null>(null);
  const [fuNewStatus, setFuNewStatus] = useState<string>("");

  // ============================================================================
  // DERIVED
  // ============================================================================
  const scopedLeads = useMemo(() => {
    // Undo-এর অপেক্ষায় থাকা লিড বাদ
    const live = allLeads.filter((l) => !pendingDeletes[Number(l.id)]);

    if (activeTab === "IBDC") return live.filter((l) => activeLeadCompany(l) === "IBDC");
    if (activeTab === "IREL") return live.filter((l) => activeLeadCompany(l) === "IREL");
    return live;
  }, [allLeads, activeTab, pendingDeletes]);

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

  const filteredLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      if (onlyToday && leadCreatedYmd(l) !== today) return false;
      if (filterSource !== "All" && l.source !== filterSource) return false;
      if (filterStatus !== "All" && l.status !== filterStatus) return false;
      if (filterPriority !== "All" && l.priority !== filterPriority) return false;
      if (filterCategory !== "All") {
        const cat = activeTab === "IREL" ? l.propertyType : l.service;
        if (cat !== filterCategory) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const blob = [
          l.name,
          l.phone,
          l.whatsapp,
          l.leadCode,
          l.location,
          l.preferredLocation,
          l.source,
          l.service,
          l.propertyType,
          l.status,
          l.requirement,
          l.clientRequirement,
          l.insafResponse,
          l.remarks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [
    scopedLeads,
    filterSource,
    filterStatus,
    filterPriority,
    filterCategory,
    searchTerm,
    activeTab,
    onlyToday,
    today,
  ]);

  const todayLeadCount = useMemo(
    () => scopedLeads.filter((l) => leadCreatedYmd(l) === today).length,
    [scopedLeads, today]
  );

  const dashStats = useMemo(() => {
    const total = scopedLeads.length;
    const converted = scopedLeads.filter((l) => l.status === "Won" || l.status === "Converted").length;
    const lost = scopedLeads.filter((l) => l.status === "Lost" || l.priority === "Lost").length;
    const hot = scopedLeads.filter((l) => l.priority === "Hot").length;
    const active = scopedLeads.filter(
      (l) =>
        !["Won", "Converted", "On Hold"].includes(l.status) &&
        l.status !== "Lost" &&
        l.priority !== "Lost"
    ).length;
    const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0";

    const sourceTallied = tally(scopedLeads.map((l) => l.source || "Other"));
    const sourceBy = new Map(sourceTallied.map((x) => [x.label, x]));
    const sourceItems = [
      ...LEAD_SOURCES.map((s) => sourceBy.get(s) || { label: s, count: 0 }),
      ...sourceTallied.filter((x) => !(LEAD_SOURCES as readonly string[]).includes(x.label as any)),
    ];

    const serviceTallied = tally(scopedLeads.map(categoryOfLead));
    const cats =
      activeTab === "IREL"
        ? [...IREL_PROPERTY_TYPES]
        : activeTab === "IBDC"
        ? [...IBDC_SERVICES]
        : null;
    const serviceItems = cats
      ? cats.map((c) => serviceTallied.find((x) => x.label === c) || { label: c, count: 0 })
      : serviceTallied;

    return { total, converted, lost, hot, active, rate, sourceItems, serviceItems };
  }, [scopedLeads, activeTab]);

  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((e) => map.set(Number(e.id), e.name));
    return map;
  }, [employees]);

  const derivedBoardRows = useMemo(() => {
    return scopedLeads
      .filter((l) => l.status !== "Won" && l.status !== "Converted" && l.status !== "On Hold" && l.priority !== "Lost")
      .map((l) => {
        const fus = fuByLead.get(l.id) || [];
        const last = fus[fus.length - 1];
        const nextDate = normalizeYmd(l.nextFollowUpDate);
        let bucket = "Later";
        if (!nextDate) bucket = "No Next";
        else {
          const diff = daysBetween(today, nextDate);
          if (diff < 0) bucket = "Overdue";
          else if (diff === 0) bucket = "Today";
          else if (diff === 1) bucket = "Tomorrow";
          else if (diff <= 3) bucket = "Next 3 Days";
          else if (diff <= 7) bucket = "Next 7 Days";
          else bucket = "Later";
        }

        const lastContactDate = normalizeYmd(l.lastContactDate || last?.date || l.updatedAt || l.createdAt || l.leadDate);
        const assignedName =
          (l.assignedStaffId ? employeeNameById.get(Number(l.assignedStaffId)) : "") ||
          l.assignedStaffName ||
          "অনির্ধারিত";

        return {
          leadId: l.id,
          companyId: activeLeadCompany(l),
          clientName: l.name,
          leadCode: l.leadCode,
          phone: l.phone,
          category: categoryOfLead(l),
          projectName: l.projectName,
          assignedStaffName: assignedName,
          lastContactDate: lastContactDate || "",
          daysSinceLastContact: lastContactDate ? daysBetween(lastContactDate, today) : null,
          nextFollowUpDate: nextDate,
          nextFollowUpTime: l.nextFollowUpTime || "10:00",
          bucket,
          daysOverdue: nextDate && bucket === "Overdue" ? daysBetween(nextDate, today) : 0,
          priority: l.priority || "Warm",
          totalFollowUps: fus.length,
          status: l.status || "New",
          lastOutcome: last?.outcome || "",
        };
      })
      .sort((a, b) => {
        const aa = a.nextFollowUpDate || "9999-12-31";
        const bb = b.nextFollowUpDate || "9999-12-31";
        return aa.localeCompare(bb);
      });
  }, [scopedLeads, fuByLead, today, employeeNameById]);

  const boardToday = useMemo(() => derivedBoardRows.filter((r) => r.bucket === "Today"), [derivedBoardRows]);
  const boardOverdue = useMemo(() => derivedBoardRows.filter((r) => r.bucket === "Overdue"), [derivedBoardRows]);
  const boardUpcoming = useMemo(
    () =>
      derivedBoardRows.filter((r) =>
        ["Tomorrow", "Next 3 Days", "Next 7 Days", "Later"].includes(r.bucket)
      ),
    [derivedBoardRows]
  );

  const managementNeverFollowed = useMemo(
    () => scopedLeads.filter((l) => (fuByLead.get(l.id) || []).length === 0),
    [scopedLeads, fuByLead]
  );

  const managementMultipleFU = useMemo(
    () => scopedLeads.filter((l) => (fuByLead.get(l.id) || []).length > 1),
    [scopedLeads, fuByLead]
  );

  const managementNoResponse = useMemo(
    () =>
      scopedLeads.filter((l) => {
        const fus = fuByLead.get(l.id) || [];
        const last = fus[fus.length - 1];
        return l.status === "No Response" || last?.outcome === "No Response";
      }),
    [scopedLeads, fuByLead]
  );

  const managementAwaitingClient = useMemo(
    () =>
      scopedLeads.filter((l) => {
        const fus = fuByLead.get(l.id) || [];
        const last = fus[fus.length - 1];
        if (!last) return false;
        return ["Contacted", "Interested", "Need More Information", "Quotation Sent", "Negotiating", "Call Back Later"].includes(last.outcome);
      }),
    [scopedLeads, fuByLead]
  );

  const managementNoNextFU = useMemo(
    () =>
      scopedLeads.filter(
        (l) =>
          !normalizeYmd(l.nextFollowUpDate) &&
          !["Won", "Converted", "Lost", "On Hold"].includes(l.status) &&
          l.priority !== "Lost"
      ),
    [scopedLeads]
  );

  const managementOnHold = useMemo(
    () => scopedLeads.filter((l) => l.status === "On Hold"),
    [scopedLeads]
  );

  const boardSummary = useMemo(() => {
    const completedToday = followUps.filter((f) => {
      const lead = allLeads.find((x) => x.id === f.leadId);
      if (!lead) return false;
      if (activeTab !== "ALL" && activeLeadCompany(lead) !== activeTab) return false;
      return normalizeYmd(f.date) === today;
    }).length;

    return {
      todaysFollowUps: boardToday.length,
      overdueFollowUps: boardOverdue.length,
      upcomingFollowUps: boardUpcoming.length,
      followUpsCompletedToday: completedToday,
      leadsWithoutNextFollowUp: managementNoNextFU.length,
      leadsWithNoResponse: managementNoResponse.length,
      activeLeads: dashStats.active,
    };
  }, [
    boardToday.length,
    boardOverdue.length,
    boardUpcoming.length,
    followUps,
    allLeads,
    activeTab,
    today,
    managementNoNextFU.length,
    managementNoResponse.length,
    dashStats.active,
  ]);

  const staffPerformanceScoped = useMemo(() => {
    const map = new Map<string, any>();

    const ensure = (staffId: string, staffName: string) => {
      if (!map.has(staffId)) {
        map.set(staffId, {
          staffId,
          staffName,
          activeLeads: 0,
          todaysFollowUps: 0,
          totalFollowUps: 0,
          overdueFollowUps: 0,
        });
      }
      return map.get(staffId);
    };

    scopedLeads.forEach((l) => {
      const sid = String(l.assignedStaffId || "unassigned");
      const sname =
        (l.assignedStaffId ? employeeNameById.get(Number(l.assignedStaffId)) : "") ||
        l.assignedStaffName ||
        "অনির্ধারিত";
      const row = ensure(sid, sname);
      if (!["Won", "Converted", "Lost", "On Hold"].includes(l.status) && l.priority !== "Lost") {
        row.activeLeads += 1;
      }
      row.totalFollowUps += (fuByLead.get(l.id) || []).length;
    });

    boardToday.forEach((r) => {
      const row = ensure(String(r.assignedStaffName || "unassigned"), r.assignedStaffName || "অনির্ধারিত");
      row.todaysFollowUps += 1;
    });

    boardOverdue.forEach((r) => {
      const row = ensure(String(r.assignedStaffName || "unassigned"), r.assignedStaffName || "অনির্ধারিত");
      row.overdueFollowUps += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.activeLeads - a.activeLeads);
  }, [scopedLeads, employeeNameById, fuByLead, boardToday, boardOverdue]);

  const openLead = allLeads.find((l) => l.id === openLeadId) || null;
  const fuLead = allLeads.find((l) => l.id === fuLeadId) || null;
  const closedOutcome = CLOSED_FU.includes(fuOutcome);

  // ============================================================================
  // ACTIONS
  // ============================================================================
  function switchTab(tab: CompanyTab) {
    setActiveTab(tab);
    setFilterSource("All");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterCategory("All");
    setSearchTerm("");
    setOnlyToday(false);
    if (tab === "IREL") setFormCompany("IREL");
    else if (tab === "IBDC") setFormCompany("IBDC");
  }

  function openFollowUpModal(leadId: number) {
    const lead = allLeads.find((l) => l.id === leadId);
    setFuLeadId(leadId);
    setFuMethod("Phone Call");
    setFuOutcome("Contacted");
    setFuClientResponse("");
    setFuNote("");
    setFuNextDate(normalizeYmd(lead?.nextFollowUpDate) || today);
    setFuNextTime(lead?.nextFollowUpTime || "10:00");
    setFuAttachment(null);
    setFuNewStatus("");
  }

  async function saveFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!fuLeadId) return;
    if (!closedOutcome && fuLead?.status !== "On Hold" && !fuNextDate) {
      alert("পরবর্তী ফলো-আপ Date দরকার");
      return;
    }
    const result = await onMutate({
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
    if (!result?.success) return;
    setFuLeadId(null);
  }

    async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();

    const payload: Record<string, unknown> = {
      action: "createLead",
      companyId: formCompany,
      name,
      phone,
      whatsapp: whatsapp || phone,
      location,
      source,
      budget: Number(budget || 0),
      priority,
      status: leadStatus,
      assignedStaffId: assignedStaffId ? Number(assignedStaffId) : null,
      nextFollowUpDate: nextFollowUpInput || today,

      // ✅ নতুন ফিল্ড — এগুলো থাকা জরুরি
      insafResponse: String(insafResponse || ""),
      remarks: String(leadRemarks || ""),
      reminder1: String(reminder1Input || ""),
      reminder2: String(reminder2Input || ""),
      reminder3: String(reminder3Input || ""),
      leadDate: leadDate || today,
    };

    // অতিরিক্ত ফিল্ড — requirement-এ যোগ
    const customFieldLines = customLeadFields
      .map((field) => ({ label: field.label.trim(), value: field.value.trim() }))
      .filter((field) => field.label && field.value)
      .map((field) => `${field.label}: ${field.value}`);
    const customFieldBlock = customFieldLines.length
      ? `\n\n[অতিরিক্ত তথ্য]\n${customFieldLines.join("\n")}`
      : "";

    if (formCompany === "IBDC") {
      payload.service = service;
      payload.requirement = `${requirement.trim()}${customFieldBlock}`.trim();
      payload.landSize = landSize;
      payload.roadWidth = roadWidth;
    } else {
      payload.propertyType = propertyType;
      payload.projectName = projectName;
      payload.unitFlatShop = unitFlatShop;
      payload.preferredLocation = preferredLocation || location;
      payload.size = size;
      payload.floor = floor;
      payload.bedrooms = bedrooms;
      payload.purpose = purpose;
      payload.expectedPurchaseDate = expectedPurchaseDate;
      payload.clientRequirement = `${clientRequirement.trim()}${customFieldBlock}`.trim();
    }

    const result = await onMutate(payload);
    if (result?.error) return;

    setActiveTab(formCompany);
    setViewMode("cards");

    // ফর্ম রিসেট
    setLeadDate(today);
    setName("");
    setPhone("");
    setWhatsapp("");
    setLocation("");
    setBudget("0");
    setPriority("Warm");
    setLeadStatus("New");
    setAssignedStaffId("");
    setRequirement("");
    setClientRequirement("");
    setInsafResponse("");
    setLeadRemarks("");
    setNextFollowUpInput(today);
    setReminder1Input("");
    setReminder2Input("");
    setReminder3Input("");
    setCustomLeadFields([]);
    setUnitFlatShop("");
  }

  async function importProvidedLeads() {
    setImportingProvided(true);
    try {
      for (const seed of PROVIDED_SAMPLE_LEADS) {
        const exists = allLeads.some(
          (l) =>
            String(l.name || "").trim().toLowerCase() === seed.name.trim().toLowerCase() &&
            String(l.phone || "").trim() === seed.phone.trim() &&
            activeLeadCompany(l) === seed.companyId
        );
        if (exists) continue;

        await onMutate({
          action: "createLead",
          companyId: seed.companyId,
          name: seed.name,
          phone: seed.phone,
          whatsapp: seed.whatsapp,
          location: seed.location,
          source: seed.source,
          budget: seed.budget,
          priority: seed.priority,
          status: seed.status,
          service: seed.service,
          requirement: seed.requirement,
          nextFollowUpDate: seed.nextFollowUpDate || null,
          assignedStaffId: null,
        });
      }
      setActiveTab("IBDC");
    } finally {
      setImportingProvided(false);
    }
  }

  function openEditModal(lead: any) {
    setEditingLead(lead);
    setEditForm({
      companyId: activeLeadCompany(lead),
      leadDate: toInputDate(lead.leadDate || lead.createdAt || lead.date, today),
      name: lead.name || "",
      phone: lead.phone || "",
      whatsapp: lead.whatsapp || lead.phone || "",
      location: lead.location || "",
      source: lead.source || "Facebook",
      budget: String(lead.budget || 0),
      priority: lead.priority || "Warm",
      status: lead.status || "New",
      assignedStaffId: lead.assignedStaffId ? String(lead.assignedStaffId) : "",
      service: lead.service || "RAJUK Plan Approval",
      requirement: lead.requirement || "",
      landSize: lead.landSize || "",
      roadWidth: lead.roadWidth || "",
      propertyType: lead.propertyType || "Flat",
      projectName: lead.projectName || "",
      unitFlatShop: lead.unitFlatShop || "",
      preferredLocation: lead.preferredLocation || "",
      size: lead.size || "",
      floor: lead.floor || "",
      bedrooms: lead.bedrooms || "",
      purpose: lead.purpose || "Own Use",
      expectedPurchaseDate: lead.expectedPurchaseDate || "",
      clientRequirement: lead.clientRequirement || "",
      insafResponse: lead.insafResponse || "",
      remarks: lead.remarks || "",
      nextFollowUpDate: normalizeYmd(lead.nextFollowUpDate) || "",
      reminder1: lead.reminder1 || "",
      reminder2: lead.reminder2 || "",
      reminder3: lead.reminder3 || "",
    });
  }

      async function saveEditedLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead || !editForm) return;

    const companyId = editForm.companyId === "IREL" ? 2 : 1;

    const payload: Record<string, unknown> = {
      action: "updateLead",
      leadId: Number(editingLead.id),
      companyId,
      name: String(editForm.name || "").trim(),
      phone: String(editForm.phone || "").trim(),
      whatsapp: String(editForm.whatsapp || editForm.phone || "").trim(),
      location: editForm.location || "",
      source: editForm.source || "Facebook",
      budget: Number(editForm.budget || 0),
      priority: editForm.priority || "Warm",
      status: editForm.status || "New",
      assignedStaffId: editForm.assignedStaffId ? Number(editForm.assignedStaffId) : null,
      nextFollowUpDate: editForm.nextFollowUpDate || null,

      // ✅ নতুন ফিল্ড — এগুলো থাকা জরুরি
      insafResponse: String(editForm.insafResponse || ""),
      remarks: String(editForm.remarks || ""),
      reminder1: String(editForm.reminder1 || ""),
      reminder2: String(editForm.reminder2 || ""),
      reminder3: String(editForm.reminder3 || ""),
      leadDate: editForm.leadDate || today,
    };

    if (editForm.companyId === "IBDC") {
      payload.service = editForm.service;
      payload.requirement = editForm.requirement;
      payload.landSize = editForm.landSize;
      payload.roadWidth = editForm.roadWidth;
    } else {
      payload.propertyType = editForm.propertyType;
      payload.projectName = editForm.projectName;
      payload.unitFlatShop = editForm.unitFlatShop;
      payload.preferredLocation = editForm.preferredLocation || editForm.location;
      payload.size = editForm.size;
      payload.floor = editForm.floor;
      payload.bedrooms = editForm.bedrooms;
      payload.purpose = editForm.purpose;
      payload.expectedPurchaseDate = editForm.expectedPurchaseDate || null;
      payload.clientRequirement = editForm.clientRequirement;
    }

    const result = await onMutate(payload);
    if (result?.error) return;

    setEditingLead(null);
    setEditForm(null);
  }

  async function handleExport(kind: "csv" | "xlsx" | "pdf") {
    const headers = [
      "Lead ID",
      "Date",
      "Client Name",
      "Contact No",
      "Location",
      "Source",
      "Service Type",
      "Priority",
      "Status",
      "Client Requirement",
      "Insaf Response",
      "Remarks",
      "Next Follow-up",
      "Reminder 1",
      "Reminder 2",
      "Reminder 3",
    ];

    const rows: string[][] = filteredLeads.map((l) => [
      String(l.leadCode || l.id || ""),
      fmtISO(l.leadDate || l.createdAt || l.date),
      String(l.name || ""),
      String(l.phone || ""),
      String(l.location || l.preferredLocation || ""),
      String(l.source || ""),
      String(categoryOfLead(l)),
      String(l.priority || ""),
      String(l.status || ""),
      leadDisplayTexts(l).requirement,
leadDisplayTexts(l).insafResponse,
leadDisplayTexts(l).remarks,
      String(l.nextFollowUpDate || ""),
      String(l.reminder1 || ""),
      String(l.reminder2 || ""),
      String(l.reminder3 || ""),
    ]);

    const exportRows = rows.map((row) =>
      Object.fromEntries(headers.map((heading, index) => [heading, row[index] ?? ""]))
    );
    if (kind === "csv") exportRecordsToCSV("insaf-leads", exportRows);
    else if (kind === "xlsx") exportToExcel("insaf-leads", "Leads & CRM", exportRows);
    else exportRecordsToPDFPrint("INSAF LEAD MANAGEMENT DASHBOARD", "Leads & CRM", exportRows);
  }

  const pendingCount = Object.keys(pendingDeletes).length;

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Phone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Leads & CRM Management</h1>
              <p className="text-xs text-slate-400">
                Dual Business Unit • One-Click Delete • Ctrl+Z Undo • Dashboard Auto Update
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={importProvidedLeads}
              disabled={true}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {"Sample Import Disabled (Production Safety)"}
            </button>
            <button
              type="button"
              onClick={() => handleExport("xlsx")}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={() => onMutate({ action: "sendFollowUpReminders" })}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reminders
            </button>
          </div>
        </div>
      </div>

      {/* COMPANY TABS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {([
          {
            id: "IBDC" as CompanyTab,
            label: "IBDC",
            sub: "Building Design • RAJUK • Engineering",
            activeCls: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100",
            badgeCls: "bg-emerald-600",
          },
          {
            id: "IREL" as CompanyTab,
            label: "IREL",
            sub: "Flat • Shop • Land • Investment",
            activeCls: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100",
            badgeCls: "bg-indigo-600",
          },
          {
            id: "ALL" as CompanyTab,
            label: "ALL",
            sub: "Combined View",
            activeCls: "border-slate-800 bg-slate-50 ring-2 ring-slate-200",
            badgeCls: "bg-slate-900",
          },
        ]).map((tab) => {
          const live = allLeads.filter((l) => !pendingDeletes[Number(l.id)]);
          const count =
            tab.id === "IBDC"
              ? live.filter((l) => activeLeadCompany(l) === "IBDC").length
              : tab.id === "IREL"
              ? live.filter((l) => activeLeadCompany(l) === "IREL").length
              : live.length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`text-left p-4 rounded-2xl border-2 transition ${
                isActive ? tab.activeCls : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{tab.label}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${tab.badgeCls}`}>
                  {count}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{tab.sub}</p>
            </button>
          );
        })}
      </div>

      {/* DASHBOARD */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white py-3 px-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <h2 className="text-sm font-bold tracking-wide">
            {activeTab === "IBDC"
              ? "INSAF BUILDING DESIGN — LEAD DASHBOARD"
              : activeTab === "IREL"
              ? "INSAF REAL ESTATE — LEAD DASHBOARD"
              : "ALL COMPANIES — LEAD DASHBOARD"}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100">
          <KpiCard label="Total Leads" value={dashStats.total} color="text-slate-900" bg="bg-white" />
          <KpiCard label="Active Follow-ups" value={dashStats.active} color="text-amber-600" bg="bg-amber-50/50" />
          <KpiCard label="Converted" value={dashStats.converted} color="text-emerald-600" bg="bg-emerald-50/50" />
          <KpiCard label="Lost" value={dashStats.lost} color="text-rose-600" bg="bg-rose-50/50" />
          <KpiCard label="Hot Leads" value={dashStats.hot} color="text-orange-600" bg="bg-orange-50/50" />
          <KpiCard label="Conversion Rate" value={`${dashStats.rate}%`} color="text-violet-600" bg="bg-violet-50/50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-slate-100">
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" />
              Leads by Source
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[220px]">
              <PieChartSVG
                items={dashStats.sourceItems
                  .filter((s) => s.count > 0)
                  .map((s, i) => ({ ...s, color: colorForLabel(s.label, i) }))}
              />
              <div className="flex flex-col gap-1.5 text-[11px] w-full max-w-[180px]">
                {dashStats.sourceItems.filter((s) => s.count > 0).map((s, i) => (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: colorForLabel(s.label, i) }}
                      />
                      <span className="truncate text-slate-700">{s.label}</span>
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">{s.count}</span>
                  </div>
                ))}
                {dashStats.sourceItems.every((s) => s.count === 0) && (
                  <p className="text-slate-400 text-center">No data yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Leads by {activeTab === "IREL" ? "Property Type" : "Service"}
            </h3>
            <ServiceBarChart items={dashStats.serviceItems} />
          </div>
        </div>
      </div>

      {/* FOLLOW-UP COMMAND BOARD */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-emerald-600" />
            ফলো-আপ কমান্ড বোর্ড
          </h2>

          <div className="flex flex-wrap gap-1">
            {(["Today", "Overdue", "Upcoming", "Management"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBoardTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  boardTab === t ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
                {t === "Today" && ` (${boardSummary.todaysFollowUps})`}
                {t === "Overdue" && ` (${boardSummary.overdueFollowUps})`}
                {t === "Upcoming" && ` (${boardSummary.upcomingFollowUps})`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-4 bg-slate-50 border-b border-slate-200">
          {[
            { l: "আজকের ফলো-আপ", v: boardSummary.todaysFollowUps, c: "text-amber-600" },
            { l: "Overdue", v: boardSummary.overdueFollowUps, c: "text-rose-600" },
            { l: "Upcoming", v: boardSummary.upcomingFollowUps, c: "text-indigo-600" },
            { l: "Completed Today", v: boardSummary.followUpsCompletedToday, c: "text-emerald-600" },
            { l: "No Next FU", v: boardSummary.leadsWithoutNextFollowUp, c: "text-slate-700" },
            { l: "No Response", v: boardSummary.leadsWithNoResponse, c: "text-orange-600" },
            { l: "Active Leads", v: boardSummary.activeLeads, c: "text-slate-900" },
          ].map((k) => (
            <div key={k.l} className="bg-white p-2.5 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">{k.l}</p>
              <p className={`text-lg font-bold ${k.c}`}>{k.v ?? 0}</p>
            </div>
          ))}
        </div>

        {boardTab === "Management" ? (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5 text-left font-semibold">স্টাফ</th>
                    <th className="p-2.5 text-center font-semibold">সক্রিয় লিড</th>
                    <th className="p-2.5 text-center font-semibold">Today FU</th>
                    <th className="p-2.5 text-center font-semibold">মোট FU</th>
                    <th className="p-2.5 text-center font-semibold">ওভারডিউ</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformanceScoped.map((s: any, idx: number) => (
                    <tr key={`${s.staffId}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{s.staffName}</td>
                      <td className="p-2.5 text-center">{s.activeLeads}</td>
                      <td className="p-2.5 text-center text-amber-600 font-semibold">{s.todaysFollowUps}</td>
                      <td className="p-2.5 text-center">{s.totalFollowUps}</td>
                      <td className="p-2.5 text-center text-rose-600 font-bold">{s.overdueFollowUps}</td>
                    </tr>
                  ))}
                  {staffPerformanceScoped.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        ডাটা নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <MiniList title="কখনো ফলো-আপ হয়নি" rows={managementNeverFollowed.map((r: any) => `${r.name} (${r.leadCode})`)} />
              <MiniList title="একাধিক ফলো-আপ" rows={managementMultipleFU.map((r: any) => `${r.name} — ${(fuByLead.get(r.id) || []).length}x`)} />
              <MiniList title="কোনো সাড়া নেই" rows={managementNoResponse.map((r: any) => `${r.name} (${r.leadCode})`)} />
              <MiniList title="ক্লায়েন্টের অপেক্ষায়" rows={managementAwaitingClient.map((r: any) => `${r.name} (${r.leadCode})`)} />
              <MiniList title="Next FU নির্ধারিত নয়" rows={managementNoNextFU.map((r: any) => `${r.name} (${r.status})`)} />
              <MiniList title="স্থগিত লিড" rows={managementOnHold.map((r: any) => `${r.name} (${r.leadCode})`)} />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5 text-left font-semibold">ক্লায়েন্ট</th>
                  <th className="p-2.5 text-left font-semibold">ফোন</th>
                  <th className="p-2.5 text-left font-semibold">সার্ভিস / প্রপার্টি</th>
                  <th className="p-2.5 text-left font-semibold">স্টাফ</th>
                  <th className="p-2.5 text-left font-semibold">শেষ FU</th>
                  <th className="p-2.5 text-left font-semibold">Next FU</th>
                  <th className="p-2.5 text-center font-semibold">Priority</th>
                  <th className="p-2.5 text-center font-semibold">FU Count</th>
                  <th className="p-2.5 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {(boardTab === "Today"
                  ? boardToday
                  : boardTab === "Overdue"
                  ? boardOverdue
                  : boardUpcoming
                ).map((r: any) => (
                  <tr key={r.leadId} className="border-b border-slate-100 hover:bg-emerald-50/30">
                    <td className="p-2.5">
                      <button
                        type="button"
                        onClick={() => setOpenLeadId(r.leadId)}
                        className="text-left"
                      >
                        <span className="font-bold text-slate-900 hover:text-emerald-700">
                          {r.clientName}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.leadCode}
                        </span>
                      </button>
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">{r.phone}</td>
                    <td className="p-2.5 text-[11px]">
                      {r.category}
                      {r.projectName ? ` • ${r.projectName}` : ""}
                    </td>
                    <td className="p-2.5 text-[11px]">{r.assignedStaffName || "—"}</td>
                    <td className="p-2.5 text-[11px]">
                      {fmtDate(r.lastContactDate)}
                      <span className="block text-slate-400">
                        {r.daysSinceLastContact != null ? `${r.daysSinceLastContact}d ago` : "never"}
                      </span>
                    </td>
                    <td className="p-2.5 text-[11px]">
                      {fmtDate(r.nextFollowUpDate)} {r.nextFollowUpTime}
                      {r.bucket === "Overdue" && (
                        <span className="block text-rose-600 font-bold">
                          🔴 {r.daysOverdue}d late
                        </span>
                      )}
                      {r.bucket === "Today" && (
                        <span className="block text-amber-600 font-bold">TODAY</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${priorityStyle(r.priority).dot}`} />
                    </td>
                    <td className="p-2.5 text-center font-semibold">{r.totalFollowUps}</td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => openFollowUpModal(r.leadId)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                      >
                        + FU
                      </button>
                    </td>
                  </tr>
                ))}
                {(boardTab === "Today"
                  ? boardToday
                  : boardTab === "Overdue"
                  ? boardOverdue
                  : boardUpcoming
                ).length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">
                      এই তালিকায় লিড নেই ✓
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEAD LIST + NEW LEAD FORM */}
      <div className={`grid grid-cols-1 gap-5 ${viewMode === "sheet" ? "" : "lg:grid-cols-12"}`}>
        {/* LEFT */}
        <div className={`${viewMode === "sheet" ? "" : "lg:col-span-8"} space-y-3`}>
          {/* FILTER BAR */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2 shadow-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search…"
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyToday((v) => !v)}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border-2 transition ${
                onlyToday
                  ? "bg-emerald-500 border-emerald-600 text-slate-950"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              আজকের লিড ({todayLeadCount})
            </button>

            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white">
              <option value="All">সকল Source</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white">
              <option value="All">সকল Status</option>
              {LEAD_STATUSES_FULL.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white">
              <option value="All">সকল Priority</option>
              {LEAD_PRIORITY_OPTIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            {activeTab !== "ALL" && (
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white">
                <option value="All">All {activeTab === "IREL" ? "Property" : "Service"}</option>
                {(activeTab === "IREL" ? IREL_PROPERTY_TYPES : IBDC_SERVICES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setFilterSource("All");
                setFilterStatus("All");
                setFilterPriority("All");
                setFilterCategory("All");
                setSearchTerm("");
                setOnlyToday(false);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
            >
              Reset
            </button>

            {pendingCount > 0 && (
              <button
                type="button"
                onClick={undoAllDeletes}
                className="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" /> সব ফেরান ({pendingCount})
              </button>
            )}

            <div className="ml-auto flex items-center gap-0.5 bg-slate-100 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${viewMode === "cards" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("sheet")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${viewMode === "sheet" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
              >
                Sheet
              </button>
            </div>
          </div>

                    {/* LEADS */}
          {viewMode === "sheet" ? (
            <LeadSheetTable
              leads={filteredLeads}
              fuByLead={fuByLead}
              openLeadId={openLeadId}
              today={today}
              onOpenLead={(id) => setOpenLeadId(id === openLeadId ? null : id)}
              onFollowUp={openFollowUpModal}
              onEdit={openEditModal}
              onDelete={softDeleteLead}
              onMutate={onMutate}
            />
          ) : (
            <>
              {filteredLeads.map((l) => {
                const isIREL = activeLeadCompany(l) === "IREL";
                const fus = fuByLead.get(l.id) || [];
                const last = fus[fus.length - 1];
                const pStyle = priorityStyle(l.priority || "Warm");
                const PIcon = pStyle.Icon;
                const isToday = leadCreatedYmd(l) === today;
                const texts = leadDisplayTexts(l);

                return (
                  <div
                    key={l.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-sm transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {l.leadCode || l.id}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                              আজ
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isIREL
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isIREL ? "IREL" : "IBDC"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(l.status)}`}>
                            {l.status}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mt-1.5 truncate">{l.name}</h3>
                        <p className="text-[11px] text-slate-500">
                          {l.phone} • {l.location || l.preferredLocation || "—"}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {isIREL ? (
                            <>
                              🏠 <strong>{l.propertyType}</strong>
                              {l.projectName ? ` • ${l.projectName}` : ""}
                              {l.size ? ` • ${l.size}` : ""}
                            </>
                          ) : (
                            <>
                              📐 <strong>{l.service}</strong>
                              {l.landSize ? ` • ${l.landSize}` : ""}
                            </>
                          )}
                        </p>

                        {texts.requirement && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            <strong>Req:</strong> {texts.requirement}
                          </p>
                        )}
                        {texts.insafResponse && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            <strong>Response:</strong> {texts.insafResponse}
                          </p>
                        )}
                        {texts.remarks && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            <strong>Remarks:</strong> {texts.remarks}
                          </p>
                        )}
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${pStyle.cls}`}>
                          <PIcon className="w-3 h-3" /> {l.priority || "Warm"}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Next: <strong>{fmtDate(l.nextFollowUpDate)}</strong>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          FU: <strong>{fus.length}</strong> • {formatBudget(Number(l.budget || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                      {!["Won", "Lost", "On Hold"].includes(l.status) && l.priority !== "Lost" && (
                        <button
                          type="button"
                          onClick={() => openFollowUpModal(l.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                        >
                          + Follow-up
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setOpenLeadId(l.id === openLeadId ? null : l.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold"
                      >
                        {l.id === openLeadId ? "Hide" : `Timeline (${fus.length})`}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(l)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => softDeleteLead(l)}
                        title="এক ক্লিকে ডিলিট — Ctrl+Z দিয়ে ফেরানো যাবে"
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>

                      {l.status !== "On Hold" && !["Won", "Lost"].includes(l.status) && l.priority !== "Lost" && (
                        <button
                          type="button"
                          onClick={() => onMutate({ action: "updateLeadStatus", leadId: l.id, status: "On Hold" })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold"
                        >
                          Hold
                        </button>
                      )}

                      {l.status === "On Hold" && (
                        <button
                          type="button"
                          onClick={() => onMutate({ action: "updateLeadStatus", leadId: l.id, status: "Follow-up" })}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold"
                        >
                          Resume
                        </button>
                      )}

                      {l.status !== "Won" && (
                        <button
                          type="button"
                          onClick={() => onMutate({ action: "convertLeadToClient", leadId: l.id })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold"
                        >
                          Convert →
                        </button>
                      )}

                      {last && <span className="text-[10px] text-slate-400 ml-auto truncate">Last: {last.outcome}</span>}
                    </div>

                    {l.id === openLeadId && <LeadTimeline lead={l} fus={fus} />}
                  </div>
                );
              })}

              {filteredLeads.length === 0 && (
                <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">কোনো লিড নেই</p>
                  <p className="text-xs text-slate-400 mt-1">নতুন lead যোগ করুন বা filter পরিবর্তন করুন</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT FORM */}
        <form
          onSubmit={handleCreateLead}
          className={`${viewMode === "sheet" ? "max-w-lg" : "lg:col-span-4"} bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit shadow-sm`}
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            নতুন লিড
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <label className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer text-center text-[11px] font-bold transition ${formCompany === "IBDC" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
              <input type="radio" className="hidden" checked={formCompany === "IBDC"} onChange={() => { setFormCompany("IBDC"); setService("RAJUK Plan Approval"); }} />
              Building Design
            </label>
            <label className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer text-center text-[11px] font-bold transition ${formCompany === "IREL" ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
              <input type="radio" className="hidden" checked={formCompany === "IREL"} onChange={() => { setFormCompany("IREL"); setPropertyType("Flat"); }} />
              Real Estate
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={leadDate} onChange={(e) => setLeadDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
              {LEAD_STATUSES_FULL.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="ক্লায়েন্টের নাম *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" required value={phone} onChange={(e) => { setPhone(e.target.value); setWhatsapp(e.target.value); }} placeholder="ফোন / WhatsApp *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />

          {formCompany === "IBDC" ? (
            <>
              <select value={service} onChange={(e) => setService(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs font-medium">
                {IBDC_SERVICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={landSize} onChange={(e) => setLandSize(e.target.value)} placeholder="জমির পরিমাণ" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
                <input type="text" value={roadWidth} onChange={(e) => setRoadWidth(e.target.value)} placeholder="রাস্তার প্রস্থ" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
              <textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder="ডিজাইন / ক্লায়েন্ট requirement" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            </>
          ) : (
            <>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/30 text-xs font-medium">
                {IREL_PROPERTY_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
                <input type="text" value={unitFlatShop} onChange={(e) => setUnitFlatShop(e.target.value)} placeholder="Unit/Flat/Shop" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} placeholder="Preferred Location" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
                <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" className="px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
                <input type="text" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="Bed" className="px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs" />
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  <option>Own Use</option>
                  <option>Investment</option>
                </select>
              </div>
              <input type="date" value={expectedPurchaseDate} onChange={(e) => setExpectedPurchaseDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              <textarea value={clientRequirement} onChange={(e) => setClientRequirement(e.target.value)} placeholder="ক্লায়েন্টের চাহিদা" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
              {LEAD_PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <select value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="">অনির্ধারিত স্টাফ</option>
            {employees.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-800">অতিরিক্ত ফিল্ড</p>
                <p className="text-[10px] text-slate-500">দুই কোম্পানির জন্যই প্রয়োজনমতো যোগ বা বাদ দিন; পূরণ করা তথ্য লিডের Requirement-এ সংরক্ষিত হবে।</p>
              </div>
              <button type="button" onClick={() => setCustomLeadFields((fields) => [...fields, { id: `${Date.now()}-${fields.length}`, label: "", value: "" }])} className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white">+ ফিল্ড যোগ</button>
            </div>
            {customLeadFields.map((field) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                <input value={field.label} onChange={(e) => setCustomLeadFields((fields) => fields.map((item) => item.id === field.id ? { ...item, label: e.target.value } : item))} placeholder="ফিল্ডের নাম" aria-label="অতিরিক্ত ফিল্ডের নাম" className="min-w-0 px-2.5 py-2.5 rounded-lg border border-slate-200 text-xs" />
                <input value={field.value} onChange={(e) => setCustomLeadFields((fields) => fields.map((item) => item.id === field.id ? { ...item, value: e.target.value } : item))} placeholder="তথ্য" aria-label="অতিরিক্ত ফিল্ডের তথ্য" className="min-w-0 px-2.5 py-2.5 rounded-lg border border-slate-200 text-xs" />
                <button type="button" onClick={() => setCustomLeadFields((fields) => fields.filter((item) => item.id !== field.id))} aria-label="ফিল্ড বাদ দিন" title="ফিল্ড বাদ দিন" className="rounded-lg border border-red-200 p-2 text-red-600"><XCircle className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
                      <textarea
            value={insafResponse}
            onChange={(e) => setInsafResponse(e.target.value)}
            placeholder="Insaf Response (আমরা কী বলেছি)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <textarea
            value={leadRemarks}
            onChange={(e) => setLeadRemarks(e.target.value)}
            placeholder="Remarks"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={reminder1Input}
              onChange={(e) => setReminder1Input(e.target.value)}
              placeholder="Reminder 1"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
            <input
              type="text"
              value={reminder2Input}
              onChange={(e) => setReminder2Input(e.target.value)}
              placeholder="Reminder 2"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
            <input
              type="text"
              value={reminder3Input}
              onChange={(e) => setReminder3Input(e.target.value)}
              placeholder="Reminder 3"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <label className="block space-y-1 text-xs text-slate-600"><span>পরবর্তী ফলো-আপ তারিখ</span><input type="date" value={nextFollowUpInput} onChange={(e) => setNextFollowUpInput(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" /></label>

          <button type="submit" className={`w-full py-3 rounded-xl text-white font-bold text-sm transition ${formCompany === "IREL" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
            + Save Lead
          </button>
        </form>
      </div>

      {/* FOLLOW-UP MODAL */}
      {fuLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 overflow-y-auto">
          <form onSubmit={saveFollowUp} className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">ফলো-আপ — {fuLead.name}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {fuLead.leadCode} • Total FU: {(fuByLead.get(fuLead.id) || []).length} • Next: #
                  {(fuByLead.get(fuLead.id) || []).length + 1}
                </p>
              </div>
              <button type="button" onClick={() => setFuLeadId(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">মাধ্যম *</label>
                <select value={fuMethod} onChange={(e) => setFuMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  {FU_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">ফলাফল *</label>
                <select value={fuOutcome} onChange={(e) => setFuOutcome(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  {FU_OUTCOMES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {fuOutcome === "No Response" && (
              <p className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2.5">
                Lead active থাকবে। Next follow-up date দিন।
              </p>
            )}
            {closedOutcome && (
              <p className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5">
                Lead close হবে। Next follow-up clear হবে।
              </p>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ক্লায়েন্টের সাড়া</label>
              <input type="text" value={fuClientResponse} onChange={(e) => setFuClientResponse(e.target.value)} placeholder="Client said..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">নোট *</label>
              <textarea required rows={2} value={fuNote} onChange={(e) => setFuNote(e.target.value)} placeholder="Called, no answer..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Next FU Date {!closedOutcome && fuLead.status !== "On Hold" ? "*" : ""}</label>
                <input type="date" required={!closedOutcome && fuLead.status !== "On Hold"} value={fuNextDate} onChange={(e) => setFuNextDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time</label>
                <input type="time" value={fuNextTime} onChange={(e) => setFuNextTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Attachment</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return setFuAttachment(null);
                    setFuAttachment({
                      name: f.name,
                      type: f.type || "File",
                      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                      url: `#fu-${encodeURIComponent(f.name)}`,
                    });
                  }}
                  className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:text-[10px] file:font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Update</label>
                <select value={fuNewStatus} onChange={(e) => setFuNewStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  <option value="">Auto</option>
                  {LEAD_STATUSES_FULL.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">
              ✓ Save Follow-up
            </button>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingLead && editForm && (
        <EditLeadModal
          lead={editingLead}
          form={editForm}
          setForm={setEditForm}
          employees={employees}
          onClose={() => {
            setEditingLead(null);
            setEditForm(null);
          }}
          onSave={saveEditedLead}
        />
      )}

      {/* SHEET MODE TIMELINE */}
      {viewMode === "sheet" && openLead && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Timeline — {openLead.name} ({openLead.leadCode})
            </h3>
            <button type="button" onClick={() => setOpenLeadId(null)} className="text-xs text-slate-500 hover:text-slate-900 font-semibold">
              ✕ Close
            </button>
          </div>
          <LeadTimeline lead={openLead} fus={fuByLead.get(openLead.id) || []} />
        </div>
      )}

      {/* ===== UNDO DELETE TOAST ===== */}
      {pendingCount > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[min(30rem,92vw)] space-y-2">
          {Object.entries(pendingDeletes)
            .slice(-3)
            .map(([key, item]) => {
              const id = Number(key);
              const remainMs = Math.max(0, item.expiresAt - Date.now());
              const remainSec = Math.ceil(remainMs / 1000);
              const pct = (remainMs / UNDO_WINDOW_MS) * 100;

              return (
                <div
                  key={id}
                  className="bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          ডিলিট হয়েছে — {item.lead.name || item.lead.leadCode}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {remainSec} সেকেন্ড পর স্থায়ীভাবে মুছে যাবে
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => undoDelete(id)}
                      className="shrink-0 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Undo
                    </button>
                  </div>

                  <div className="h-1 bg-slate-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 ease-linear"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

          <p className="text-center text-[11px] text-slate-500 font-semibold">
            কীবোর্ডে <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600">Ctrl</kbd>
            {" + "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600">Z</kbd>
            {" "}চেপেও ফিরিয়ে আনতে পারবেন
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB COMPONENTS
// ============================================================================
function KpiCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} p-3 text-center`}>
      <p className={`text-2xl font-black ${color} tabular-nums`}>{value}</p>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function MiniList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
      <h4 className="text-[11px] font-bold text-slate-700 mb-1.5">
        {title} ({rows.length})
      </h4>
      {rows.length === 0 ? (
        <p className="text-[10px] text-slate-400">নেই ✓</p>
      ) : (
        <ul className="space-y-0.5 text-[10px] text-slate-600 max-h-24 overflow-y-auto">
          {rows.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PieChartSVG({
  items,
}: {
  items: Array<{ label: string; count: number; color: string }>;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const size = 180;
  const cx = 90;
  const cy = 90;
  const r = 80;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 180 180" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="#E5E7EB" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#94a3b8">
          No Data
        </text>
      </svg>
    );
  }

  const nonzero = items.filter((i) => i.count > 0);

  if (nonzero.length === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 180 180" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill={nonzero[0].color} />
      </svg>
    );
  }

  let angle = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" className="shrink-0">
      {nonzero.map((item) => {
        const sweep = (item.count / total) * 360;
        const start = angle;
        const end = angle + sweep;
        angle = end;
        const startPt = polar(cx, cy, r, start);
        const endPt = polar(cx, cy, r, end);
        const large = sweep > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${large} 1 ${endPt.x} ${endPt.y} Z`;
        return <path key={item.label} d={d} fill={item.color} stroke="#fff" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

function ServiceBarChart({
  items,
}: {
  items: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  return (
    <div className="min-h-[220px]">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between h-44 text-[9px] text-slate-400 tabular-nums pr-1 text-right w-8">
          <span>{ticks[4]}</span>
          <span>{ticks[3]}</span>
          <span>{ticks[2]}</span>
          <span>{ticks[1]}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1 h-44 border-l border-b border-slate-300">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-slate-100 w-full" />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-1 px-1 overflow-x-auto">
            {items.map((item) => (
              <div key={item.label} className="flex-1 min-w-[22px] h-full flex items-end group relative">
                <div
                  className="w-full bg-emerald-400 hover:bg-emerald-500 rounded-t-sm transition-colors"
                  style={{ height: `${(item.count / max) * 100}%`, minHeight: item.count > 0 ? 3 : 0 }}
                  title={`${item.label}: ${item.count}`}
                />
                {item.count > 0 && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {item.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1 pl-10 mt-1 overflow-x-auto">
        {items.map((item) => (
          <span key={item.label} className="flex-1 min-w-[22px] text-[8px] text-slate-500 text-center leading-tight break-words">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LeadTimeline({ lead, fus }: { lead: any; fus: any[] }) {
  return (
    <div className="border-l-2 border-emerald-500 pl-4 ml-1 space-y-3 py-2">
      <div className="text-[11px]">
        <span className="font-bold text-slate-800">লিড তৈরি</span>
        <span className="text-slate-500">
          {" "}
          — {fmtISO(lead.leadDate || lead.createdAt || lead.date)} • {lead.source || "—"}
        </span>
      </div>

      {fus.map((f) => (
        <div key={f.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">Follow-up #{f.followUpNumber}</span>
              <span className="font-mono text-slate-500">
                {f.date} {f.time}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                {f.contactMethod}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                {f.outcome}
              </span>
              {f.attachmentName && (
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                  📎 {f.attachmentName}
                </span>
              )}
            </div>
            <p className="text-slate-700">
              <strong>Staff:</strong> {f.staffName || "—"}
            </p>
            {f.clientResponse && (
              <p className="text-slate-700">
                <strong>ক্লায়েন্টের সাড়া:</strong> {f.clientResponse}
              </p>
            )}
            <p className="text-slate-700">
              <strong>Note:</strong> {f.discussion || f.note}
            </p>
            <p className="text-slate-500">
              <strong>পরবর্তী ফলো-আপ:</strong>{" "}
              {f.nextFollowUpDate ? `${f.nextFollowUpDate} ${f.nextFollowUpTime || ""}` : "নেই (closed)"}
            </p>
          </div>
        </div>
      ))}

      {lead.reminder1 && (
        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <strong>Reminder 1:</strong> {lead.reminder1}
        </div>
      )}
      {lead.reminder2 && (
        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <strong>Reminder 2:</strong> {lead.reminder2}
        </div>
      )}
      {lead.reminder3 && (
        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <strong>Reminder 3:</strong> {lead.reminder3}
        </div>
      )}

      {fus.length === 0 && !lead.reminder1 && !lead.reminder2 && !lead.reminder3 && (
        <p className="text-[11px] text-slate-400">এখনো ফলো-আপ নেই।</p>
      )}
    </div>
  );
}

// ============================================================================
// EXCEL-LIKE SHEET TABLE (Stable Version - No Layout Break)
// ============================================================================

type SheetCol = {
  key: string;
  label: string;
  width: string;
  frozen?: boolean;
  align?: "left" | "center";
  get: (l: any) => string;
};

const SHEET_COLUMNS: SheetCol[] = [
  { key: "leadCode", label: "Lead ID", width: "140px", frozen: true, get: (l) => String(l.leadCode || l.id || "") },
  { key: "date", label: "Date", width: "100px", frozen: true, get: (l) => fmtISO(l.leadDate || l.createdAt || l.date) },
  { key: "name", label: "Client Name", width: "170px", frozen: true, get: (l) => String(l.name || "") },
  { key: "phone", label: "Contact No", width: "130px", get: (l) => String(l.phone || "") },
  { key: "location", label: "Location", width: "120px", get: (l) => String(l.location || l.preferredLocation || "") },
  { key: "source", label: "Source", width: "110px", get: (l) => String(l.source || "") },
  { key: "service", label: "Service Type", width: "170px", get: (l) => categoryOfLead(l) },
  { key: "priority", label: "Priority", width: "100px", align: "center", get: (l) => String(l.priority || "Warm") },
  { key: "status", label: "Status", width: "130px", align: "center", get: (l) => String(l.status || "") },
  { key: "requirement", label: "Client Requirement", width: "220px", get: (l) => dash(leadDisplayTexts(l).requirement) },
  { key: "insafResponse", label: "Insaf Response", width: "190px", get: (l) => dash(leadDisplayTexts(l).insafResponse) },
{ key: "remarks", label: "Remarks", width: "190px", get: (l) => dash(leadDisplayTexts(l).remarks) },
  { key: "nextFollowUpDate", label: "Next Follow-up", width: "120px", align: "center", get: (l) => String(l.nextFollowUpDate || "") },
  { key: "reminder1", label: "Reminder 1", width: "160px", get: (l) => String(l.reminder1 || "") },
  { key: "reminder2", label: "Reminder 2", width: "160px", get: (l) => String(l.reminder2 || "") },
  { key: "reminder3", label: "Reminder 3", width: "160px", get: (l) => String(l.reminder3 || "") },
];

function LeadSheetTable({
  leads,
  fuByLead,
  openLeadId,
  today,
  onOpenLead,
  onFollowUp,
  onEdit,
  onDelete,
  onMutate,
}: {
  leads: any[];
  fuByLead: Map<number, any[]>;
  openLeadId: number | null;
  today: string;
  onOpenLead: (id: number) => void;
  onFollowUp: (id: number) => void;
  onEdit: (lead: any) => void;
  onDelete: (lead: any) => void;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [colFilters, setColFilters] = useState<Record<string, string[]>>({});
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (!openFilterKey) return;
    function onDocClick(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (el.closest("[data-filter-popover]") || el.closest("[data-filter-trigger]")) return;
      setOpenFilterKey(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openFilterKey]);

  const filtered = useMemo(() => {
    let rows = leads;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      rows = rows.filter((l) => {
        const blob = [l.name, l.phone, l.leadCode, l.location, l.source, categoryOfLead(l)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    Object.entries(colFilters).forEach(([key, selected]) => {
      if (!selected || selected.length === 0) return;
      const col = SHEET_COLUMNS.find((c) => c.key === key);
      if (!col) return;
      const set = new Set(selected);
      rows = rows.filter((l) => set.has(col.get(l) || "(ফাঁকা)"));
    });
    return rows;
  }, [leads, colFilters, searchFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = SHEET_COLUMNS.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.get(a) || "";
      const bv = col.get(b) || "";
      const cmp = av.localeCompare(bv, "bn", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function uniqueValues(key: string) {
    const col = SHEET_COLUMNS.find((c) => c.key === key);
    if (!col) return [];
    const set = new Set<string>();
    leads.forEach((l) => set.add(col.get(l) || "(ফাঁকা)"));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "bn", { numeric: true }));
  }

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearAllFilters() {
    setColFilters({});
    setSortKey(null);
    setSortDir("asc");
    setSearchFilter("");
  }

  const activeFilterCount = Object.values(colFilters).filter((v) => v && v.length > 0).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
          <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
          দেখানো হচ্ছে <span className="text-slate-900 font-bold">{sorted.length}</span> / {leads.length}
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              {activeFilterCount} ফিল্টার
            </span>
          )}
          {sortKey && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
              সর্ট: {SHEET_COLUMNS.find((c) => c.key === sortKey)?.label}
            </span>
          )}
        </div>

        {(activeFilterCount > 0 || sortKey || searchFilter) && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1.5"
          >
            <Eraser className="w-3 h-3" /> রিসেট
          </button>
        )}
      </div>

      {/* Table Container with proper scrolling */}
      <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
        <table className="w-full text-[11px] border-collapse" style={{ tableLayout: "fixed", minWidth: "2000px" }}>
          <thead className="bg-slate-900 text-white sticky top-0 z-20">
            <tr>
              {SHEET_COLUMNS.map((col) => {
                const selected = colFilters[col.key] || [];
                const hasFilter = selected.length > 0;
                const isSorted = sortKey === col.key;

                return (
                  <th
                    key={col.key}
                    className={`font-semibold text-left px-2 py-2.5 border-r border-slate-700 ${
                      col.frozen ? "sticky left-0 z-30 bg-slate-900" : ""
                    }`}
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      textAlign: col.align || "left",
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 hover:text-emerald-300 truncate font-semibold"
                        title="সর্ট করুন"
                      >
                        <span className="truncate">{col.label}</span>
                        {isSorted && (
                          <span className="text-emerald-400 text-xs">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        data-filter-trigger
                        onClick={() => setOpenFilterKey(openFilterKey === col.key ? null : col.key)}
                        title="ফিল্টার"
                        className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition ${
                          hasFilter ? "bg-emerald-500 text-slate-950" : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        }`}
                      >
                        <ListFilter className="w-3 h-3" />
                      </button>
                    </div>

                    {openFilterKey === col.key && (
                      <ColumnFilterPopover
                        values={uniqueValues(col.key)}
                        selected={selected}
                        onApply={(vals) => {
                          setColFilters((prev) => ({ ...prev, [col.key]: vals }));
                          setOpenFilterKey(null);
                        }}
                        onClose={() => setOpenFilterKey(null)}
                      />
                    )}
                  </th>
                );
              })}

              <th className="font-semibold text-left px-2 py-2.5 border-l border-slate-700 sticky left-0 z-30 bg-slate-900" style={{ width: "280px", minWidth: "280px" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((l, idx) => {
              const fus = fuByLead.get(l.id) || [];
              const pStyle = priorityStyle(l.priority || "Warm");
              const PIcon = pStyle.Icon;
              const isOpen = openLeadId === l.id;
              const isToday = leadCreatedYmd(l) === today;
              const rowBg = isOpen ? "bg-emerald-50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/50";

              return (
                <tr key={l.id} className={`${rowBg} border-b border-slate-200 hover:bg-emerald-50/60 transition-colors`}>
                  {SHEET_COLUMNS.map((col, colIdx) => {
                    const value = col.get(l);
                    const isFrozen = col.frozen;
                    const isPriority = col.key === "priority";
                    const isStatus = col.key === "status";

                    return (
                      <td
                        key={col.key}
                        className={`px-2 py-2 border-r border-slate-200 truncate ${
                          isFrozen ? "sticky bg-inherit z-10" : ""
                        } ${colIdx === 2 ? "border-r-2 border-slate-300 font-semibold" : ""}`}
                        style={{
                          width: col.width,
                          minWidth: col.width,
                          textAlign: col.align || "left",
                          left: isFrozen ? getFrozenLeft(col.key) : undefined,
                        }}
                        title={value.length > 50 ? value : undefined}
                      >
                        {colIdx === 0 && isToday && (
                          <span className="inline-block mb-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-bold">
                            আজ
                          </span>
                        )}

                        {isPriority ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${pStyle.cls}`}>
                            <PIcon className="w-3 h-3" /> {value}
                          </span>
                        ) : isStatus ? (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusStyle(value)}`}>
                            {value}
                          </span>
                        ) : (
                          <span className="truncate block">{value || "—"}</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-2 py-2 border-l border-slate-200 sticky left-0 z-10 bg-inherit" style={{ width: "280px", minWidth: "280px" }}>
                    <div className="flex items-center gap-1 flex-wrap">
                      {!["Won", "Lost", "On Hold"].includes(l.status) && l.priority !== "Lost" && (
                        <button
                          type="button"
                          onClick={() => onFollowUp(l.id)}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shrink-0"
                        >
                          FU
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenLead(l.id)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold shrink-0"
                      >
                        {isOpen ? "Hide" : `TL(${fus.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(l)}
                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shrink-0"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(l)}
                        title="এক ক্লিকে ডিলিট — Ctrl+Z দিয়ে ফেরানো যাবে"
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {l.status !== "Won" && (
                        <button
                          type="button"
                          onClick={() => onMutate({ action: "convertLeadToClient", leadId: l.id })}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0"
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={SHEET_COLUMNS.length + 1} className="px-4 py-10 text-center text-slate-400">
                  কোনো লিড পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper for frozen column positioning
function getFrozenLeft(key: string): string {
  const frozenCols = SHEET_COLUMNS.filter((c) => c.frozen);
  const idx = frozenCols.findIndex((c) => c.key === key);
  if (idx === -1) return "auto";

  let left = 0;
  for (let i = 0; i < idx; i++) {
    left += parseInt(frozenCols[i].width) || 0;
  }
  return `${left}px`;
}

// ---- Simple Column Filter Popover ----
function ColumnFilterPopover({
  values,
  selected,
  onApply,
  onClose,
}: {
  values: string[];
  selected: string[];
  onApply: (vals: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<string[]>(selected.length ? selected : values);

  const shown = useMemo(
    () => values.filter((v) => v.toLowerCase().includes(search.trim().toLowerCase())),
    [values, search]
  );

  const allChecked = shown.length > 0 && shown.every((v) => draft.includes(v));

  function toggle(v: string) {
    setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  }

  function toggleAll() {
    if (allChecked) setDraft((d) => d.filter((v) => !shown.includes(v)));
    else setDraft((d) => Array.from(new Set([...d, ...shown])));
  }

  return (
    <div
      data-filter-popover
      className="absolute top-full left-0 mt-1 w-56 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-slate-200 bg-slate-50">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="খুঁজুন…"
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <button
        type="button"
        onClick={toggleAll}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold hover:bg-slate-50 border-b border-slate-200"
      >
        <span
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
            allChecked ? "bg-emerald-500 border-emerald-600" : "bg-white border-slate-400"
          }`}
        >
          {allChecked && <Check className="w-2.5 h-2.5 text-white" />}
        </span>
        সব নির্বাচন করুন
      </button>

      <div className="max-h-48 overflow-y-auto">
        {shown.map((v) => {
          const checked = draft.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-slate-50 text-left"
            >
              <span
                className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                  checked ? "bg-emerald-500 border-emerald-600" : "bg-white border-slate-400"
                }`}
              >
                {checked && <Check className="w-2.5 h-2.5 text-white" />}
              </span>
              <span className="truncate" title={v}>
                {v}
              </span>
            </button>
          );
        })}
        {shown.length === 0 && <p className="px-3 py-4 text-[11px] text-slate-400 text-center">কিছু পাওয়া যায়নি</p>}
      </div>

      <div className="flex gap-1.5 p-2 border-t border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => onApply([])}
          className="flex-1 px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold"
        >
          মুছুন
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 text-[11px] font-bold"
        >
          বাতিল
        </button>
        <button
          type="button"
          onClick={() => onApply(draft.length === values.length ? [] : draft)}
          className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
        >
          প্রয়োগ
        </button>
      </div>
    </div>
  );
}
function EditLeadModal({
  lead,
  form,
  setForm,
  employees,
  onClose,
  onSave,
}: {
  lead: any;
  form: any;
  setForm: React.Dispatch<any>;
  employees: any[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
}) {
  const isIREL = form.companyId === "IREL";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 overflow-y-auto">
      <form onSubmit={onSave} className="bg-white w-full max-w-3xl rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Lead — {lead.name}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Lead ID: {lead.leadCode || lead.id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={form.companyId} onChange={(e) => setForm((p: any) => ({ ...p, companyId: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="IBDC">IBDC</option>
            <option value="IREL">IREL</option>
          </select>
          <input type="date" value={form.leadDate} onChange={(e) => setForm((p: any) => ({ ...p, leadDate: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <select value={form.status} onChange={(e) => setForm((p: any) => ({ ...p, status: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            {LEAD_STATUSES_FULL.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="text" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Client Name" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" value={form.phone} onChange={(e) => setForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" value={form.whatsapp} onChange={(e) => setForm((p: any) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" value={form.location} onChange={(e) => setForm((p: any) => ({ ...p, location: e.target.value }))} placeholder="Location" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <select value={form.source} onChange={(e) => setForm((p: any) => ({ ...p, source: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            {LEAD_SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={form.priority} onChange={(e) => setForm((p: any) => ({ ...p, priority: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            {LEAD_PRIORITY_OPTIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {isIREL ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.propertyType} onChange={(e) => setForm((p: any) => ({ ...p, propertyType: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
              {IREL_PROPERTY_TYPES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input type="text" value={form.projectName} onChange={(e) => setForm((p: any) => ({ ...p, projectName: e.target.value }))} placeholder="Project Name" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={form.unitFlatShop} onChange={(e) => setForm((p: any) => ({ ...p, unitFlatShop: e.target.value }))} placeholder="Unit/Flat/Shop" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={form.preferredLocation} onChange={(e) => setForm((p: any) => ({ ...p, preferredLocation: e.target.value }))} placeholder="Preferred Location" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={form.size} onChange={(e) => setForm((p: any) => ({ ...p, size: e.target.value }))} placeholder="Size" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={form.floor} onChange={(e) => setForm((p: any) => ({ ...p, floor: e.target.value }))} placeholder="Floor" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={form.bedrooms} onChange={(e) => setForm((p: any) => ({ ...p, bedrooms: e.target.value }))} placeholder="Bedrooms" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <select value={form.purpose} onChange={(e) => setForm((p: any) => ({ ...p, purpose: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
              <option>Own Use</option>
              <option>Investment</option>
            </select>
            <input type="date" value={form.expectedPurchaseDate} onChange={(e) => setForm((p: any) => ({ ...p, expectedPurchaseDate: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <textarea value={form.clientRequirement} onChange={(e) => setForm((p: any) => ({ ...p, clientRequirement: e.target.value }))} placeholder="Client Requirement" rows={2} className="md:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.service} onChange={(e) => setForm((p: any) => ({ ...p, service: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
              {IBDC_SERVICES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input type="text" value={form.landSize} onChange={(e) => setForm((p: any) => ({ ...p, landSize: e.target.value }))} placeholder="Land Size" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <input type="text" value={form.roadWidth} onChange={(e) => setForm((p: any) => ({ ...p, roadWidth: e.target.value }))} placeholder="Road Width" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
            <textarea value={form.requirement} onChange={(e) => setForm((p: any) => ({ ...p, requirement: e.target.value }))} placeholder="Client Requirement" rows={2} className="md:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="number" value={form.budget} onChange={(e) => setForm((p: any) => ({ ...p, budget: e.target.value }))} placeholder="Budget" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="date" value={form.nextFollowUpDate} onChange={(e) => setForm((p: any) => ({ ...p, nextFollowUpDate: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <select value={form.assignedStaffId} onChange={(e) => setForm((p: any) => ({ ...p, assignedStaffId: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="">অনির্ধারিত স্টাফ</option>
            {employees.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <textarea value={form.insafResponse} onChange={(e) => setForm((p: any) => ({ ...p, insafResponse: e.target.value }))} placeholder="Insaf Response" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
        <textarea value={form.remarks} onChange={(e) => setForm((p: any) => ({ ...p, remarks: e.target.value }))} placeholder="Remarks" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" value={form.reminder1} onChange={(e) => setForm((p: any) => ({ ...p, reminder1: e.target.value }))} placeholder="Reminder 1" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" value={form.reminder2} onChange={(e) => setForm((p: any) => ({ ...p, reminder2: e.target.value }))} placeholder="Reminder 2" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
          <input type="text" value={form.reminder3} onChange={(e) => setForm((p: any) => ({ ...p, reminder3: e.target.value }))} placeholder="Reminder 3" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

// Backward-compatible name used by ErpAppShell.tsx.
export { LeadsView as LeadsCrmView };