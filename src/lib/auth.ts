import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { db, users, sessions, employees } from "@/db";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE_NAME = "insaf_erp_session";
const SECRET_SALT = process.env.AUTH_SECRET || "insaf_erp_enterprise_salt_2026";

export type UserRole =
  | "Owner"
  | "Chairman"
  | "Manager"
  | "Marketing"
  | "Engineer"
  | "Project Manager"
  | "Site Staff"
  | "Staff"
  | "MD"
  | "Admin"
  | "HR"
  | "Accounts"
  | "Sales";

export const ALL_ROLES: UserRole[] = [
  "Owner",
  "Chairman",
  "Manager",
  "Marketing",
  "Engineer",
  "Project Manager",
  "Site Staff",
  "Staff",
  "MD",
  "Admin",
  "HR",
  "Accounts",
  "Sales",
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Owner: ["*"],
  MD: ["*"],
  Admin: ["*"],
  Chairman: [
    "dashboard.view",
    "announcements.view",
    "announcements.create",
    "tasks.view",
    "tasks.manage",
    "tasks.approve",
    "projects.view",
    "projects.manage",
    "sites.view",
    "leads.view",
    "leads.manage",
    "clients.view",
    "quotations.view",
    "reports.view",
    "employees.view",
    "attendance.view",
    "documents.view",
    "notifications.view",
    "settings.view",
    "audit.view",
    "accounts.view",
    "payroll.view",
    "users.view",
  ],
  Manager: [
    "dashboard.view",
    "announcements.view",
    "announcements.create",
    "attendance.view",
    "attendance.approve",
    "daily_work.view",
    "daily_work.manage",
    "tasks.view",
    "tasks.manage",
    "tasks.approve",
    "employees.view",
    "leads.view",
    "leads.manage",
    "clients.view",
    "quotations.view",
    "projects.view",
    "projects.manage",
    "sites.view",
    "sites.manage",
    "materials.view",
    "inventory.view",
    "procurement.view",
    "procurement.approve",
    "leave.view",
    "leave.approve",
    "performance.view",
    "performance.manage",
    "reports.view",
    "documents.view",
    "notifications.view",
    "payroll.view",
    "accounts.view",
    "users.view",
  ],
  Marketing: [
    "dashboard.view",
    "announcements.view",
    "attendance.self",
    "daily_work.self",
    "tasks.self",
    "leads.view",
    "leads.manage",
    "clients.view",
    "clients.manage",
    "quotations.view",
    "quotations.manage",
    "leave.self",
    "documents.view",
    "notifications.view",
  ],
  Engineer: [
    "dashboard.view",
    "announcements.view",
    "attendance.self",
    "daily_work.self",
    "tasks.self",
    "projects.view",
    "sites.view",
    "sites.manage",
    "materials.view",
    "inventory.view",
    "procurement.create",
    "labour.view",
    "leave.self",
    "documents.view",
    "notifications.view",
  ],
  "Project Manager": [
    "dashboard.view",
    "announcements.view",
    "attendance.self",
    "daily_work.view",
    "daily_work.manage",
    "tasks.view",
    "tasks.manage",
    "tasks.approve",
    "projects.view",
    "projects.manage",
    "sites.view",
    "sites.manage",
    "materials.view",
    "inventory.view",
    "inventory.manage",
    "procurement.view",
    "procurement.manage",
    "labour.view",
    "labour.manage",
    "expenses.view",
    "expenses.create",
    "leave.self",
    "reports.view",
    "documents.view",
    "notifications.view",
  ],
  "Site Staff": [
    "dashboard.view",
    "announcements.view",
    "attendance.self",
    "daily_work.self",
    "tasks.self",
    "sites.view",
    "sites.report",
    "materials.view",
    "inventory.view",
    "procurement.create",
    "leave.self",
    "notifications.view",
  ],
  Staff: [
    "dashboard.view",
    "announcements.view",
    "attendance.self",
    "daily_work.self",
    "tasks.self",
    "leave.self",
    "notifications.view",
  ],
  HR: [
    "dashboard.view",
    "announcements.view",
    "employees.view",
    "employees.manage",
    "attendance.view",
    "attendance.manage",
    "attendance.approve",
    "daily_work.view",
    "tasks.view",
    "leave.view",
    "leave.manage",
    "leave.approve",
    "payroll.view",
    "payroll.manage",
    "performance.view",
    "performance.manage",
    "documents.view",
    "documents.manage",
    "reports.view",
    "notifications.view",
  ],
  Accounts: [
    "dashboard.view",
    "announcements.view",
    "accounts.view",
    "accounts.manage",
    "invoices.view",
    "invoices.manage",
    "payments.view",
    "payments.manage",
    "expenses.view",
    "expenses.manage",
    "expenses.approve",
    "payroll.view",
    "payroll.manage",
    "payroll.pay",
    "suppliers.view",
    "suppliers.manage",
    "procurement.view",
    "projects.view",
    "clients.view",
    "quotations.view",
    "reports.view",
    "documents.view",
    "notifications.view",
  ],
  Sales: [
    "dashboard.view",
    "announcements.view",
    "attendance.self",
    "daily_work.self",
    "tasks.self",
    "leads.view",
    "leads.manage",
    "clients.view",
    "clients.manage",
    "quotations.view",
    "quotations.manage",
    "projects.view",
    "invoices.view",
    "leave.self",
    "documents.view",
    "notifications.view",
  ],
};

