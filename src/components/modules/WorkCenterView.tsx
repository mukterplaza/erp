// src/components/modules/WorkCenterView.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Star,
  Activity,
  Filter,
  Search,
  UserCheck,
  UserX,
  Loader2,
  TrendingUp,
  MessageSquare,
  Paperclip,
  Calendar,
  Award,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// Types & Interfaces
// ============================================================================
type TaskStatus =
  | "Pending Acceptance"
  | "Accepted"
  | "In Progress"
  | "Review"
  | "Completed"
  | "Declined"
  | "Correction Required"
  | "Blocked";

type Task = {
  id: number;
  taskCode: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: string;
  assignedTo?: number;
  assignedToName?: string;
  assignedBy?: number;
  assignedByName?: string;
  isCompanyWide?: boolean;
  dueDate?: string;
  progressPercent?: number;
  completionNote?: string;
  reviewedBy?: string;
  rating?: string; // Best, Better, Good, Needs Improvement, Poor
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
};

type TaskComment = {
  id: number;
  taskId: number;
  authorName: string;
  comment: string;
  actionType: string;
  createdAt: string;
};

type User = {
  id: number;
  name: string;
  role: string;
  employeeId?: number;
  empCode?: string;
};

// ============================================================================
// Helper Components
// ============================================================================
function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<string, string> = {
    "Pending Acceptance": "bg-amber-100 text-amber-700 border-amber-200",
    Accepted: "bg-blue-100 text-blue-700 border-blue-200",
    "In Progress": "bg-indigo-100 text-indigo-700 border-indigo-200",
    Review: "bg-purple-100 text-purple-700 border-purple-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Declined: "bg-rose-100 text-rose-700 border-rose-200",
    "Correction Required": "bg-orange-100 text-orange-700 border-orange-200",
    Blocked: "bg-slate-200 text-slate-700 border-slate-300",
  };
  const cls = map[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {status}
    </span>
  );
}

function RatingBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  const colors: Record<string, string> = {
    Best: "text-emerald-600 bg-emerald-50",
    Better: "text-blue-600 bg-blue-50",
    Good: "text-slate-600 bg-slate-50",
    "Needs Improvement": "text-amber-600 bg-amber-50",
    Poor: "text-rose-600 bg-rose-50",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[rating] || "text-slate-500"}`}>
      <Star className="w-3 h-3 inline mr-1 fill-current" />
      {rating}
    </span>
  );
}

function ProgressBar({ percent, onChange, readOnly = false }: { percent: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
        <span>অগ্রগতি</span>
        <span className={percent === 100 ? "text-emerald-600" : "text-slate-900"}>{percent}%</span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${
            percent === 100 ? "bg-emerald-500" : "bg-indigo-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!readOnly && onChange && (
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={percent}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full mt-2 h-1 bg-transparent appearance-none cursor-pointer accent-indigo-600"
        />
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export function WorkCenterView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const currentUser: User = data.currentUser;
  const isManagement = ["Owner", "Chairman", "MD", "Admin", "Manager", "HR", "Project Manager"].includes(currentUser.role);
  const myEmpId = currentUser.employeeId;

  // State
  const [activeTab, setActiveTab] = useState<"my-tasks" | "team-tasks" | "activity">("my-tasks");
  const [localProgress, setLocalProgress] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [rating, setRating] = useState("Good");

  // Data
  const allTasks: Task[] = data.tasks || [];
  const comments: TaskComment[] = data.taskComments || [];

  // Filter Tasks
  const myTasks = useMemo(() => {
    if (!myEmpId) return [];
    return allTasks.filter((t) => Number(t.assignedTo) === Number(myEmpId) || t.isCompanyWide);
  }, [allTasks, myEmpId]);

  const teamTasks = useMemo(() => {
    if (!isManagement) return [];
    return allTasks.filter((t) => !t.isCompanyWide); // Show all assigned tasks
  }, [allTasks, isManagement]);

  // Today's Activity (Auto-generated from comments/updates today)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayActivity = useMemo(() => {
    return comments
      .filter((c) => c.createdAt && c.createdAt.startsWith(todayStr))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments, todayStr]);

  // Stats
  const stats = useMemo(() => {
    const tasks = isManagement ? teamTasks : myTasks;
    return {
      total: tasks.length,
      pendingAcceptance: tasks.filter((t) => t.status === "Pending Acceptance").length,
      inProgress: tasks.filter((t) => t.status === "In Progress" || t.status === "Accepted").length,
      review: tasks.filter((t) => t.status === "Review").length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "Completed" && t.status !== "Declined").length,
    };
  }, [myTasks, teamTasks, isManagement, todayStr]);

  // Handlers
  const handleAccept = async (taskId: number) => {
    await onMutate({ action: "updateTaskStatus", taskId, status: "Accepted" });
  };

  const handleDecline = async (taskId: number) => {
    const reason = prompt("কাজটি প্রত্যাখ্যান করার কারণ লিখুন:");
    if (reason) {
      await onMutate({ action: "updateTaskStatus", taskId, status: "Declined", comment: reason });
    }
  };

  const handleSaveProgress = async (taskId: number, currentPercent: number) => {
    const newPercent = localProgress[taskId] ?? currentPercent;
    if (newPercent === currentPercent) return;

    setSavingId(taskId);
    try {
      await onMutate({
        action: "updateTaskProgress",
        taskId,
        progressPercent: newPercent,
        note: `অগ্রগতি আপডেট: ${currentPercent}% → ${newPercent}%`,
      });
      // Clear local state after success
      setLocalProgress((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmitForApproval = async (taskId: number) => {
    if (confirm("আপনি কি নিশ্চিত যে কাজটি ১০০% সম্পন্ন হয়েছে এবং অনুমোদনের জন্য জমা দিতে চান?")) {
      await onMutate({ action: "updateTaskStatus", taskId, status: "Review", progressPercent: 100 });
    }
  };

  const handleApprove = async (taskId: number) => {
    if (!reviewNote.trim() && rating === "Needs Improvement") {
      alert("উন্নতির প্রয়োজন হলে কারণ লেখা বাধ্যতামূলক।");
      return;
    }
    await onMutate({
      action: "reviewTask",
      taskId,
      decision: "Approve",
      reason: reviewNote,
      rating, // Custom field for rating
    });
    setReviewNote("");
  };

  const handleRequestCorrection = async (taskId: number) => {
    if (!reviewNote.trim()) {
      alert("সংশোধনের কারণ লেখা বাধ্যতামূলক।");
      return;
    }
    await onMutate({
      action: "reviewTask",
      taskId,
      decision: "Correction",
      reason: reviewNote,
    });
    setReviewNote("");
  };

  // Render Task Card
  const renderTaskCard = (task: Task) => {
    const isAssignee = Number(task.assignedTo) === Number(myEmpId);
    const currentProgress = localProgress[task.id] ?? task.progressPercent ?? 0;
    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== "Completed";

    return (
      <div key={task.id} className={`bg-white rounded-xl border p-4 shadow-sm transition hover:shadow-md ${isOverdue ? "border-rose-200" : "border-slate-200"}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {task.taskCode}
              </span>
              <StatusBadge status={task.status} />
              {task.rating && <RatingBadge rating={task.rating} />}
              {isOverdue && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">OVERDUE</span>}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {task.assignedByName} • Deadline: {task.dueDate || "No Date"}
            </p>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
            {task.description}
          </p>
        )}

        {/* Progress Section */}
        <div className="mb-3">
          <ProgressBar
            percent={currentProgress}
            onChange={isAssignee && (task.status === "Accepted" || task.status === "In Progress") ? (v) => setLocalProgress((p) => ({ ...p, [task.id]: v })) : undefined}
            readOnly={!isAssignee || (task.status !== "Accepted" && task.status !== "In Progress")}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {/* Assignee Actions */}
          {isAssignee && task.status === "Pending Acceptance" && (
            <>
              <button onClick={() => handleAccept(task.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700">
                <UserCheck className="w-3 h-3" /> কাজ গ্রহণ করুন
              </button>
              <button onClick={() => handleDecline(task.id)} className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 hover:bg-rose-200">
                <UserX className="w-3 h-3" /> প্রত্যাখ্যান
              </button>
            </>
          )}

          {isAssignee && (task.status === "Accepted" || task.status === "In Progress") && (
            <>
              <button
                onClick={() => handleSaveProgress(task.id, task.progressPercent ?? 0)}
                disabled={savingId === task.id || currentProgress === (task.progressPercent ?? 0)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                অগ্রগতি সংরক্ষণ
              </button>
             {currentProgress === 100 && (
                <button onClick={() => handleSubmitForApproval(task.id)} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-purple-700">
                  <Send className="w-3 h-3" /> অনুমোদনের জন্য জমা দিন
                </button>
              )}
            </>
          )}

          {/* Manager Actions */}
          {isManagement && task.status === "Review" && (
            <div className="w-full space-y-2">
              <div className="flex gap-2">
                <select value={rating} onChange={(e) => setRating(e.target.value)} className="px-2 py-1 rounded border border-slate-300 text-xs">
                  <option value="Best">Best (অসাধারণ)</option>
                  <option value="Better">Better (ভালো)</option>
                  <option value="Good">Good (সন্তোষজনক)</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="মন্তব্য বা সংশোধনের কারণ..."
                className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={() => handleApprove(task.id)} className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> অনুমোদন
                </button>
                <button onClick={() => handleRequestCorrection(task.id)} className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" /> সংশোধন চান
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          কাজ ও কার্যক্রম কেন্দ্র
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
            <p className="text-[10px] text-slate-300 uppercase font-bold">মোট কাজ</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-amber-500/20 rounded-xl p-3 backdrop-blur border border-amber-500/30">
            <p className="text-[10px] text-amber-200 uppercase font-bold">গ্রহণের অপেক্ষায়</p>
            <p className="text-xl font-bold text-amber-100">{stats.pendingAcceptance}</p>
          </div>
          <div className="bg-indigo-500/20 rounded-xl p-3 backdrop-blur border border-indigo-500/30">
            <p className="text-[10px] text-indigo-200 uppercase font-bold">চলমান</p>
            <p className="text-xl font-bold text-indigo-100">{stats.inProgress}</p>
          </div>
          <div className="bg-purple-500/20 rounded-xl p-3 backdrop-blur border border-purple-500/30">
            <p className="text-[10px] text-purple-200 uppercase font-bold">অনুমোদনের অপেক্ষায়</p>
            <p className="text-xl font-bold text-purple-100">{stats.review}</p>
          </div>
          <div className="bg-emerald-500/20 rounded-xl p-3 backdrop-blur border border-emerald-500/30">
            <p className="text-[10px] text-emerald-200 uppercase font-bold">সম্পন্ন</p>
            <p className="text-xl font-bold text-emerald-100">{stats.completed}</p>
          </div>
          <div className="bg-rose-500/20 rounded-xl p-3 backdrop-blur border border-rose-500/30">
            <p className="text-[10px] text-rose-200 uppercase font-bold">মেয়াদ উত্তীর্ণ</p>
            <p className="text-xl font-bold text-rose-100">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("my-tasks")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
            activeTab === "my-tasks" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          আমার কাজ ({myTasks.length})
        </button>
        {isManagement && (
          <button
            onClick={() => setActiveTab("team-tasks")}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
              activeTab === "team-tasks" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            টিম মনিটরিং ({teamTasks.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
            activeTab === "activity" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          আজকের কার্যক্রম
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main List */}
        <div className={`${activeTab === "activity" ? "lg:col-span-12" : "lg:col-span-8"} space-y-4`}>
          {activeTab === "my-tasks" && (
            <>
              {myTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>আপনার জন্য কোনো কাজ নেই।</p>
                </div>
              ) : (
                myTasks.map(renderTaskCard)
              )}
            </>
          )}

          {activeTab === "team-tasks" && isManagement && (
            <>
              {teamTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-500">কোনো টিম টাস্ক নেই।</div>
              ) : (
                teamTasks.map(renderTaskCard)
              )}
            </>
          )}

          {activeTab === "activity" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> আজকের স্বয়ংক্রিয় আপডেট ({todayActivity.length})
              </h3>
              {todayActivity.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">আজকে কোনো আপডেট নেই।</p>
              ) : (
                <div className="space-y-3">
                  {todayActivity.map((c) => (
                    <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {c.authorName.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{c.authorName}</p>
                        <p className="text-sm text-slate-700 mt-0.5">{c.comment}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(c.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} • {c.actionType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Quick Info / Pending Approvals for Manager */}
        {activeTab !== "activity" && (
          <div className="lg:col-span-4 space-y-4">
            {isManagement && stats.review > 0 && (
              <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                <h4 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> অনুমোদনের অপেক্ষায় ({stats.review})
                </h4>
                <p className="text-xs text-purple-700">
                  {stats.review} টি কাজ অনুমোদনের জন্য জমা দেওয়া হয়েছে। দয়া করে Review ট্যাবে গিয়ে সেগুলো দেখুন।
                </p>
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-900 text-sm mb-3">দ্রুত তথ্য</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-bold text-emerald-600">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>On-Time:</span>
                  <span className="font-bold text-blue-600">
                    {stats.total > 0 ? Math.round(((stats.completed - stats.overdue) / stats.total) * 100) : 0}%
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}