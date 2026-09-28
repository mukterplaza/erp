import { NextRequest, NextResponse } from "next/server";
import { db, tasks, workFiles } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, canViewAllEmployeeProfiles } from "@/lib/auth";
import { logAudit } from "@/lib/erp-engine";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_EXT = /\.(jpe?g|png|webp|pdf|docx?|xlsx?)$/i;

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "ফাইল পাওয়া যায়নি" }, { status: 400 });
  }

  const taskIdRaw = form.get("taskId");
  const taskId = taskIdRaw ? Number(taskIdRaw) : null;
  const isMgmt = canViewAllEmployeeProfiles(currentUser.role);

  let ownerEmployeeId = currentUser.employeeId;
  if (taskId) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!isMgmt && task.assignedTo !== currentUser.employeeId) {
      return NextResponse.json(
        { error: "অন্যের টাস্কে ফাইল আপলোড করার অনুমতি নেই।" },
        { status: 403 }
      );
    }
    ownerEmployeeId = task.assignedTo;
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "কমপক্ষে একটি ফাইল দিন" }, { status: 400 });
  }
  if (files.length > 10) {
    return NextResponse.json({ error: "একবারে সর্বোচ্চ ১০টি ফাইল" }, { status: 400 });
  }

  const saved: Array<{ id: number; fileName: string; mimeType: string; sizeBytes: number }> = [];
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: `${f.name}: সর্বোচ্চ ৫ MB` }, { status: 400 });
    }
    if (!ALLOWED.has(f.type) || !ALLOWED_EXT.test(f.name)) {
      return NextResponse.json(
        { error: `${f.name}: শুধু ছবি, PDF, Word, Excel অনুমোদিত` },
        { status: 400 }
      );
    }
    const buf = Buffer.from(await f.arrayBuffer());
    const [row] = await db
      .insert(workFiles)
      .values({
        taskId,
        employeeId: ownerEmployeeId,
        uploadedByUserId: currentUser.id,
        uploadedByName: currentUser.name,
        fileName: f.name.slice(0, 200),
        mimeType: f.type,
        sizeBytes: f.size,
        dataBase64: buf.toString("base64"),
      })
      .returning({
        id: workFiles.id,
        fileName: workFiles.fileName,
        mimeType: workFiles.mimeType,
        sizeBytes: workFiles.sizeBytes,
      });
    saved.push(row);
  }

  await logAudit({
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action: "FILE_UPLOAD",
    entity: "WorkFile",
    recordId: saved.map((s) => s.id).join(","),
    afterData: { taskId, files: saved.map((s) => s.fileName) },
  });

  return NextResponse.json({ success: true, files: saved });
}
