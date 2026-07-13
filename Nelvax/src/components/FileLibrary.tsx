import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Download,
  Edit2,
  Check,
  X,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Calendar,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";
import type { CompressedFile, UserAccount } from "../types";
import { MockStorage } from "../utils/mockData";
import { generateMockDownloadBlob } from "../utils/compression";

interface FileLibraryProps {
  currentUser: UserAccount | null;
  theme: "light" | "dark";
  refreshTrigger: number;
}

export default function FileLibrary({
  currentUser,
  theme,
  refreshTrigger,
}: FileLibraryProps) {
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "size-saved" | "original-size">(
    "date",
  );

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reset selection when search/filter/sort changes
  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, categoryFilter, sortBy]);

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Load files from storage
  const loadFiles = () => {
    const allFiles = MockStorage.getFiles();
    // Filter to current logged-in user or guest session
    const currentUserId = currentUser ? currentUser.id : "guest-session";
    const userFiles = allFiles.filter((f) => f.userId === currentUserId);
    setFiles(userFiles);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (visibleFiles: CompressedFile[]) => {
    const visibleIds = visibleFiles.map((f) => f.id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedIds.includes(id),
    );

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const newSelections = [...prev];
        visibleIds.forEach((id) => {
          if (!newSelections.includes(id)) {
            newSelections.push(id);
          }
        });
        return newSelections;
      });
    }
  };

  const handleBatchDownload = (visibleFiles: CompressedFile[]) => {
    const selectedVisible = visibleFiles.filter((f) =>
      selectedIds.includes(f.id),
    );
    if (selectedVisible.length === 0) return;

    selectedVisible.forEach((file, index) => {
      setTimeout(() => {
        const hasDownloadBlob =
          file.compressedUrl && file.compressedUrl !== "#";
        const realDownloadUrl = hasDownloadBlob
          ? file.compressedUrl
          : generateMockDownloadBlob(file.name, file.compressedSize);

        const link = document.createElement("a");
        link.href = realDownloadUrl;
        link.download = file.downloadName || file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 250);
    });

    MockStorage.addLog(
      currentUser?.email || "guest@opticompress.io",
      "BATCH_DOWNLOAD",
      "success",
      `Batch downloaded ${selectedVisible.length} files`,
    );
  };

  const handleBatchDelete = (visibleFiles: CompressedFile[]) => {
    const selectedVisibleIds = visibleFiles
      .filter((f) => selectedIds.includes(f.id))
      .map((f) => f.id);
    if (selectedVisibleIds.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to permanently delete the ${selectedVisibleIds.length} selected files from your archive?`,
      )
    )
      return;

    const allFiles = MockStorage.getFiles();
    const filtered = allFiles.filter((f) => !selectedVisibleIds.includes(f.id));
    MockStorage.setFiles(filtered);

    MockStorage.addLog(
      currentUser?.email || "guest@opticompress.io",
      "BATCH_DELETE",
      "warning",
      `Deleted ${selectedVisibleIds.length} files via batch deletion`,
    );

    setSelectedIds((prev) =>
      prev.filter((id) => !selectedVisibleIds.includes(id)),
    );
    loadFiles();
  };

  useEffect(() => {
    loadFiles();
  }, [currentUser, refreshTrigger]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return <FileImage className="h-5 w-5 text-[#718FBF]" />;
      case "video":
        return <FileVideo className="h-5 w-5 text-indigo-400" />;
      case "audio":
        return <FileAudio className="h-5 w-5 text-emerald-400" />;
      case "document":
        return <FileText className="h-5 w-5 text-amber-400" />;
      default:
        return <FileArchive className="h-5 w-5 text-purple-400" />;
    }
  };

  // Rename action
  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const saveRename = (id: string) => {
    if (!renameValue.trim()) return;
    const allFiles = MockStorage.getFiles();
    const updated = allFiles.map((f) => {
      if (f.id === id) {
        MockStorage.addLog(
          currentUser?.email || "guest@opticompress.io",
          "RENAME_FILE",
          "success",
          `Renamed file from "${f.name}" to "${renameValue}"`,
        );
        return {
          ...f,
          name: renameValue,
          downloadName: renameValue.includes(".")
            ? renameValue
            : `${renameValue}.${f.format}`,
        };
      }
      return f;
    });
    MockStorage.setFiles(updated);
    setRenamingId(null);
    loadFiles();
  };

  // Delete file from library
  const handleDelete = (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${name}" from your cloud archive?`,
      )
    )
      return;

    const allFiles = MockStorage.getFiles();
    const filtered = allFiles.filter((f) => f.id !== id);
    MockStorage.setFiles(filtered);

    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

    MockStorage.addLog(
      currentUser?.email || "guest@opticompress.io",
      "DELETE_FILE",
      "warning",
      `Deleted file "${name}" from historical archive`,
    );

    loadFiles();
  };

  // Calculate file deletion date based on limits
  const getExpirationText = (timestampStr: string) => {
    const durationDays = currentUser?.tier === "premium" ? 30 : 3;
    const createdDate = new Date(timestampStr);
    const expDate = new Date(
      createdDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );
    const diffMs = expDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired soon";
    return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  // Filter and sort computation
  const filteredFiles = files
    .filter((file) => {
      const matchesSearch =
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.format.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || file.fileType === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      if (sortBy === "size-saved") {
        return (
          b.originalSize -
          b.compressedSize -
          (a.originalSize - a.compressedSize)
        );
      }
      if (sortBy === "original-size") {
        return b.originalSize - a.originalSize;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header section with Stats counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-2">
            My File Library
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#718FBF]/20 text-[#718FBF]">
              {files.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Access, download or rename files recently compressed in this
            session.
          </p>
        </div>

        {/* Storage Tier duration warning banner */}
        <div
          className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs ${
            currentUser?.tier === "premium"
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
          }`}
        >
          <Clock className="h-4 w-4" />
          <div>
            <span className="font-semibold block">
              {currentUser?.tier === "premium"
                ? "Premium 30-Day Storage Active"
                : "Free 3-Day Limit Active"}
            </span>
            <span className="opacity-80">
              {currentUser?.tier === "premium"
                ? "Your optimized files are safe with us"
                : "Upgrade to keep files for 30 days."}
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter and Sort bar */}
      <div
        className={`p-4 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-3.5 ${
          theme === "dark"
            ? "bg-[#2D2E30]/40 border-gray-700"
            : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files by name, type, extension..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3.5 py-1.8 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#718FBF] ${
              theme === "dark"
                ? "bg-[#1E1F21] border border-gray-600 text-white"
                : "bg-gray-50 border border-slate-200"
            }`}
          />
        </div>

        {/* Category Filters */}
        <div className="md:col-span-4 flex gap-1 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-2.5 py-1.2 rounded-lg text-[11px] font-semibold transition ${
              categoryFilter === "all"
                ? "bg-[#718FBF] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          {["image", "video", "audio", "document", "archive"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1.2 rounded-lg text-[11px] font-semibold transition capitalize ${
                categoryFilter === cat
                  ? "bg-[#718FBF] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat}s
            </button>
          ))}
        </div>

        {/* Sorting & Filter */}
        <div className="md:col-span-4 flex items-center justify-between sm:justify-end gap-3">
          {/* Sort selection */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className={`px-2 py-1.2 rounded-lg border text-xs focus:outline-none ${
                theme === "dark"
                  ? "bg-[#1E1F21] border-gray-600 text-white"
                  : "bg-white border-slate-200"
              }`}
            >
              <option value="date">Newest First</option>
              <option value="size-saved">Most Space Saved</option>
              <option value="original-size">Largest Original</option>
            </select>
          </div>
        </div>
      </div>

      {/* Library Grid rendering */}
      {filteredFiles.length === 0 ? (
        <div
          className={`p-12 text-center rounded-3xl border ${
            theme === "dark"
              ? "bg-[#2D2E30]/40 border-gray-700"
              : "bg-white border-slate-100"
          }`}
        >
          <Search className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h4 className="font-display font-semibold text-base text-gray-800 dark:text-white">
            No compressed files found
          </h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
            {searchQuery || categoryFilter !== "all"
              ? "Try modifying your search keywords or adjusting the file status filters."
              : "You have not compressed any files in this session yet. Upload a file above to get started!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk selection controls toolbar */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300 ${
              theme === "dark"
                ? "bg-[#2D2E30]/60 border-gray-700/80"
                : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleSelectAll(filteredFiles)}
                className="flex items-center justify-center p-1 rounded-lg text-gray-400 hover:text-[#718FBF] hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                title={
                  filteredFiles.every((f) => selectedIds.includes(f.id))
                    ? "Deselect all visible files"
                    : "Select all visible files"
                }
              >
                {filteredFiles.every((f) => selectedIds.includes(f.id)) ? (
                  <CheckSquare className="h-5 w-5 text-[#718FBF]" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {selectedIds.length > 0
                  ? `Selected ${selectedIds.filter((id) => filteredFiles.some((f) => f.id === id)).length} of ${filteredFiles.length} files`
                  : "Select files for bulk operations"}
              </span>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleBatchDownload(filteredFiles)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.8 bg-[#718FBF]/10 text-[#718FBF] hover:bg-[#718FBF] hover:text-white font-bold rounded-xl transition text-xs cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Batch Download</span>
                </button>
                <button
                  onClick={() => handleBatchDelete(filteredFiles)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.8 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl transition text-xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Batch Delete</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFiles.map((file) => {
              const hasDownloadBlob =
                file.compressedUrl && file.compressedUrl !== "#";
              const realDownloadUrl = hasDownloadBlob
                ? file.compressedUrl
                : generateMockDownloadBlob(file.name, file.compressedSize);
              const isSelected = selectedIds.includes(file.id);

              return (
                <div
                  key={file.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative group flex flex-col justify-between ${
                    isSelected
                      ? theme === "dark"
                        ? "bg-[#718FBF]/10 border-[#718FBF]/60"
                        : "bg-[#718FBF]/5 border-[#718FBF]/60 shadow-md"
                      : theme === "dark"
                        ? "bg-[#2D2E30]/60 border-gray-700/80 hover:border-[#718FBF]/40 hover:bg-[#2D2E30]/85"
                        : "bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#718FBF]/40 hover:bg-slate-50/20"
                  }`}
                >
                  {/* Header card info */}
                  <div>
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        {/* Checkbox button */}
                        <button
                          onClick={() => toggleSelect(file.id)}
                          className="flex items-center justify-center text-gray-400 hover:text-[#718FBF] transition cursor-pointer"
                          title={isSelected ? "Deselect file" : "Select file"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-[#718FBF]" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500" />
                          )}
                        </button>

                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
                          {getFileIcon(file.fileType)}
                        </div>

                        {/* Name editing row */}
                        {renamingId === file.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className={`px-2 py-1 rounded text-xs border focus:outline-none focus:ring-1 focus:ring-[#718FBF] ${
                                theme === "dark"
                                  ? "bg-[#1E1F21] text-white border-gray-600"
                                  : "bg-white text-slate-800 border-slate-300"
                              }`}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRename(file.id);
                                if (e.key === "Escape") setRenamingId(null);
                              }}
                            />
                            <button
                              onClick={() => saveRename(file.id)}
                              className="p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              className="p-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 group/name">
                              <h4
                                className="text-sm font-semibold truncate max-w-[130px] sm:max-w-[170px] text-gray-900 dark:text-white"
                                title={file.name}
                              >
                                {file.name}
                              </h4>
                              <button
                                onClick={() => startRename(file.id, file.name)}
                                className="p-1 rounded opacity-0 group-hover/name:opacity-100 transition text-gray-400 hover:text-[#718FBF]"
                                title="Rename File"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-[10px] uppercase font-mono text-[#718FBF] font-semibold">
                              {file.format} format
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right side actions: Expire status & Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                          title="Delete permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Size reduction metrics display */}
                    <div className="mt-4 grid grid-cols-3 gap-2 py-2 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">
                          Original
                        </span>
                        <span className="font-semibold text-gray-700 dark:text-slate-300">
                          {formatSize(file.originalSize)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">
                          Compressed
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatSize(file.compressedSize)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#718FBF] block text-[10px]">
                          Saved
                        </span>
                        <span className="font-bold text-[#718FBF] flex items-center justify-end gap-0.5">
                          {file.percentageSaved}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card footer details & Re-download */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{getExpirationText(file.timestamp)}</span>
                    </div>

                    <a
                      href={realDownloadUrl}
                      download={file.downloadName}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#718FBF]/10 text-[#718FBF] hover:bg-[#718FBF] hover:text-white font-bold rounded-xl transition"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
