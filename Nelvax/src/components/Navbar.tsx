import { useState } from "react";
import type { FormEvent } from "react";
import {
  FileArchive,
  Sun,
  Moon,
  User,
  Shield,
  Crown,
  Sparkles,
  LogOut,
  ChevronDown,
  LogIn,
} from "lucide-react";
import type { UserAccount } from "../types";
import { MockStorage } from "../utils/mockData";

interface NavbarProps {
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  activeTab: "compress" | "library" | "admin" | "account";
  setActiveTab: (tab: "compress" | "library" | "admin" | "account") => void;
}

export default function Navbar({
  currentUser,
  setCurrentUser,
  theme,
  setTheme,
  setActiveTab,
}: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Helper to quickly switch roles in-app for demonstration/evaluation
  const handleQuickSwitchRole = (
    role: "admin" | "premium" | "free" | "guest",
  ) => {
    if (role === "guest") {
      setCurrentUser(null);
      MockStorage.setCurrentUser(null);
      setActiveTab("compress");
    } else {
      const users = MockStorage.getUsers();
      let selectedUser = users.find((u) => {
        if (role === "admin") return u.role === "admin";
        if (role === "premium")
          return u.tier === "premium" && u.role === "user";
        if (role === "free") return u.tier === "free";
        return false;
      });

      if (!selectedUser) {
        // Create a default if missing
        selectedUser = {
          id: `usr-demo-${role}`,
          email: `${role}.demo@opticompress.io`,
          tier: role === "premium" || role === "admin" ? "premium" : "free",
          role: role === "admin" ? "admin" : "user",
          registeredAt: new Date().toISOString(),
          filesCompressedCount: 0,
          storageUsed: 0,
        };
        const allUsers = [...users, selectedUser];
        MockStorage.setUsers(allUsers);
      }

      setCurrentUser(selectedUser);
      MockStorage.setCurrentUser(selectedUser);
      MockStorage.addLog(
        selectedUser.email,
        "DEMO_SWITCH",
        "info",
        `Switched to ${role.toUpperCase()} workspace role`,
      );
    }
    setShowUserDropdown(false);
  };

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authEmail.includes("@")) return;

    const users = MockStorage.getUsers();
    let user = users.find(
      (u) => u.email.toLowerCase() === authEmail.toLowerCase(),
    );

    if (!user) {
      // Create new user
      user = {
        id: `usr-${Date.now()}`,
        email: authEmail,
        tier: isRegister ? "free" : "free", // Default new accounts to free
        role: "user",
        registeredAt: new Date().toISOString(),
        filesCompressedCount: 0,
        storageUsed: 0,
      };
      const updatedUsers = [...users, user];
      MockStorage.setUsers(updatedUsers);
      MockStorage.addLog(
        authEmail,
        "REGISTER",
        "success",
        "New user account registered",
      );
    } else {
      MockStorage.addLog(
        authEmail,
        "LOGIN",
        "info",
        "User logged in successfully",
      );
    }

    setCurrentUser(user);
    MockStorage.setCurrentUser(user);
    setShowAuthModal(false);
    setAuthEmail("");
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        theme === "dark"
          ? "bg-[#1E1F21]/90 border-b border-[#6B6C6E]/20 text-white"
          : "bg-white/90 border-b border-[#718FBF]/10 text-[#1E293B]"
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveTab("compress")}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#718FBF] to-[#5A7AA3] text-white shadow-md transition-transform group-hover:scale-105 duration-200">
              <FileArchive className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-[#718FBF] to-[#4F6C92] bg-clip-text text-transparent">
                OptiCompress
              </span>
              <span className="block text-[9px] font-medium text-[#718FBF] uppercase tracking-wider -mt-1">
                Pro Optimizer
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-gray-800 text-yellow-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Auth Button or User Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white bg-gradient-to-tr ${
                      currentUser.role === "admin"
                        ? "from-red-500 to-amber-500"
                        : currentUser.tier === "premium"
                          ? "from-[#718FBF] to-purple-500"
                          : "from-[#718FBF] to-gray-400"
                    }`}
                  >
                    {currentUser.email[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {currentUser.email.split("@")[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showUserDropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-1.5 border ${
                      theme === "dark"
                        ? "bg-[#2D2E30] border-gray-700 text-white"
                        : "bg-white border-gray-100 text-[#1E293B]"
                    } ring-1 ring-black/5 z-50`}
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 truncate">
                        Logged in as
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {currentUser.email}
                      </p>
                      <div className="flex items-center mt-1.5 space-x-1">
                        {currentUser.role === "admin" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Admin
                          </span>
                        ) : currentUser.tier === "premium" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#718FBF]/25 text-[#718FBF] flex items-center gap-1">
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" /> Free Member
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveTab("compress");
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Compress File
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveTab("library");
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      My Library
                    </button>
                    {currentUser.role === "admin" && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab("admin");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium"
                      >
                        Admin Dashboard
                      </button>
                    )}

                    {/* Quick premium unlock for trial */}
                    {currentUser.tier === "free" && (
                      <button
                        onClick={() => {
                          const users = MockStorage.getUsers();
                          const updated = users.map((u) =>
                            u.id === currentUser.id
                              ? { ...u, tier: "premium" as const }
                              : u,
                          );
                          MockStorage.setUsers(updated);
                          const updatedUser = {
                            ...currentUser,
                            tier: "premium" as const,
                          };
                          setCurrentUser(updatedUser);
                          MockStorage.setCurrentUser(updatedUser);
                          MockStorage.addLog(
                            currentUser.email,
                            "UPGRADE_TIER",
                            "success",
                            "Upgraded account to Premium Workspace tier",
                          );
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#718FBF] font-semibold hover:bg-[#718FBF]/10 transition flex items-center gap-1.5"
                      >
                        <Sparkles className="h-4 w-4" />
                        Go Premium (Free trial)
                      </button>
                    )}

                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Demo Role Switch
                    </div>
                    <div className="grid grid-cols-4 gap-1 px-3 pb-2 text-[10px]">
                      <button
                        onClick={() => handleQuickSwitchRole("guest")}
                        className={`py-1 rounded text-center font-semibold transition ${!currentUser ? "bg-[#718FBF] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"}`}
                      >
                        Guest
                      </button>
                      <button
                        onClick={() => handleQuickSwitchRole("free")}
                        className={`py-1 rounded text-center font-semibold transition ${currentUser?.tier === "free" && currentUser?.role !== "admin" ? "bg-[#718FBF] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200"}`}
                      >
                        Free
                      </button>
                      <button
                        onClick={() => handleQuickSwitchRole("premium")}
                        className={`py-1 rounded text-center font-semibold transition ${currentUser?.tier === "premium" && currentUser?.role !== "admin" ? "bg-[#718FBF] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200"}`}
                      >
                        Prem
                      </button>
                      <button
                        onClick={() => handleQuickSwitchRole("admin")}
                        className={`py-1 rounded text-center font-semibold transition ${currentUser?.role === "admin" ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200"}`}
                      >
                        Admin
                      </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => handleQuickSwitchRole("guest")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsRegister(false);
                  setShowAuthModal(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-1.8 bg-gradient-to-r from-[#718FBF] to-[#5A7AA3] text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all duration-150"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border transition-all duration-300 ${
              theme === "dark"
                ? "bg-[#2D2E30] border-gray-700 text-white"
                : "bg-white border-gray-100 text-[#1E293B]"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-[#718FBF]" />
                {isRegister ? "Create Free Account" : "Welcome Back"}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {isRegister
                ? "Join today to access premium, high-speed multi-file compression, secure storage, and cross-device historical sync."
                : "Sign in to access your recently compressed files and personal preferences."}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#718FBF] ${
                    theme === "dark"
                      ? "bg-[#1E1F21] border-gray-600 text-white"
                      : "bg-white border-gray-200 text-slate-800"
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#718FBF] hover:bg-[#5A7AA3] text-white font-semibold text-sm transition shadow-md"
              >
                {isRegister ? "Register and Continue" : "Sign In"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-[#718FBF] hover:underline font-medium"
              >
                {isRegister
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
