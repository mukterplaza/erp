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
  Megaphone,
  KeyRound,
} from "lucide-react";

import {
  DashboardView,
  AttendanceView,
  MyDayAndDailyWorksView,
  TasksView,
} from "./modules/OperationsViews";
import {
  LeaveView,
  PayrollView,
  PerformanceView,
} from "./modules/HrPayrollViews";
import { EmployeeDirectory } from "./modules/EmployeeDirectory";
import {
  ClientsAndQuotationsView,
  ProjectsView,
  SitesAndReportsView,
} from "./modules/CrmProjectsViews";
import { LeadsCrmView } from "./modules/LeadsCrmView";
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
} from "./modules/FinanceAdminViews";

// বাংলা ভূমিকা ও পদবী অনুবাদ
export function getRoleBangla(role?: string | null): string {
  switch (role) {
    case "Owner":
      return "প্রতিষ্ঠাতা ও সিইও (Founder & CEO)";
    case "Chairman":
      return "চেয়ারম্যান (Chairman)";
    case "Manager":
      return "জেনারেল ম্যানেজার (General Manager)";
    case "Project Manager":
      return "প্রজেক্ট ম্যানেজার";
    case "Engineer":
      return "সিভিল ইঞ্জিনিয়ার";
    case "Marketing":
      return "মার্কেটিং স্পেশালিস্ট";
    case "Site Staff":
      return "সাইট ম্যানেজার";
    case "Staff":
      return "অফিস স্টাফ";
    case "HR":
      return "মানবসম্পদ প্রধান (HR Head)";
    case "Accounts":
      return "প্রধান হিসাবরক্ষক";
    case "Sales":
      return "সেলস এক্সিকিউটিভ";
    default:
      return role || "কর্মকর্তা";
  }
}

