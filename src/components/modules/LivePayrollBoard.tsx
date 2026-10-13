"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Users, TrendingUp, AlertTriangle, RefreshCw, Printer, ShieldCheck } from "lucide-react";

const WORKING_DAYS = 26;
const STANDARD_HOURS = 8.75;
const PF_RATE = 0.05; // PF = Basic-এর ৫%

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const taka = (n: number) => "৳" + Math.round(n).toLocaleString("en-IN");
const bdToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
const isFriday = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay() === 5;

export function LivePayrollBoard({ data }: { data: any }) {
  const today = bdToday();
   const router = useRouter();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const role = data.currentUser?.role || "Staff";
  const isMgmt = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Accounts"].includes(role);

  const employees: any[] = (data.employees || []).filter((e: any) => !e.archived);
  const attendances: any[] = data.attendances || [];
  const leaves: any[] = data.leaveRequests || [];
  const payrolls: any[] = data.payrolls || [];

   const rows = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const isPast = month < today.slice(0, 7);
    const isCurrent = month === today.slice(0, 7);
    const lastDay = isPast ? daysInMonth : isCurrent ? Number(today.slice(8, 10)) : 0;

    let elapsedWorkDays = 0;
    let totalWorkDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${month}-${String(d).padStart(2, "0")}`;
      if (isFriday(date)) continue;
      totalWorkDays++;
      if (d <= lastDay) elapsedWorkDays++;
    }

    return employees
      .map((emp) => {
        const id = Number(emp.id);
        const gross = num(emp.basicSalary) + num(emp.allowance);
        const pfDed = gross * PF_RATE; // Gross-এর ৫% — সবসময় কাটবে
        const advanceDed = num(emp.advanceBalance); // যারা আগে টাকা নিয়েছে
        const perDay = gross / WORKING_DAYS;
        const hourly = perDay / STANDARD_HOURS;

        // দিনভিত্তিক মার্জ
        const byDay = new Map<string, any>();
        for (const a of attendances) {
          if (Number(a.employeeId) !== id) continue;
          if (!String(a.date || "").startsWith(`${month}-`)) continue;
          const p = byDay.get(a.date);
          byDay.set(a.date, p ? {
            ...p,
            checkIn: p.checkIn || a.checkIn,
            checkOut: p.checkOut || a.checkOut,
            checkIn2: p.checkIn2 || a.checkIn2,
            checkOut2: p.checkOut2 || a.checkOut2,
            workingHours: Math.max(num(p.workingHours), num(a.workingHours)),
            overtimeHours: Math.max(num(p.overtimeHours), num(a.overtimeHours)),
            lateMinutes: Math.max(num(p.lateMinutes), num(a.lateMinutes)),
            status: p.status === "Leave" || a.status === "Leave" ? "Leave"
                  : p.status === "Late" || a.status === "Late" ? "Late"
                  : p.status || a.status,
          } : { ...a });
        }

        let present = 0, leave = 0, lateDays = 0, otHours = 0, shortfallHours = 0;
        for (let d = 1; d <= lastDay; d++) {
          const date = `${month}-${String(d).padStart(2, "0")}`;
          if (isFriday(date)) continue;
          const a = byDay.get(date);
          const approvedLeave = leaves.some(
            (l) => Number(l.employeeId) === id && l.status === "Approved" && l.startDate <= date && l.endDate >= date
          );
          const hasPunch = Boolean(a?.checkIn || a?.checkIn2);
          if (!hasPunch && (a?.status === "Leave" || approvedLeave)) { leave++; continue; }
          if (!hasPunch) continue;

          present++;
          otHours += num(a?.overtimeHours);
          if (num(a?.lateMinutes) > 0) lateDays++;
          const dayEnded = Boolean(a?.checkOut2) || (Boolean(a?.checkOut) && !a?.checkIn2);
          if (dayEnded) shortfallHours += Math.max(0, STANDARD_HOURS - num(a?.workingHours));
        }

        const absent = Math.max(0, elapsedWorkDays - present - leave);
        const absentDed = absent * perDay;
        const shortfallDed = shortfallHours * hourly;
        const otPay = otHours * hourly;

        const fraction = totalWorkDays ? elapsedWorkDays / totalWorkDays : 0;
        const earnedToDate = Math.max(
          0,
          (present + leave) * perDay - shortfallDed + otPay
        );

        // Net = Gross − PF − Advance − Attendance Deduction + OT
        const projectedNet = Math.max(
          0,
          gross - pfDed - advanceDed - absentDed - shortfallDed + otPay
        );

        const paidRow = payrolls.find(
          (p) => Number(p.employeeId) === id && p.salaryMonth === month
        );
        const paid = paidRow ? paidRow.status === "Paid" : false;

        return {
          emp, gross, pf: pfDed, advanceDed, present, leave, absent, lateDays,
          otHours, shortfallHours, earnedToDate, projectedNet,
          absentDed, shortfallDed, otPay, paid,
        };
      })
      .filter((r) => {
        const s = q.trim().toLowerCase();
        return !s || `${r.emp.name} ${r.emp.empCode} ${r.emp.designation}`.toLowerCase().includes(s);
      });
  }, [employees, attendances, leaves, payrolls, month, today, q]);

     const totals = rows.reduce(
    (t, r) => ({
      gross: t.gross + r.gross,
      pf: t.pf + r.pf,
      advance: t.advance + r.advanceDed,
      ded: t.ded + r.absentDed + r.shortfallDed,
      earned: t.earned + r.earnedToDate,
      projected: t.projected + r.projectedNet,
      ot: t.ot + r.otPay,
    }),
    { gross: 0, pf: 0, advance: 0, ded: 0, earned: 0, projected: 0, ot: 0 }
  );

  async function generateAll() {
    if (!confirm(`${month} মাসের জন্য ${rows.length} জনের পে-রোল জেনারেট করবেন? আগের রেকর্ড থাকলে আপডেট হবে।`)) return;
    setBusy(true);
    let ok = 0;
    for (const r of rows) {
      try {
        const res = await fetch("/api/erp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            action: "generatePayroll",
            employeeId: r.emp.id,
            salaryMonth: month,
            basicSalary: r.gross,
            allowance: 0,
            pfDeduction: Math.round(r.pf),
            advanceDeduction: Math.round(r.advanceDed),
            otherDeduction: Math.round(r.absentDed + r.shortfallDed),
          }),
        });
        if (res.ok) ok++;
      } catch {}
    }
    setBusy(false);
    alert(`${ok}/${rows.length} জনের পে-রোল জেনারেট হয়েছে।`);
    window.location.reload();
  }

  function printSheet() {
    const w = window.open("", "_blank");
    if (!w) return;
        const trs = rows.map((r, i) =>
      `<tr><td>${i + 1}</td><td>${r.emp.name}</td><td>${r.emp.designation}</td><td>${taka(r.gross)}</td><td>${r.otHours.toFixed(1)}</td><td>${taka(r.pf)}</td><td>${taka(r.absentDed + r.shortfallDed)}</td><td>${taka(r.advanceDed)}</td><td>${taka(r.projectedNet)}</td><td>${r.paid ? "পরিশোধিত" : "চলমান"}</td></tr>`    ).join("");
    w.document.write(`<html><head><meta charset="utf-8"><title>Salary Sheet — ${month}</title>
      <style>body{font-family:sans-serif;padding:16px;font-size:12px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px}th{background:#e8f5f0}</style></head>
      <body><h2>Insaf Building Design & Consultant Ltd.</h2><h3>Staff Salary Sheet — ${month}</h3>
      <table><tr><th>Si</th><th>Name</th><th>Designation</th><th>Total Salary</th><th>T/A/D/A</th><th>OT</th><th>PF</th><th>Ded.</th><th>Adv</th><th>Net</th><th>Status</th></tr>${trs}</table>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <section className="space-y-4 mb-6">
      <div className="bg-gradient-to-r from-slate-900 to-emerald-900 text-white rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-300" /> লাইভ বেতন বোর্ড — হাজিরা থেকে স্বয়ংক্রিয়
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            প্রতিদিনের হাজিরা থেকে বেতন জমা হয় • PF ৫% • কম ঘণ্টায় ঘণ্টা অনুযায়ী কর্তন • অনুপস্থিতে দৈনিক বেতন কর্তন
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl text-slate-900 text-xs font-bold" />
          <button type="button" onClick={printSheet}
            className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold flex items-center gap-1">
            <Printer className="w-4 h-4" /> শিট প্রিন্ট
          </button>
          {isMgmt && (
            <button type="button" disabled={busy} onClick={generateAll}
              className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              {busy ? "জেনারেট হচ্ছে…" : "সবার পে-রোল জেনারেট"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { l: "মোট নির্ধারিত (Gross)", v: taka(totals.gross), c: "text-slate-900", I: Users },
          { l: "আজ পর্যন্ত অর্জিত", v: taka(totals.earned), c: "text-emerald-700", I: TrendingUp },
          { l: "মাস শেষে আনুমানিক নিট", v: taka(totals.projected), c: "text-indigo-700", I: Wallet },
          { l: "মোট কর্তন (Abs+Short)", v: taka(totals.ded), c: "text-rose-600", I: AlertTriangle },
          { l: "মোট PF", v: taka(totals.pf), c: "text-purple-600", I: ShieldCheck },
        ].map(({ l, v, c, I }) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500 flex items-center gap-1"><I className="w-3.5 h-3.5" /> {l}</p>
            <p className={`text-xl font-extrabold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 নাম / কোড খুঁজুন"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-2.5">#</th>
                <th className="p-2.5">কর্মী</th>
                <th className="p-2.5 text-right">Gross</th>
                <th className="p-2.5 text-center">উপস্থিত</th>
                <th className="p-2.5 text-center">ছুটি</th>
                <th className="p-2.5 text-center">অনুপস্থিত</th>
                <th className="p-2.5 text-center">লেট</th>
                <th className="p-2.5 text-center">ঘাটতি ঘণ্টা</th>
                <th className="p-2.5 text-center">OT ঘণ্টা</th>
                <th className="p-2.5 text-right">PF (৫%)</th>
                <th className="p-2.5 text-right">Advance</th>
                <th className="p-2.5 text-right">কর্তন</th>
                <th className="p-2.5 text-right">আজ পর্যন্ত</th>
                <th className="p-2.5 text-right">মাস শেষে Net</th>
                <th className="p-2.5">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.emp.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-slate-400">{i + 1}</td>
                 <td className="p-2.5">
  <button
    type="button"
    onClick={() => router.push(`/employees/${r.emp.id}`)}
    className="font-bold text-slate-900 hover:text-emerald-600 hover:underline text-left"
  >
    {r.emp.name}
  </button>
  <p className="text-[10px] text-slate-500">{r.emp.empCode} • {r.emp.designation}</p>
  <p className="text-[10px] text-emerald-600 font-semibold">৩৬০° প্রোফাইল →</p>
</td>
                  <td className="p-2.5 text-right font-mono">{taka(r.gross)}</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">{r.present}</td>
                  <td className="p-2.5 text-center text-blue-700">{r.leave}</td>
                  <td className="p-2.5 text-center font-bold text-rose-600">{r.absent}</td>
                  <td className="p-2.5 text-center text-amber-700">{r.lateDays}</td>
                  <td className="p-2.5 text-center">{r.shortfallHours.toFixed(1)}</td>
                  <td className="p-2.5 text-center text-indigo-700">{r.otHours.toFixed(1)}</td>
                  <td className="p-2.5 text-right text-purple-700 font-mono">{taka(r.pf)}</td>
<td className="p-2.5 text-right text-orange-600 font-mono">{taka(r.advanceDed)}</td>
<td className="p-2.5 text-right text-rose-600 font-mono">{taka(r.absentDed + r.shortfallDed)}</td>
                  <td className="p-2.5 text-right font-bold text-emerald-700 font-mono">{taka(r.earnedToDate)}</td>
                  <td className="p-2.5 text-right font-extrabold text-indigo-700 font-mono">{taka(r.projectedNet)}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>{r.paid ? "পরিশোধিত" : "চলমান"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50 border-t-2 border-emerald-300 font-bold">
                <td className="p-2.5" colSpan={2}>মোট ({rows.length} জন)</td>
                <td className="p-2.5 text-right font-mono">{taka(totals.gross)}</td>
                <td colSpan={6}></td>
                <td className="p-2.5 text-right text-purple-700 font-mono">{taka(totals.pf)}</td>
<td className="p-2.5 text-right text-orange-600 font-mono">{taka(totals.advance)}</td>
<td className="p-2.5 text-right text-rose-600 font-mono">{taka(totals.ded)}</td>
                <td className="p-2.5 text-right text-emerald-700 font-mono">{taka(totals.earned)}</td>
                <td className="p-2.5 text-right text-indigo-700 font-mono">{taka(totals.projected)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}