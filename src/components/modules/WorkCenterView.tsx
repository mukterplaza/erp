"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

// ─── Status & Rating Maps ──────────────────────────────────────────────────

const STATUS_BN: Record<string, { label: string; cls: string }> = {
  "Pending Acceptance": { label: "গ্রহণের অপেক্ষায়", cls: "bg-amber-100 text-amber-800" },
  Todo: { label: "গ্রহণের অপেক্ষায়", cls: "bg-amber-100 text-amber-800" },
  Accepted: { label: "গৃহীত", cls: "bg-blue-100 text-blue-800" },
  "In Progress": { label: "চলমান", cls: "bg-indigo-100 text-indigo-800" },
  Review: { label: "অনুমোদনের অপেক্ষায়", cls: "bg-purple-100 text-purple-800" },
  Reopened: { label: "সংশোধন প্রয়োজন", cls: "bg-rose-100 text-rose-800" },
  Completed: { label: "সম্পন্ন", cls: "bg-emerald-100 text-emerald-800" },
  Declined: { label: "প্রত্যাখ্যাত", cls: "bg-slate-200 text-slate-700" },
  Cancelled: { label: "বাতিল", cls: "bg-slate-200 text-slate-500" },
};

const RATING_BN: Record<string, string> = {
  Best: "সেরা (Best)",
  Better: "খুব ভালো (Better)",
  Good: "ভালো (Good)",
  "Needs Improvement": "উন্নতি প্রয়োজন",
  Penalty: "পেনাল্টি / ভুল",
};

const ACTIVE = ["Accepted", "In Progress", "Reopened"];

// ─── Helpers ───────────────────────────────────────────────────────────────

function bdDateKey(value?: string | Date | null): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function uniqueEmployeeCount(rows: any[]): number {
  return new Set(
    rows.map((task) => Number(task.assignedTo)).filter((id) => Number.isInteger(id) && id > 0)
  ).size;
}

function employeeName(employeeId: number, directory: any[], tasks: any[]): string {
  const employee = directory.find((item) => Number(item.id) === Number(employeeId));
  if (employee?.name) return employee.name;
  const task = tasks.find((item) => Number(item.assignedTo) === Number(employeeId));
  return task?.assignedToName || `Employee #${employeeId}`;
}

const fmtDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString("bn-BD", {
        timeZone: "Asia/Dhaka",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── Reusable UI ───────────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const s = STATUS_BN[status] || { label: status, cls: "bg-slate-100 text-slate-700" };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}

function Section({
  title,
  count,
  children,
  tone = "slate",
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  tone?: string;
}) {
  const toneMap: Record<string, string> = {
    slate: "border-slate-200",
    amber: "border-amber-300",
    purple: "border-purple-300",
    emerald: "border-emerald-300",
  };
  return (
    <section className={`bg-white rounded-2xl border-2 ${toneMap[tone]} p-4 space-y-3`}>
      <h2 className="text-sm font-extrabold text-slate-900">
        {title} {count !== undefined && <span className="text-slate-500">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
        style={{ width: `${pct || 0}%` }}
      />
    </div>
  );
}

function TaskMeta({ t, today }: { t: any; today?: string }) {
  const overdue =
    today && t.dueDate && t.dueDate < today && !["Completed", "Cancelled", "Declined"].includes(t.status);
  return (
    <div className="text-[11px] text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5">
      <span>
        দিয়েছেন: <b>{t.assignedByName || t.createdBy || "—"}</b>
      </span>
      <span>দেওয়ার তারিখ: {fmtDate(t.createdAt)}</span>
      <span>শুরু: {t.startDate || "—"}</span>
      <span className={overdue ? "text-rose-700 font-bold" : ""}>
        শেষ তারিখ: {t.dueDate} {overdue ? "(সময় পেরিয়েছে)" : ""}
      </span>
    </div>
  );
}

function HistoryList({ hist }: { hist: any[] }) {
  if (hist.length === 0) return null;
  return (
    <details className="text-[11px]">
      <summary className="cursor-pointer font-semibold text-slate-600">
        অগ্রগতির ইতিহাস ({hist.length})
      </summary>
      <ul className="mt-1.5 space-y-1 border-l-2 border-emerald-400 pl-2">
        {hist.slice(0, 15).map((h) => (
          <li key={h.id} className="text-slate-700">
            <span className="text-slate-400">{fmtDate(h.createdAt)}</span> • <b>{h.authorName}</b>: {h.comment}
          </li>
        ))}
      </ul>
    </details>
  );
}

// ─── Management: Team Overview ─────────────────────────────────────────────

function TaskMiniGroup({
  title,
  tasks,
  tone,
}: {
  title: string;
  tasks: any[];
  tone: "blue" | "amber" | "purple" | "rose" | "emerald";
}) {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
    rose: "bg-rose-50 border-rose-100 text-rose-800",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };

  return (
    <div className="mt-3">
      <p className="mb-1 text-[10px] font-bold uppercase text-slate-600">{title}</p>
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={`${title}-${task.id}`}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${styles[tone]}`}
          >
            <span className="font-semibold">{task.title}</span>
            <span className="flex items-center gap-2">
              <span>{task.progressPercent || 0}%</span>
              <Badge status={task.status} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamTodayOverview({
  tasks,
  directory,
  today,
  historyByTask,
}: {
  tasks: any[];
  directory: any[];
  today: string;
  historyByTask: Map<number, any[]>;
}) {
  const employeeIds = Array.from(
    new Set(tasks.map((task) => Number(task.assignedTo)).filter((id) => Number.isInteger(id) && id > 0))
  );

  const rows = employeeIds
    .map((employeeId) => {
      const employeeTasks = tasks.filter((task) => Number(task.assignedTo) === Number(employeeId));
      const assignedToday = employeeTasks.filter((task) => bdDateKey(task.createdAt) === today);
      const activeTasks = employeeTasks.filter((task) =>
        ["Accepted", "In Progress"].includes(task.status)
      );
      const reviewTasks = employeeTasks.filter((task) => task.status === "Review");
      const correctionTasks = employeeTasks.filter((task) => task.status === "Reopened");
      const pendingAcceptance = employeeTasks.filter(
        (task) => task.status === "Pending Acceptance" || task.status === "Todo"
      );
      const completedToday = employeeTasks.filter(
        (task) => task.status === "Completed" && bdDateKey(task.reviewedAt || task.completedAt) === today
      );

      const progressValues = activeTasks.map((task) => Number(task.progressPercent || 0));
      const averageProgress = progressValues.length
        ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
        : 0;

      return {
        employeeId,
        name: employeeName(employeeId, directory, employeeTasks),
        assignedToday,
        activeTasks,
        reviewTasks,
        correctionTasks,
        pendingAcceptance,
        completedToday,
        averageProgress,
        totalCurrent:
          activeTasks.length + reviewTasks.length + correctionTasks.length + pendingAcceptance.length,
      };
    })
    .sort((a, b) => {
      if (b.totalCurrent !== a.totalCurrent) return b.totalCurrent - a.totalCurrent;
      return a.name.localeCompare(b.name, "bn");
    });

  return (
    <Section title="👥 আজকের টিম কাজ — কর্মীর নাম ও অগ্রগতিসহ" count={rows.length}>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">আজ কোনো কর্মীকে কাজ দেওয়া হয়নি এবং কোনো চলমান কাজ নেই।</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <article key={row.employeeId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900">
                    {index + 1}. {row.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    আজ দেওয়া: {row.assignedToday.length} • চলমান: {row.activeTasks.length} •
                    অনুমোদনের অপেক্ষায়: {row.reviewTasks.length} • সংশোধন: {row.correctionTasks.length} • আজ সম্পন্ন:{" "}
                    {row.completedToday.length}
                  </p>
                </div>
                <div className="min-w-[110px] text-right">
                  <p className="text-[10px] text-slate-500">চলমান গড় অগ্রগতি</p>
                  <p className="text-lg font-extrabold text-emerald-700">{row.averageProgress}%</p>
                </div>
              </div>

              {row.activeTasks.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-indigo-700">বর্তমানে চলমান</p>
                  {row.activeTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-indigo-100 bg-white p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{task.title}</span>
                        <span className="text-xs font-extrabold text-indigo-700">{task.progressPercent || 0}%</span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar pct={Number(task.progressPercent || 0)} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span>দিয়েছেন: {task.assignedByName || task.createdBy || "—"}</span>
                        <span>শেষ তারিখ: {task.dueDate || "—"}</span>
                      </div>
                      <HistoryList hist={historyByTask.get(task.id) || []} />
                    </div>
                  ))}
                </div>
              )}

              {row.assignedToday.length > 0 && <TaskMiniGroup title="আজ দেওয়া কাজ" tasks={row.assignedToday} tone="blue" />}
              {row.pendingAcceptance.length > 0 && (
                <TaskMiniGroup title="গ্রহণের অপেক্ষায়" tasks={row.pendingAcceptance} tone="amber" />
              )}
              {row.reviewTasks.length > 0 && (
                <TaskMiniGroup title="অনুমোদনের অপেক্ষায়" tasks={row.reviewTasks} tone="purple" />
              )}
              {row.correctionTasks.length > 0 && (
                <TaskMiniGroup title="সংশোধন প্রয়োজন" tasks={row.correctionTasks} tone="rose" />
              )}
              {row.completedToday.length > 0 && (
                <TaskMiniGroup title="আজ সম্পন্ন" tasks={row.completedToday} tone="emerald" />
              )}
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function WorkCenterView(_props: { data?: any; onMutate?: any }) {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/work-center", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setState(j);
      else setMsg({ ok: false, text: j.error || "ডাটা লোড হয়নি" });
    } catch {
      setMsg({ ok: false, text: "নেটওয়ার্ক সমস্যা" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let last = Date.now();
    const onVis = () => {
      if (document.visibilityState === "visible" && Date.now() - last > 120000) {
        last = Date.now();
        load();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  async function act(payload: Record<string, unknown>): Promise<boolean> {
    const key = String(payload.taskId ?? payload.action);
    setBusy(key);
    setMsg(null);
    try {
      const r = await fetch("/api/work-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg({ ok: false, text: j.error || "কাজটি সম্পন্ন হয়নি" });
        return false;
      }
      setState((s: any) => {
        const others = (s.tasks || []).filter((t: any) => t.id !== j.task.id);
        return {
          ...s,
          tasks: [j.task, ...others].sort((a: any, b: any) => b.id - a.id),
          history: j.historyItem ? [j.historyItem, ...(s.history || [])] : s.history,
        };
      });
      setMsg({ ok: true, text: "সংরক্ষণ হয়েছে" });
      return true;
    } catch {
      setMsg({ ok: false, text: "নেটওয়ার্ক সমস্যা" });
      return false;
    } finally {
      setBusy(null);
    }
  }

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const me = state?.me;
  const myEmp: number | null = me?.employeeId ?? null;
  const allTasks: any[] = state?.tasks || [];
  const history: any[] = state?.history || [];
  const directory: any[] = state?.directory || [];
  const today: string = state?.today || "";

  const canSeeTeam = Boolean(state?.canMonitorAll ?? state?.isApprover);

  const historyByTask = useMemo(() => {
    const m = new Map<number, any[]>();
    for (const h of history) {
      const arr = m.get(h.taskId) || [];
      arr.push(h);
      m.set(h.taskId, arr);
    }
    return m;
  }, [history]);

  // Staff: incoming = other people gave me work, still pending acceptance
  const incoming = allTasks.filter(
    (t) => t.assignedTo === myEmp && t.assignedByEmployeeId !== myEmp && t.status === "Pending Acceptance"
  );

  // Staff: active = accepted / in progress / reopened, or self-created Todo
  const active = allTasks.filter(
    (t) =>
      t.assignedTo === myEmp &&
      (ACTIVE.includes(t.status) || (t.status === "Todo" && t.assignedByEmployeeId === myEmp))
  );

  // Staff: waiting for approval
  const waiting = allTasks.filter((t) => t.assignedTo === myEmp && t.status === "Review");

  // Management: approval queue
  const approvals = canSeeTeam
    ? allTasks.filter((t) => t.status === "Review" && t.assignedTo !== myEmp)
    : [];

  // Staff: tasks I gave to others
  const given = allTasks.filter(
    (t) =>
      t.assignedByEmployeeId === myEmp &&
      t.assignedTo !== myEmp &&
      !["Completed", "Cancelled"].includes(t.status)
  );

  const myCompletedRecent = allTasks
    .filter((t) => t.assignedTo === myEmp && t.status === "Completed")
    .slice(0, 10);

  // Management team stats
  const teamActiveTasks = canSeeTeam
    ? allTasks.filter((t) => ["Accepted", "In Progress"].includes(t.status))
    : [];
  const teamCorrectionTasks = canSeeTeam ? allTasks.filter((t) => t.status === "Reopened") : [];
  const teamReviewTasks = canSeeTeam ? allTasks.filter((t) => t.status === "Review") : [];
  const teamPendingAcceptanceTasks = canSeeTeam
    ? allTasks.filter((t) => t.status === "Pending Acceptance" || t.status === "Todo")
    : [];

  const todayAssignedTasks = canSeeTeam ? allTasks.filter((t) => bdDateKey(t.createdAt) === today) : [];
  const todayCompletedTasks = canSeeTeam
    ? allTasks.filter((t) => t.status === "Completed" && bdDateKey(t.reviewedAt || t.completedAt) === today)
    : [];
  const todayUpdatedTasks = canSeeTeam ? allTasks.filter((t) => bdDateKey(t.lastUpdateAt) === today) : [];

  const todayAssignedEmployees = uniqueEmployeeCount(todayAssignedTasks);
  const activeEmployees = uniqueEmployeeCount(teamActiveTasks);

  const teamOverviewTasks = canSeeTeam
    ? Array.from(
        new Map(
          [...todayAssignedTasks, ...teamActiveTasks, ...teamCorrectionTasks, ...teamReviewTasks, ...teamPendingAcceptanceTasks, ...todayCompletedTasks].map((task) => [
            Number(task.id),
            task,
          ])
        ).values()
      )
    : [];

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="p-10 text-center text-sm text-slate-500 animate-pulse">কাজের তালিকা লোড হচ্ছে…</div>
    );
  if (!state) return <div className="p-10 text-center text-sm text-rose-600">{msg?.text || "ডাটা পাওয়া যায়নি"}</div>;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-cyan-700 rounded-2xl p-5 text-white">
        <h1 className="text-xl font-extrabold">📋 কাজ ও কার্যক্রম</h1>
        <p className="text-xs text-emerald-100 mt-1">
          {me?.name} • {me?.role} • আজ {fmtDate(today)}
        </p>
      </div>

      {!myEmp && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800">
          আপনার লগইন কোনো কর্মী প্রোফাইলের সাথে যুক্ত নয়। HR-কে জানান, নাহলে কাজ দেওয়া-নেওয়া করা যাবে না।
        </div>
      )}

      {/* ── Management Summary Cards ── */}
      {canSeeTeam ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
            {[
              { label: "আজ কাজ পেয়েছেন", value: todayAssignedEmployees, color: "text-blue-700", hint: "জন কর্মী" },
              { label: "আজ দেওয়া কাজ", value: todayAssignedTasks.length, color: "text-slate-900", hint: "মোট কাজ" },
              { label: "এখন কাজ করছেন", value: activeEmployees, color: "text-indigo-700", hint: "জন কর্মী" },
              {
                label: "মোট চলমান কাজ",
                value: teamActiveTasks.length,
                color: "text-indigo-700",
                hint: "Accepted + In Progress",
              },
              { label: "আজ সম্পন্ন", value: todayCompletedTasks.length, color: "text-emerald-700", hint: "অনুমোদিত কাজ" },
              {
                label: "অনুমোদনের অপেক্ষায়",
                value: teamReviewTasks.length,
                color: "text-purple-700",
                hint: "Review queue",
              },
              { label: "সংশোধন প্রয়োজন", value: teamCorrectionTasks.length, color: "text-rose-700", hint: "Reopened" },
              {
                label: "গ্রহণের অপেক্ষায়",
                value: teamPendingAcceptanceTasks.length,
                color: "text-amber-700",
                hint: "নতুন assignment",
              },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                <p className="text-[10px] text-slate-500">{item.label}</p>
                <p className={`text-xl font-extrabold ${item.color}`}>{item.value}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] text-slate-600">
              আজ আপডেট হয়েছে: <strong>{todayUpdatedTasks.length}</strong>টি কাজ • সর্বশেষ তথ্য দেখতে প্রয়োজন হলে
              হালনাগাদ করুন
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => load()}
              className="min-h-[38px] rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-bold text-white disabled:opacity-50"
            >
              ↻ হালনাগাদ
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            ["নতুন অনুরোধ", incoming.length, "text-amber-700"],
            ["চলমান কাজ", active.length, "text-indigo-700"],
            ["অনুমোদনের অপেক্ষায়", waiting.length, "text-purple-700"],
            ["সংশোধন প্রয়োজন", active.filter((t) => t.status === "Reopened").length, "text-rose-700"],
            ["সাম্প্রতিক সম্পন্ন", myCompletedRecent.length, "text-emerald-700"],
          ].map(([l, v, c]) => (
            <div key={String(l)} className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] text-slate-500">{l}</p>
              <p className={`text-xl font-extrabold ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold border ${msg.ok ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"}`}
        >
          {msg.text}
        </div>
      )}

      {/* ── Management: Team Today Overview ── */}
      {canSeeTeam && (
        <TeamTodayOverview tasks={teamOverviewTasks} directory={directory} today={today} historyByTask={historyByTask} />
      )}

      {/* ── Staff: Incoming assignments ── */}
      {incoming.length > 0 && (
        <Section
          title="🔔 আমাকে দেওয়া নতুন কাজ — গ্রহণ করলে তবেই আমার কাজে যোগ হবে"
          count={incoming.length}
          tone="amber"
        >
          {incoming.map((t) => (
            <IncomingCard key={t.id} t={t} busy={busy === String(t.id)} act={act} />
          ))}
        </Section>
      )}

      {/* ── Staff: Active tasks ── */}
      <Section title="🛠️ আমার চলমান কাজ (শেষ না হওয়া পর্যন্ত প্রতিদিন এখানে থাকবে)" count={active.length}>
        {active.length === 0 && <p className="text-xs text-slate-400">কোনো চলমান কাজ নেই।</p>}
        {active.map((t) => (
          <ActiveCard
            key={t.id}
            t={t}
            today={today}
            hist={historyByTask.get(t.id) || []}
            busy={busy === String(t.id)}
            act={act}
          />
        ))}
      </Section>

      {/* ── Management: Approvals ── */}
      {approvals.length > 0 && (
        <Section title="✅ আমার অনুমোদন প্রয়োজন" count={approvals.length} tone="purple">
          {approvals.map((t) => (
            <ApprovalCard
              key={t.id}
              t={t}
              hist={historyByTask.get(t.id) || []}
              busy={busy === String(t.id)}
              act={act}
            />
          ))}
        </Section>
      )}

      {/* ── Staff: Submitted & awaiting approval ── */}
      {waiting.length > 0 && (
        <Section title="⏳ আমার জমা দেওয়া কাজ — অনুমোদনের অপেক্ষায়" count={waiting.length}>
          {waiting.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs flex flex-wrap justify-between gap-2"
            >
              <span className="font-bold text-slate-900">{t.title}</span>
              <span className="text-slate-600">
                জমা: {fmtDate(t.completedAt)} • দিয়েছেন: {t.assignedByName || "—"}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* ── New Task Form ── */}
      <NewTaskForm directory={directory} myEmp={myEmp} today={today} busy={busy === "create"} act={act} />

      {/* ── Given tasks ── */}
      {given.length > 0 && (
        <Section title="📤 আমি যাদের কাজ দিয়েছি" count={given.length}>
          {given.map((t) => (
            <div key={t.id} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{t.title}</span>
                <Badge status={t.status} />
              </div>
              <p className="text-slate-600">
                {t.assignedToName} • শেষ তারিখ {t.dueDate} • অগ্রগতি {t.progressPercent}%
              </p>
              <ProgressBar pct={t.progressPercent} />
              {t.status === "Declined" && <p className="text-rose-700">প্রত্যাখ্যানের কারণ: {t.reviewNote}</p>}
              {!["Declined"].includes(t.status) && (
                <button
                  type="button"
                  disabled={busy === String(t.id)}
                  onClick={() => confirm("কাজটি বাতিল করবেন?") && act({ action: "cancel", taskId: t.id })}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  বাতিল করুন
                </button>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── Completed ── */}
      {myCompletedRecent.length > 0 && (
        <Section title="🏁 আমার সাম্প্রতিক সম্পন্ন কাজ" count={myCompletedRecent.length} tone="emerald">
          {myCompletedRecent.map((t) => (
            <CompletedRow key={t.id} t={t} />
          ))}
        </Section>
      )}

      {/* ── Monthly Report ── */}
      <MonthlyReport
        tasks={allTasks}
        directory={directory}
        myEmp={myEmp}
        isApprover={!!state.isApprover}
        today={today}
      />
    </div>
  );
}

// ─── Card Components ───────────────────────────────────────────────────────

function IncomingCard({
  t,
  busy,
  act,
}: {
  t: any;
  busy: boolean;
  act: (p: any) => Promise<boolean>;
}) {
  return (
    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-bold text-slate-900 text-sm">{t.title}</span>
        <span className="font-semibold text-amber-800">অগ্রাধিকার: {t.priority}</span>
      </div>
      {t.description && <p className="text-slate-700">{t.description}</p>}
      <TaskMeta t={t} />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => act({ action: "accept", taskId: t.id })}
          className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"
        >
          ✓ গ্রহণ করুন
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const reason = prompt("কেন প্রত্যাখ্যান করছেন? (কারণ যিনি দিয়েছেন তিনি দেখবেন)");
            if (reason && reason.trim()) act({ action: "decline", taskId: t.id, reason });
          }}
          className="flex-1 min-h-[40px] rounded-xl bg-white border border-rose-300 text-rose-700 font-bold disabled:opacity-50"
        >
          ✕ প্রত্যাখ্যান
        </button>
      </div>
    </div>
  );
}

function ActiveCard({
  t,
  today,
  hist,
  busy,
  act,
}: {
  t: any;
  today: string;
  hist: any[];
  busy: boolean;
  act: (p: any) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<number>(t.progressPercent || 0);
  const [note, setNote] = useState("");

  useEffect(() => setDraft(t.progressPercent || 0), [t.progressPercent]);

  const changed = draft !== (t.progressPercent || 0);
  const correction = t.status === "Reopened";

  return (
    <div
      className={`p-3 rounded-xl border space-y-2.5 ${correction ? "border-rose-300 bg-rose-50/40" : "border-slate-200"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-slate-900 text-sm">{t.title}</span>
        <Badge status={t.status} />
      </div>
      {t.description && <p className="text-xs text-slate-600">{t.description}</p>}
      <TaskMeta t={t} today={today} />

      {correction && (
        <div className="p-2.5 rounded-lg bg-rose-100 text-xs text-rose-900">
          <b>{t.reviewedBy || "ম্যানেজমেন্ট"}</b> সংশোধন চেয়েছেন ({fmtDate(t.reviewedAt)}): {t.reviewNote}
          <span className="block text-[11px] mt-0.5">মোট সংশোধন: {t.correctionCount || 1} বার</span>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
          <span>অগ্রগতি — টেনে সেট করুন</span>
          <span className="text-emerald-700 text-base">{draft}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="w-full h-3 accent-emerald-600 cursor-pointer"
        />
        <p className="text-[10px] text-slate-400">
          আগের সংরক্ষিত: {t.progressPercent || 0}% • ১০০% করলে অনুমোদনে পাঠাতে হবে
        </p>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="আজ কী করেছেন (ঐচ্ছিক)…"
        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
      />

      <div className="flex gap-2">
        {draft < 100 ? (
          <button
            type="button"
            disabled={busy || (!changed && !note.trim())}
            onClick={async () => {
              if (await act({ action: "progress", taskId: t.id, progressPercent: draft, note })) setNote("");
            }}
            className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-40"
          >
            অগ্রগতি সংরক্ষণ
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await act({ action: "submit", taskId: t.id, note })) setNote("");
            }}
            className="flex-1 min-h-[40px] rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-40"
          >
            {correction ? "সংশোধন করে আবার জমা দিন" : "১০০% — অনুমোদনে পাঠান"}
          </button>
        )}
      </div>

      <HistoryList hist={hist} />
    </div>
  );
}

function ApprovalCard({
  t,
  hist,
  busy,
  act,
}: {
  t: any;
  hist: any[];
  busy: boolean;
  act: (p: any) => Promise<boolean>;
}) {
  const [rating, setRating] = useState("Good");
  const [note, setNote] = useState("");
  return (
    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2 text-xs">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-bold text-slate-900 text-sm">{t.title}</span>
        <span className="font-semibold text-slate-700">{t.assignedToName}</span>
      </div>
      <TaskMeta t={t} />
      <p className="text-slate-600">
        জমা দিয়েছেন: {fmtDate(t.completedAt)} {t.completionNote ? `• নোট: ${t.completionNote}` : ""}
      </p>
      <HistoryList hist={hist} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300">
          {Object.entries(RATING_BN).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="মন্তব্য / ভুল / রিভিউ নোট"
          className="px-3 py-2 rounded-xl border border-slate-300"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => act({ action: "approve", taskId: t.id, rating, note })}
          className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"
        >
          ✓ অনুমোদন
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const reason = note.trim() || prompt("কী সংশোধন করতে হবে?") || "";
            if (reason.trim()) act({ action: "correction", taskId: t.id, reason });
          }}
          className="flex-1 min-h-[40px] rounded-xl bg-white border border-rose-300 text-rose-700 font-bold disabled:opacity-50"
        >
          ↺ সংশোধনে ফেরত
        </button>
      </div>
    </div>
  );
}

function CompletedRow({ t }: { t: any }) {
  return (
    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-wrap justify-between gap-2">
      <span className="font-bold text-slate-900">{t.title}</span>
      <span className="text-slate-600">
        শুরু {t.startDate || "—"} • শেষ {fmtDate(t.completedAt)} • অনুমোদন {t.reviewedBy || "—"} •{" "}
        {RATING_BN[t.rating] || "—"}
      </span>
    </div>
  );
}

function NewTaskForm({
  directory,
  myEmp,
  today,
  busy,
  act,
}: {
  directory: any[];
  myEmp: number | null;
  today: string;
  busy: boolean;
  act: (p: any) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>(myEmp ? String(myEmp) : "");
  const [dueDate, setDueDate] = useState(today);
  const [priority, setPriority] = useState("Medium");
  const [q, setQ] = useState("");

  const list = directory.filter(
    (e) => !q.trim() || `${e.name} ${e.empCode} ${e.designation}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await act({ action: "create", title, description, assignedTo: Number(assignedTo), dueDate, priority })) {
      setTitle("");
      setDescription("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={!myEmp}
        onClick={() => setOpen(true)}
        className="w-full min-h-[48px] rounded-2xl border-2 border-dashed border-emerald-400 bg-white text-emerald-700 font-bold text-sm disabled:opacity-40"
      >
        ＋ নতুন কাজ যোগ করুন / কাউকে কাজ দিন
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border-2 border-emerald-300 p-4 space-y-2.5 text-xs">
      <h2 className="text-sm font-extrabold text-slate-900">＋ নতুন কাজ</h2>
      <p className="text-[11px] text-slate-500">
        নিজেকে দিলে সরাসরি আপনার কাজে যোগ হবে। অন্যকে দিলে তিনি গ্রহণ করার পর যোগ হবে।
      </p>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="কাজের শিরোনাম *"
        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
      />
      <textarea
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="বিস্তারিত নির্দেশনা"
        className="w-full px-3 py-2 rounded-xl border border-slate-300"
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 কর্মী খুঁজুন (নাম/কোড)"
        className="w-full px-3 py-2 rounded-xl border border-slate-300"
      />
      <select
        required
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-slate-300"
      >
        <option value="">— কাকে দেবেন —</option>
        {list.map((e) => (
          <option key={e.id} value={e.id}>
            {e.id === myEmp ? "★ নিজে — " : ""}
            {e.name} ({e.designation || e.empCode})
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <label>
          শেষ তারিখ
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
          />
        </label>
        <label>
          অগ্রাধিকার
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
          >
            <option value="Low">সাধারণ</option>
            <option value="Medium">মাঝারি</option>
            <option value="High">জরুরি</option>
            <option value="Critical">অতি জরুরি</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"
        >
          কাজ যোগ করুন
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 min-h-[40px] rounded-xl bg-slate-100 font-semibold"
        >
          বন্ধ
        </button>
      </div>
    </form>
  );
}

function MonthlyReport({
  tasks,
  directory,
  myEmp,
  isApprover,
  today,
}: {
  tasks: any[];
  directory: any[];
  myEmp: number | null;
  isApprover: boolean;
  today: string;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [empId, setEmpId] = useState<string>(myEmp ? String(myEmp) : "");

  const target = isApprover ? Number(empId) : myEmp;
  const emp = directory.find((e) => e.id === target);

  const inMonth = (v?: string | null) => !!v && String(v).slice(0, 7) === month;

  const rows = tasks.filter(
    (t) =>
      t.assignedTo === target &&
      (inMonth(t.createdAt) || inMonth(t.completedAt) || inMonth(t.reviewedAt) || ACTIVE.includes(t.status))
  );

  const count = (fn: (t: any) => boolean) => rows.filter(fn).length;
  const stats = [
    ["মোট কাজ", rows.length],
    ["সম্পন্ন (অনুমোদিত)", count((t) => t.status === "Completed")],
    ["চলমান", count((t) => ACTIVE.includes(t.status))],
    ["অনুমোদনের অপেক্ষায়", count((t) => t.status === "Review")],
    ["প্রত্যাখ্যাত", count((t) => t.status === "Declined")],
    ["মোট সংশোধন", rows.reduce((s, t) => s + (t.correctionCount || 0), 0)],
    [
      "সময়মতো শেষ",
      count((t) => t.status === "Completed" && t.completedAt && String(t.completedAt).slice(0, 10) <= t.dueDate),
    ],
    ["সেরা / খুব ভালো", count((t) => t.rating === "Best" || t.rating === "Better")],
    ["পেনাল্টি", count((t) => t.rating === "Penalty")],
  ];

  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    const trs = rows
      .map(
        (t) =>
          `<tr><td>${t.title}</td><td>${t.assignedByName || ""}</td><td>${t.startDate || "—"}</td><td>${t.dueDate}</td><td>${t.completedAt ? String(t.completedAt).slice(0, 10) : "—"}</td><td>${t.progressPercent}%</td><td>${(STATUS_BN[t.status] || { label: t.status }).label}</td><td>${RATING_BN[t.rating] || "—"}</td><td>${t.reviewedBy || ""}</td></tr>`
      )
      .join("");
    w.document.write(
      `<html><head><meta charset="utf-8"><title>মাসিক কাজের রিপোর্ট</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #999;padding:4px}th{background:#eee}</style></head><body><h2>INSAF ERP — মাসিক কাজের রিপোর্ট</h2><p><b>${emp?.name || ""}</b> (${emp?.designation || ""}) • মাস: ${month}</p><p>${stats.map(([l, v]) => `${l}: <b>${v}</b>`).join(" &nbsp;|&nbsp; ")}</p><table><tr><th>কাজ</th><th>দিয়েছেন</th><th>শুরু</th><th>শেষ তারিখ</th><th>জমা</th><th>অগ্রগতি</th><th>অবস্থা</th><th>রেটিং</th><th>অনুমোদন</th></tr>${trs}</table><script>window.print()</script></body></html>`
    );
    w.document.close();
  }

  return (
    <Section title="📊 মাসিক কাজের রিপোর্ট">
      <div className="flex flex-wrap gap-2 text-xs">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300"
        />
        {isApprover && (
          <select
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 min-w-[180px]"
          >
            {directory.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={print} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">
          🖨️ প্রিন্ট
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {stats.map(([l, v]) => (
          <div key={String(l)} className="rounded-xl bg-slate-50 border border-slate-200 p-2">
            <p className="text-[10px] text-slate-500">{l}</p>
            <p className="text-lg font-extrabold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && <p className="text-xs text-slate-400">এই মাসে কোনো কাজ নেই।</p>}
        {rows.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 text-xs">
            <span className="font-semibold text-slate-800">{t.title}</span>
            <span className="flex items-center gap-2">
              <span className="text-slate-500">{t.progressPercent}%</span>
              {t.rating && <span className="text-emerald-700 font-bold">{RATING_BN[t.rating]}</span>}
              <Badge status={t.status} />
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}