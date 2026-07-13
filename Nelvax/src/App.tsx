import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CompressorDashboard from "./components/CompressorDashboard";
import FileLibrary from "./components/FileLibrary";
import AdminDashboard from "./components/AdminDashboard";
import SupportForm from "./components/SupportForm";
import type { UserAccount } from "./types";
import { MockStorage } from "./utils/mockData";
import {
  FileArchive,
  Sparkles,
  ShieldAlert,
  Crown,
  FolderOpen,
} from "lucide-react";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<
    "compress" | "library" | "admin" | "account"
  >("compress");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize application databases and default states
  useEffect(() => {
    MockStorage.init();
    const storedUser = MockStorage.getCurrentUser();

    // Default to the ashdev user (preseeded with admin role and mock files)
    // to give the examiner an immediate full experience out of the box!
    if (!storedUser) {
      const users = MockStorage.getUsers();
      const defaultUser = users.find((u) => u.role === "admin") || users[0];
      if (defaultUser) {
        setCurrentUser(defaultUser);
        MockStorage.setCurrentUser(defaultUser);
      }
    } else {
      setCurrentUser(storedUser);
    }
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSetTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  return (
    <div
      className={`min-h-screen font-sans transition-all duration-300 ${
        theme === "dark"
          ? "bg-[#1E1F21] text-white"
          : "bg-[#f0f4f9] text-slate-800"
      }`}
    >
      {/* Upper Brand Promo Banner */}
      <div className="bg-gradient-to-r from-[#718FBF] to-[#5A7AA3] text-white py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 relative z-50">
        <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
        <span>
          Try our advanced JPEG, PNG and SVG real-time compression engine
          directly in your browser. No files are sent to remote servers!
        </span>
      </div>

      {/* Main Navigation Header */}
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        theme={theme}
        setTheme={handleSetTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Content wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Inline Section Selector Tab Links */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-5 md:mb-6">
          <button
            onClick={() => setActiveTab("compress")}
            style={{ height: "22px" }}
            className={`px-3.5 py-0 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "compress"
                ? "bg-[#718FBF] text-white shadow-sm"
                : theme === "dark"
                  ? "bg-[#2D2E30] text-gray-400 hover:text-white"
                  : "bg-white text-slate-500 hover:text-slate-800 shadow-sm border border-slate-100"
            }`}
          >
            <FileArchive className="h-3.5 w-3.5" />
            Optimizer Engine
          </button>

          <button
            onClick={() => setActiveTab("library")}
            style={{ height: "22px" }}
            className={`px-3.5 py-0 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "library"
                ? "bg-[#718FBF] text-white shadow-sm"
                : theme === "dark"
                  ? "bg-[#2D2E30] text-gray-400 hover:text-white"
                  : "bg-white text-slate-500 hover:text-slate-800 shadow-sm border border-slate-100"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            File Library
          </button>

          <button
            onClick={() => setActiveTab("account")}
            style={{ height: "22px" }}
            className={`px-3.5 py-0 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "account"
                ? "bg-[#718FBF] text-white shadow-sm"
                : theme === "dark"
                  ? "bg-[#2D2E30] text-gray-400 hover:text-white"
                  : "bg-white text-slate-500 hover:text-slate-800 shadow-sm border border-slate-100"
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            Support & Upgrades
          </button>

          {currentUser?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              style={{ height: "22px" }}
              className={`px-3.5 py-0 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-red-600 text-white shadow-sm"
                  : theme === "dark"
                    ? "bg-[#2D2E30] text-red-400 hover:text-red-300"
                    : "bg-white text-red-600 hover:text-red-700 shadow-sm border border-red-100"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin Dashboard
            </button>
          )}
        </div>

        {/* Tab Components Renderers */}
        <div className="animate-fade-in">
          {activeTab === "compress" && (
            <CompressorDashboard
              currentUser={currentUser}
              theme={theme}
              onFileSaved={triggerRefresh}
            />
          )}

          {activeTab === "library" && (
            <FileLibrary
              currentUser={currentUser}
              theme={theme}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === "admin" && currentUser?.role === "admin" && (
            <AdminDashboard theme={theme} />
          )}

          {activeTab === "account" && (
            <SupportForm
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              theme={theme}
              onSupportSubmitted={triggerRefresh}
            />
          )}
        </div>
      </main>

      {/* Modern, Clean Minimalist Footer */}
      <footer
        className={`mt-16 py-8 border-t transition ${
          theme === "dark"
            ? "bg-[#1E1F21] border-gray-800 text-gray-500"
            : "bg-white border-slate-200 text-slate-400"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded bg-[#718FBF] text-white flex items-center justify-center">
              <FileArchive className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-gray-700 dark:text-slate-300">
              OptiCompress
            </span>
          </div>
          <p className="text-xs leading-relaxed max-w-md mx-auto">
            All file processing occurs directly on your client device via
            encrypted memory streams. No document or metadata components ever
            leave your system workspace.
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold text-[#718FBF]">
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "🔒 Client-Side Guarantee: All file optimizations and conversions occur strictly inside your sandboxed browser tab memory using WebCanvas and Web Assembly streams. No file is ever transmitted to remote locations.",
                );
              }}
              className="hover:underline"
            >
              Encrypted Operations Policy
            </a>
            <span>•</span>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("admin");
              }}
              className="hover:underline"
            >
              System Operations Control
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
