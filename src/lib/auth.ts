import crypto from "crypto";
import { cookies } from "next/headers";
import { db, users, sessions, employees } from "@/db";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE_NAME = "insaf_erp_session";
const SECRET_SALT = process.env.AUTH_SECRET || "insaf_erp_enterprise_salt_2026";

export type UserRole =
  | "Owner"
  | "Chairman"
  | "MD"
  | "Admin"
  | "Manager"
  | "HR"
  | "Accounts"
  | "Sales"
  | "Project Manager"
  | "Engineer"
  | "Staff"
  | "Site Staff";

export const ALL_ROLES: UserRole[] = [
  "Owner",
  "Chairman",
  "MD",
  "Admin",
  "Manager",
  "HR",
  "Accounts",
  "Sales",
  "Project Manager",
  "Engineer",
  "Staff",
  "Site Staff",
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  Owner: ["*"],
  Chairman: [
    "dashboard.view",
    "attendance.view",
    "daily_work.view",
    "tasks.view",
    "tasks.manage",
    "tasks.approve",
    "employees.view",
    "leads.view",
    "leads.manage",
    "clients.view",
    "quotations.view",
    "projects.view",
    "sites.view",
    "reports.view",
    "announcements.view",
    "announcements.manage",
    "documents.view",
    "notifications.view",
    "leave.view",
    "performance.view",
  ],
  MD: ["*"],
  Admin: ["*"],
  Manager: [
    "dashboard.view",
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
    "announcements.view",
    "announcements.manage",
  ],
  HR: [
    "dashboard.view",
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
  "Project Manager": [
    "dashboard.view",
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
  Engineer: [
    "dashboard.view",
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
  Staff: [
    "dashboard.view",
    "attendance.self",
    "daily_work.self",
    "tasks.self",
    "leave.self",
    "notifications.view",
  ],
  "Site Staff": [
    "dashboard.view",
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

export function isManagementRole(role?: string | null): boolean {
  return (
    role === "Owner" ||
    role === "Chairman" ||
    role === "MD" ||
    role === "Admin" ||
    role === "Manager"
  );
}

export function canViewAllEmployeeProfiles(role?: string | null): boolean {
  return (
    role === "Owner" ||
    role === "Chairman" ||
    role === "MD" ||
    role === "Admin" ||
    role === "Manager" ||
    role === "HR"
  );
}

export function isStaffSelfOnlyRole(role?: string | null): boolean {
  return (
    role === "Staff" ||
    role === "Site Staff" ||
    role === "Engineer" ||
    role === "Sales"
  );
}

/** Lead company access: BOTH | IBDC | IREL | NONE */
export function leadCompanyAccess(user: {
  role: string;
  marketingCompany?: string | null;
}): "BOTH" | "IBDC" | "IREL" | "NONE" {
  if (
    user.role === "Owner" ||
    user.role === "Chairman" ||
    user.role === "MD" ||
    user.role === "Admin" ||
    user.role === "Manager" ||
    user.role === "HR"
  ) {
    return "BOTH";
  }
  if (user.role === "Sales") {
    if (user.marketingCompany === "IBDC") return "IBDC";
    if (user.marketingCompany === "IREL") return "IREL";
    if (user.marketingCompany === "BOTH") return "BOTH";
    return "NONE";
  }
  return "NONE";
}

export function canCreateAnnouncement(role?: string | null): boolean {
  return isManagementRole(role);
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
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  employeeId: number | null;
  empCode: string | null;
  department: string | null;
  designation: string | null;
  companyId: string | null;
  marketingCompany: string | null;
  assignedSite: string | null;
  mustChangePassword: boolean;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
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

    // Block inactive users immediately
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
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: effectivePermissions,
      status: user.status,
      employeeId: emp ? emp.id : null,
      empCode: emp ? emp.empCode : null,
      department: emp ? emp.department : null,
      designation: emp ? emp.designation : null,
      companyId: emp ? emp.companyId : null,
      marketingCompany: emp ? emp.marketingCompany : null,
      assignedSite: emp ? emp.assignedSite : null,
      mustChangePassword: user.mustChangePassword,
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
    secure: process.env.NODE_ENV === "production",
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
