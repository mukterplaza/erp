"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Forgot/Reset Password state
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("insaf_erp_saved_user");
    if (saved) {
      setIdentifier(saved);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem("insaf_erp_saved_user", identifier);
    } else {
      localStorage.removeItem("insaf_erp_saved_user");
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username: identifier, email: identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("নেটওয়ার্ক ত্রুটি। সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword", email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "পাসওয়ার্ড রিসেট টোকেন তৈরি ব্যর্থ হয়েছে।");
      } else {
        setResetToken(data.resetToken);
        setMessage(`রিসেট টোকেন তৈরি হয়েছে: ${data.resetToken}`);
        setMode("reset");
      }
    } catch {
      setError("পাসওয়ার্ড রিসেট অনুরোধে ত্রুটি হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPassword",
          email: resetEmail,
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।");
      } else {
        setMessage("পাসওয়ার্ড সফলভাবে রিসেট সম্পন্ন হয়েছে! নতুন পাসওয়ার্ড দিয়ে লগইন করুন।");
        setPassword(newPassword);
        setMode("login");
      }
    } catch {
      setError("পাসওয়ার্ড রিসেট প্রক্রিয়ায় ত্রুটি হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* বাম পাশের পরিচিতি ও নিরাপত্তা ব্যানার */}
      <div className="lg:w-7/12 p-8 lg:p-14 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                INSAF ERP
              </h1>
              <p className="text-xs text-emerald-400 font-medium">
                ইনসাফ পূর্ণাঙ্গ এন্টারপ্রাইজ বিজনেস ম্যানেজমেন্ট সিস্টেম
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              নিরাপদ প্রাতিষ্ঠানিক একাউন্ট ও ভূমিকাভিত্তিক প্রবেশাধিকার (RBAC)
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              নির্মাণ, রিয়েল এস্টেট ও সার্বিক ব্যবসায়িক কার্যক্রমের সেন্ট্রাল প্ল্যাটফর্ম
            </h2>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              ইনসাফ বিল্ডিং ডিজাইন অ্যান্ড কনসালট্যান্ট লিমিটেড এবং ইনসাফ রিয়েল এস্টেট লিমিটেডের উপস্থিতি, কাজের পরিকল্পনা, সাইট অপারেশন, প্রকল্প ব্যবস্থাপনা এবং হিসাবের সমন্বিত ব্যবস্থাপনা।
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs font-bold text-emerald-400">INSAF BUILDING DESIGN &amp; CONSULTANT LTD.</p>
              <p className="text-[12px] text-slate-400 mt-1">
                আর্কিটেকচারাল, স্ট্রাকচারাল, রাজউক অনুমোদন ও ইঞ্জিনিয়ারিং সেবা
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-xs font-bold text-blue-400">INSAF REAL ESTATE LTD.</p>
              <p className="text-[12px] text-slate-400 mt-1">
                ফ্ল্যাট, দোকান, বাণিজ্যিক স্পেস ও প্রপার্টি সেলস ব্যবস্থাপনা
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>সার্ভার-সাইড নিরাপত্তা ও অডিট লগ সক্রিয়</span>
          <span>PostgreSQL ও ডাবল-এন্ট্রি আর্থিক নিশ্চয়তা</span>
        </div>
      </div>

      {/* ডান পাশের সুরক্ষিত লগইন ফর্ম */}
      <div className="lg:w-5/12 p-8 lg:p-14 flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              সুরক্ষিত একাউন্ট প্রবেশদ্বার
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {mode === "login"
              ? "ইআরপি পোর্টালে লগইন করুন"
              : mode === "forgot"
              ? "পাসওয়ার্ড পুনরুদ্ধার"
              : "নতুন পাসওয়ার্ড নির্ধারণ"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === "login"
              ? "আপনার বরাদ্দকৃত ইউজারনেম/ইমেইল এবং পাসওয়ার্ড প্রদান করুন।"
              : mode === "forgot"
              ? "আপনার নিবন্ধিত ইমেইল প্রদান করে রিসেট টোকেন সংগ্রহ করুন।"
              : "রিসেট টোকেন এবং নতুন পাসওয়ার্ড প্রদান করুন।"}
          </p>

          {error && (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ইউজারনেম অথবা ইমেইল ঠিকানা
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="ইউজারনেম বা ইমেইল দিন"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-0.5"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  ইউজারনেম মনে রাখুন
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setResetEmail(identifier.includes("@") ? identifier : "");
                    setMode("forgot");
                  }}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
              >
                {loading ? "যাচাই করা হচ্ছে..." : "লগইন করুন"}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  নিবন্ধিত ইমেইল ঠিকানা
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="আপনার ইমেইল ঠিকানা দিন"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
              >
                রিসেট টোকেন পাঠান
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                লগইনে ফিরে যান
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  রিসেট টোকেন
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                    placeholder="RST-XXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  placeholder="নতুন পাসওয়ার্ড দিন"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
              >
                পাসওয়ার্ড পরিবর্তন নিশ্চিত করুন
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                লগইনে ফিরে যান
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
