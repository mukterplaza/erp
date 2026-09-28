import { NextRequest, NextResponse } from "next/server";
import { db, users, employees, auditLogs } from "@/db";
import { eq, or, sql } from "drizzle-orm";
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
  // Production Security: NEVER expose demo accounts or user list to unauthenticated callers
  return NextResponse.json({
    user,
  });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  try {
    const body = await req.json();
    const { action } = body;

    // -------------------------------------------------------------------------
    // CRITICAL SECURITY (Part 5): Explicitly block all account impersonation & backdoors
    // -------------------------------------------------------------------------
    if (
      action === "quickLogin" ||
      action === "loginAs" ||
      action === "switchUser" ||
      action === "impersonate" ||
      action === "demoLogin"
    ) {
      const actor = await getCurrentUser();
      await db.insert(auditLogs).values({
        userId: actor?.id ?? null,
        userName: actor?.name || "Anonymous/Attacker",
        userRole: actor?.role || "Unauthenticated",
        action: "BLOCKED_IMPERSONATION_ATTEMPT",
        entity: "Security",
        recordId: String(body?.email || body?.targetUserId || "Unknown"),
        beforeData: null,
        afterData: { actionAttempted: action, target: body?.email || body?.targetUserId },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "Unknown",
      });

      return NextResponse.json(
        {
          error:
            "403 Forbidden: অ্যাকাউন্ট পরিবর্তন (Switch User) বা কুইক-লগইন (Quick Login) সম্পূর্ণ নিষিদ্ধ। শুধুমাত্র বৈধ ক্রেডেনশিয়াল দিয়ে লগইন করুন।",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------------------
    // 1. SECURE USER LOGIN (Email or Username + Password)
    // -------------------------------------------------------------------------
    if (action === "login") {
      const identifier = String(body.email || body.username || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!identifier || !password) {
        return NextResponse.json(
          { error: "ইমেইল/ইউজারনেম এবং পাসওয়ার্ড প্রদান করা বাধ্যতামূলক।" },
          { status: 400 }
        );
      }

      // Support convenient Login ID aliases (e.g. rakibul -> rakibul.hasan, etc.)
      const USERNAME_ALIASES: Record<string, string> = {
        "rakibul": "rakibul.hasan",
        "fahim": "asifur.fahim",
        "asifur": "asifur.fahim",
        "harizul": "harizul.islam",
        "mahdi": "mahdi.hasan",
        "rakib": "rakib.hossain",
        "asif": "azharul.asif",
        "azharul": "azharul.asif",
        "talha": "md.talha",
        "jahid": "jahid.hasan",
        "salam": "abdus.salam",
        "abdus": "abdus.salam",
        "yasin": "md.yasin",
        "israfil": "md.israfil",
      };
      const resolvedUsername = USERNAME_ALIASES[identifier] || identifier;

      // Also support Employee Code login (e.g. EMP-0001)
      let matchedUserIdFromEmp: number | null = null;
      if (identifier.startsWith("emp-")) {
        const [emp] = await db
          .select({ userId: employees.userId })
          .from(employees)
          .where(sql`LOWER(${employees.empCode}) = ${identifier}`)
          .limit(1);
        if (emp?.userId) {
          matchedUserIdFromEmp = emp.userId;
        }
      }

      const found = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, identifier),
            eq(users.username, identifier),
            eq(users.username, resolvedUsername),
            matchedUserIdFromEmp ? eq(users.id, matchedUserIdFromEmp) : sql`FALSE`
          )
        )
        .limit(1);

      if (found.length === 0) {
        return NextResponse.json(
          { error: "ইমেইল/ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।" },
          { status: 401 }
        );
      }

      const targetUser = found[0];
      if (targetUser.status !== "Active") {
        await logAudit({
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: targetUser.role,
          action: "INACTIVE_ACCOUNT_LOGIN_BLOCKED",
          entity: "User",
          recordId: String(targetUser.id),
          afterData: { email: targetUser.email, status: targetUser.status },
        });
        return NextResponse.json(
          { error: "আপনার অ্যাকাউন্টটি নিষ্ক্রিয়। অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।" },
          { status: 403 }
        );
      }

      if (!verifyPassword(password, targetUser.passwordHash)) {
        await logAudit({
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: targetUser.role,
          action: "FAILED_LOGIN_ATTEMPT",
          entity: "User",
          recordId: String(targetUser.id),
          afterData: { identifier },
        });
        return NextResponse.json(
          { error: "ইমেইল/ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।" },
          { status: 401 }
        );
      }

      await createSessionCookie(targetUser.id);
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

    // -------------------------------------------------------------------------
    // 2. SECURE LOGOUT (Terminates current session)
    // -------------------------------------------------------------------------
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
      return NextResponse.json({ success: true, message: "সফলভাবে লগআউট হয়েছে।" });
    }

    // -------------------------------------------------------------------------
    // 3. CHANGE PASSWORD (User can only change their OWN password)
    // -------------------------------------------------------------------------
    if (action === "changePassword") {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "অননুমোদিত অনুরোধ। দয়া করে লগইন করুন।" }, { status: 401 });
      }
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword || String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
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
          { error: "বর্তমান পাসওয়ার্ডটি সঠিক নয়।" },
          { status: 400 }
        );
      }

      await db
        .update(users)
        .set({
          passwordHash: hashPassword(newPassword),
          mustChangePassword: false,
        })
        .where(eq(users.id, user.id));

      await logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "PASSWORD_CHANGE",
        entity: "User",
        recordId: String(user.id),
      });

      return NextResponse.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।" });
    }

    // -------------------------------------------------------------------------
    // 4. FORGOT PASSWORD (Generates temporary reset token)
    // -------------------------------------------------------------------------
    if (action === "forgotPassword") {
      const email = String(body.email || "").trim().toLowerCase();
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!dbUser) {
        return NextResponse.json({ error: "এই ইমেইল ঠিকানা দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" }, { status: 404 });
      }

      if (dbUser.status !== "Active") {
        return NextResponse.json({ error: "আপনার অ্যাকাউন্টটি নিষ্ক্রিয়।" }, { status: 403 });
      }

      const resetToken = `RST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({ resetToken, resetTokenExpiry: expiry })
        .where(eq(users.id, dbUser.id));

      return NextResponse.json({
        success: true,
        resetToken,
        message: `রিসেট টোকেন তৈরি হয়েছে: ${resetToken}`,
      });
    }

    // -------------------------------------------------------------------------
    // 5. RESET PASSWORD WITH TOKEN
    // -------------------------------------------------------------------------
    if (action === "resetPassword") {
      const { email, resetToken, newPassword } = body;
      if (!email || !resetToken || !newPassword || String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "ইমেইল, বৈধ টোকেন এবং ৬+ অক্ষরের নতুন পাসওয়ার্ড প্রদান করুন।" },
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
          { error: "অবৈধ বা মেয়াদোত্তীর্ণ রিসেট টোকেন।" },
          { status: 400 }
        );
      }

      await db
        .update(users)
        .set({
          passwordHash: hashPassword(newPassword),
          resetToken: null,
          resetTokenExpiry: null,
          mustChangePassword: false,
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

      return NextResponse.json({ success: true, message: "পাসওয়ার্ড সফলভাবে রিসেট সম্পন্ন হয়েছে।" });
    }

    return NextResponse.json({ error: "অননুমোদিত অ্যাকশন।" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
