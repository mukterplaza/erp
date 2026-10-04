"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Clock,
  ClipboardCheck,
  CheckSquare,
  Users,
  Calendar,
  DollarSign,
  Award,
  PhoneCall,
  UserCheck,
  FileText,
  Briefcase,
  MapPin,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  HardHat,
  Landmark,
  Receipt,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

import {
  DashboardView,
  AttendanceView,
  MyDayAndDailyWorksView,
  TasksView,
  MonthlyAttendanceView, // ⭐ NEW: মাসিক হাজিরা
} from "./modules/OperationsViews";
import {
  LeaveView,
  PayrollView,
  PerformanceView,
  ExecutivePayrollDashboard,
} from "./modules/HrPayrollViews";
import {
  ClientsAndQuotationsView,
  ProjectsView,
  SitesAndReportsView,
} from "./modules/CrmProjectsViews";
import { LeadsView } from "./modules/LeadsCrmView";
import { EmployeeDirectoryView } from "./modules/EmployeeDirectoryView";
import { TeamTaskMonitorView } from "./modules/TeamTaskMonitorView";
import {
  MaterialsAndInventoryView,
  ProcurementAndSuppliersView,
  LabourAndContractorsView,
} from "./modules/SupplyChainViews";
import {
  AccountingView,
  InvoicesPaymentsExpensesView,
  ReportsCenterView,
  NotificationsView,
  DocumentsAndUsersView,
  fixBanglaEncoding,
} from "./modules/FinanceAdminViews";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  needsLeads?: boolean;
  execOnly?: boolean;
};

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "দৈনন্দিন কাজ",
    items: [
      { label: "ড্যাশবোর্ড", href: "/dashboard", icon: LayoutDashboard },
      { label: "হাজিরা", href: "/attendance", icon: Clock },
      { label: "মাসিক হাজিরা", href: "/monthly-attendance", icon: Calendar },
      { label: "আমার দিন", href: "/my-day", icon: ClipboardCheck },
      { label: "দৈনিক কাজ", href: "/daily-works", icon: ClipboardCheck },
      { label: "দৈনিক জমা-খরচ", href: "/expenses", icon: CreditCard },
      { label: "টাস্ক", href: "/tasks", icon: CheckSquare },
      { label: "টিম টাস্ক মনিটরিং / আমার টাস্ক", href: "/team-tasks", icon: ClipboardCheck },
      { label: "সাইট রিপোর্ট", href: "/site-reports", icon: MapPin },
    ],
  },
  {
    group: "CRM ও প্রজেক্ট",
    items: [
      { label: "লিড ও ফলো-আপ", href: "/leads", icon: PhoneCall, needsLeads: true },
      { label: "ক্লায়েন্ট", href: "/clients", icon: UserCheck, needsLeads: true },
      { label: "কোটেশন", href: "/quotations", icon: FileText, needsLeads: true },
      { label: "প্রজেক্ট", href: "/projects", icon: Briefcase },
      { label: "সাইট", href: "/sites", icon: MapPin },
    ],
  },
  {
    group: "সাপ্লাই চেইন",
    items: [
      { label: "মালামাল", href: "/materials", icon: Package },
      { label: "ইনভেন্টরি", href: "/inventory", icon: Boxes },
      { label: "ক্রয় অর্ডার", href: "/purchase-orders", icon: ShoppingCart },
      { label: "সাপ্লায়ার", href: "/suppliers", icon: Truck },
      { label: "শ্রমিক ও ঠিকাদার", href: "/labour", icon: HardHat },
    ],
  },
  {
    group: "হিসাব ও অর্থ",
    items: [
      { label: "ডাবল-এন্ট্রি হিসাব", href: "/accounts", icon: Landmark },
      { label: "ইনভয়েস (AR)", href: "/invoices", icon: Receipt },
      { label: "আয়", href: "/income", icon: DollarSign },
      { label: "খরচ", href: "/expenses", icon: CreditCard },
      { label: "পেমেন্ট", href: "/payments", icon: DollarSign },
    ],
  },
  {
    group: "এইচআর ও কর্মী",
    items: [
      { label: "কর্মচারী", href: "/employees", icon: Users },
      { label: "পে-রোল", href: "/payroll", icon: DollarSign },
      { label: "Executive Dashboard", href: "/executive-payroll", icon: TrendingUp, execOnly: true },
      { label: "ছুটি", href: "/leave", icon: Calendar },
      { label: "পারফরম্যান্স", href: "/performance", icon: Award },
    ],
  },
  {
    group: "রিপোর্ট ও নিয়ন্ত্রণ",
    items: [
      { label: "রিপোর্ট", href: "/reports", icon: BarChart3 },
      { label: "ডকুমেন্ট", href: "/documents", icon: FileText },
      { label: "নোটিফিকেশন", href: "/notifications", icon: Bell },
      { label: "ব্যবহারকারী", href: "/users", icon: Shield },
      { label: "সেটিংস ও অডিট", href: "/settings", icon: Settings },
    ],
  },
];

