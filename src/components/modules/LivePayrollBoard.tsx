"use client";



import React, { useMemo, useState } from "react";


import { Wallet, Users, TrendingUp, AlertTriangle, RefreshCw, Printer, ShieldCheck } from "lucide-react";



const WORKING_DAYS = 26;

const STANDARD_HOURS = 8.75;

const PF_RATE = 0.05;

// August 2026 salary sheet fallback. Existing positive employee salary always wins.
const SALARY_REFERENCE: Record<string, { gross: number; pf: boolean }> = {
  "md harijul islam": { gross: 50000, pf: false },
  "harijul islam": { gross: 50000, pf: false },
  // Common spelling used in the employee list (Harizul vs Harijul).
  "md harizul islam": { gross: 50000, pf: false },
  "harizul islam": { gross: 50000, pf: false },
  "md rakibul hasan": { gross: 50000, pf: false },
  "md asifur rahman fahim": { gross: 32000, pf: true },
  "asifur rahman fahim": { gross: 32000, pf: true },
  "md rakib hossain": { gross: 30000, pf: true },
  "engr rakib hossain": { gross: 30000, pf: true },
  "md abu talha": { gross: 23000, pf: true },
  "md talha": { gross: 23000, pf: true },
  "md mehadi hassan": { gross: 24000, pf: true },
  "md mahdi hasan": { gross: 24000, pf: true },
  "mahdi hasan": { gross: 24000, pf: true },
  "md jahid hassan": { gross: 23000, pf: false },
  "jahid hassan": { gross: 23000, pf: false },
  "md jahid hasan": { gross: 23000, pf: false },
  "jahid hasan": { gross: 23000, pf: false },
  "md yeasin hossain": { gross: 14500, pf: true },
  "md yasin": { gross: 14500, pf: true },
  "yasin": { gross: 14500, pf: true },
  "md azharul haque asif": { gross: 24000, pf: false },
  "azharul haq asif": { gross: 24000, pf: false },
  "md azharul haq asif": { gross: 24000, pf: false },
  "md abdus salam": { gross: 18500, pf: true },
  "md parves": { gross: 15000, pf: false },
  "md rafiqul islam n g": { gross: 14500, pf: false },
  "md israfi n g": { gross: 15000, pf: false },
  "md israfil": { gross: 15000, pf: false },
  "israfil": { gross: 15000, pf: false },
  "engr muhammad sheik rakibul hasan": { gross: 50000, pf: false },
  "muhammad sheik rakibul hasan": { gross: 50000, pf: false },
};

const normalizeName = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const firstPositive = (...values: any[]) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return 0;
};



const num = (v: any) => {

  const n = Number(v);

  return Number.isFinite(n) ? n : 0;

};

