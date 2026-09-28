import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "INSAF ERP — Complete Enterprise Construction & Business ERP",
  description:
    "Full Business ERP with HR, Attendance, My Day, Tasks, CRM, Quotations, Projects, Sites, Inventory Formula Engine, Procurement GRN, Double-Entry Accounting, AR/AP, Payroll, Leave, Performance & Audit Trail.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body className="bg-slate-100 text-slate-900 antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
