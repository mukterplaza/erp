import { NextRequest, NextResponse } from "next/server";
import { db, tasks, workFiles } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, canViewAllEmployeeProfiles } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [file] = await db.select().from(workFiles).where(eq(workFiles.id, Number(id)));
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const isMgmt = canViewAllEmployeeProfiles(currentUser.role);
  let allowed =
    isMgmt ||
    file.uploadedByUserId === currentUser.id ||
    (file.employeeId !== null && file.employeeId === currentUser.employeeId);

  if (!allowed && file.taskId) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, file.taskId));
    allowed = !!task && task.assignedTo === currentUser.employeeId;
  }
  if (!allowed) {
    return NextResponse.json({ error: "এই ফাইল দেখার অনুমতি নেই।" }, { status: 403 });
  }

  const bytes = Buffer.from(file.dataBase64, "base64");
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
