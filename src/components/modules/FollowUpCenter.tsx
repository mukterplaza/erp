"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  PhoneOff,
  Users,
  Clock,
  Paperclip,
  X,
  PlusCircle,
  History,
  Hourglass,
  BellRing,
} from "lucide-react";
import {
  FOLLOWUP_METHODS,
  FOLLOWUP_OUTCOMES,
  LEAD_CLOSED_STATUSES,
  OUTCOME_TO_STATUS,
} from "@/lib/crm-constants";

 

// বাংলা মাধ্যম অনুবাদ
export function getMethodBangla(m: string): string {
  switch (m) {
    case "Phone Call":
      return "ফোন কল (Phone Call)";
    case "WhatsApp":
      return "হোয়াটসঅ্যাপ (WhatsApp)";
    case "Facebook":
      return "ফেসবুক (Facebook)";
    case "SMS":
      return "এসএমএস (SMS)";
    case "Email":
      return "ইমেইল (Email)";
    case "Meeting":
      return "সরাসরি মিটিং (Meeting)";
    case "Office Visit":
      return "অফিসে আগমন (Office Visit)";
    case "Site Visit":
      return "সাইট পরিদর্শন (Site Visit)";
    default:
      return m || "অন্যান্য";
  }
}

// বাংলা ফলাফল অনুবাদ
export function getOutcomeBangla(o: string): string {
  switch (o) {
    case "No Response":
      return "সাড়া মেলেনি (No Response)";
    case "Contacted":
      return "যোগাযোগ হয়েছে (Contacted)";
    case "Interested":
      return "আগ্রহী (Interested)";
    case "Qualified":
      return "যোগ্য লিড (Qualified)";
    case "Need More Information":
      return "তথ্য প্রয়োজন (Need More Info)";
    case "Quotation Sent":
      return "কোটেশন প্রেরিত (Quotation Sent)";
    case "Negotiating":
      return "দরাদরি চলছে (Negotiating)";
    case "Call Back Later":
      return "পরে কল করতে বলেছেন (Call Back Later)";
    case "Not Interested":
      return "অনাগ্রহী (Not Interested)";
    case "Won":
      return "সফল সমাপ্তি (Won)";
    case "Lost":
      return "বাতিল/ব্যর্থ (Lost)";
    default:
      return o || "অন্যান্য";
  }
}

