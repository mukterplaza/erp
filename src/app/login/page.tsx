"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("insaf_erp_saved_email");
    if (saved) setEmail(saved);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    if (rememberMe) localStorage.setItem("insaf_erp_saved_email", email);
    else localStorage.removeItem("insaf_erp_saved_email");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", loginId: email, email, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "লগইন ব্যর্থ হয়েছে");
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword", email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "টোকেন তৈরি হয়নি");
      else {
        setResetToken(data.resetToken);
        setMessage(`রিসেট টোকেন: ${data.resetToken}`);
        setMode("reset");
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "পাসওয়ার্ড রিসেট ব্যর্থ");
      else {
        setMessage("পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগইন করুন।");
        setPassword(newPassword);
        setMode("login");
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      <div className="lg:w-1/2 p-8 lg:p-14 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">INSAF ERP</h1>
              <p className="text-xs text-emerald-400">নিরাপদ কর্পোরেট ওয়ার্কস্পেস</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 mt-8 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> কঠোর অ্যাকাউন্ট নিরাপত্তা — অন্যের অ্যাকাউন্টে প্রবেশ নিষিদ্ধ
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight">
            INSAF BUILDING DESIGN & CONSULTANT LTD.
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            এবং INSAF REAL ESTATE LTD. — একই নিরাপদ ব্যাকএন্ডে পৃথক লিড ডাটাবেস।
          </p>
          <ul className="mt-8 space-y-2 text-sm text-slate-300">
            <li>• প্রত্যেক কর্মী শুধু নিজের অ্যাকাউন্টে লগইন করবেন</li>
            <li>• ম্যানেজমেন্ট অন্যের অ্যাকাউন্টে ঢুকতে পারবেন না</li>
            <li>• হাজিরা, টাস্ক, দৈনিক কাজ মোবাইল থেকে সহজে ব্যবহারযোগ্য</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500 mt-8">সার্ভার-সাইড RBAC • PostgreSQL • সেশন কুকি HttpOnly</p>
      </div>

      <div className="lg:w-1/2 p-6 sm:p-10 flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold">
            {mode === "login" ? "লগ ইন করুন" : mode === "forgot" ? "পাসওয়ার্ড ভুলে গেছেন" : "পাসওয়ার্ড রিসেট"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">নিজের লগইন আইডি ও পাসওয়ার্ড দিন। অন্যের অ্যাকাউন্টে প্রবেশ করা যাবে না।</p>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {message && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                  <label className="block text-xs font-medium mb-1.5">লগইন আইডি</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm"
                    placeholder="rakibul.hasan" autoComplete="username" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">পাসওয়ার্ড</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input type={showPassword ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm"
                    placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400" aria-label="পাসওয়ার্ড দেখুন">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  আমাকে মনে রাখুন
                </label>
                <button type="button" onClick={() => setMode("forgot")} className="text-emerald-400">
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50 min-h-[48px]">
                {loading ? "যাচাই করা হচ্ছে..." : "লগ ইন"}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="mt-6 space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm" placeholder="ইমেইল" />
              <button type="submit" className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm min-h-[48px]">
                রিসেট টোকেন নিন
              </button>
              <button type="button" onClick={() => setMode("login")} className="w-full text-xs text-slate-400">ফিরে যান</button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input required value={resetToken} onChange={(e) => setResetToken(e.target.value)}
                  className="w-full pl-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm" placeholder="টোকেন" />
              </div>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm" placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" />
              <button type="submit" className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm min-h-[48px]">
                পাসওয়ার্ড সেট করুন
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