// বাংলা ন্যাভিগেশন গ্রুপ ও মেনু
const NAV_GROUPS = [
  {
    group: "মূল অপারেশন",
    items: [
      { label: "ড্যাশবোর্ড", href: "/dashboard", icon: LayoutDashboard },
      { label: "উপস্থিতি (Attendance)", href: "/attendance", icon: Clock },
      { label: "মাই ডে (My Day)", href: "/my-day", icon: ClipboardCheck },
      { label: "দৈনিক কাজের বিবরণ", href: "/daily-works", icon: ClipboardCheck },
      { label: "দায়িত্ব ও টাস্ক (Tasks)", href: "/tasks", icon: CheckSquare },
      { label: "সাইট রিপোর্ট", href: "/site-reports", icon: MapPin },
    ],
  },
  {
    group: "সিআরএম ও প্রজেক্ট",
    items: [
      { label: "লিড ও ফলো-আপ (CRM)", href: "/leads", icon: PhoneCall },
      { label: "ক্লায়েন্ট তালিকা", href: "/clients", icon: UserCheck },
      { label: "কোটেশন ও বিওকিউ", href: "/quotations", icon: FileText },
      { label: "প্রজেক্ট তালিকা", href: "/projects", icon: Briefcase },
      { label: "সাইট ব্যবস্থাপনা", href: "/sites", icon: MapPin },
    ],
  },
  {
    group: "সাপ্লাই চেইন ও সাইট",
    items: [
      { label: "কাঁচামাল ও মালামাল", href: "/materials", icon: Package },
      { label: "ইনভেন্টরি স্টক", href: "/inventory", icon: Boxes },
      { label: "পারচেজ অর্ডার (PO)", href: "/purchase-orders", icon: ShoppingCart },
      { label: "সরবরাহকারী (Suppliers)", href: "/suppliers", icon: Truck },
      { label: "শ্রমিক ও ঠিকাদার", href: "/labour", icon: HardHat },
    ],
  },
  {
    group: "হিসাব ও অর্থায়ন",
    items: [
      { label: "ডাবল-এন্ট্রি খতিয়ান", href: "/accounts", icon: Landmark },
      { label: "ইনভয়েস ও বিল (AR)", href: "/invoices", icon: Receipt },
      { label: "আয় খতিয়ান", href: "/income", icon: DollarSign },
      { label: "ব্যয় ও খরচ (Expenses)", href: "/expenses", icon: CreditCard },
      { label: "পেমেন্ট ও রসিদ", href: "/payments", icon: DollarSign },
    ],
  },
  {
    group: "মানবসম্পদ ও টিম",
    items: [
      { label: "কর্মকর্তা ও কর্মচারী", href: "/employees", icon: Users },
      { label: "বেতন ও পে-স্লিপ", href: "/payroll", icon: DollarSign },
      { label: "ছুটির আবেদন ও হিসাব", href: "/leave", icon: Calendar },
      { label: "পারফরম্যান্স মূল্যায়ন", href: "/performance", icon: Award },
    ],
  },
  {
    group: "রিপোর্ট ও প্রশাসন",
    items: [
      { label: "রিপোর্ট ও এক্সপোর্ট", href: "/reports", icon: BarChart3 },
      { label: "ডকুমেন্ট ভল্ট", href: "/documents", icon: FileText },
      { label: "নোটিফিকেশন সেন্টার", href: "/notifications", icon: Bell },
      { label: "ব্যবহারকারী ও ভূমিকা", href: "/users", icon: Shield },
      { label: "সেটিংস ও অডিট লগ", href: "/settings", icon: Settings },
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
  const pathname = usePathname();
  const router = useRouter();
   
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(
    null
  );
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    setPwdLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          currentPassword: pwdCurrent,
          newPassword: pwdNew,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPwdMsg({ type: "err", text: d.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।" });
      } else {
        setPwdMsg({ type: "ok", text: d.message || "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।" });
        setPwdCurrent("");
        setPwdNew("");
        if (data?.currentUser) {
          data.currentUser.mustChangePassword = false;
        }
        setTimeout(() => {
          setShowPwdModal(false);
          setPwdMsg(null);
        }, 1200);
      }
    } catch {
      setPwdMsg({ type: "err", text: "নেটওয়ার্ক ত্রুটি হয়েছে।" });
    } finally {
      setPwdLoading(false);
    }
  }

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
        setToast({ type: "err", msg: json.error || "কার্যক্রম সম্পন্ন করা যায়নি।" });
        return json;
      }
      setToast({
        type: "ok",
        msg: "সফলভাবে ডাটাবেজ এবং লেজারে সংরক্ষিত হয়েছে।",
      });
      await loadData();
      return json;
    } catch {
      setToast({ type: "err", msg: "নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।" });
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-emerald-500/20">
            <Building2 className="w-7 h-7" />
          </div>
          <p className="text-base font-bold">ইনসাফ ইআরপি লোড হচ্ছে...</p>
          <p className="text-xs text-slate-400">
            সেশন এবং রিয়েল-টাইম PostgreSQL ডাটা যাচাই করা হচ্ছে
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.currentUser) {
    return null;
  }

  const unreadCount = (data.notifications || []).filter(
     
    (n: any) => !n.isRead
  ).length;

  const activeRoute = routeKey || pathname;
  const userRole = data.currentUser.role;
  const isStaff = userRole === "Staff" || userRole === "Site Staff";
  const isMarketing = userRole === "Marketing" || userRole === "Sales";

  function renderMainContent() {
    // Security Restriction Screen for Protected Modules
    if (
      (isStaff || isMarketing) &&
      (activeRoute === "/accounts" ||
        activeRoute === "/invoices" ||
        activeRoute === "/income" ||
        activeRoute === "/payments" ||
        activeRoute === "/users")
    ) {
      return (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-rose-900">
            ৪০৩ অননুমোদিত প্রবেশাধিকার — আর্থিক ও প্রশাসনিক মডিউল সুরক্ষিত
          </h2>
          <p className="text-xs text-rose-700 leading-relaxed">
            আপনার ভূমিকা ({getRoleBangla(userRole)}) অনুযায়ী এই সেকশনে প্রবেশের অনুমতি নেই। আর্থিক খতিয়ান, ইনভয়েস, পেমেন্ট এবং ব্যবহারকারী ব্যবস্থাপনা শুধুমাত্র অনুমোদিত কর্তৃপক্ষের জন্য সংরক্ষিত।
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition"
          >
            ড্যাশবোর্ডে ফিরে যান
          </Link>
        </div>
      );
    }

    // Lead Security for Non-authorized Staff
    if (isStaff && activeRoute === "/leads") {
      return (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-rose-900">
            ৪০৩ অননুমোদিত — লিড ডাটাবেজ সুরক্ষিত
          </h2>
          <p className="text-xs text-rose-700 leading-relaxed">
            ইনসাফ বিল্ডিং ডিজাইন এবং ইনসাফ রিয়েল এস্টেটের লিড ও গ্রাহক তথ্য সুরক্ষিত। সাধারণ কর্মকর্তা/কর্মচারীদের লিড তথ্য দেখার অনুমতি নেই।
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition"
          >
            ড্যাশবোর্ডে ফিরে যান
          </Link>
        </div>
      );
    }

    if (activeRoute === "/attendance") {
      return <AttendanceView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/my-day" || activeRoute === "/daily-works") {
      return <MyDayAndDailyWorksView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute.startsWith("/tasks")) {
      return (
        <TasksView
          data={data}
          onMutate={handleMutate}
          focusedTaskId={entityId}
        />
      );
    }
    if (activeRoute.startsWith("/employees")) {
      return (
        <EmployeeDirectory
          data={data}
          onMutate={handleMutate}
          focusedEmployeeId={entityId}
        />
      );
    }
    if (activeRoute === "/leave") {
      return <LeaveView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/payroll") {
      return <PayrollView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/performance") {
      return <PerformanceView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/leads") {
      return <LeadsCrmView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/clients") {
      return (
        <ClientsAndQuotationsView
          data={data}
          onMutate={handleMutate}
          mode="clients"
        />
      );
    }
    if (activeRoute === "/quotations") {
      return (
        <ClientsAndQuotationsView
          data={data}
          onMutate={handleMutate}
          mode="quotations"
        />
      );
    }
    if (activeRoute.startsWith("/projects")) {
      return (
        <ProjectsView
          data={data}
          onMutate={handleMutate}
          focusedProjectId={entityId}
        />
      );
    }
    if (activeRoute === "/sites" || activeRoute === "/site-reports") {
      return <SitesAndReportsView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/materials" || activeRoute === "/inventory") {
      return <MaterialsAndInventoryView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/purchase-orders" || activeRoute === "/suppliers") {
      return (
        <ProcurementAndSuppliersView data={data} onMutate={handleMutate} />
      );
    }
    if (activeRoute === "/labour") {
      return <LabourAndContractorsView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/accounts") {
      return <AccountingView data={data} onMutate={handleMutate} />;
    }
    if (activeRoute === "/invoices" || activeRoute === "/income") {
      return (
        <InvoicesPaymentsExpensesView
          data={data}
          onMutate={handleMutate}
          tab="invoices"
        />
      );
    }
    if (activeRoute === "/expenses") {
      return (
        <InvoicesPaymentsExpensesView
          data={data}
          onMutate={handleMutate}
          tab="expenses"
        />
      );
    }
    if (activeRoute === "/payments") {
      return (
        <InvoicesPaymentsExpensesView
          data={data}
          onMutate={handleMutate}
          tab="payments"
        />
      );
    }
    if (activeRoute === "/reports") {
      return <ReportsCenterView data={data} />;
    }
    if (activeRoute === "/notifications") {
      return <NotificationsView data={data} onMutate={handleMutate} />;
    }
    if (
      activeRoute === "/documents" ||
      activeRoute === "/users" ||
      activeRoute === "/settings"
    ) {
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

  // ফিল্টার করা সাইডবার মেনু (ভূমিকা অনুযায়ী)
  const filteredNavGroups = NAV_GROUPS.filter((grp) => {
    if (isStaff) {
      return (
        grp.group === "মূল অপারেশন" ||
        grp.group === "মানবসম্পদ ও টিম" ||
        grp.group === "রিপোর্ট ও প্রশাসন"
      );
    }
    if (isMarketing) {
      return (
        grp.group === "মূল অপারেশন" ||
        grp.group === "সিআরএম ও প্রজেক্ট" ||
        grp.group === "রিপোর্ট ও প্রশাসন"
      );
    }
    return true;
  }).map((grp) => {
    if (isStaff) {
      return {
        ...grp,
        items: grp.items.filter(
          (it) =>
            it.href !== "/users" &&
            it.href !== "/settings" &&
            it.href !== "/payroll"
        ),
      };
    }
    if (isMarketing) {
      return {
        ...grp,
        items: grp.items.filter(
          (it) => it.href !== "/users" && it.href !== "/settings"
        ),
      };
    }
    return grp;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* ডেস্কটপ সাইডবার */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-950 text-slate-200 border-r border-slate-800 z-30">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block leading-none font-sans">
                INSAF ERP
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                বিজনেস ম্যানেজমেন্ট পোর্টাল
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredNavGroups.map((grp) => (
            <div key={grp.group}>
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {grp.group}
              </p>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
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

        {/* ব্যবহারকারীর প্রোফাইল ও লগআউট বার */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="truncate">
              <p className="font-bold text-white truncate text-xs">
                {data.currentUser.name}
              </p>
              <p className="text-[10px] text-emerald-400 truncate">
                {data.currentUser.designation || getRoleBangla(userRole)}
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                {data.currentUser.empCode || "EMP"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowPwdModal(true)}
                title="পাসওয়ার্ড পরিবর্তন করুন"
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="লগআউট করুন"
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* মূল কনটেন্ট এলাকা */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* শীর্ষ হেডার */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="মেনু খুলুন বা বন্ধ করুন"
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-800 font-sans">INSAF ERP</span>
              <span>/</span>
              <span className="font-medium text-emerald-700 truncate max-w-[150px] sm:max-w-none">
                {data.currentUser.name} ({data.currentUser.designation || getRoleBangla(userRole)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="নোটিফিকেশন"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </header>

        {/* মোবাইল ড্রয়ার মেনু */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 text-white p-4 space-y-4 border-b border-slate-800 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div>
                <p className="font-bold text-white">{data.currentUser.name}</p>
                <p className="text-emerald-400 text-[11px]">{data.currentUser.designation || getRoleBangla(userRole)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowPwdModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold"
                >
                  পাসওয়ার্ড পরিবর্তন
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 text-xs font-semibold"
                >
                  লগআউট
                </button>
              </div>
            </div>
            {filteredNavGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {grp.group}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {grp.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition truncate ${
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
            ))}
          </div>
        )}

        {/* ফিডব্যাক টোস্ট */}
        {toast && (
          <div
            className={`mx-4 lg:mx-6 mt-4 p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
              toast.type === "ok"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            <span className="flex items-center gap-2">
              {toast.type === "ok" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toast.msg}</span>
            </span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-slate-900 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* প্রথম লগইনে পাসওয়ার্ড পরিবর্তনের নিরাপত্তা অ্যালার্ট ব্যানার */}
        {data.currentUser.mustChangePassword && (
          <div className="mx-4 lg:mx-6 mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>নিরাপত্তা নির্দেশনা:</strong> আপনি প্রাথমিক পাসওয়ার্ড দিয়ে লগইন করেছেন। একাউন্টের সর্বোচ্চ সুরক্ষায় অবিলম্বে আপনার নিজস্ব গোপন পাসওয়ার্ড নির্ধারণ করুন।
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPwdModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition shadow-xs"
            >
              পাসওয়ার্ড পরিবর্তন করুন
            </button>
          </div>
        )}

        {/* পাসওয়ার্ড পরিবর্তন পপআপ মডাল (সকল কর্মকর্তার জন্য সার্বজনীন) */}
        {showPwdModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">পাসওয়ার্ড পরিবর্তন</h3>
                    <p className="text-[11px] text-slate-500">{data.currentUser.name} ({data.currentUser.username || data.currentUser.email})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPwdModal(false);
                    setPwdMsg(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-5 space-y-3.5">
                {pwdMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      pwdMsg.type === "ok"
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                        : "bg-rose-50 border border-rose-300 text-rose-800"
                    }`}
                  >
                    {pwdMsg.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    বর্তমান পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdCurrent}
                    onChange={(e) => setPwdCurrent(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড দিন"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড লিখুন"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPwdModal(false);
                      setPwdMsg(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {pwdLoading ? "সংরক্ষণ হচ্ছে..." : "নতুন পাসওয়ার্ড নিশ্চিত করুন"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* মূল স্ক্রিন কনটেন্ট */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-[1600px] w-full mx-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* মোবাইল বটম ন্যাভিগেশন বার (টাস্ক, উপস্থিতি, নোটিফিকেশন ইত্যাদির জন্য কুইক অ্যাক্সেস) */}
      <nav
        aria-label="মোবাইল বটম ন্যাভিগেশন"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-950 border-t border-slate-800 px-2 py-2 flex items-center justify-around z-30 shadow-2xl backdrop-blur"
      >
        {[
          { label: "হোম", href: "/dashboard", icon: LayoutDashboard },
          { label: "উপস্থিতি", href: "/attendance", icon: Clock },
          { label: "মাই ডে", href: "/my-day", icon: ClipboardCheck },
          { label: "টাস্ক", href: "/tasks", icon: CheckSquare },
          { label: "নোটিফিকেশন", href: "/notifications", icon: Bell },
        ].map((m) => {
          const Icon = m.icon;
          const active = pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
                active ? "text-emerald-400 font-bold bg-slate-900" : "text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{m.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