// =============================================================================
// 16. FOLLOW-UP DASHBOARD BAND (all values from PostgreSQL)
// =============================================================================
export function FollowUpStatsBand({
  stats,
  onRunReminders,
  onJump,
}: {
  stats: any;
  onRunReminders: () => void;
  onJump: (bucket: string) => void;
}) {
  if (!stats) return null;

  const cards = [
    {
      key: "Today",
      label: "আজকের ফলো-আপ",
      value: stats.dueToday,
      cls: "text-emerald-600",
      icon: CalendarClock,
    },
    {
      key: "Overdue",
      label: "মেয়াদোত্তীর্ণ ফলো-আপ",
      value: stats.overdue,
      cls: "text-rose-600",
      icon: AlertTriangle,
    },
    {
      key: "Upcoming",
      label: "আসন্ন ফলো-আপ",
      value: stats.upcoming,
      cls: "text-blue-600",
      icon: CalendarDays,
    },
    {
      key: "CompletedToday",
      label: "আজ সম্পন্নকৃত",
      value: stats.completedToday,
      cls: "text-slate-900",
      icon: CheckCircle2,
    },
    {
      key: "Unscheduled",
      label: "পরবর্তী তারিখ বিহীন",
      value: stats.withoutNextFollowUp,
      cls: "text-amber-600",
      icon: Hourglass,
    },
    {
      key: "NoResponse",
      label: "সাড়া মেলেনি (No Response)",
      value: stats.noResponse,
      cls: "text-purple-600",
      icon: PhoneOff,
    },
    {
      key: "Active",
      label: "সক্রিয় লিডসমূহ",
      value: stats.activeLeads,
      cls: "text-slate-900",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          ফলো-আপ কমান্ড সেন্টার — রিয়েল-টাইম মেট্রিক্স ({stats.today})
        </h2>
        <button
          type="button"
          onClick={onRunReminders}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <BellRing className="w-3.5 h-3.5" /> রিমাইন্ডার নোটিফিকেশন চালু করুন
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onJump(c.key)}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-left hover:border-slate-400 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500 font-medium">{c.label}</p>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className={`text-2xl font-bold mt-1 ${c.cls}`}>{c.value}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// 4, 5 & 6. OVERDUE / TODAY / UPCOMING FOLLOW-UP QUEUES
// =============================================================================
function QueueRow({
  lead,
  staffMap,
  onFollowUpNow,
  onOpenLead,
  variant,
}: {
  lead: any;
  staffMap: Map<number, any>;
  onFollowUpNow: (lead: any) => void;
  onOpenLead: (lead: any) => void;
  variant: "overdue" | "today" | "upcoming";
}) {
  const staff = staffMap.get(lead.assignedStaffId);
  const category = lead.propertyType || lead.service || "—";

  return (
    <tr
      className="hover:bg-slate-50 cursor-pointer transition"
      onClick={() => onOpenLead(lead)}
    >
      <td className="p-3">
        <div className="font-bold text-slate-900">{lead.name}</div>
        <div className="text-[11px] text-slate-400 font-mono">{lead.leadCode}</div>
      </td>
      <td className="p-3 text-slate-700 font-mono">{lead.phone}</td>
      <td className="p-3 text-slate-700 font-medium">{category}</td>
      <td className="p-3 text-slate-700">{staff?.name || "বরাদ্দহীন"}</td>
      <td className="p-3">
        <span className="text-slate-700">{lead.lastContactDate || "কখনো নয়"}</span>
        <div className="text-[11px] text-slate-400">
          {lead.followUpCount} টি ফলো-আপ সম্পন্ন
        </div>
      </td>
      <td className="p-3">
        {variant === "overdue" ? (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px]">
            🔴 {lead.nextFollowUpDate} — {lead.daysOverdue} দিন মেয়াদোত্তীর্ণ
          </span>
        ) : variant === "today" ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
            🟢 আজ (TODAY) {lead.nextFollowUpTime || ""}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
            {lead.nextFollowUpDate} ({lead.daysUntil} দিন পর)
          </span>
        )}
      </td>
      <td className="p-3 text-center font-bold text-slate-900">
        {lead.daysSinceLastContact === null ? "—" : `${lead.daysSinceLastContact} দিন`}
      </td>
      <td className="p-3">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            lead.priority === "Hot"
              ? "bg-orange-100 text-orange-700"
              : lead.priority === "Cold"
              ? "bg-slate-200 text-slate-600"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {lead.priority === "Hot" ? "জরুরি (Hot)" : lead.priority === "Cold" ? "ধীর (Cold)" : "মধ্যম (Warm)"}
        </span>
        <div className="text-[10px] text-slate-500 mt-1 font-medium">{lead.status}</div>
      </td>
      <td className="p-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFollowUpNow(lead);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold whitespace-nowrap shadow-sm transition"
        >
          এখনই ফলো-আপ দিন
        </button>
      </td>
    </tr>
  );
}