export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, SECRET_SALT, 1000, 64, "sha512")
    .toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  return computed === hash;
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === "Owner" || role === "MD" || role === "Admin";
}

export function isChairman(role?: string | null): boolean {
  return role === "Chairman";
}

export function isManagementRole(role?: string | null): boolean {
  return (
    role === "Owner" ||
    role === "Chairman" ||
    role === "Manager" ||
    role === "MD" ||
    role === "Admin"
  );
}

export function canCreateAnnouncements(role?: string | null): boolean {
  return (
    role === "Owner" ||
    role === "Chairman" ||
    role === "Manager" ||
    role === "MD" ||
    role === "Admin"
  );
}

export function canViewAllEmployeeProfiles(role?: string | null): boolean {
  return (
    role === "Owner" ||
    role === "Chairman" ||
    role === "Manager" ||
    role === "HR" ||
    role === "MD" ||
    role === "Admin"
  );
}

export function isStaffSelfOnlyRole(role?: string | null): boolean {
  return (
    role === "Staff" ||
    role === "Site Staff" ||
    role === "Engineer" ||
    role === "Marketing" ||
    role === "Sales"
  );
}

// Strict Server-Side Lead access authorization (Part 11 & Part 12)
export function canAccessMarketingLeads(
  user: { role: string; marketingScope?: string | null; permissions?: string[] },
  targetCompanyCode?: string | null
): boolean {
  if (!user) return false;
  if (isManagementRole(user.role)) return true;

  if (user.role === "Marketing" || user.role === "Sales") {
    if (!targetCompanyCode) return true;
    if (user.marketingScope === "IBDC") {
      return targetCompanyCode === "IBDC";
    }
    if (user.marketingScope === "IREL") {
      return targetCompanyCode === "IREL";
    }
    if (user.permissions && user.permissions.includes("leads.ibdc")) {
      return targetCompanyCode === "IBDC";
    }
    if (user.permissions && user.permissions.includes("leads.irel")) {
      return targetCompanyCode === "IREL";
    }
  }

  return false;
}

export function hasPermission(
  user: { role: string; permissions?: string[] | null },
  requiredPerm: string
): boolean {
  if (!user) return false;
  if (isSuperAdminRole(user.role)) return true;
  const userPerms =
    user.permissions && user.permissions.length > 0
      ? user.permissions
      : ROLE_DEFAULT_PERMISSIONS[user.role] || [];
  if (userPerms.includes("*")) return true;
  if (userPerms.includes(requiredPerm)) return true;
  const [modulePrefix] = requiredPerm.split(".");
  if (userPerms.includes(`${modulePrefix}.*`) || userPerms.includes(`${modulePrefix}.manage`)) {
    return true;
  }
  return false;
}

export interface AuthenticatedUser {
  id: number;
  username: string | null;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  marketingScope: string | null;
  mustChangePassword: boolean;
  employeeId: number | null;
  empCode: string | null;
  department: string | null;
  company: string | null;
  assignedSite: string | null;
  designation: string | null;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    let token: string | undefined;

    // Check cookie
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Cookies not accessible in some execution contexts
    }

    // Check Bearer authorization header
    if (!token) {
      try {
        const headerStore = await headers();
        const authHeader = headerStore.get("authorization") || headerStore.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7).trim();
        }
      } catch {
        // Headers not accessible
      }
    }

    if (!token) return null;

    const now = new Date();
    const sessionRows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (sessionRows.length === 0) return null;
    const session = sessionRows[0];

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userRows.length === 0) return null;
    const user = userRows[0];

    // Block inactive users immediately server-side
    if (user.status !== "Active") {
      return null;
    }

    const empRows = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, user.id))
      .limit(1);

    const emp = empRows[0] || null;
    const effectivePermissions =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : ROLE_DEFAULT_PERMISSIONS[user.role] || [];

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: effectivePermissions,
      status: user.status,
      marketingScope: user.marketingScope,
      mustChangePassword: Boolean(user.mustChangePassword),
      employeeId: emp ? emp.id : null,
      empCode: emp ? emp.empCode : null,
      department: emp ? emp.department : null,
      company: emp ? emp.company : "INSAF",
      assignedSite: emp ? emp.assignedSite : "",
      designation: emp ? emp.designation : null,
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: number, ip = "127.0.0.1", ua = "Browser") {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
    ipAddress: ip,
    userAgent: ua,
  });

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    expires: expiresAt,
  });

  return token;
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // ignore
  }
}
