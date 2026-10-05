import { db, users, employees, sessions, announcements, leads, tasks } from "@/db";
import { eq, or } from "drizzle-orm";
import { hashPassword, ROLE_DEFAULT_PERMISSIONS } from "@/lib/auth";

export const FINAL_TEAM = [
  {
    email: "rakibul@insaferp.com",
    username: "rakibul.hasan",
    tempPassword: "Rh#7kP2mQ9xL",
    name: "Engr. Muhammad Sheik Rakibul Hasan",
    role: "Owner",
    designation: "Founder & CEO",
    department: "Management",
    companyId: "INSAF",
    marketingCompany: "BOTH",
    assignedSite: "",
    phone: "01711-100001",
  },
  {
    email: "harizul@insaferp.com",
    username: "harizul.islam",
    tempPassword: "Hi$4nW8vL3cR",
    name: "Md Harizul Islam",
    role: "Chairman",
    designation: "Chairman",
    department: "Management",
    companyId: "INSAF",
    marketingCompany: "BOTH",
    assignedSite: "",
    phone: "01711-100002",
  },
  {
    email: "fahim@insaferp.com",
    username: "asifur.fahim",
    tempPassword: "Af@6tY1bN5sK",
    name: "Asifur Rahman Fahim",
    role: "Manager",
    designation: "General Manager",
    department: "Operations",
    companyId: "INSAF",
    marketingCompany: "BOTH",
    assignedSite: "",
    phone: "01711-100003",
  },
  {
    email: "rakib.hossain@insaferp.com",
    username: "rakib.hossain",
    tempPassword: "Rk!9dC4qP2wM",
    name: "Engr. Rakib Hossain",
    role: "Engineer",
    designation: "Civil Engineer",
    department: "Engineering",
    companyId: "INSAF",
    marketingCompany: null,
    assignedSite: "",
    phone: "01711-100004",
  },
  {
    email: "azharul@insaferp.com",
    username: "azharul.asif",
    tempPassword: "Aa#3gH7xT8vB",
    name: "Azharul Haq Asif",
    role: "Engineer",
    designation: "Civil Engineer",
    department: "Engineering",
    companyId: "INSAF",
    marketingCompany: null,
    assignedSite: "",
    phone: "01711-100005",
  },
  {
    email: "mahdi@insaferp.com",
    username: "mahdi.hasan",
    tempPassword: "Mh$2pL9sQ5nD",
    name: "Md Mahdi Hasan",
    role: "Project Manager",
    designation: "Project Manager",
    department: "Engineering",
    companyId: "INSAF",
    marketingCompany: null,
    assignedSite: "",
    phone: "01711-100006",
  },
  {
    email: "talha@insaferp.com",
    username: "md.talha",
    tempPassword: "Mt@8kR1wF6yC",
    name: "Md Talha",
    role: "Sales",
    designation: "Marketing Specialist",
    department: "CRM & Sales",
    companyId: "IBDC",
    marketingCompany: "IBDC",
    assignedSite: "",
    phone: "01711-100007",
  },
  {
    email: "jahid@insaferp.com",
    username: "jahid.hasan",
    tempPassword: "Jh!5nV3eZ7qP",
    name: "Md Jahid Hasan",
    role: "Sales",
    designation: "Marketing Specialist",
    department: "CRM & Sales",
    companyId: "IREL",
    marketingCompany: "IREL",
    assignedSite: "",
    phone: "01711-100008",
  },
  {
    email: "salam@insaferp.com",
    username: "abdus.salam",
    tempPassword: "As#6bT2mX9kL",
    name: "Md Abdus Salam",
    role: "Site Staff",
    designation: "Site Manager",
    department: "Construction",
    companyId: "IREL",
    marketingCompany: null,
    assignedSite: "INSAF Real Estate Sites",
    phone: "01711-100009",
  },
  {
    email: "yasin@insaferp.com",
    username: "md.yasin",
    tempPassword: "My$4cW8hN1rJ",
    name: "Md Yasin",
    role: "Staff",
    designation: "Office Assistant",
    department: "HR & Admin",
    companyId: "INSAF",
    marketingCompany: null,
    assignedSite: "",
    phone: "01711-100010",
  },
  {
    email: "israfil@insaferp.com",
    username: "md.israfil",
    tempPassword: "Mi@7pD3sK5gQ",
    name: "Md Israfil",
    role: "Staff",
    designation: "Night Guard",
    department: "Construction",
    companyId: "IREL",
    marketingCompany: null,
    assignedSite: "Muktar Plaza",
    phone: "01711-100011",
  },
] as const;

