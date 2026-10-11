export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db, tasks, employees, taskComments } from "@/db";
import { desc, eq, inArray, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

const APPROVER_ROLES = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR"];
const isApprover = (role?: string | null) => APPROVER_ROLES.includes(role || "");
const RATINGS = ["Best", "Better", "Good", "Needs Improvement", "Penalty"];

function dhakaToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

// ---------------------------------------------------------------------------
// GET: শুধু কাজ-সংক্রান্ত ৩টি টেবিল পড়ে (পুরো ERP-এর ৩৮টি নয়)
// ---------------------------------------------------------------------------
export async function GET() {
  const me: any = await getCurrentUser();
  if (!me) return bad("Unauthorized", 401);

  const myEmp = me.employeeId ? Number(me.employeeId) : null;
  const approver = isApprover(me.role);

  const rows = approver
    ? await db.select().from(tasks).orderBy(desc(tasks.id)).limit(600)
    : myEmp
      ? await db
          .select()
          .from(tasks)
          .where(or(eq(tasks.assignedTo, myEmp), eq(tasks.assignedByEmployeeId, myEmp)))
          .orderBy(desc(tasks.id))
          .limit(300)
      : [];

  const ids = rows.map((r) => r.id);
  const history = ids.length
    ? await db
        .select({
          id: taskComments.id,
          taskId: taskComments.taskId,
          authorName: taskComments.authorName,
          comment: taskComments.comment,
          eventType: taskComments.eventType,
          progressPercent: taskComments.progressPercent,
          createdAt: taskComments.createdAt,
        })
        .from(taskComments)
        .where(inArray(taskComments.taskId, ids))
        .orderBy(desc(taskComments.id))
        .limit(800)
    : [];

  const directory = await db
    .select({
      id: employees.id,
      name: employees.name,
      designation: employees.designation,
      empCode: employees.empCode,
    })
    .from(employees)
    .where(eq(employees.archived, false));

  return NextResponse.json({
    me: { id: me.id, name: me.name, role: me.role, employeeId: myEmp },
    isApprover: approver,
    today: dhakaToday(),
    tasks: rows,
    history,
    directory,
  });
}

// ---------------------------------------------------------------------------
// POST: create / accept / decline / progress / submit / approve / correction / cancel
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const me: any = await getCurrentUser();
  if (!me) return bad("Unauthorized", 401);

  const myEmp = me.employeeId ? Number(me.employeeId) : null;
  const approver = isApprover(me.role);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("অবৈধ অনুরোধ");
  }
  const action = String(body.action || "");

  async function log(taskId: number, eventType: string, comment: string, oldStatus: string | null, newStatus: string, pct: number | null) {
    const [h] = await db
      .insert(taskComments)
      .values({
        taskId,
        userId: me.id,
        authorName: me.name,
        actorEmployeeId: myEmp,
        actorDesignation: me.designation || me.role,
        comment,
        actionType: eventType,
        eventType,
        oldStatus,
        newStatus,
        progressPercent: pct,
      })
      .returning();
    return h;
  }

  try {
    // ---------------- নতুন কাজ দেওয়া ----------------
    if (action === "create") {
      if (!myEmp) return bad("আপনার লগইন কোনো কর্মী প্রোফাইলের সাথে যুক্ত নয়।");
      const title = String(body.title || "").trim();
      const assignedTo = Number(body.assignedTo);
      const dueDate = String(body.dueDate || "");
      if (!title) return bad("কাজের শিরোনাম লিখুন");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return bad("সঠিক শেষ তারিখ দিন");

      const [target] = await db.select().from(employees).where(eq(employees.id, assignedTo));
      if (!target || target.archived) return bad("সক্রিয় কর্মী নির্বাচন করুন");

      const self = assignedTo === myEmp;
      const status = self ? "Accepted" : "Pending Acceptance";

      const [created] = await db
        .insert(tasks)
        .values({
          taskCode: `TSK-${Date.now().toString().slice(-8)}`,
          title,
          description: String(body.description || ""),
          assignedTo,
          managerId: myEmp,
          priority: ["Low", "Medium", "High", "Critical"].includes(body.priority) ? body.priority : "Medium",
          dueDate,
          status,
          progressPercent: 0,
          createdBy: me.name,
          assignedByUserId: me.id,
          assignedByEmployeeId: myEmp,
          assignedByName: me.name,
          assignedByDesignation: me.designation || me.role,
          assignedToName: target.name,
          assignedToDesignation: target.designation,
          category: "General",
          lastUpdateAt: new Date(),
        })
        .returning();

      const h = await log(created.id, "TASK_ASSIGNED", `${me.name} → ${target.name}: কাজ দেওয়া হয়েছে`, null, status, 0);
      return NextResponse.json({ success: true, task: created, historyItem: h });
    }

    // বাকি সব action-এ task লাগবে
    const taskId = Number(body.taskId);
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return bad("কাজটি পাওয়া যায়নি", 404);

    const isAssignee = myEmp !== null && task.assignedTo === myEmp;
    const isAssigner = myEmp !== null && task.assignedByEmployeeId === myEmp;

    // ---------------- গ্রহণ ----------------
    if (action === "accept") {
      if (!isAssignee) return bad("শুধু যাকে কাজ দেওয়া হয়েছে তিনি গ্রহণ করতে পারবেন", 403);
      if (task.status !== "Pending Acceptance") return bad("এই কাজটি আর গ্রহণের অপেক্ষায় নেই");
      const [u] = await db.update(tasks).set({ status: "Accepted", lastUpdateAt: new Date() }).where(eq(tasks.id, task.id)).returning();
      const h = await log(task.id, "TASK_ACCEPTED", "কাজটি গ্রহণ করেছেন", task.status, "Accepted", task.progressPercent);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    // ---------------- প্রত্যাখ্যান ----------------
    if (action === "decline") {
      if (!isAssignee) return bad("অনুমতি নেই", 403);
      if (task.status !== "Pending Acceptance") return bad("এই কাজটি আর গ্রহণের অপেক্ষায় নেই");
      const reason = String(body.reason || "").trim();
      if (!reason) return bad("প্রত্যাখ্যানের কারণ লিখুন");
      const [u] = await db.update(tasks).set({ status: "Declined", reviewNote: reason, lastUpdateAt: new Date() }).where(eq(tasks.id, task.id)).returning();
      const h = await log(task.id, "TASK_DECLINED", `প্রত্যাখ্যান: ${reason}`, task.status, "Declined", task.progressPercent);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    // ---------------- অগ্রগতি সংরক্ষণ (slider) ----------------
    if (action === "progress") {
      if (!isAssignee) return bad("শুধু নিজের কাজের অগ্রগতি দিতে পারবেন", 403);
      if (!["Accepted", "In Progress", "Reopened"].includes(task.status)) return bad("এই অবস্থায় অগ্রগতি দেওয়া যাবে না");
      const pct = Math.min(99, Math.max(0, Math.round(Number(body.progressPercent) || 0)));
      const note = String(body.note || "").trim();
      const first = !task.startDate && pct > 0;
      const [u] = await db
        .update(tasks)
        .set({
          progressPercent: pct,
          status: pct > 0 ? "In Progress" : task.status,
          startDate: first ? dhakaToday() : task.startDate,
          startedAt: first ? dhakaToday() : task.startedAt,
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();
      const h = await log(task.id, "TASK_PROGRESS_UPDATED", `${task.progressPercent}% → ${pct}%${note ? ` • ${note}` : ""}`, task.status, u.status, pct);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    // ---------------- ১০০% করে অনুমোদনে পাঠানো ----------------
    if (action === "submit") {
      if (!isAssignee) return bad("অনুমতি নেই", 403);
      if (!["Accepted", "In Progress", "Reopened"].includes(task.status)) return bad("এই অবস্থায় জমা দেওয়া যাবে না");
      const note = String(body.note || "").trim();
      const resubmit = task.status === "Reopened";
      const [u] = await db
        .update(tasks)
        .set({
          progressPercent: 100,
          status: "Review",
          reviewStatus: "Pending Review",
          completedBy: me.name,
          completedAt: new Date(),
          startDate: task.startDate || dhakaToday(),
          completionNote: note || task.completionNote,
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();
      const h = await log(task.id, resubmit ? "TASK_RESUBMITTED" : "TASK_COMPLETED", `${resubmit ? "সংশোধন করে আবার জমা" : "১০০% সম্পন্ন — অনুমোদনে পাঠানো হয়েছে"}${note ? ` • ${note}` : ""}`, task.status, "Review", 100);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    // ---------------- অনুমোদন + রেটিং ----------------
    if (action === "approve") {
      if (!approver) return bad("শুধু Owner/MD/Manager/HR অনুমোদন দিতে পারবেন", 403);
      if (isAssignee) return bad("নিজের কাজ নিজে অনুমোদন করা যাবে না", 403);
      if (task.status !== "Review") return bad("কাজটি অনুমোদনের অপেক্ষায় নেই");
      const rating = RATINGS.includes(body.rating) ? body.rating : "Good";
      const note = String(body.note || "").trim();
      const [u] = await db
        .update(tasks)
        .set({
          status: "Completed",
          reviewStatus: "Approved",
          rating,
          reviewNote: note,
          reviewedBy: me.name,
          reviewedAt: new Date(),
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();
      const h = await log(task.id, "TASK_APPROVED", `অনুমোদিত • রেটিং: ${rating}${note ? ` • ${note}` : ""}`, task.status, "Completed", 100);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    // ---------------- সংশোধনে ফেরত ----------------
    if (action === "correction") {
      if (!approver) return bad("অনুমতি নেই", 403);
      if (isAssignee) return bad("নিজের কাজে সংশোধন চাওয়া যাবে না", 403);
      if (task.status !== "Review") return bad("কাজটি অনুমোদনের অপেক্ষায় নেই");
      const reason = String(body.reason || "").trim();
      if (!reason) return bad("কী সংশোধন করতে হবে লিখুন");
      const [u] = await db
        .update(tasks)
        .set({
          status: "Reopened",
          reviewStatus: "Correction Required",
          reviewNote: reason,
          reviewedBy: me.name,
          reviewedAt: new Date(),
          correctionCount: (task.correctionCount || 0) + 1,
          progressPercent: Math.min(task.progressPercent, 90),
          lastUpdateAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();
      const h = await log(task.id, "TASK_CORRECTION_REQUIRED", `সংশোধন প্রয়োজন: ${reason}`, task.status, "Reopened", u.progressPercent);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    // ---------------- বাতিল (যিনি দিয়েছেন বা ম্যানেজমেন্ট) ----------------
    if (action === "cancel") {
      if (!isAssigner && !approver) return bad("অনুমতি নেই", 403);
      if (task.status === "Completed") return bad("সম্পন্ন কাজ বাতিল করা যাবে না");
      const [u] = await db.update(tasks).set({ status: "Cancelled", lastUpdateAt: new Date() }).where(eq(tasks.id, task.id)).returning();
      const h = await log(task.id, "TASK_CANCELLED", "কাজটি বাতিল করা হয়েছে", task.status, "Cancelled", task.progressPercent);
      return NextResponse.json({ success: true, task: u, historyItem: h });
    }

    return bad(`অজানা action: ${action}`);
  } catch (err) {
    console.error("WorkCenter POST error:", err);
    return bad(err instanceof Error ? err.message : "কাজটি সম্পন্ন হয়নি", 500);
  }
}