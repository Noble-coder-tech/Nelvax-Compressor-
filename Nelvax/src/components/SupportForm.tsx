import { useState } from "react";
import type { FormEvent } from "react";
import {
  Crown,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import type { UserAccount, SupportRequest } from "../types";
import { MockStorage } from "../utils/mockData";

interface SupportFormProps {
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  theme: "light" | "dark";
  onSupportSubmitted: () => void;
}

export default function SupportForm({
  currentUser,
  setCurrentUser,
  theme,
  onSupportSubmitted,
}: SupportFormProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSupportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    const reqs = MockStorage.getSupportRequests();
    const newReq: SupportRequest = {
      id: `sup-${Date.now()}`,
      email: currentUser?.email || "guest@opticompress.io",
      subject,
      message,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    reqs.unshift(newReq);
    MockStorage.setSupportRequests(reqs);

    MockStorage.addLog(
      currentUser?.email || "guest@opticompress.io",
      "SUBMIT_SUPPORT",
      "info",
      `Submitted ticket: "${subject}"`,
    );

    setSubject("");
    setMessage("");
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 5000);
    onSupportSubmitted();
  };

  const handleTriggerUpgrade = () => {
    if (!currentUser) {
      alert(
        "⚠️ Please sign in first (using the Sign In button at top-right) before subscribing to Premium.",
      );
      return;
    }

    const users = MockStorage.getUsers();
    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        return { ...u, tier: "premium" as const };
      }
      return u;
    });

    MockStorage.setUsers(updatedUsers);

    const updatedUser = { ...currentUser, tier: "premium" as const };
    setCurrentUser(updatedUser);
    MockStorage.setCurrentUser(updatedUser);

    MockStorage.addLog(
      currentUser.email,
      "UPGRADE_TIER",
      "success",
      "Upgraded account to Premium Workspace tier",
    );

    alert(
      "✨ Success! You have been upgraded to the Premium Workspace. You now enjoy 1GB single file uploads, fast compression, and batch queueing.",
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Account Tier Upgrade Details (7 Columns) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Tier Features Comparison Grid */}
        <div
          className={`p-6 rounded-3xl border transition duration-300 ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500 animate-pulse" />
              Upgrade to Premium
            </h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              Full access details
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Get unlimited priority bandwidth, batch conversions, and advanced
            format overrides.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Tier Details */}
            <div
              className={`p-4 rounded-2xl border ${
                theme === "dark"
                  ? "bg-[#1E1F21] border-gray-700/60"
                  : "bg-[#F8FAFC] border-slate-100"
              }`}
            >
              <h4 className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-1.5 mb-3">
                <User className="h-4 w-4 text-gray-400" />
                Free Membership
              </h4>
              <ul className="space-y-2 text-xs text-gray-500 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>50 MB Max upload size</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>3-Day storage retention</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Standard processing speed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Single-file uploader</span>
                </li>
              </ul>
              <div className="mt-5 text-center">
                <span className="font-display font-bold text-base text-gray-900 dark:text-white block">
                  $0
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Free forever
                </span>
              </div>
            </div>

            {/* Premium Tier Details */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-bl-lg shadow flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Popular
              </div>

              <h4 className="font-semibold text-sm text-amber-500 flex items-center gap-1.5 mb-3">
                <Crown className="h-4 w-4 text-amber-500" />
                Premium Workspace
              </h4>
              <ul className="space-y-2 text-xs text-gray-700 dark:text-slate-200">
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>1.0 GB Max upload size</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>30-Day storage retention</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>3x Faster processing speed</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Unlimited batch upload</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Format converter, EXIF editor</span>
                </li>
              </ul>
              <div className="mt-5 text-center">
                <span className="font-display font-bold text-base text-gray-900 dark:text-white block">
                  $9 / month
                </span>
                <span className="text-[10px] text-amber-400 block mt-0.5">
                  Instant activation
                </span>
              </div>
            </div>
          </div>

          {/* Action to switch/upgrade immediately */}
          {!currentUser || currentUser.tier !== "premium" ? (
            <button
              onClick={handleTriggerUpgrade}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#718FBF] text-white font-bold rounded-xl text-xs mt-6 transition shadow-md hover:opacity-95"
            >
              {!currentUser
                ? "Sign In to Upgrade to Premium"
                : "Activate 30-Day Free Premium Trial"}
            </button>
          ) : (
            <div className="mt-6 text-center text-xs text-amber-500 font-semibold p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
              <Crown className="h-4 w-4" />
              <span>
                You have active Premium credentials. Enjoy full unlimited
                features!
              </span>
            </div>
          )}
        </div>

        {/* Current logged-in stats overview */}
        {currentUser && (
          <div
            className={`p-6 rounded-3xl border transition duration-300 ${
              theme === "dark"
                ? "bg-[#2D2E30]/60 border-gray-700"
                : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-3">
              Your Usage Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase">
                  Files Compressed
                </span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {currentUser.filesCompressedCount} files
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase">
                  Cloud Storage Saved
                </span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {formatSize(currentUser.storageUsed)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Support Ticket Form (5 Columns) */}
      <div className="lg:col-span-5 space-y-6">
        <div
          className={`p-6 rounded-3xl border transition duration-300 ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#718FBF]" />
            Submit Support Request
          </h3>
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">
            Need help or have questions about compression accuracy? Drop us a
            line.
          </p>

          <form onSubmit={handleSupportSubmit} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="e.g., SVG path simplification issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#718FBF] ${
                  theme === "dark"
                    ? "bg-[#1E1F21] border-gray-600 text-white"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide">
                Message Description
              </label>
              <textarea
                required
                rows={4}
                placeholder="Details of your concern..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#718FBF] ${
                  theme === "dark"
                    ? "bg-[#1E1F21] border-gray-600 text-white"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#718FBF] hover:bg-[#5A7AA3] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Support Ticket</span>
            </button>
          </form>

          {ticketSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs text-center font-semibold flex items-center justify-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Ticket submitted successfully! Admin will view it shortly.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
