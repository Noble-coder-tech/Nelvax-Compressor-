import { useState, useRef } from "react";
import type { MouseEvent, DragEvent } from "react";
import {
  Upload,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  RefreshCw,
  Clock,
  Download,
  Crown,
  X,
  LayoutGrid,
  Columns,
  Minimize2,
  Sliders,
} from "lucide-react";
import type { UserAccount, CompressionLevel, CompressedFile } from "../types";
import { MockStorage } from "../utils/mockData";
import {
  compressImageFile,
  compressTextToZip,
  simulateCompressionResult,
  generateMockDownloadBlob,
  getFileCategory,
  getTargetFormat,
} from "../utils/compression";

interface CompressorDashboardProps {
  currentUser: UserAccount | null;
  theme: "light" | "dark";
  onFileSaved: () => void;
}

interface ActiveCompression {
  id: string;
  file: File;
  name: string;
  size: number;
  category: "image" | "video" | "audio" | "document" | "archive";
  level: CompressionLevel;
  progress: number;
  stage: "uploading" | "processing" | "completed" | "failed";
  statusText: string;
  estRemainingSeconds: number;
  originalSizeText: string;
  compressedSize: number;
  percentageSaved: number;
  downloadUrl: string;
  error?: string;
  advancedSettings?: {
    formatOverride: string;
    preserveMetadata: boolean;
    resizeWidth?: number;
  };
}

