"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Search, AlertTriangle } from "lucide-react";
import {
  TaskCard,
  STATUS_LABEL,
  displayStatus,
  fmtDate,
  fmtDateTime,
  statusCls,
} from "./EmployeeDirectoryView";

const MGMT_ROLES = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Project Manager"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function TeamTaskMonitorView({
  data,
  onMutate,
  focusedTaskId,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
  focusedTaskId?: number;
}) {
  const me = data.currentUser;
  const isMgmt = MGMT_ROLES.includes(me?.role);
  const allTasks: any[] = useMemo(
    () => (data.tasks || []).filter((t: any) => t.status !== "Cancelled"),
    [data.tasks]
  );
  const employees: any[] = (data.employees || []).filter((e: any) => !e.archived);
  const directory: any[] = data.allEmployeesDirectory || [];
  const projects: any[] = data.projects || [];
  const sites: any[] = data.sites || [];
  const comments: any[] = data.taskComments || [];
  const files: any[] = data.workFiles || [];

  // Auto-record "viewed" when the assignee opens their task (server ignores anyone else)
  const viewedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!focusedTaskId || viewedRef.current === focusedTaskId) return;
    const t = allTasks.find((x) => x.id === focusedTaskId);
    if (t && t.assignedTo === me?.employeeId && !t.viewedAt) {
      viewedRef.current = focusedTaskId;
      fetch("/api/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markTaskViewed", taskId: focusedTaskId }),
      }).catch(() => {});
    }
  }, [focusedTaskId, allTasks, me?.employeeId]);

  const [q, setQ] = useState("");
  const [by, setBy] = useState("All");
  const [to, setTo] = useState(isMgmt ? "All" : String(me?.employeeId || ""));
  const [proj, setProj] = useState("All");
  const [site, setSite] = useState("All");
  const [status, setStatus] = useState("Open");
  const [prio, setPrio] = useState("All");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [openId, setOpenId] = useState<number | null>(focusedTaskId || null);

  if (focusedTaskId) {
    const t = allTasks.find((x) => x.id === focusedTaskId);
    if (!t) {
      return (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-rose-900">টাস্ক পাওয়া যায়নি বা দেখার অনুমতি নেই</h2>
          <a href="/team-tasks" className="inline-block mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">টাস্ক তালিকায় ফিরুন</a>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <a href="/team-tasks" className="inline-block px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">← টাস্ক তালিকা</a>
        <TaskCard
          t={t}
          comments={comments.filter((c) => c.taskId === t.id)}
          files={files}
          isMgmt={isMgmt}
          isSelf={t.assignedTo === me?.employeeId}
          onMutate={onMutate}
          projects={projects}
          sites={sites}
          employees={employees}
          defaultTimeline
        />
      </div>
    );
  }

  const assigners = Array.from(
    new Map(allTasks.filter((t) => t.assignedByName).map((t) => [t.assignedByName, t.assignedByName])).values()
  );
  const today = todayStr();

  const list = allTasks
    .filter((t) => {
      const ds = displayStatus(t);
      const text = [t.title, t.taskCode, t.description, t.assignedByName, t.assignedToName].join(" ").toLowerCase();
      if (q.trim() && !text.includes(q.trim().toLowerCase())) return false;
      if (by !== "All" && t.assignedByName !== by) return false;
      if (to !== "All" && to !== "" && String(t.assignedTo) !== to) return false;
      if (proj !== "All" && String(t.projectId || "") !== proj) return false;
      if (site !== "All" && String(t.siteId || "") !== site) return false;
      if (status === "Open" && t.status === "Completed") return false;
      if (status !== "All" && status !== "Open" && ds !== status) return false;
      if (prio !== "All" && t.priority !== prio) return false;
      const created = String(t.createdAt).slice(0, 10);
      if (from && created < from) return false;
      if (until && created > until) return false;
      if (dueFrom && t.dueDate < dueFrom) return false;
      if (dueTo && t.dueDate > dueTo) return false;
      return true;
    })
    .sort((a, b) => {
      const ao = displayStatus(a) === "Overdue" ? 0 : 1;
      const bo = displayStatus(b) === "Overdue" ? 0 : 1;
      return ao - bo || (a.dueDate < b.dueDate ? -1 : 1);
    });

  const count = (fn: (t: any) => boolean) => list.filter(fn).length;
  const selectedEmp = to !== "All" ? directory.find((e) => String(e.id) === to) : null;
  const work = selectedEmp ? (data.employeeWork || []).find((w: any) => w.employeeId === selectedEmp.id) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          {isMgmt ? "টিম টাস্ক মনিটরিং" : "আমার দায়িত্ব ও টাস্ক"}
        </h1>
        <p className="text-xs text-slate-500">
          {isMgmt
            ? "কে কাকে কাজ দিয়েছে, কখন, ডেডলাইন, অগ্রগতি, সর্বশেষ আপডেট ও অনুমোদন — এক জায়গায়।"
            : "আপনাকে দেওয়া সব কাজ, নির্দেশনা, ডেডলাইন ও অগ্রগতি।"}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
        {[
          ["মোট", count(() => true), "text-slate-900"],
          ["শুরু হয়নি", count((t) => t.status === "Todo" || t.status === "Accepted"), "text-slate-600"],
          ["চলমান", count((t) => t.status === "In Progress" || t.status === "Reopened"), "text-blue-600"],
          ["অনুমোদনের অপেক্ষায়", count((t) => t.status === "Review"), "text-purple-600"],
          ["সংশোধন প্রয়োজন", count((t) => t.status === "Reopened"), "text-orange-600"],
          ["আটকে আছে", count((t) => t.status === "Blocked"), "text-rose-600"],
          ["সম্পন্ন", count((t) => t.status === "Completed"), "text-emerald-600"],
          ["ওভারডিউ", count((t) => displayStatus(t) === "Overdue"), "text-rose-600"],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="bg-white p-3 rounded-xl border border-slate-200">
            <p className="text-[11px] text-slate-500">{l}</p>
            <p className={`text-xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="কাজ, কোড, দাতা, কর্মী খুঁজুন"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          {isMgmt && (
            <select value={by} onChange={(e) => setBy(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300">
              <option value="All">যিনি দিয়েছেন: সবাই</option>
              {assigners.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          {isMgmt && (
            <select value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300">
              <option value="All">যাকে দেওয়া: সবাই</option>
              {directory.map((e) => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
            </select>
          )}
          <select value={proj} onChange={(e) => setProj(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300">
            <option value="All">সব প্রজেক্ট</option>
            {projects.map((p) => <option key={p.id} value={String(p.id)}>{p.projectCode} — {p.name}</option>)}
          </select>
          <select value={site} onChange={(e) => setSite(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300">
            <option value="All">সব সাইট</option>
            {sites.map((s) => <option key={s.id} value={String(s.id)}>{s.siteCode} — {s.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300">
            <option value="Open">খোলা কাজ</option>
            <option value="All">সব স্ট্যাটাস</option>
            {Object.keys(STATUS_LABEL).filter((k) => k !== "Cancelled").map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
          <select value={prio} onChange={(e) => setPrio(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300">
            <option value="All">সব অগ্রাধিকার</option>
            {["Critical", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
          </select>
          <label className="flex items-center gap-1">দেওয়া হয়েছে<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 px-1 py-1.5 rounded-lg border border-slate-300" /></label>
          <label className="flex items-center gap-1">পর্যন্ত<input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="flex-1 px-1 py-1.5 rounded-lg border border-slate-300" /></label>
          <label className="flex items-center gap-1">ডেডলাইন<input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} className="flex-1 px-1 py-1.5 rounded-lg border border-slate-300" /></label>
          <label className="flex items-center gap-1">পর্যন্ত<input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} className="flex-1 px-1 py-1.5 rounded-lg border border-slate-300" /></label>
        </div>
      </div>

      {selectedEmp && work && isMgmt && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl">
          <p className="text-sm font-bold">{selectedEmp.name} — এই মাসে</p>
          <p className="text-xs text-slate-300 mt-1">
            দেওয়া {work.month.assigned} • সম্পন্ন {work.month.completed} • চলমান {work.month.inProgress} • পেন্ডিং {work.month.notStarted} •
            রিভিউ {work.month.awaitingReview} • ওভারডিউ {work.month.overdue} • সম্পন্ন {work.month.completionPercent}% • স্কোর {work.performance.finalScore ?? "—"}
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-2.5">কাজ</th>
              {isMgmt && <th className="p-2.5">দিয়েছেন</th>}
              {isMgmt && <th className="p-2.5">যাকে</th>}
              <th className="p-2.5">দেওয়ার সময়</th>
              <th className="p-2.5">প্রজেক্ট / সাইট</th>
              <th className="p-2.5">ডেডলাইন</th>
              <th className="p-2.5">অগ্রগতি</th>
              <th className="p-2.5">স্ট্যাটাস</th>
              <th className="p-2.5">সর্বশেষ আপডেট</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => {
              const ds = displayStatus(t);
              const p = projects.find((x) => x.id === t.projectId);
              const s = sites.find((x) => x.id === t.siteId);
              const od = ds === "Overdue" ? Math.max(0, Math.round((new Date(today).getTime() - new Date(t.dueDate).getTime()) / 86400000)) : 0;
              return (
                <tr key={t.id} onClick={() => setOpenId(openId === t.id ? null : t.id)}
                  className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${openId === t.id ? "bg-emerald-50" : ""}`}>
                  <td className="p-2.5">
                    <span className="font-mono text-[10px] text-slate-400">{t.taskCode}</span>
                    <span className="block font-bold text-slate-900">{t.title}</span>
                  </td>
                  {isMgmt && <td className="p-2.5">{t.assignedByName || t.createdBy}<span className="block text-[10px] text-slate-400">{t.assignedByDesignation}</span></td>}
                  {isMgmt && <td className="p-2.5">{t.assignedToName}<span className="block text-[10px] text-slate-400">{t.assignedToDesignation}</span></td>}
                  <td className="p-2.5 whitespace-nowrap">{fmtDateTime(t.createdAt)}</td>
                  <td className="p-2.5">{p ? p.name : "—"}{s ? <span className="block text-[10px] text-slate-400">{s.name}</span> : null}</td>
                  <td className={`p-2.5 whitespace-nowrap ${ds === "Overdue" ? "text-rose-600 font-bold" : ""}`}>
                    {fmtDate(t.dueDate)}{t.dueTime ? ` ${t.dueTime}` : ""}
                    {od > 0 && <span className="block text-[10px] flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{od} দিন</span>}
                  </td>
                  <td className="p-2.5 min-w-[90px]">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${t.progressPercent >= 100 ? "bg-emerald-500" : ds === "Overdue" ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${t.progressPercent}%` }} />
                    </div>
                    <span className="text-[10px] font-bold">{t.progressPercent}%</span>
                  </td>
                  <td className="p-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusCls(ds)}`}>{STATUS_LABEL[ds] || ds}</span></td>
                  <td className="p-2.5 whitespace-nowrap">{fmtDateTime(t.lastUpdateAt || t.createdAt)}</td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={9} className="p-4 text-center text-slate-400">এই ফিল্টারে কোনো টাস্ক নেই</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {openId && (() => {
        const t = allTasks.find((x) => x.id === openId);
        if (!t) return null;
        return (
          <TaskCard
            key={t.id}
            t={t}
            comments={comments.filter((c) => c.taskId === t.id)}
            files={files}
            isMgmt={isMgmt}
            isSelf={t.assignedTo === me?.employeeId}
            onMutate={onMutate}
            projects={projects}
            sites={sites}
            employees={employees}
            defaultTimeline
          />
        );
      })()}
    </div>
  );
}