export function FollowUpQueues({
  leads,
  staffMap,
  onFollowUpNow,
  onOpenLead,
}: {
  leads: any[];
  staffMap: Map<number, any>;
  onFollowUpNow: (lead: any) => void;
  onOpenLead: (lead: any) => void;
}) {
  const [upcomingRange, setUpcomingRange] = useState<1 | 3 | 7>(7);

  const overdue = leads
    .filter((l) => l.isOverdue)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  const todays = leads.filter((l) => l.isDueToday);
  const upcoming = leads
    .filter((l) => l.daysUntil >= 1 && l.daysUntil <= upcomingRange)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const header = (
    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
      <th className="p-3 font-semibold">গ্রাহক / ক্লায়েন্ট</th>
      <th className="p-3 font-semibold">ফোন নম্বর</th>
      <th className="p-3 font-semibold">সেবা / প্রপার্টি</th>
      <th className="p-3 font-semibold">দায়িত্বপ্রাপ্ত কর্মকর্তা</th>
      <th className="p-3 font-semibold">পূর্ববর্তী ফলো-আপ</th>
      <th className="p-3 font-semibold">পরবর্তী ফলো-আপের সময়সূচি</th>
      <th className="p-3 font-semibold text-center">যোগাযোগের ব্যবধান</th>
      <th className="p-3 font-semibold">অগ্রাধিকার ও স্ট্যাটাস</th>
      <th className="p-3 font-semibold">পদক্ষেপ</th>
    </tr>
  );

  return (
    <div className="space-y-5">
      {/* মেয়াদোত্তীর্ণ ফলো-আপ */}
      <div
        id="queue-Overdue"
        className="bg-white rounded-2xl border-l-4 border-rose-500 border border-slate-200 overflow-hidden shadow-xs"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              মেয়াদোত্তীর্ণ ফলো-আপসমূহ ({overdue.length})
            </h3>
          </div>
          <span className="text-xs text-rose-600 font-medium">
            নির্ধারিত তারিখ পার হয়েছে — জরুরি যোগাযোগ প্রয়োজন
          </span>
        </div>
        {overdue.length === 0 ? (
          <p className="p-5 text-xs text-slate-400">
            কোনো মেয়াদোত্তীর্ণ ফলো-আপ নেই। সকল লিডের ফলো-আপ সঠিক সময়সূচিতে রয়েছে।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>{header}</thead>
              <tbody className="divide-y divide-slate-100">
                {overdue.map((l) => (
                  <QueueRow
                    key={l.id}
                    lead={l}
                    staffMap={staffMap}
                    onFollowUpNow={onFollowUpNow}
                    onOpenLead={onOpenLead}
                    variant="overdue"
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* আজকের ফলো-আপ */}
      <div
        id="queue-Today"
        className="bg-white rounded-2xl border-l-4 border-emerald-500 border border-slate-200 overflow-hidden shadow-xs"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              আজকের ফলো-আপ তালিকা ({todays.length})
            </h3>
          </div>
          <span className="text-xs text-emerald-700 font-medium">
            আজ যোগাযোগ করার জন্য নির্ধারিত
          </span>
        </div>
        {todays.length === 0 ? (
          <p className="p-5 text-xs text-slate-400">
            আজকের জন্য কোনো নতুন ফলো-আপ নির্ধারিত নেই।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>{header}</thead>
              <tbody className="divide-y divide-slate-100">
                {todays.map((l) => (
                  <QueueRow
                    key={l.id}
                    lead={l}
                    staffMap={staffMap}
                    onFollowUpNow={onFollowUpNow}
                    onOpenLead={onOpenLead}
                    variant="today"
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* আসন্ন ফলো-আপ */}
      <div
        id="queue-Upcoming"
        className="bg-white rounded-2xl border-l-4 border-blue-500 border border-slate-200 overflow-hidden shadow-xs"
      >
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              আসন্ন ফলো-আপ তালিকা ({upcoming.length})
            </h3>
          </div>
          <div className="flex gap-1.5">
            {([1, 3, 7] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setUpcomingRange(r)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                  upcomingRange === r
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r === 1 ? "আগামীকাল" : `পরবর্তী ${r} দিন`}
              </button>
            ))}
          </div>
        </div>
        {upcoming.length === 0 ? (
          <p className="p-5 text-xs text-slate-400">
            এই সময়সীমার মধ্যে কোনো ফলো-আপ নির্ধারিত নেই।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>{header}</thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((l) => (
                  <QueueRow
                    key={l.id}
                    lead={l}
                    staffMap={staffMap}
                    onFollowUpNow={onFollowUpNow}
                    onOpenLead={onOpenLead}
                    variant="upcoming"
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// 9. QUICK "+ ADD FOLLOW-UP" MODAL (Bangla)
// =============================================================================
export function AddFollowUpModal({
  lead,
  onClose,
  onSubmit,
}: {
  lead: any;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [today] = useState(() => new Date().toISOString().split("T")[0]);

  const [method, setMethod] = useState("Phone Call");
  const [outcome, setOutcome] = useState("Contacted");
  const [clientResponse, setClientResponse] = useState("");
  const [note, setNote] = useState("");
  const [nextDate, setNextDate] = useState(() =>
    new Date(new Date().getTime() + 2 * 86400000).toISOString().split("T")[0]
  );
  const [nextTime, setNextTime] = useState("10:00");
  const [attachments, setAttachments] = useState<
    Array<{ name: string; type: string; size: string; url: string }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mappedStatus = OUTCOME_TO_STATUS[outcome] || "Follow-up Required";
  const isClosing = LEAD_CLOSED_STATUSES.includes(mappedStatus);
  const nextNumber = (lead.followUpCount || 0) + 1;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isClosing && !nextDate) {
      setError(
        "পরবর্তী ফলো-আপের তারিখ প্রদান করা বাধ্যতামূলক — সক্রিয় লিড ভুলে যাওয়া প্রতিরোধে এটি আবশ্যক।"
      );
      return;
    }

    setSaving(true);
    const res = await onSubmit({
      action: "addLeadFollowup",
      leadId: lead.id,
      method,
      outcome,
      clientResponse,
      note,
      nextFollowUpDate: isClosing ? null : nextDate,
      nextFollowUpTime: isClosing ? null : nextTime,
      attachments,
    });
    setSaving(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl w-full max-w-2xl my-8 shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              ফলো-আপ #{nextNumber}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              ফলো-আপ সম্পন্ন ও আপডেট করুন — {lead.name}
            </h3>
            <p className="text-xs text-slate-500">
              {lead.leadCode} • {lead.phone} • পূর্ববর্তী মোট ফলো-আপ:{" "}
              {lead.followUpCount || 0} টি • শেষ যোগাযোগ:{" "}
              {lead.lastContactDate || "কখনো নয়"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                যোগাযোগের মাধ্যম *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {FOLLOWUP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {getMethodBangla(m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ফলাফল (Outcome) *
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {FOLLOWUP_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {getOutcomeBangla(o)}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                লিডের নতুন স্ট্যাটাস হবে:{" "}
                <strong className="text-slate-900">{mappedStatus}</strong>
                {(outcome === "No Response" || outcome === "Call Back Later") &&
                  " — লিড সক্রিয় থাকবে, পরবর্তী তারিখ নির্ধারণ করুন।"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              গ্রাহকের বক্তব্য / প্রতিক্রিয়া
            </label>
            <input
              type="text"
              value={clientResponse}
              onChange={(e) => setClientResponse(e.target.value)}
              placeholder="যেমন: আগামী সপ্তাহে কথা বলবেন / পরিবারের সাথে আলোচনা করে জানাবেন"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              কর্মকর্তার নোট / সারসংক্ষেপ *
            </label>
            <textarea
              required
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="কল দেওয়া হয়েছিল কিন্তু রিসিভ হয়নি। আগামী রবিবার পুনরায় যোগাযোগ করা হবে।"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div
            className={`p-3.5 rounded-2xl border ${
              isClosing
                ? "bg-slate-50 border-slate-200"
                : "bg-emerald-50/60 border-emerald-300"
            }`}
          >
            {isClosing ? (
              <p className="text-xs text-slate-600 font-medium">
                এই ফলাফলের কারণে লিডটি{" "}
                <strong className="text-slate-900">{mappedStatus}</strong> হিসেবে সমাপ্ত হবে। পরবর্তী ফলো-আপের সময়সূচির প্রয়োজন নেই।
              </p>
            ) : (
              <>
                <p className="text-xs font-bold text-emerald-900 mb-2">
                  পরবর্তী ফলো-আপ আবশ্যক (লিডটি সক্রিয় রয়েছে)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      পরবর্তী তারিখ *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      পরবর্তী সময়
                    </label>
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-medium"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> ফাইল সংযুক্তি / প্রমাণপত্র (ঐচ্ছিক)
            </label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments(
                  files.map((f) => ({
                    name: f.name,
                    type: f.type || "FILE",
                    size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                    url: `#followup-${encodeURIComponent(f.name)}`,
                  }))
                );
              }}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {attachments.map((a, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold"
                  >
                    {a.name} ({a.size})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 transition shadow-sm"
          >
            {saving ? "সংরক্ষণ করা হচ্ছে..." : `ফলো-আপ #${nextNumber} সংরক্ষণ করুন`}
          </button>
        </div>
      </form>
    </div>
  );
}

// =============================================================================
// 8. FOLLOW-UP TIMELINE (Lead 360 chronological view in Bangla)
// =============================================================================
export function FollowUpTimeline({
  lead,
  history,
}: {
  lead: any;
  history: any[];
}) {
  const ordered = history
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? b.followupNumber - a.followupNumber
        : a.date < b.date
        ? 1
        : -1
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-900">
          ফলো-আপ টাইমলাইন — {lead.leadCode} ({lead.name})
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
          {ordered.length} টি ফলো-আপ রেকর্ড
        </span>
      </div>

      <div className="relative pl-6 space-y-3">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

        {ordered.length === 0 && (
          <p className="text-xs text-slate-400">
            এখনও কোনো ফলো-আপ রেকর্ড করা হয়নি। &ldquo;+ ফলো-আপ যোগ করুন&rdquo; বোতাম ব্যবহার করুন।
          </p>
        )}

        {ordered.map((f, idx) => (
          <div key={f.id} className="relative">
            <span
              className={`absolute -left-[18px] top-2.5 w-3 h-3 rounded-full border-2 border-white ${
                idx === 0 ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
              }`}
            />
            <div
              className={`p-3.5 rounded-2xl border text-xs ${
                idx === 0
                  ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[10px]">
                    ফলো-আপ #{f.followupNumber}
                  </span>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                      সর্বশেষ
                    </span>
                  )}
                  <span className="font-bold text-slate-900">
                    {f.date} {f.time || ""}
                  </span>
                  <span className="text-slate-500">পরিচালক: {f.staffName}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    f.outcome === "Won"
                      ? "bg-emerald-100 text-emerald-800"
                      : f.outcome === "Lost" || f.outcome === "Not Interested"
                      ? "bg-rose-100 text-rose-700"
                      : f.outcome === "No Response"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {getOutcomeBangla(f.outcome || f.result)}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
                <div>
                  <span className="text-slate-400">মাধ্যম:</span>{" "}
                  <strong>{getMethodBangla(f.method || "Phone Call")}</strong>
                </div>
                <div>
                  <span className="text-slate-400">পরবর্তী ফলো-আপ:</span>{" "}
                  <strong className={f.nextFollowUpDate ? "text-emerald-700" : ""}>
                    {f.nextFollowUpDate
                      ? `${f.nextFollowUpDate} ${f.nextFollowUpTime || ""}`
                      : "— (সমাপ্ত)"}
                  </strong>
                </div>
              </div>

              {(f.clientResponse || f.nextAction) && (
                <p className="mt-1.5 text-slate-600">
                  <span className="text-slate-400">গ্রাহকের প্রতিক্রিয়া:</span>{" "}
                  {f.clientResponse || f.nextAction}
                </p>
              )}
              <p className="mt-1 text-slate-800">
                <span className="text-slate-400">পর্যবেক্ষণ নোট:</span> {f.note || f.discussion}
              </p>

              {(f.attachments || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(f.attachments || []).map((a: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-slate-300 text-[10px] font-semibold text-slate-700"
                    >
                      <Paperclip className="w-3 h-3" /> {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Lead Created anchor */}
        <div className="relative">
          <span className="absolute -left-[18px] top-2.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <span className="font-bold text-slate-900">লিড তৈরি সম্পন্ন</span>
            <span className="text-slate-500 ml-2">
              {lead.createdAt ? String(lead.createdAt).split("T")[0] : "—"} • সোর্স:{" "}
              {lead.source}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 13. MANAGEMENT VIEW (RBAC-gated in Bangla)
// =============================================================================
export function ManagementFollowUpView({
  leads,
  staffStats,
  onOpenLead,
}: {
  leads: any[];
  staffStats: any[];
  onOpenLead: (lead: any) => void;
}) {
  const buckets = [
    {
      title: "কখনও ফলো-আপ না হওয়া লিড",
      rows: leads.filter((l) => l.neverFollowedUp),
      cls: "border-rose-400",
    },
    {
      title: "একাধিকবার ফলো-আপকৃত লিড",
      rows: leads.filter((l) => l.followUpCount > 1),
      cls: "border-emerald-400",
    },
    {
      title: "সাড়া মেলেনি এমন লিড (No Response)",
      rows: leads.filter((l) => l.lastOutcome === "No Response"),
      cls: "border-amber-400",
    },
    {
      title: "গ্রাহকের উত্তরের অপেক্ষায় থাকা লিড",
      rows: leads.filter((l) => l.awaitingClientResponse),
      cls: "border-blue-400",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {buckets.map((b) => (
          <div
            key={b.title}
            className={`bg-white rounded-2xl border-l-4 ${b.cls} border border-slate-200 p-4 shadow-xs`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
              <span className="text-lg font-bold text-slate-900">{b.rows.length}</span>
            </div>
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {b.rows.length === 0 && (
                <p className="text-[11px] text-slate-400">কোনো তথ্য নেই</p>
              )}
              {b.rows.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onOpenLead(l)}
                  className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition truncate"
                >
                  <strong className="text-slate-800">{l.name}</strong>{" "}
                  <span className="text-slate-500">
                    ({l.leadCode} • {l.followUpCount} টি)
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">
            কর্মকর্তাদের ফলো-আপ কার্যক্ষমতা নিরীক্ষা (Staff Performance)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">কর্মকর্তার নাম</th>
                <th className="p-3 font-semibold text-center">সক্রিয় লিড</th>
                <th className="p-3 font-semibold text-center">আজকের ফলো-আপ</th>
                <th className="p-3 font-semibold text-center">মোট সম্পন্নকৃত</th>
                <th className="p-3 font-semibold text-center">মেয়াদোত্তীর্ণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-5 text-xs text-slate-400 text-center">
                    এখনও কোনো কর্মকর্তা-ভিত্তিক কার্যবিবরণী নেই।
                  </td>
                </tr>
              )}
              {staffStats.map((s) => (
                <tr key={s.employeeId} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{s.empCode}</div>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-900">
                    {s.activeLeads}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-600">
                    {s.followUpsToday}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700">
                    {s.followUpsCompleted}
                  </td>
                  <td className="p-3 text-center font-bold text-rose-600">
                    {s.overdueFollowUps}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const FollowUpIcons = { Clock, PlusCircle, CheckCircle2 };
