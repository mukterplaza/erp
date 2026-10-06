import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Hind_Siliguri, Inter } from "next/font/google";
import PwaRegistration from "@/components/PwaRegistration";
import "./globals.css";

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
    "Full Business ERP with HR, Attendance, My Day, Tasks, CRM, Quotations, Projects, Sites, Inventory, Procurement, Accounting, Payroll, Leave and Audit Trail.",
  applicationName: "INSAF ERP",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "INSAF ERP",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/pwa-icon?size=180",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased overflow-x-hidden font-sans">
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}