export default function CompressorDashboard({
  currentUser,
  theme,
  onFileSaved,
}: CompressorDashboardProps) {
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("balanced");
  const [compressions, setCompressions] = useState<ActiveCompression[]>([]);
  const [stagedFiles, setStagedFiles] = useState<
    {
      id: string;
      file: File;
      name: string;
      size: number;
      category: "image" | "video" | "audio" | "document" | "archive";
      originalSizeText: string;
    }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"classic" | "split" | "compact">(
    "classic",
  );

  // Advanced settings state
  const [formatOverride, setFormatOverride] = useState<string>("original");
  const [preserveMetadata, setPreserveMetadata] = useState<boolean>(true);
  const [audioBitrate, setAudioBitrate] = useState<string>("192");
  const [videoResolution, setVideoResolution] = useState<string>("1080");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage and limit configuration
  const limits = MockStorage.getLimits();
  const currentMaxUpload =
    currentUser?.tier === "premium"
      ? limits.premiumMaxUploadSize
      : limits.freeMaxUploadSize;

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return <FileImage className="h-8 w-8 text-[#718FBF]" />;
      case "video":
        return <FileVideo className="h-8 w-8 text-indigo-400" />;
      case "audio":
        return <FileAudio className="h-8 w-8 text-emerald-400" />;
      case "document":
        return <FileText className="h-8 w-8 text-amber-400" />;
      default:
        return <Archive className="h-8 w-8 text-purple-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const processUpload = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    // Check batch compression restriction for free users
    const existingCount = stagedFiles.length;
    const incomingCount = filesList.length;
    if (
      existingCount + incomingCount > 1 &&
      (!currentUser || currentUser.tier !== "premium")
    ) {
      alert(
        "⚠️ Batch compression is a premium-only feature. Please sign in with a Premium account (or use the role switcher above) to optimize multiple files at once.",
      );
      return;
    }

    const newStaged: typeof stagedFiles = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > currentMaxUpload) {
        alert(
          `❌ File "${file.name}" is too large (${fileSizeMB.toFixed(1)}MB). The limit is ${currentMaxUpload}MB for your account level.`,
        );
        continue;
      }

      const category = getFileCategory(file.name);
      const id = `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      newStaged.push({
        id,
        file,
        name: file.name,
        size: file.size,
        category,
        originalSizeText: formatSize(file.size),
      });
    }

    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
    }
  };

  const removeStagedFile = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const runCompressor = () => {
    if (stagedFiles.length === 0) return;

    const newCompressions: ActiveCompression[] = stagedFiles.map((item) => ({
      id: item.id,
      file: item.file,
      name: item.name,
      size: item.size,
      category: item.category,
      level: compressionLevel,
      progress: 0,
      stage: "uploading",
      statusText: "Preparing secure upload...",
      estRemainingSeconds: 5,
      originalSizeText: item.originalSizeText,
      compressedSize: 0,
      percentageSaved: 0,
      downloadUrl: "",
      advancedSettings: {
        formatOverride,
        preserveMetadata,
      },
    }));

    setStagedFiles([]);
    setCompressions((prev) => [...newCompressions, ...prev]);
    newCompressions.forEach((item) => triggerCompressionFlow(item));
  };

  const triggerCompressionFlow = async (item: ActiveCompression) => {
    // 1. Simulating uploading process
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Move to processing stage
        setCompressions((prev) =>
          prev.map((c) =>
            c.id === item.id
              ? {
                  ...c,
                  progress: 0,
                  stage: "processing",
                  statusText: "Optimizing and compressing file buffers...",
                  estRemainingSeconds: 3,
                }
              : c,
          ),
        );

        // Start processing logic
        try {
          let downloadUrl = "";
          let compressedSize = 0;
          let percentSaved = 0;

          // Perform actual or simulated compression
          if (item.category === "image") {
            const result = await compressImageFile(item.file, item.level);
            downloadUrl = result.url;
            compressedSize = result.size;
            percentSaved = Math.round(
              ((item.size - compressedSize) / item.size) * 100,
            );
          } else if (
            item.category === "document" &&
            item.file.name.toLowerCase().endsWith(".txt")
          ) {
            const result = await compressTextToZip(item.file);
            downloadUrl = result.url;
            compressedSize = result.size;
            percentSaved = Math.round(
              ((item.size - compressedSize) / item.size) * 100,
            );
          } else {
            // Simulated compression for larger formats (video, audio, high-density archives/documents)
            // Still generates a real downloadable log file describing the completed operation
            const res = simulateCompressionResult(
              item.name,
              item.size,
              item.level,
            );
            compressedSize = res.size;
            percentSaved = res.percent;
            downloadUrl = generateMockDownloadBlob(item.name, compressedSize);
          }

          // Simulate processing progress bar counting up to 100%
          let processProgress = 0;
          const speedMultiplier = currentUser?.tier === "premium" ? 2.5 : 1.0; // Premium has faster speeds!

          const procInterval = setInterval(() => {
            processProgress +=
              Math.floor(Math.random() * 15) * speedMultiplier + 5;
            const estSeconds = Math.max(
              1,
              Math.round((100 - processProgress) / 25),
            );
            if (processProgress >= 100) {
              processProgress = 100;
              clearInterval(procInterval);

              // Update compression item as fully completed
              setCompressions((prev) =>
                prev.map((c) =>
                  c.id === item.id
                    ? {
                        ...c,
                        progress: 100,
                        stage: "completed",
                        statusText: `Compression complete! Saved ${percentSaved}%`,
                        estRemainingSeconds: 0,
                        compressedSize,
                        percentageSaved: percentSaved,
                        downloadUrl,
                      }
                    : c,
                ),
              );

              // Store completed file into history database
              saveToLibrary(item, compressedSize, percentSaved, downloadUrl);
            } else {
              setCompressions((prev) =>
                prev.map((c) =>
                  c.id === item.id
                    ? {
                        ...c,
                        progress: Math.min(98, Math.round(processProgress)),
                        estRemainingSeconds: estSeconds,
                      }
                    : c,
                ),
              );
            }
          }, 200);
        } catch (err: any) {
          setCompressions((prev) =>
            prev.map((c) =>
              c.id === item.id
                ? {
                    ...c,
                    stage: "failed",
                    statusText: "Compression failed",
                    error:
                      err.message || "An error occurred during file rendering.",
                  }
                : c,
            ),
          );
          MockStorage.addLog(
            currentUser?.email || "guest@opticompress.io",
            "COMPRESS_FAILED",
            "warning",
            `Failed compressing "${item.name}": ${err.message || "Rendering error"}`,
          );
        }
      } else {
        // Update upload progress
        const estSec = Math.max(1, Math.round((100 - progress) / 15));
        setCompressions((prev) =>
          prev.map((c) =>
            c.id === item.id
              ? {
                  ...c,
                  progress,
                  statusText: `Uploading components... ${progress}%`,
                  estRemainingSeconds: estSec,
                }
              : c,
          ),
        );
      }
    }, 150);
  };

  const saveToLibrary = (
    item: ActiveCompression,
    compSize: number,
    pct: number,
    dUrl: string,
  ) => {
    const files = MockStorage.getFiles();
    const newFile: CompressedFile = {
      id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: item.name,
      originalSize: item.size,
      compressedSize: compSize,
      percentageSaved: pct,
      fileType: item.category,
      format: getTargetFormat(item.name),
      compressedUrl: dUrl,
      timestamp: new Date().toISOString(),
      isFavorite: false,
      compressionLevel: item.level,
      status: "completed",
      downloadName: `${item.name.substring(0, item.name.lastIndexOf("."))}_optimized.${getTargetFormat(item.name)}`,
      userId: currentUser?.id || "guest-session",
    };

    files.unshift(newFile);
    MockStorage.setFiles(files);

    // Increment stats for logged in users
    if (currentUser) {
      const users = MockStorage.getUsers();
      const updatedUsers = users.map((u) => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            filesCompressedCount: u.filesCompressedCount + 1,
            storageUsed: u.storageUsed + compSize,
          };
        }
        return u;
      });
      MockStorage.setUsers(updatedUsers);
    }

    MockStorage.addLog(
      currentUser?.email || "guest@opticompress.io",
      "COMPRESS_FILE",
      "success",
      `Compressed "${newFile.name}" (${formatSize(newFile.originalSize)}) down to ${formatSize(newFile.compressedSize)} (-${newFile.percentageSaved}%)`,
    );

    onFileSaved();
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processUpload(e.dataTransfer.files);
  };

  const triggerSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const clearCompressions = () => {
    setCompressions([]);
  };

  return (
    <div className="space-y-5">
      {/* Hero Header Section */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-gray-900 dark:text-white">
          Compress Files Instantly,{" "}
          <span className="text-[#718FBF]">Without Loss of Quality</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Secure, lighting-fast in-browser file compression. Compress
          high-resolution images, videos, audios, and documents in seconds.
        </p>
      </div>

      {/* Workspace Layout Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 max-w-4xl mx-auto pb-1 border-b border-gray-100 dark:border-gray-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Optimize Workspace Layout:
        </span>
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-[11px]">
          <button
            onClick={() => setLayoutMode("classic")}
            className={`py-1 px-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              layoutMode === "classic"
                ? "bg-white dark:bg-[#1E1F21] text-[#718FBF] shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Classic (8:4)</span>
          </button>
          <button
            onClick={() => setLayoutMode("split")}
            className={`py-1 px-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              layoutMode === "split"
                ? "bg-white dark:bg-[#1E1F21] text-[#718FBF] shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Split Panel (50:50)</span>
          </button>
          <button
            onClick={() => setLayoutMode("compact")}
            className={`py-1 px-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              layoutMode === "compact"
                ? "bg-white dark:bg-[#1E1F21] text-[#718FBF] shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Compact Column</span>
          </button>
        </div>
      </div>

      <div
        className={
          layoutMode === "compact"
            ? "max-w-2xl mx-auto space-y-4"
            : "grid grid-cols-1 lg:grid-cols-12 gap-5"
        }
        style={layoutMode !== "compact" ? { height: "476px" } : undefined}
      >
        {/* Left Column / First Section */}
        <div
          className={
            layoutMode === "compact"
              ? "space-y-4"
              : layoutMode === "split"
                ? "lg:col-span-6 space-y-4"
                : "lg:col-span-8 space-y-4"
          }
          style={
            layoutMode !== "compact"
              ? { height: "0px", overflow: "visible" }
              : undefined
          }
        >
          {/* Main Dropzone Container */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={
              layoutMode !== "compact"
                ? {
                    height: "476px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }
                : undefined
            }
            className={`relative border-2 border-dashed rounded-3xl p-5 sm:p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-[#718FBF] bg-[#718FBF]/5 scale-[0.99] shadow-inner"
                : theme === "dark"
                  ? "border-gray-700 bg-[#2D2E30]/60 hover:border-[#718FBF]/60"
                  : "border-slate-300 bg-gradient-to-b from-white to-[#f8fafc] hover:border-[#718FBF] hover:shadow-md"
            }`}
            onClick={triggerSelectFiles}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple={currentUser?.tier === "premium"}
              onChange={(e) => processUpload(e.target.files)}
              accept="image/*,video/*,audio/*,.pdf,.docx,.xlsx,.pptx,.txt,.zip,.rar"
            />

            <div className="max-w-md mx-auto space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#718FBF]/10 text-[#718FBF] flex items-center justify-center mx-auto shadow-inner transition-transform group-hover:scale-105 duration-300">
                <Upload className="h-5.5 w-5.5" />
              </div>

              <div className="space-y-1">
                <p className="font-display font-semibold text-base text-gray-900 dark:text-white">
                  Drag and drop files here, or{" "}
                  <span className="text-[#718FBF] underline decoration-wavy decoration-[#718FBF]/50">
                    browse local drive
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-400">
                  Supports Images, Videos, Audio, Documents (PDF/TXT), and
                  Archives (ZIP)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500 font-medium">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  Max: {currentMaxUpload} MB
                </span>
                {currentUser?.tier !== "premium" ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Single-file limit (Upgrade for
                    Batching)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center gap-1 font-semibold">
                    <Crown className="h-3 w-3 text-amber-400" /> Unlimited
                    Batching Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Staged Files ready for manual compression trigger */}
          {stagedFiles.length > 0 && (
            <div
              className={`rounded-3xl p-6 border transition duration-300 ${
                theme === "dark"
                  ? "bg-[#2D2E30]/50 border-gray-700"
                  : "bg-white border-slate-200/80 shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#718FBF] animate-pulse"></span>
                  Staged Files ({stagedFiles.length} ready)
                </h3>
                <button
                  onClick={() => setStagedFiles([])}
                  className="text-xs text-gray-400 hover:text-red-500 transition font-medium"
                >
                  Unstage All
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {stagedFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                      theme === "dark"
                        ? "bg-[#1E1F21] border-gray-700"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                        {getFileIcon(item.category)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[350px]">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Size: {item.originalSizeText}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => removeStagedFile(item.id, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                      title="Remove from staging"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Highly prominent action button to run the compressor explicitly */}
              <button
                onClick={runCompressor}
                className="w-full py-4 px-6 bg-[#718FBF] hover:bg-[#5A7AA3] text-white rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2.5 text-sm cursor-pointer"
              >
                <Zap className="h-4.5 w-4.5 fill-white" />
                <span>Run OptiCompress Engine</span>
              </button>
            </div>
          )}

          {/* Real-time Compression Queue Output */}
          {compressions.length > 0 && (
            <div
              className={`rounded-3xl p-6 border transition duration-300 ${
                theme === "dark"
                  ? "bg-[#2D2E30]/50 border-gray-700"
                  : "bg-white border-slate-100 shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="h-4.5 w-4.5 text-[#718FBF] animate-spin-slow" />
                  Processing Queue ({compressions.length} files)
                </h3>
                <button
                  onClick={clearCompressions}
                  className="text-xs text-gray-400 hover:text-[#718FBF] transition font-medium"
                >
                  Clear Queue
                </button>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {compressions.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 ${
                      item.stage === "completed"
                        ? theme === "dark"
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-emerald-50/50 border-emerald-100"
                        : theme === "dark"
                          ? "bg-[#1E1F21] border-gray-700"
                          : "bg-[#F8FAFC] border-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                          {getFileIcon(item.category)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span>{item.originalSizeText}</span>
                            <span>•</span>
                            <span className="capitalize font-semibold text-[#718FBF]">
                              {item.level} Compression
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Completed / Saved Indicator */}
                      {item.stage === "completed" && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            Saved {item.percentageSaved}%
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            Saved {formatSize(item.size - item.compressedSize)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress / Status Block */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          {item.stage === "uploading" && (
                            <Clock className="h-3.5 w-3.5 text-blue-400" />
                          )}
                          {item.stage === "processing" && (
                            <RefreshCw className="h-3.5 w-3.5 text-[#718FBF] animate-spin" />
                          )}
                          {item.stage === "completed" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {item.stage === "failed" && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <span className="font-medium text-gray-700 dark:text-slate-300">
                            {item.statusText}
                          </span>
                        </span>

                        {item.stage !== "completed" &&
                          item.stage !== "failed" && (
                            <span className="font-mono text-gray-400">
                              {item.estRemainingSeconds > 0
                                ? `Est. ${item.estRemainingSeconds}s remaining`
                                : "Finalizing..."}
                            </span>
                          )}
                      </div>

                      {/* Progress bar slider */}
                      {item.stage !== "completed" &&
                        item.stage !== "failed" && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#718FBF] to-[#5A7AA3] h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                      {/* Completion stats + Download Button */}
                      {item.stage === "completed" && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-gray-400 block">
                                Original
                              </span>
                              <span className="font-semibold">
                                {item.originalSizeText}
                              </span>
                            </div>
                            <div className="text-gray-300 dark:text-gray-700">
                              |
                            </div>
                            <div>
                              <span className="text-[#718FBF] block">
                                Compressed
                              </span>
                              <span className="font-semibold text-[#718FBF]">
                                {formatSize(item.compressedSize)}
                              </span>
                            </div>
                          </div>

                          <a
                            href={item.downloadUrl}
                            download={`${item.name.substring(0, item.name.lastIndexOf("."))}_optimized.${getTargetFormat(item.name)}`}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#718FBF] hover:bg-[#5A7AA3] text-white text-xs font-bold rounded-xl shadow-md transition-all"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Optimized</span>
                          </a>
                        </div>
                      )}

                      {item.stage === "failed" && (
                        <p className="text-xs text-red-500 font-medium">
                          Error: {item.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Compression Quality Settings */}
        <div
          className={
            layoutMode === "compact"
              ? "space-y-4"
              : layoutMode === "split"
                ? "lg:col-span-6 space-y-4"
                : "lg:col-span-4 space-y-4"
          }
        >
          {/* Card: Set Compression Level */}
          <div
            style={
              layoutMode !== "compact"
                ? { width: "321px", height: "476px" }
                : undefined
            }
            className={`rounded-3xl p-6 border transition duration-300 ${
              theme === "dark"
                ? "bg-[#2D2E30]/60 border-gray-700"
                : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-[#718FBF]" />
              Compression Strength
            </h3>

            <div className="space-y-3">
              {/* Option: High Quality */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  compressionLevel === "high"
                    ? "border-2 border-[#718FBF] bg-[#718FBF]/8"
                    : "border-slate-200 bg-white hover:border-[#718FBF] hover:bg-[#718FBF]/5 dark:border-gray-700/60 dark:bg-[#1E1F21] dark:hover:bg-gray-800"
                }`}
                onClick={() => setCompressionLevel("high")}
              >
                <input
                  type="radio"
                  name="level"
                  checked={compressionLevel === "high"}
                  onChange={() => setCompressionLevel("high")}
                  className="mt-1 accent-[#718FBF]"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold block text-gray-900 dark:text-white">
                    High Quality (Low compression)
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Prioritizes detail accuracy. Recommended for presentation
                    images, photography and brand vectors.
                  </span>
                </div>
              </label>

              {/* Option: Balanced */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  compressionLevel === "balanced"
                    ? "border-2 border-[#718FBF] bg-[#718FBF]/8"
                    : "border-slate-200 bg-white hover:border-[#718FBF] hover:bg-[#718FBF]/5 dark:border-gray-700/60 dark:bg-[#1E1F21] dark:hover:bg-gray-800"
                }`}
                onClick={() => setCompressionLevel("balanced")}
              >
                <input
                  type="radio"
                  name="level"
                  checked={compressionLevel === "balanced"}
                  onChange={() => setCompressionLevel("balanced")}
                  className="mt-1 accent-[#718FBF]"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold block text-gray-900 dark:text-white flex items-center gap-1.5">
                    Balanced Optimization
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#718FBF]/15 text-[#718FBF] font-extrabold uppercase">
                      Recommended
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Maintains human eye equivalence. Optimum ratio of size
                    reduction and high fidelity rendering.
                  </span>
                </div>
              </label>

              {/* Option: Maximum Compression */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  compressionLevel === "max"
                    ? "border-2 border-[#718FBF] bg-[#718FBF]/8"
                    : "border-slate-200 bg-white hover:border-[#718FBF] hover:bg-[#718FBF]/5 dark:border-gray-700/60 dark:bg-[#1E1F21] dark:hover:bg-gray-800"
                }`}
                onClick={() => setCompressionLevel("max")}
              >
                <input
                  type="radio"
                  name="level"
                  checked={compressionLevel === "max"}
                  onChange={() => setCompressionLevel("max")}
                  className="mt-1 accent-[#718FBF]"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold block text-gray-900 dark:text-white flex items-center gap-1.5">
                    Maximum Compression
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 font-extrabold uppercase">
                      Smallest Size
                    </span>
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Aggressive space saving. Best for emails, mobile
                    notifications, fast network load speeds.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Card: Advanced Configuration (Premium Teaser or Enabled) */}
          <div
            style={
              layoutMode !== "compact"
                ? {
                    width: "0px",
                    height: "0px",
                    padding: "0px",
                    border: "none",
                    overflow: "hidden",
                  }
                : undefined
            }
            className={`rounded-3xl p-6 border transition duration-300 relative overflow-hidden ${
              theme === "dark"
                ? "bg-[#2D2E30]/60 border-gray-700"
                : "bg-white border-slate-100 shadow-md"
            }`}
          >
            {/* Crown Premium Watermark if not premium */}
            {(!currentUser || currentUser.tier !== "premium") && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
                <Crown className="h-8 w-8 text-amber-400 mb-2 animate-bounce-slow" />
                <h4 className="font-display font-bold text-sm text-white">
                  Advanced Settings
                </h4>
                <p className="text-[11px] text-gray-300 max-w-[220px] mb-3 mt-1 leading-relaxed">
                  Format conversion, metadata protection, custom resolutions,
                  and faster engine speeds.
                </p>
                <button
                  onClick={() => {
                    const users = MockStorage.getUsers();
                    let updatedUser;
                    if (currentUser) {
                      const updated = users.map((u) =>
                        u.id === currentUser.id
                          ? { ...u, tier: "premium" as const }
                          : u,
                      );
                      MockStorage.setUsers(updated);
                      updatedUser = {
                        ...currentUser,
                        tier: "premium" as const,
                      };
                    } else {
                      // Guest upgrade
                      updatedUser = {
                        id: "usr-trial",
                        email: "trial.member@opticompress.io",
                        tier: "premium" as const,
                        role: "user" as const,
                        registeredAt: new Date().toISOString(),
                        filesCompressedCount: 0,
                        storageUsed: 0,
                      };
                      MockStorage.setUsers([...users, updatedUser]);
                    }
                    MockStorage.setCurrentUser(updatedUser);
                    window.location.reload(); // Refresh to propagate state
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-[#718FBF] text-white text-[11px] font-extrabold rounded-xl shadow-lg hover:opacity-90 transition"
                >
                  Unlock with Free Trial
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3
                style={
                  layoutMode !== "compact"
                    ? { width: "1000px", height: "487px" }
                    : undefined
                }
                className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2"
              >
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                Advanced Compression
              </h3>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Crown className="h-3 w-3" /> PRO
              </span>
            </div>

            <div className="space-y-4 text-sm text-gray-600 dark:text-slate-300">
              {/* Setting 1: Export Format */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  Target Export Format
                </label>
                <select
                  value={formatOverride}
                  onChange={(e) => setFormatOverride(e.target.value)}
                  className={`w-full px-3 py-1.8 rounded-xl text-xs border focus:outline-none ${
                    theme === "dark"
                      ? "bg-[#1E1F21] border-gray-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <option value="original">Keep Original Format</option>
                  <option value="webp">Convert to WebP (Optimized)</option>
                  <option value="jpg">Convert to JPEG (Compatible)</option>
                  <option value="png">Convert to PNG (Lossless)</option>
                </select>
              </div>

              {/* Setting 2: Preserve EXIF Metadata */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-semibold block text-gray-800 dark:text-white">
                    Preserve EXIF Metadata
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    Retain camera tags, GPS position, and dates.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preserveMetadata}
                  onChange={(e) => setPreserveMetadata(e.target.checked)}
                  className="h-4 w-4 rounded text-[#718FBF] focus:ring-[#718FBF]"
                />
              </div>

              {/* Setting 3: Audio/Video custom overrides */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wide">
                    Audio Bitrate
                  </label>
                  <select
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-xl text-[11px] border focus:outline-none ${
                      theme === "dark"
                        ? "bg-[#1E1F21] border-gray-600"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <option value="128">128 kbps (Light)</option>
                    <option value="192">192 kbps (Medium)</option>
                    <option value="320">320 kbps (High-Fi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wide">
                    Video Resolution
                  </label>
                  <select
                    value={videoResolution}
                    onChange={(e) => setVideoResolution(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-xl text-[11px] border focus:outline-none ${
                      theme === "dark"
                        ? "bg-[#1E1F21] border-gray-600"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <option value="720">720p (HD Mobile)</option>
                    <option value="1080">1080p (Full HD)</option>
                    <option value="original">Original Size</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
