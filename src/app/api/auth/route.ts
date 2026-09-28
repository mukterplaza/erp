import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { eq, or } from "drizzle-orm";
import {
  getCurrentUser,
  verifyPassword,
  hashPassword,
  createSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { logAudit } from "@/lib/erp-engine";
import crypto from "crypto";

export async function GET() {
  await ensureSeeded();
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const { email, password, loginId } = body;
      const identifier = String(loginId || email || "")
        .trim()
        .toLowerCase();
      if (!identifier || !password) {
        return NextResponse.json(
          { error: "লগইন আইডি ও পাসওয়ার্ড দিতে হবে" },
          { status: 400 }
        );
      }

      const found = await db
        .select()
        .from(users)
        .where(or(eq(users.email, identifier), eq(users.username, identifier)))
        .limit(1);

      if (found.length === 0) {
        await logAudit({
          userName: String(email),
          userRole: "Anonymous",
          action: "LOGIN_FAILED",
          entity: "User",
          recordId: String(email),
          afterData: { reason: "unknown_email" },
        });
        return NextResponse.json(
          { error: "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়" },
          { status: 401 }
        );
      }

      const targetUser = found[0];
      if (targetUser.status !== "Active") {
        await logAudit({
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: targetUser.role,
          action: "LOGIN_FAILED",
          entity: "User",
          recordId: String(targetUser.id),
          afterData: { reason: "inactive" },
        });
        return NextResponse.json(
          { error: "এই অ্যাকাউন্ট নিষ্ক্রিয়। প্রশাসকের সাথে যোগাযোগ করুন।" },
          { status: 403 }
        );
      }

      if (!verifyPassword(password, targetUser.passwordHash)) {
        await db
          .update(users)
          .set({ failedLoginCount: (targetUser.failedLoginCount || 0) + 1 })
          .where(eq(users.id, targetUser.id));
        await logAudit({
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: targetUser.role,
          action: "LOGIN_FAILED",
          entity: "User",
          recordId: String(targetUser.id),
          afterData: { reason: "bad_password" },
        });
        return NextResponse.json(
          { error: "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়" },
          { status: 401 }
        );
      }

      await db.update(users).set({ failedLoginCount: 0 }).where(eq(users.id, targetUser.id));
      await createSessionCookie(targetUser.id, "127.0.0.1", req.headers.get("user-agent") || "Browser");
      await logAudit({
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        action: "LOGIN",
        entity: "User",
        recordId: String(targetUser.id),
        afterData: { email: targetUser.email, role: targetUser.role },
      });

      const currentUser = await getCurrentUser();
      return NextResponse.json({ success: true, user: currentUser });
    }

    if (
      action === "quickLogin" ||
      action === "loginAs" ||
      action === "switchUser" ||
      action === "impersonate" ||
      action === "demoLogin"
    ) {
      await logAudit({
        userName: "Anonymous",
        userRole: "Anonymous",
        action: "IMPERSONATION_BLOCKED",
        entity: "User",
        recordId: String(body.email || "unknown"),
        afterData: { attemptedAction: action },
      });
      return NextResponse.json(
        { error: "অ্যাকাউন্ট পরিবর্তন / অন্যের পরিচয়ে লগইন সম্পূর্ণ নিষিদ্ধ।" },
        { status: 403 }
      );
    }

    if (action === "logout") {
      const user = await getCurrentUser();
      if (user) {
        await logAudit({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: "LOGOUT",
          entity: "User",
          recordId: String(user.id),
        });
      }
      await clearSessionCookie();
      return NextResponse.json({ success: true });
    }

    if (action === "changePassword") {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword || String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!verifyPassword(currentPassword, dbUser.passwordHash)) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      await db
        .update(users)
        .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false })
        .where(eq(users.id, user.id));

      await logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "PASSWORD_CHANGE",
        entity: "User",
        recordId: String(user.id),
      });

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    if (action === "forgotPassword") {
      const { email } = body;
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, String(email || "").trim().toLowerCase()))
        .limit(1);

      if (!dbUser) {
        return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
      }

      const resetToken = `RST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .update(users)
        .set({ resetToken, resetTokenExpiry: expiry })
        .where(eq(users.id, dbUser.id));

      return NextResponse.json({
        success: true,
        resetToken,
        message: `Reset token generated: ${resetToken}`,
      });
    }

    if (action === "resetPassword") {
      const { email, resetToken, newPassword } = body;
      if (!email || !resetToken || !newPassword || String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "Email, valid reset token, and 6+ char password required" },
          { status: 400 }
        );
      }

      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, String(email).trim().toLowerCase()))
        .limit(1);

      if (
        !dbUser ||
        dbUser.resetToken !== resetToken ||
        !dbUser.resetTokenExpiry ||
        new Date(dbUser.resetTokenExpiry) < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid or expired reset token" },
          { status: 400 }
        );
      }

      await db
        .update(users)
        .set({
          passwordHash: hashPassword(newPassword),
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, dbUser.id));

      await logAudit({
        userId: dbUser.id,
        userName: dbUser.name,
        userRole: dbUser.role,
        action: "PASSWORD_RESET",
        entity: "User",
        recordId: String(dbUser.id),
      });

      return NextResponse.json({ success: true, message: "Password reset complete" });
    }

    return NextResponse.json({ error: "Unknown auth action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