export function initialPasswordFor(_email: string): never {
  throw new Error("Initial password generation is disabled; use account password setup.");
}

async function legacyEnsureFinalTeam() {
  if (process.env.ENABLE_DEMO_SEED !== "true") return;

  const existingUsers = await db.select().from(users);
  const existingEmps = await db.select().from(employees);
  const finalEmails = new Set<string>(FINAL_TEAM.map((t) => t.email));

  // Archive previous placeholder/demo accounts that are not in the final team
  for (const u of existingUsers) {
    if (!finalEmails.has(u.email) && u.status === "Active") {
      await db.update(users).set({ status: "Inactive" }).where(eq(users.id, u.id));
      await db.delete(sessions).where(eq(sessions.userId, u.id));
    }
  }
  for (const e of existingEmps) {
    const linked = existingUsers.find((u) => u.id === e.userId);
    if (linked && !finalEmails.has(linked.email) && e.employmentStatus === "Active") {
      await db
        .update(employees)
        .set({ employmentStatus: "Inactive", archived: true })
        .where(eq(employees.id, e.id));
    }
  }

  const allEmpsNow = await db.select().from(employees);
  let nextEmpNum = allEmpsNow.length + 1;

  const ownerEmpIdByEmail = new Map<string, number>();

  for (const member of FINAL_TEAM) {
    const foundUser = (await db.select().from(users).where(or(eq(users.email, member.email), eq(users.username, member.username))))[0];
    let userId: number;
    if (foundUser) {
      const patch: {
        name: string;
        role: string;
        permissions: string[];
        status: string;
        username?: string;
        passwordHash?: string;
        mustChangePassword?: boolean;
      } = {
        name: member.name,
        role: member.role,
        permissions: ROLE_DEFAULT_PERMISSIONS[member.role] || ROLE_DEFAULT_PERMISSIONS.Staff,
        status: "Active",
      };
      if (!foundUser.username) {
        patch.username = member.username;
        patch.passwordHash = hashPassword(member.tempPassword);
        patch.mustChangePassword = true;
        await db.delete(sessions).where(eq(sessions.userId, foundUser.id));
      }
      await db.update(users).set(patch).where(eq(users.id, foundUser.id));
      userId = foundUser.id;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          name: member.name,
          email: member.email,
          username: member.username,
          passwordHash: hashPassword(member.tempPassword),
          role: member.role,
          permissions: ROLE_DEFAULT_PERMISSIONS[member.role] || ROLE_DEFAULT_PERMISSIONS.Staff,
          status: "Active",
          mustChangePassword: true,
        })
        .returning();
      userId = created.id;
    }

    const foundEmp = (await db.select().from(employees).where(eq(employees.email, member.email)))[0];
    if (foundEmp) {
      await db
        .update(employees)
        .set({
          userId,
          name: member.name,
          department: member.department,
          designation: member.designation,
          employmentStatus: "Active",
          archived: false,
          companyId: member.companyId,
          marketingCompany: member.marketingCompany,
          assignedSite: member.assignedSite,
          phone: member.phone,
        })
        .where(eq(employees.id, foundEmp.id));
      ownerEmpIdByEmail.set(member.email, foundEmp.id);
    } else {
      const empCode = `EMP-${String(nextEmpNum).padStart(4, "0")}`;
      nextEmpNum += 1;
      const [emp] = await db
        .insert(employees)
        .values({
          empCode,
          userId,
          name: member.name,
          department: member.department,
          designation: member.designation,
          joiningDate: "2024-01-01",
          basicSalary: "0.00",
          allowance: "0.00",
          phone: member.phone,
          email: member.email,
          address: "Dhaka",
          employmentStatus: "Active",
          companyId: member.companyId,
          marketingCompany: member.marketingCompany,
          assignedSite: member.assignedSite,
          archived: false,
        })
        .returning();
      ownerEmpIdByEmail.set(member.email, emp.id);
    }
  }

  const talhaId = ownerEmpIdByEmail.get("talha@insaferp.com");
  const jahidId = ownerEmpIdByEmail.get("jahid@insaferp.com");
  if (talhaId) {
    const ibdc = await db.select().from(leads);
    for (const l of ibdc.filter((x) => (x.companyId || "IBDC") === "IBDC")) {
      await db.update(leads).set({ assignedStaffId: talhaId }).where(eq(leads.id, l.id));
    }
  }
  if (jahidId) {
    const allL = await db.select().from(leads);
    for (const l of allL.filter((x) => x.companyId === 2)) {
      await db.update(leads).set({ assignedStaffId: jahidId }).where(eq(leads.id, l.id));
    }
  }

  const existingAnn = await db.select().from(announcements);
  if (existingAnn.length === 0) {
    await db.insert(announcements).values({
      title: "INSAF ERP â€” à¦…à¦«à¦¿à¦¸à¦¿à¦¯à¦¼à¦¾à¦² à¦˜à§‹à¦·à¦£à¦¾",
      message:
        "à¦¸à¦•à¦² à¦¸à¦¹à¦•à¦°à§à¦®à§€à¦¦à§‡à¦° à¦œà¦¾à¦¨à¦¾à¦¨à§‹ à¦¯à¦¾à¦šà§à¦›à§‡, INSAF ERP à¦à¦–à¦¨ à¦¥à§‡à¦•à§‡ à¦¬à¦¾à¦‚à¦²à¦¾ à¦‡à¦¨à§à¦Ÿà¦¾à¦°à¦«à§‡à¦¸, à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦¯à§‹à¦—à§à¦¯à¦¤à¦¾ à¦à¦¬à¦‚ à¦•à¦ à§‹à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦¨à¦¿à¦°à¦¾à¦ªà¦¤à§à¦¤à¦¾à¦¸à¦¹ à¦šà¦¾à¦²à§ à¦†à¦›à§‡à¥¤ à¦ªà§à¦°à¦¤à§à¦¯à§‡à¦•à§‡ à¦¶à§à¦§à§ à¦¨à¦¿à¦œà§‡à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡ à¦²à¦—à¦‡à¦¨ à¦•à¦°à¦¬à§‡à¦¨à¥¤ à¦ªà§à¦°à¦¥à¦® à¦²à¦—à¦‡à¦¨à§‡ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¬à¦¾à¦§à§à¦¯à¦¤à¦¾à¦®à§‚à¦²à¦•à¥¤",
      createdBy: "Engr. Muhammad Sheik Rakibul Hasan",
      published: true,
    });
  }

  // Backfill assignment identity on tasks that pre-date assigner tracking (no rows deleted)
  const allEmpsFinal = await db.select().from(employees);
  const allUsersFinal = await db.select().from(users);
  const legacyTasks = (await db.select().from(tasks)).filter((t) => !t.assignedByName || !t.assignedToName);
  for (const t of legacyTasks) {
    const to = allEmpsFinal.find((e) => e.id === t.assignedTo);
    const byEmp = allEmpsFinal.find((e) => e.name === t.createdBy || (e.userId && allUsersFinal.find((u) => u.id === e.userId)?.name === t.createdBy));
    await db
      .update(tasks)
      .set({
        assignedToName: t.assignedToName || to?.name || null,
        assignedToDesignation: t.assignedToDesignation || to?.designation || null,
        assignedByName: t.assignedByName || byEmp?.name || t.createdBy,
        assignedByDesignation: t.assignedByDesignation || byEmp?.designation || (t.createdBy === "Manager" ? "à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦®à§‡à¦¨à§à¦Ÿ (à¦ªà§à¦°à¦¨à§‹ à¦°à§‡à¦•à¦°à§à¦¡)" : null),
        assignedByEmployeeId: t.assignedByEmployeeId ?? byEmp?.id ?? null,
        assignedByUserId: t.assignedByUserId ?? byEmp?.userId ?? null,
      })
      .where(eq(tasks.id, t.id));
  }
}

export async function ensureFinalTeam() {
  return;
}