// If older attendance rows have punch times but no workingHours value,
// calculate completed session durations from the four punch fields.
const punchMinutes = (value: any): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const match = String(value).match(/(?:T|\s)?(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const deriveWorkingHours = (a: any): number => {
  const stored = num(a?.workingHours);
  if (stored > 0) return stored;
  let totalMinutes = 0;
  const addPair = (start: any, end: any) => {
    const from = punchMinutes(start);
    const to = punchMinutes(end);
    if (from !== null && to !== null && to >= from) totalMinutes += to - from;
  };
  addPair(a?.checkIn, a?.checkOut);
  addPair(a?.checkIn2, a?.checkOut2);
  return totalMinutes / 60;
};

const taka = (n: number) => "৳" + Math.round(n).toLocaleString("en-IN");

const bdToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

const isFriday = (d: string) => {

  // Asia/Dhaka Friday — avoid UTC shift

  const [y, m, day] = d.split("-").map(Number);

  const dt = new Date(Date.UTC(y, m - 1, day, 6, 0, 0)); // +6h ≈ BD

  return dt.getUTCDay() === 5;

};



export function LivePayrollBoard({ data }: { data: any }) {

  const today = bdToday();



  const [month, setMonth] = useState(today.slice(0, 7));

  const [q, setQ] = useState("");

  const [busy, setBusy] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);



  const role = String(data.currentUser?.role || "Staff").trim();

  const isMgmt = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Accounts"]
    .some((r) => r.toLowerCase() === role.toLowerCase());

  // A logged-in user ID and an employee table ID are not always the same.
  // Match all known employee/user linkage fields to avoid an empty staff view.
  const currentUserIds = [
    data.currentUser?.employeeId,
    data.currentUser?.id,
    data.currentUser?.userId,
    data.currentUser?.user?.id,
  ].filter((v) => v !== undefined && v !== null && v !== "").map(String);

  const allEmployees: any[] = (data.employees || []).filter((e: any) => !e.archived);

  const employees = isMgmt
    ? allEmployees
    : allEmployees.filter((e) => {
        const employeeIds = [e.id, e.employeeId, e.userId, e.user?.id]
          .filter((v) => v !== undefined && v !== null && v !== "").map(String);
        return employeeIds.some((id) => currentUserIds.includes(id));
      });



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
        const savedPayroll = payrolls.find(
          (p) => Number(p.employeeId) === id && p.salaryMonth === month
        );
        const reference = SALARY_REFERENCE[normalizeName(emp.name)];
        const storedBasic = firstPositive(
          emp.basicSalary, emp.monthlySalary, emp.salary, emp.grossSalary, savedPayroll?.basicSalary
        );
        const storedAllowance = firstPositive(
          emp.allowance, emp.salaryAllowance, savedPayroll?.allowance
        );
        const basic = storedBasic > 0
          ? storedBasic
          : Math.max(0, (reference?.gross || 0) - storedAllowance);
        const allowance = storedAllowance;
        const gross = basic + allowance;
        const explicitPfAmount = firstPositive(emp.pfDeduction, emp.providentFund);
        const hasExplicitPfFlag =
          typeof emp.pfEligible === "boolean" ||
          typeof emp.providentFundEligible === "boolean";
        const pfEligible = hasExplicitPfFlag
          ? Boolean(emp.pfEligible ?? emp.providentFundEligible)
          : reference?.pf ?? (firstPositive(emp.pfRate, emp.pfPercentage) > 0);
        const rawPfRate = firstPositive(emp.pfRate, emp.pfPercentage);
        const configuredPfRate = rawPfRate > 1 ? rawPfRate / 100 : rawPfRate;
        const pfDed = explicitPfAmount > 0
          ? explicitPfAmount
          : pfEligible
            ? gross * (configuredPfRate || PF_RATE)
            : 0;
        const advanceDed = num(emp.advanceBalance);
        const perDay = gross / WORKING_DAYS;
        const hourly = perDay / STANDARD_HOURS;



        const byDay = new Map<string, any>();

        for (const a of attendances) {

          const employeeAttendanceIds = new Set(
            [emp.id, emp.employeeId, emp.userId, emp.user?.id]
              .filter((value) => value !== undefined && value !== null && value !== "")
              .map((value) => String(value))
          );
          const attendanceIds = [
            a.employeeId, a.employee_id, a.userId, a.user_id, a.staffId, a.staff_id
          ].filter((value) => value !== undefined && value !== null && value !== "").map((value) => String(value));
          if (!attendanceIds.some((attendanceId) => employeeAttendanceIds.has(attendanceId))) continue;

          const attendanceDate = String(a.date || "").slice(0, 10);
          if (!attendanceDate.startsWith(`${month}-`)) continue;
          const p = byDay.get(attendanceDate);
          byDay.set(
            attendanceDate,

            p

              ? {

                  ...p,

                  checkIn: p.checkIn || a.checkIn,

                  checkOut: p.checkOut || a.checkOut,

                  checkIn2: p.checkIn2 || a.checkIn2,

                  checkOut2: p.checkOut2 || a.checkOut2,

                  workingHours: Math.max(num(p.workingHours), num(a.workingHours)),

                  overtimeHours: Math.max(num(p.overtimeHours), num(a.overtimeHours)),

                  lateMinutes: Math.max(num(p.lateMinutes), num(a.lateMinutes)),

                  status:

                    p.status === "Leave" || a.status === "Leave"

                      ? "Leave"

                      : p.status === "Late" || a.status === "Late"

                      ? "Late"

                      : p.status || a.status,

                }

              : { ...a }

          );

        }



        let present = 0,

          leave = 0,

          lateDays = 0,

          otHours = 0,

          shortfallHours = 0;

        const daily: any[] = [];



        for (let d = 1; d <= lastDay; d++) {

          const date = `${month}-${String(d).padStart(2, "0")}`;

          if (isFriday(date)) continue;

          const a = byDay.get(date);

          const approvedLeave = leaves.some(

            (l) =>

              [emp.id, emp.employeeId, emp.userId, emp.user?.id]
                .filter((value) => value !== undefined && value !== null && value !== "")
                .map(String)
                .includes(String(l.employeeId ?? l.employee_id ?? l.userId ?? l.user_id)) &&

              l.status === "Approved" &&

              l.startDate <= date &&

              l.endDate >= date

          );

          const hasPunch =
            Boolean(a?.checkIn || a?.checkIn2) ||
            ["Present", "Late", "Early Leave", "Missing Checkout"].includes(String(a?.status || ""));

          const dayEnded = Boolean(a?.checkOut2) || (Boolean(a?.checkOut) && !a?.checkIn2);

          const wh = deriveWorkingHours(a);

          const ot = num(a?.overtimeHours);

          const short = dayEnded ? Math.max(0, STANDARD_HOURS - wh) : 0;



          let status = "Absent";

          let earnedDay = 0;

          if (!hasPunch && (a?.status === "Leave" || approvedLeave)) {

            leave++;

            status = "Leave";

            earnedDay = perDay;

          } else if (hasPunch) {

            present++;

            otHours += ot;

            if (num(a?.lateMinutes) > 0) lateDays++;

            shortfallHours += short;

            status = num(a?.lateMinutes) > 0 ? "Late" : "Present";

            earnedDay = perDay - short * hourly + ot * hourly;

          }



          daily.push({

            date,

            status,

            in: a?.checkIn || a?.checkIn2 || "—",

            out: a?.checkOut2 || a?.checkOut || "—",

            hours: wh,

            ot,

            short,

            earned: Math.max(0, earnedDay),

          });

        }



        const absent = Math.max(0, elapsedWorkDays - present - leave);

        const absentDed = absent * perDay;

        const shortfallDed = shortfallHours * hourly;

        const otPay = otHours * hourly;



        const earnedToDate = Math.max(0, (present + leave) * perDay - shortfallDed + otPay);

        const projectedNet = Math.max(0, gross - pfDed - advanceDed - absentDed - shortfallDed + otPay);



        const paid = savedPayroll ? savedPayroll.status === "Paid" : false;



        return {

          emp,

          gross,

          basic,
          allowance,
          salaryMissing: gross <= 0,
          pf: pfDed,

          advanceDed,

          present,

          leave,

          absent,

          lateDays,

          otHours,

          shortfallHours,

          earnedToDate,

          projectedNet,

          absentDed,

          shortfallDed,

          otPay,

          paid,

          daily,

          perDay,

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

    if (!isMgmt) return;

    const missingSalary = rows.filter((r) => r.salaryMissing);
    if (missingSalary.length) {
      alert(`পে-রোল জেনারেট বন্ধ: ${missingSalary.length} জনের বেতন নির্ধারিত নেই। আগে কর্মীর Salary field বা salary reference মিলিয়ে নিন।`);
      return;
    }

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

            basicSalary: r.basic,
            allowance: r.allowance,
            pfDeduction: Math.round(r.pf),
            advanceDeduction: Math.round(r.advanceDed),
            // API calculates absent/shortfall deductions itself; do not deduct twice.
            otherDeduction: 0,

          }),

        });

        if (res.ok) {
          ok++;
        } else {
          const payload = await res.json().catch(() => ({}));
          console.error(`Payroll generation failed for employee ${r.emp.id}:`, payload);
        }
      } catch (error) {
        console.error(`Payroll generation failed for employee ${r.emp.id}:`, error);
      }

    }

    setBusy(false);

    alert(`${ok}/${rows.length} জনের পে-রোল জেনারেট হয়েছে।`);

    window.location.reload();

  }



  function printSheet() {

    if (!isMgmt) return;

    const w = window.open("", "_blank");

    if (!w) return;

    const trs = rows

      .map(

        (r, i) =>

          `<tr><td>${i + 1}</td><td>${r.emp.name}</td><td>${r.emp.designation}</td><td>${taka(r.gross)}</td><td>${r.otHours.toFixed(1)}</td><td>${taka(r.pf)}</td><td>${taka(r.absentDed + r.shortfallDed)}</td><td>${taka(r.advanceDed)}</td><td>${taka(r.projectedNet)}</td><td>${r.paid ? "পরিশোধিত" : "চলমান"}</td></tr>`

      )

      .join("");

    w.document.write(`<html><head><meta charset="utf-8"><title>Salary Sheet — ${month}</title>

      <style>body{font-family:sans-serif;padding:16px;font-size:12px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px}th{background:#e8f5f0}</style></head>

      <body><h2>Insaf Building Design & Consultant Ltd.</h2><h3>Staff Salary Sheet — ${month}</h3>

      <table><tr><th>Si</th><th>Name</th><th>Designation</th><th>Total Salary</th><th>OT</th><th>PF</th><th>Ded.</th><th>Adv</th><th>Net</th><th>Status</th></tr>${trs}</table>

      <script>window.print()</script></body></html>`);

    w.document.close();

  }



  const isStaffView = !isMgmt && rows.length <= 1;



  return (

    <section className="space-y-4 mb-6">

      <div className="bg-gradient-to-r from-slate-900 to-emerald-900 text-white rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">

        <div>

          <h2 className="text-lg font-bold flex items-center gap-2">

            <Wallet className="w-5 h-5 text-emerald-300" />

            {isStaffView ? "আমার বেতন — লাইভ" : "লাইভ বেতন বোর্ড — হাজিরা থেকে স্বয়ংক্রিয়"}

          </h2>

          <p className="text-xs text-emerald-100 mt-1">

            প্রতিদিনের হাজিরা থেকে বেতন জমা হয় • PF ৫% • কম ঘণ্টায় ঘণ্টা অনুযায়ী কর্তন • অনুপস্থিতে দৈনিক বেতন কর্তন

          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <input

            type="month"

            value={month}

            onChange={(e) => setMonth(e.target.value)}

           className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-bold border border-emerald-200"

          />

          {isMgmt && (

            <>

              <button

                type="button"

                onClick={printSheet}

                className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold flex items-center gap-1"

              >

                <Printer className="w-4 h-4" /> শিট প্রিন্ট

              </button>

              <button

                type="button"

                disabled={busy}

                onClick={generateAll}

                className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 disabled:opacity-50"

              >

                <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />

                {busy ? "জেনারেট হচ্ছে…" : "সবার পে-রোল জেনারেট"}

              </button>

            </>

          )}

        </div>

      </div>



      {/* ===== STAFF PERSONAL VIEW ===== */}

      {isStaffView && rows[0] && (

        <StaffPersonal r={rows[0]} month={month} taka={taka} />

      )}



      {/* ===== MANAGEMENT / MULTI VIEW ===== */}

      {!isStaffView && (

        <>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

            {[

              { l: "মোট নির্ধারিত (Gross)", v: taka(totals.gross), c: "text-slate-900", I: Users },

              { l: "আজ পর্যন্ত অর্জিত", v: taka(totals.earned), c: "text-emerald-700", I: TrendingUp },

              { l: "মাস শেষে আনুমানিক নিট", v: taka(totals.projected), c: "text-indigo-700", I: Wallet },

              { l: "মোট কর্তন (Abs+Short)", v: taka(totals.ded), c: "text-rose-600", I: AlertTriangle },

              { l: "মোট PF", v: taka(totals.pf), c: "text-purple-600", I: ShieldCheck },

            ].map(({ l, v, c, I }) => (

              <div key={l} className="bg-white rounded-xl border border-slate-200 p-3">

                <p className="text-[11px] text-slate-500 flex items-center gap-1">

                  <I className="w-3.5 h-3.5" /> {l}

                </p>

                <p className={`text-xl font-extrabold ${c}`}>{v}</p>

              </div>

            ))}

          </div>



          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

            <div className="p-3 border-b border-slate-200">

              <input

                value={q}

                onChange={(e) => setQ(e.target.value)}

                placeholder="🔍 নাম / কোড খুঁজুন"

                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"

              />

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

                    <th className="p-2.5 text-right">PF</th>

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

                          onClick={() =>
                            setSelectedEmployeeId((current) =>
                              current === Number(r.emp.id) ? null : Number(r.emp.id)
                            )
                          }

                          className="font-bold text-slate-900 hover:text-emerald-600 hover:underline text-left"

                        >

                          {r.emp.name}

                        </button>

                        <p className="text-[10px] text-slate-500">

                          {r.emp.empCode} • {r.emp.designation}

                        </p>

                      </td>

                      <td className="p-2.5 text-right font-mono">
                        {r.salaryMissing ? <span className="text-rose-600 font-bold" title="Employee salary is not set">বেতন নেই</span> : taka(r.gross)}
                      </td>

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

                        <span

                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${

                            r.paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"

                          }`}

                        >

                          {r.paid ? "পরিশোধিত" : "চলমান"}

                        </span>

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

          {selectedEmployeeId !== null && rows.some((r) => Number(r.emp.id) === selectedEmployeeId) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-bold text-sm">
                  বেতনের বিস্তারিত — {rows.find((r) => Number(r.emp.id) === selectedEmployeeId)?.emp.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId(null)}
                  className="rounded-lg border bg-white px-3 py-1 text-xs font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
              <StaffPersonal
                r={rows.find((r) => Number(r.emp.id) === selectedEmployeeId)}
                month={month}
                taka={taka}
              />
            </div>
          )}

        </>

      )}

    </section>

  );

}



function StaffPersonal({ r, month, taka }: { r: any; month: string; taka: (n: number) => string }) {

  return (

    <div className="space-y-4">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <Card label="গ্রস বেতন" value={taka(r.gross)} />

        <Card label="আজ পর্যন্ত অর্জিত" value={taka(r.earnedToDate)} accent="text-emerald-700" />

        <Card label="মাস শেষে আনুমানিক নিট" value={taka(r.projectedNet)} accent="text-indigo-700" />

        <Card

          label="স্ট্যাটাস"

          value={r.paid ? "পরিশোধিত" : "চলমান"}

          accent={r.paid ? "text-emerald-700" : "text-amber-700"}

        />

      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">

        <Mini l="উপস্থিত" v={r.present} />

        <Mini l="ছুটি" v={r.leave} />

        <Mini l="অনুপস্থিত" v={r.absent} danger />

        <Mini l="লেট" v={r.lateDays} />

        <Mini l="OT ঘণ্টা" v={r.otHours.toFixed(1)} />

        <Mini l="ঘাটতি ঘণ্টা" v={r.shortfallHours.toFixed(1)} />

      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

        <Mini l="PF" v={taka(r.pf)} />

        <Mini l="Advance" v={taka(r.advanceDed)} />

        <Mini l="অনুপস্থিতির কর্তন" v={taka(r.absentDed)} danger />

        <Mini l="কম কাজের সময়ের কর্তন" v={taka(r.shortfallDed)} danger />

        <Mini l="মোট কর্তন" v={taka(r.pf + r.advanceDed + r.absentDed + r.shortfallDed)} danger />

        <Mini l="OT আয়" v={taka(r.otPay)} />

        <Mini l="দৈনিক বেতন" v={taka(r.perDay)} />

        <Mini l="প্রতি ঘণ্টার রেট" v={taka(r.perDay / STANDARD_HOURS)} />

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 text-xs space-y-2">
        <h3 className="font-bold text-sm text-slate-800">বেতন ও কর্তনের বিস্তারিত</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex justify-between gap-3"><span>নির্ধারিত গ্রস বেতন</span><strong>{taka(r.gross)}</strong></div>
          <div className="flex justify-between gap-3"><span>উপস্থিতি ও অনুমোদিত ছুটির অর্জিত বেতন</span><strong>{taka((r.present + r.leave) * r.perDay)}</strong></div>
          <div className="flex justify-between gap-3"><span>অনুপস্থিত দিন ({r.absent} দিন × দৈনিক বেতন)</span><strong className="text-rose-600">− {taka(r.absentDed)}</strong></div>
          <div className="flex justify-between gap-3"><span>দৈনিক সময়ের ঘাটতি ({r.shortfallHours.toFixed(2)} ঘণ্টা)</span><strong className="text-rose-600">− {taka(r.shortfallDed)}</strong></div>
          <div className="flex justify-between gap-3"><span>প্রভিডেন্ট ফান্ড (PF)</span><strong className="text-rose-600">− {taka(r.pf)}</strong></div>
          <div className="flex justify-between gap-3"><span>অগ্রিম বেতন (Advance)</span><strong className="text-rose-600">− {taka(r.advanceDed)}</strong></div>
          <div className="flex justify-between gap-3"><span>অনুমোদিত অতিরিক্ত কাজের বেতন (OT)</span><strong className="text-emerald-700">+ {taka(r.otPay)}</strong></div>
          <div className="flex justify-between gap-3 border-t pt-2"><span className="font-bold">আনুমানিক নিট বেতন</span><strong className="text-indigo-700">{taka(r.projectedNet)}</strong></div>
        </div>
        <p className="text-slate-500">এটি চলতি মাসের লাইভ হিসাব। চূড়ান্ত বেতন HR/Accounts অনুমোদনের পর নিশ্চিত হবে।</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        <div className="p-3 border-b font-bold text-sm">দৈনিক হিসাব — {month} (শুক্রবার ছুটি)</div>

        <div className="overflow-x-auto">

          <table className="w-full text-xs">

            <thead>

              <tr className="bg-slate-50 text-slate-600">

                <th className="p-2 text-left">তারিখ</th>

                <th className="p-2">ইন</th>

                <th className="p-2">আউট</th>

                <th className="p-2">ঘণ্টা</th>

                <th className="p-2">OT</th>

                <th className="p-2">স্ট্যাটাস</th>

                <th className="p-2 text-right">সেদিনের অর্জিত</th>

              </tr>

            </thead>

            <tbody className="divide-y">

              {r.daily.map((d: any) => (

                <tr key={d.date} className="hover:bg-slate-50">

                  <td className="p-2 font-mono">{d.date}</td>

                  <td className="p-2 text-center">{d.in}</td>

                  <td className="p-2 text-center">{d.out}</td>

                  <td className="p-2 text-center">{d.hours ? d.hours.toFixed(2) : "—"}</td>

                  <td className="p-2 text-center">{d.ot ? d.ot.toFixed(1) : "—"}</td>

                  <td className="p-2 text-center">

                    <span

                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${

                        d.status === "Present"

                          ? "bg-emerald-100 text-emerald-800"

                          : d.status === "Leave"

                          ? "bg-blue-100 text-blue-800"

                          : d.status === "Late"

                          ? "bg-amber-100 text-amber-800"

                          : "bg-rose-100 text-rose-800"

                      }`}

                    >

                      {d.status}

                    </span>

                  </td>

                  <td className="p-2 text-right font-mono font-bold">{taka(d.earned)}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <p className="p-3 text-[11px] text-slate-500">

          লাইভ হিসাব। চূড়ান্ত বেতন মাস শেষে HR/Accounts অনুমোদনের পর। PF ও অ্যাডভান্স মাস শেষে কাটা হবে।

        </p>

      </div>

    </div>

  );

}



function Card({ label, value, accent }: { label: string; value: string; accent?: string }) {

  return (

    <div className="bg-white rounded-xl border p-4">

      <p className="text-[11px] text-slate-500">{label}</p>

      <p className={`text-2xl font-extrabold ${accent || "text-slate-900"}`}>{value}</p>

    </div>

  );

}

function Mini({ l, v, danger }: { l: string; v: any; danger?: boolean }) {

  return (

    <div className="bg-white rounded-xl border p-3">

      <p className="text-slate-500">{l}</p>

      <p className={`font-bold ${danger ? "text-rose-600" : ""}`}>{v}</p>

    </div>

  );

}
