import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";

// গুগলের বাংলা ও ইংরেজি ফন্ট লোড (সব ডিভাইসে নিখুঁত দেখানোর জন্য)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "INSAF ERP — Complete Enterprise Construction & Business ERP",
  description:
    "Full Business ERP with HR, Attendance, My Day, Tasks, CRM, Quotations, Projects, Sites, Inventory Formula Engine, Procurement GRN, Double-Entry Accounting, AR/AP, Payroll, Leave, Performance & Audit Trail.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}