export default function ErpAppShell({
  routeKey,
  entityId,
}: {
  routeKey?: string;
  entityId?: number;
}) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/erp");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMutate(payload: Record<string, unknown>) {
    setToast(null);
    try {
      const res = await fetch("/api/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "err", msg: json.error || "কাজটি সম্পন্ন হয়নি" });
        return json;
      }
      setToast({ type: "ok", msg: "সংরক্ষণ হয়েছে — ডাটাবেস আপডেট হয়েছে" });
      await loadData();
      return json;
    } catch {
      setToast({ type: "err", msg: "নেটওয়ার্ক সমস্যা" });
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // ignore
    }
    router.push("/login");
  }

  const canViewExecutive = (role: string) => {
    return ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Accounts"].includes(role);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center mx-auto animate-pulse">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold">INSAF ERP লোড হচ্ছে...</p>
          <p className="text-xs text-slate-400">সেশন ও অনুমতি যাচাই করা হচ্ছে</p>
        </div>
      </div>
    );
  }

  if (!data || !data.currentUser) {
    return null;
  }

  const role: string = data.currentUser.role;
  const userName: string = data.currentUser.name || "";

  const unreadCount = (data.notifications || []).filter((n: any) => !n.isRead).length;

  const activeRoute = routeKey || pathname;

  const isStaffRestricted = role === "Staff" || role === "Site Staff" || role === "Engineer";
  const noLeadAccess = role === "Staff" || role === "Site Staff" || role === "Engineer";

  const filterItem = (item: NavItem) => {
    if (item.needsLeads) return !noLeadAccess;
    if (item.execOnly) return canViewExecutive(role);
    return true;
  };

  function renderMainContent() {
    // 🔒 FIX: Permission check আগে — আগে এগুলো রুট return হওয়ার পরে ছিল, তাই কখনো চলতো না
    if (
      noLeadAccess &&
      (activeRoute === "/leads" || activeRoute === "/clients" || activeRoute === "/quotations")
    ) {
      return (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-rose-900">প্রবেশাধিকার নেই — লিড/CRM</h2>
          <p className="text-xs text-rose-700 max-w-xl mx-auto">
            সাধারণ স্টাফ INSAF BUILDING DESIGN বা INSAF REAL ESTATE LTD.-এর লিড ডাটাবেস দেখতে পারেন না।
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold min-h-[44px]"
          >
            ড্যাশবোর্ডে ফিরুন
          </Link>
        </div>
      );
    }

    if (
      isStaffRestricted &&
      (activeRoute === "/accounts" ||
        activeRoute === "/invoices" ||
        activeRoute === "/income" ||
        activeRoute === "/payments" ||
        activeRoute === "/users" ||
        activeRoute === "/payroll" ||
        activeRoute === "/executive-payroll")
    ) {
      return (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-rose-900">প্রবেশাধিকার নেই</h2>
          <p className="text-xs text-rose-700 max-w-xl mx-auto">
            এই মডিউল শুধু অনুমোদিত ব্যবস্থাপনার জন্য।
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold min-h-[44px]"
          >
            আমার দিনে ফিরুন
          </Link>
        </div>
      );
    }

    if (activeRoute === "/attendance") {
      return <AttendanceView data={data} onMutate={handleMutate} />;
    }
    // ⭐ NEW: মাসিক হাজিরা রুট
    if (activeRoute === "/monthly-attendance") {
      return <MonthlyAttendanceView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/my-day" || activeRoute === "/daily-works") {
      return <MyDayAndDailyWorksView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/team-tasks") {
      return <TeamTaskMonitorView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute.startsWith("/tasks/") && entityId) {
      return <TeamTaskMonitorView data={data} onMutate={handleMutate} focusedTaskId={entityId} />;
    }
    if (activeRoute.startsWith("/tasks")) {
      return <TasksView data={data} onMutate={handleMutate} focusedTaskId={entityId} />;
    }
    if (activeRoute.startsWith("/employees")) {
      const mgmtRoles = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Project Manager"];
      if (entityId && !mgmtRoles.includes(role) && entityId !== data.currentUser.employeeId) {
        return (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center space-y-2">
            <h2 className="text-lg font-bold text-rose-900">প্রবেশাধিকার নেই</h2>
            <p className="text-xs text-rose-700">অন্য কর্মীর ব্যক্তিগত প্রোফাইল দেখা যাবে না।</p>
          </div>
        );
      }
      return <EmployeeDirectoryView data={data} onMutate={handleMutate} focusedEmployeeId={entityId} />;
    }
    if (activeRoute === "/leave") {
      return <LeaveView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/payroll") {
      return <PayrollView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/executive-payroll") {
      if (!canViewExecutive(role)) {
        return (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-8 text-center space-y-3">
            <h2 className="text-xl font-bold text-rose-900">403 Forbidden</h2>
            <p className="text-xs text-rose-700 max-w-xl mx-auto">
              Executive Dashboard শুধুমাত্র Owner, MD, Chairman, Admin, Manager, HR ও Accounts এর জন্য।
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold min-h-[44px]"
            >
              ড্যাশবোর্ডে ফিরুন
            </Link>
          </div>
        );
      }
      return <ExecutivePayrollDashboard data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/performance") {
      return <PerformanceView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/leads") {
      return <LeadsView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/clients") {
      return <ClientsAndQuotationsView data={data} onMutate={handleMutate} mode="clients" />;
    }
    if (activeRoute === "/quotations") {
      return <ClientsAndQuotationsView data={data} onMutate={handleMutate} mode="quotations" />;
    }
    if (activeRoute.startsWith("/projects")) {
      return <ProjectsView data={data} onMutate={handleMutate} focusedProjectId={entityId} />;
    }
    if (activeRoute === "/sites" || activeRoute === "/site-reports") {
      return <SitesAndReportsView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/materials" || activeRoute === "/inventory") {
      return <MaterialsAndInventoryView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/purchase-orders" || activeRoute === "/suppliers") {
      return <ProcurementAndSuppliersView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/labour") {
      return <LabourAndContractorsView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/accounts") {
      return <AccountingView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/invoices" || activeRoute === "/income") {
      return <InvoicesPaymentsExpensesView data={data} onMutate={handleMutate} tab="invoices" />;
    }
    if (activeRoute === "/expenses") {
      return <InvoicesPaymentsExpensesView data={data} onMutate={handleMutate} tab="expenses" />;
    }
    if (activeRoute === "/payments") {
      return <InvoicesPaymentsExpensesView data={data} onMutate={handleMutate} tab="payments" />;
    }
    if (activeRoute === "/reports") {
      return <ReportsCenterView data={data} />;
    }
    if (activeRoute === "/notifications") {
      return <NotificationsView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/documents" || activeRoute === "/users" || activeRoute === "/settings") {
      return (
        <DocumentsAndUsersView
          data={data}
          onMutate={handleMutate}
          mode={activeRoute === "/documents" ? "documents" : "users"}
        />
      );
    }
    return <DashboardView data={data} onMutate={handleMutate} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row pb-16 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-950 text-slate-200 border-r border-slate-800 z-30">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block leading-none">INSAF ERP</span>
              <span className="text-[10px] text-emerald-400">Full Business Suite</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.filter((grp) => {
            if (role === "Staff" || role === "Site Staff") {
              return (
                grp.group === "দৈনন্দিন কাজ" ||
                grp.group === "এইচআর ও কর্মী" ||
                grp.group === "রিপোর্ট ও নিয়ন্ত্রণ"
              );
            }
            if (role === "Sales") {
              return (
                grp.group === "দৈনন্দিন কাজ" ||
                grp.group === "CRM ও প্রজেক্ট" ||
                grp.group === "রিপোর্ট ও নিয়ন্ত্রণ"
              );
            }
            return true;
          }).map((grp) => (
            <div key={grp.group}>
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {grp.group}
              </p>
              <div className="space-y-0.5">
                {grp.items.filter(filterItem).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={`${grp.group}-${item.href}`}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        {item.label}
                        {item.execOnly && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400 text-amber-900">
                            MD
                          </span>
                        )}
                      </span>
                      {item.href === "/notifications" && unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-bold text-white truncate">{userName}</p>
              <p className="text-[11px] text-emerald-400">
                {role} • {data.currentUser.empCode || "HQ"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>INSAF ERP</span>
                <span>/</span>
                <span className="font-bold text-slate-900">{pathname}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-xs font-semibold text-slate-600">
              {userName.split(" ").slice(-2).join(" ")}
            </span>
            <Link
              href="/notifications"
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold min-h-[44px]"
            >
              লগ আউট
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 text-white p-4 space-y-3 border-b border-slate-800">
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, _group: g.group })))
                .filter(filterItem)
                .map((item) => (
                  <Link
                    key={`${item._group}-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium ${
                      pathname === item.href
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "bg-slate-900 text-slate-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {toast && (
          <div
            className={`mx-4 lg:mx-6 mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              toast.type === "ok"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            <span className="flex items-center gap-2">
              {toast.type === "ok" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              {toast.msg}
            </span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* ✅ FIX: হারিয়ে যাওয়া <main> ও মূল কনটেন্ট ফিরিয়ে আনা হয়েছে */}
        <main className="flex-1 p-4 lg:p-6">
          {/* প্রথম লগইনে পাসওয়ার্ড পরিবর্তন */}
          {data.currentUser.mustChangePassword && <ForcePasswordBanner />}

          {/* ঘোষণা ব্যানার (১০০% খাঁটি বাংলা ও এনকোডিং ফিক্সসহ) */}
          {(data.announcements || [])
            .filter((a: { published: boolean }) => a.published)
            .slice(0, 2)
            .map((a: { id: number; title: string; message: string; createdBy: string }) => (
              <div key={a.id} className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">অফিসিয়াল ঘোষণা</p>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{fixBanglaEncoding(a.title)}</h3>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{fixBanglaEncoding(a.message)}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                  প্রকাশক: {fixBanglaEncoding(a.createdBy)}
                </p>
              </div>
            ))}

          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-950 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around z-30">
        {[
          { label: "হোম", href: "/dashboard", icon: LayoutDashboard },
          { label: "হাজিরা", href: "/attendance", icon: Clock },
          { label: "আমার দিন", href: "/my-day", icon: ClipboardCheck },
          { label: "টাস্ক", href: "/team-tasks", icon: CheckSquare },
          { label: "বার্তা", href: "/notifications", icon: Bell },
        ].map((m) => {
          const Icon = m.icon;
          const active = pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`flex flex-col items-center py-2 px-2 rounded-lg text-[10px] font-medium min-w-[56px] ${
                active ? "text-emerald-400 font-bold" : "text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              {m.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ForcePasswordBanner() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", currentPassword, newPassword }),
      });
      const d = await res.json();
      if (!res.ok) setMsg(d.error || "ব্যর্থ");
      else {
        setMsg("পাসওয়ার্ড পরিবর্তন হয়েছে। পাতা রিফ্রেশ করুন।");
        window.location.reload();
      }
    } catch {
      setMsg("নেটওয়ার্ক সমস্যা");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-2">
      <h3 className="text-sm font-bold text-amber-900">প্রথম লগইন — পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক</h3>
      <input
        type="password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="বর্তমান পাসওয়ার্ড"
        className="w-full px-3 py-3 rounded-xl border border-amber-300 text-sm min-h-[44px]"
      />
      <input
        type="password"
        required
        minLength={6}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
        className="w-full px-3 py-3 rounded-xl border border-amber-300 text-sm min-h-[44px]"
      />
      {msg && <p className="text-xs text-amber-800">{msg}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold min-h-[48px] disabled:opacity-60"
      >
        {busy ? "অপেক্ষা করুন..." : "পাসওয়ার্ড সেট করুন"}
      </button>
    </form>
  );
}