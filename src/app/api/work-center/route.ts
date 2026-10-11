export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db, tasks, employees, taskComments } from "@/db";
import { eq, or, and, desc } from "drizzle-orm";
import { getCurrentUser, isManagementRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isMgmt = isManagementRole(currentUser.role) || currentUser.role === "HR";
  const myEmpId = currentUser.employeeId;

  try {
    // ????????? ??????????? ???? ??? (Neon Compute ???????)
    let scopedTasks;
    if (isMgmt) {
      scopedTasks = await db.select().from(tasks).orderBy(desc(tasks.id)).limit(500);
    } else {
      scopedTasks = await db.select().from(tasks)
        .where(or(eq(tasks.assignedTo, myEmpId), eq(tasks.assignedByEmployeeId, myEmpId)))
        .orderBy(desc(tasks.id)).limit(200);
    }

    const directory = await db.select({
      id: employees.id,
      name: employees.name,
      designation: employees.designation,
      empCode: employees.empCode
    }).from(employees).where(eq(employees.archived, false));

    return NextResponse.json({
      currentUser,
      tasks: scopedTasks,
      directory,
    });
  } catch (error) {
    console.error("WorkCenter GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch work data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, taskId } = body;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(taskId)));
    if (!task && action !== "create") return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Action: Accept Task
    if (action === "accept") {
      const [updated] = await db.update(tasks).set({ status: "Accepted", lastUpdateAt: new Date() }).where(eq(tasks.id, task.id)).returning();
      return NextResponse.json({ success: true, task: updated });
    }
    
    // Action: Decline Task
    if (action === "decline") {
      const { declineReason } = body;
      const [updated] = await db.update(tasks).set({ status: "Cancelled", declineReason, lastUpdateAt: new Date() }).where(eq(tasks.id, task.id)).returning();
      return NextResponse.json({ success: true, task: updated });
    }

    // Action: Update Progress (Slider)
    if (action === "updateProgress") {
      const { progressPercent } = body;
      const pct = Math.min(100, Math.max(0, Number(progressPercent)));
      const newStatus = pct === 100 ? "Review" : pct > 0 ? "In Progress" : task.status;
      
      const [updated] = await db.update(tasks).set({ 
        progressPercent: pct, 
        status: newStatus,
        startDate: task.startDate || (pct > 0 ? new Date().toISOString().split("T")[0] : null),
        lastUpdateAt: new Date() 
      }).where(eq(tasks.id, task.id)).returning();
      return NextResponse.json({ success: true, task: updated });
    }

    // Action: Approve & Rate (Management)
    if (action === "approve") {
      const { rating, feedback } = body;
      const [updated] = await db.update(tasks).set({ 
        status: "Completed", 
        rating,
        completionNote: feedback,
        reviewedBy: currentUser.name,
        reviewedAt: new Date(),
        lastUpdateAt: new Date() 
      }).where(eq(tasks.id, task.id)).returning();
      return NextResponse.json({ success: true, task: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("WorkCenter POST Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}