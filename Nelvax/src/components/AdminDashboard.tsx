import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Users,
  UserCheck,
  Crown,
  Database,
  ShieldAlert,
  TrendingUp,
  HardDrive,
  Cpu,
  Activity,
  Settings,
  Mail,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import type { UserAccount, SupportRequest, CompressionLimits } from "../types";
import { MockStorage } from "../utils/mockData";
import type { SystemLog } from "../utils/mockData";

interface AdminDashboardProps {
  theme: "light" | "dark";
}

export default function AdminDashboard({ theme }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [limits, setLimits] = useState<CompressionLimits>({
    freeMaxUploadSize: 50,
    premiumMaxUploadSize: 1000,
    freeStorageDurationDays: 3,
    premiumStorageDurationDays: 30,
    freeDailyLimit: 10,
    premiumDailyLimit: 150,
  });
  const [queueStatus, setQueueStatus] = useState<
    "idle" | "processing" | "congested"
  >("idle");

  // Search/Filter states for user management
  const [userSearch, setUserSearch] = useState("");
  const [userFilterTier, setUserFilterTier] = useState<string>("all");

  // Load all admin data
  const loadAdminData = () => {
    setUsers(MockStorage.getUsers());
    setSupportRequests(MockStorage.getSupportRequests());
    setSystemLogs(MockStorage.getLogs());
    setLimits(MockStorage.getLimits());
    setQueueStatus(MockStorage.getQueueStatus());
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return (mb / 1024).toFixed(2) + " GB";
    }
    return mb.toFixed(1) + " MB";
  };

  // Toggle Premium level for a user
  const handleTogglePremium = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const nextTier: UserAccount["tier"] =
      targetUser.tier === "premium" ? "free" : "premium";
    const updatedUsers: UserAccount[] = users.map((u) => {
      if (u.id === userId) {
        return { ...u, tier: nextTier };
      }
      return u;
    });

    MockStorage.setUsers(updatedUsers);
    MockStorage.addLog(
      "admin@opticompress.io",
      "UPDATE_USER_TIER",
      "success",
      `Changed tier of user "${targetUser.email}" to ${nextTier.toUpperCase()}`,
    );
    loadAdminData();
  };

  // Resolve a support request
  const handleResolveSupport = (id: string) => {
    const reqs = MockStorage.getSupportRequests();
    const updated = reqs.map((r) => {
      if (r.id === id) {
        return { ...r, status: "resolved" as const };
      }
      return r;
    });
    MockStorage.setSupportRequests(updated);
    MockStorage.addLog(
      "admin@opticompress.io",
      "RESOLVE_SUPPORT",
      "success",
      `Support request ID ${id} resolved successfully`,
    );
    loadAdminData();
  };

  // Save new configuration limits
  const handleSaveLimits = (e: FormEvent) => {
    e.preventDefault();
    MockStorage.setLimits(limits);
    alert("✅ Compression limit configurations saved to main system memory!");
    loadAdminData();
  };

  // Change queue status
  const handleQueueStatusChange = (
    status: "idle" | "processing" | "congested",
  ) => {
    MockStorage.setQueueStatus(status);
    setQueueStatus(status);
    MockStorage.addLog(
      "admin@opticompress.io",
      "UPDATE_QUEUE_STATUS",
      "warning",
      `Server processing queue status changed to ${status.toUpperCase()}`,
    );
    loadAdminData();
  };

  // Derived Analytics stats
  const totalRegistered = users.length;
  const premiumCount = users.filter((u) => u.tier === "premium").length;
  const totalFilesCompressed =
    systemLogs.filter((l) => l.action === "COMPRESS_FILE").length + 12450; // Add simulated offset
  const totalStorageBytes =
    users.reduce((sum, u) => sum + u.storageUsed, 0) + 42500000000; // Offset for realism
  const totalBandwidthSaved = 128.4 + totalFilesCompressed * 0.012; // Simulated saved bandwidth ratio

  // Filtering users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email
      .toLowerCase()
      .includes(userSearch.toLowerCase());
    const matchesTier = userFilterTier === "all" || u.tier === userFilterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Admin Operations Center
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time server infrastructure telemetry, user accounts control,
            and tier limits editor.
          </p>
        </div>

        {/* Server Queue Speed controller */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
            theme === "dark"
              ? "bg-[#2D2E30]/70 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-gray-400">
              Queue Ingress Routing
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  queueStatus === "idle"
                    ? "bg-emerald-500 animate-pulse"
                    : queueStatus === "processing"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-red-500 animate-pulse"
                }`}
              />
              <span className="text-xs font-bold capitalize">
                {queueStatus} Load
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {(["idle", "processing", "congested"] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleQueueStatusChange(status)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                  queueStatus === status
                    ? "bg-[#718FBF] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          className={`p-5 rounded-2xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3 text-gray-400">
            <span className="text-xs font-semibold">Total Registered</span>
            <Users className="h-4.5 w-4.5 text-[#718FBF]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalRegistered + 1482}
          </h3>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>+24 accounts today</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div
          className={`p-5 rounded-2xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3 text-gray-400">
            <span className="text-xs font-semibold">Premium Subscribers</span>
            <Crown className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {premiumCount + 187}
          </h3>
          <p className="text-[10px] text-indigo-400 font-semibold mt-1.5">
            {(((premiumCount + 187) / (totalRegistered + 1482)) * 100).toFixed(
              1,
            )}
            % Conversion rate
          </p>
        </div>

        {/* Metric 3 */}
        <div
          className={`p-5 rounded-2xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3 text-gray-400">
            <span className="text-xs font-semibold">Bandwidth Saved</span>
            <HardDrive className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalBandwidthSaved.toFixed(1)} GB
          </h3>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1.5">
            Saving average 72% per file
          </p>
        </div>

        {/* Metric 4 */}
        <div
          className={`p-5 rounded-2xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-100 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3 text-gray-400">
            <span className="text-xs font-semibold">Sub Revenue</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            ${1870 + premiumCount * 9}
          </h3>
          <p className="text-[10px] text-indigo-400 font-semibold mt-1.5">
            Active premium run rate
          </p>
        </div>
      </div>

      {/* Second Row: Bento Grid with Server Health and File Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Server Telemetry Health Gauge (8 Columns) */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-[#718FBF]" />
            Cloud Engine Telemetry & Performance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* CPU usage */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">
                  CPU LOAD
                </span>
                <Cpu className="h-4 w-4 text-[#718FBF]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">18%</span>
                <span className="text-[10px] text-gray-400">Secure Node</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-[#718FBF] h-full rounded-full"
                  style={{ width: "18%" }}
                />
              </div>
            </div>

            {/* RAM capacity */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">
                  RAM USAGE
                </span>
                <Database className="h-4 w-4 text-[#718FBF]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">42%</span>
                <span className="text-[10px] text-gray-400">of 16.0 GB</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-[#718FBF] h-full rounded-full"
                  style={{ width: "42%" }}
                />
              </div>
            </div>

            {/* Storage capacity */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">
                  STORAGE DEPLOY
                </span>
                <HardDrive className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">28%</span>
                <span className="text-[10px] text-gray-400">
                  {formatSize(totalStorageBytes)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: "28%" }}
                />
              </div>
            </div>
          </div>

          {/* Inline Charts for Category Popularity & Success Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            {/* Chart 1: Popular File Categories */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">
                Popular File Formats
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Images (JPG, PNG, WebP)</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
                    <div
                      className="bg-[#718FBF] h-full rounded-full"
                      style={{ width: "45%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Videos (MP4, MOV)</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{ width: "25%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>Documents (PDF, DOCX)</span>
                    <span className="font-semibold">15%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: "15%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Engine Success rates */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-3">
                Compression Success Analytics
              </span>
              <div className="flex items-center gap-4 py-3 bg-gray-50 dark:bg-gray-800/30 rounded-2xl px-4 border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold text-sm text-emerald-500">
                  98.6%
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white">
                    High Reliability Target
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                    98.6% of compression processes complete successfully. 1.4%
                    halted due to corrupted metadata files.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Limits Editor (4 Columns) */}
        <form
          onSubmit={handleSaveLimits}
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div>
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-[#718FBF]" />
              Limits Editor
            </h3>

            <div className="space-y-4 text-xs">
              {/* Limit 1: Free Upload size */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Free Max Upload (MB)
                </label>
                <input
                  type="number"
                  value={limits.freeMaxUploadSize}
                  onChange={(e) =>
                    setLimits({
                      ...limits,
                      freeMaxUploadSize: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-3 py-1.8 rounded-xl border focus:outline-none ${
                    theme === "dark"
                      ? "bg-[#1E1F21] border-gray-600 text-white"
                      : "bg-white border-slate-200"
                  }`}
                />
              </div>

              {/* Limit 2: Premium Upload size */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Premium Max Upload (MB)
                </label>
                <input
                  type="number"
                  value={limits.premiumMaxUploadSize}
                  onChange={(e) =>
                    setLimits({
                      ...limits,
                      premiumMaxUploadSize: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-3 py-1.8 rounded-xl border focus:outline-none ${
                    theme === "dark"
                      ? "bg-[#1E1F21] border-gray-600 text-white"
                      : "bg-white border-slate-200"
                  }`}
                />
              </div>

              {/* Limit 3: Storage retention days */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Free Storage Days
                  </label>
                  <input
                    type="number"
                    value={limits.freeStorageDurationDays}
                    onChange={(e) =>
                      setLimits({
                        ...limits,
                        freeStorageDurationDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-3 py-1.8 rounded-xl border focus:outline-none ${
                      theme === "dark"
                        ? "bg-[#1E1F21] border-gray-600 text-white"
                        : "bg-white border-slate-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Premium Days
                  </label>
                  <input
                    type="number"
                    value={limits.premiumStorageDurationDays}
                    onChange={(e) =>
                      setLimits({
                        ...limits,
                        premiumStorageDurationDays:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-3 py-1.8 rounded-xl border focus:outline-none ${
                      theme === "dark"
                        ? "bg-[#1E1F21] border-gray-600 text-white"
                        : "bg-white border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-red-500 to-[#718FBF] hover:opacity-90 text-white font-bold rounded-xl text-xs mt-6 transition shadow"
          >
            Apply New Guardrails
          </button>
        </form>
      </div>

      {/* Third Row: Support Inquiries & Active Users Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Accounts Management (8 Columns) */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-[#718FBF]" />
              Manage Users & Account States
            </h3>

            {/* Quick search */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search user email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                  theme === "dark"
                    ? "bg-[#1E1F21] border-gray-600"
                    : "bg-white border-slate-200"
                }`}
              />
              <select
                value={userFilterTier}
                onChange={(e) => setUserFilterTier(e.target.value)}
                className={`px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none ${
                  theme === "dark"
                    ? "bg-[#1E1F21] border-gray-600"
                    : "bg-white border-slate-200"
                }`}
              >
                <option value="all">All Tiers</option>
                <option value="premium">Premium Only</option>
                <option value="free">Free Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                  <th className="pb-2.5">User Email</th>
                  <th className="pb-2.5">Registration</th>
                  <th className="pb-2.5">Optimized Files</th>
                  <th className="pb-2.5 text-center">Tier Status</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                  >
                    <td className="py-3 font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#718FBF] to-purple-500 text-[10px] text-white flex items-center justify-center font-extrabold uppercase">
                        {user.email[0]}
                      </div>
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {user.email}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(user.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-mono font-medium">
                      {user.filesCompressedCount} files
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          user.tier === "premium"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        }`}
                      >
                        {user.tier}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleTogglePremium(user.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          user.tier === "premium"
                            ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"
                            : "bg-amber-500/15 text-amber-500 hover:bg-amber-500 hover:text-white"
                        }`}
                      >
                        {user.tier === "premium" ? "Revoke PRO" : "Assign PRO"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Support Tickets Panel (4 Columns) */}
        <div
          className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
            theme === "dark"
              ? "bg-[#2D2E30]/60 border-gray-700"
              : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div>
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-[#718FBF]" />
              Support Inbox
            </h3>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {supportRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-3.5 rounded-2xl border transition text-xs ${
                    req.status === "resolved"
                      ? theme === "dark"
                        ? "bg-emerald-500/5 border-emerald-500/10 opacity-60"
                        : "bg-emerald-50/40 border-emerald-100/50 opacity-60"
                      : theme === "dark"
                        ? "bg-[#1E1F21] border-gray-700"
                        : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="font-bold text-gray-700 dark:text-slate-300 truncate max-w-[120px]"
                      title={req.email}
                    >
                      {req.email}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        req.status === "resolved"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5">
                    {req.subject}
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    {req.message}
                  </p>

                  {req.status === "pending" && (
                    <button
                      onClick={() => handleResolveSupport(req.id)}
                      className="w-full py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-[10px] transition shadow-sm flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Resolve and notify
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fourth Row: Live Logs Feed */}
      <div
        className={`p-6 rounded-3xl border ${
          theme === "dark"
            ? "bg-[#2D2E30]/60 border-gray-700"
            : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-indigo-400" />
          Secure Core Activity Logs
        </h3>

        <div className="space-y-1.5 max-h-[220px] overflow-y-auto font-mono text-[11px]">
          {systemLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border ${
                log.status === "success"
                  ? theme === "dark"
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                    : "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                  : log.status === "warning"
                    ? theme === "dark"
                      ? "bg-amber-500/5 border-amber-500/10 text-amber-400"
                      : "bg-amber-50/50 border-amber-100 text-amber-700"
                    : theme === "dark"
                      ? "bg-[#1E1F21] border-gray-700 text-gray-400"
                      : "bg-slate-50 border-slate-200 text-gray-600"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-gray-400">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/10">
                  {log.action}
                </span>
                <span className="font-semibold text-gray-500 dark:text-gray-300">
                  ({log.email})
                </span>
                <span className="text-gray-700 dark:text-slate-200">
                  {log.details}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
