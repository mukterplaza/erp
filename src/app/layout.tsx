import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "INSAF ERP — ইনসাফ পূর্ণাঙ্গ এন্টারপ্রাইজ বিজনেস ম্যানেজমেন্ট সিস্টেম",
  description:
    "ইনসাফ বিল্ডিং ডিজাইন অ্যান্ড কনসালট্যান্ট লিমিটেড এবং ইনসাফ রিয়েল এস্টেট লিমিটেডের সমন্বিত বিজনেস ইআরপি।",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body className="bg-slate-100 text-slate-900 antialiased font-sans">{children}</body>
    </html>
  );
}
