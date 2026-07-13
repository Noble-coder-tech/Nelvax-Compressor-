import type {
  CompressedFile,
  UserAccount,
  SupportRequest,
  CompressionLimits,
} from "../types";

export interface SystemLog {
  id: string;
  timestamp: string;
  email: string;
  action: string;
  status: "success" | "warning" | "info";
  details: string;
}

export interface AdminSettings {
  limits: CompressionLimits;
  queueStatus: "idle" | "processing" | "congested";
}

const DEFAULT_LIMITS: CompressionLimits = {
  freeMaxUploadSize: 50, // MB
  premiumMaxUploadSize: 1000, // MB
  freeStorageDurationDays: 3,
  premiumStorageDurationDays: 30,
  freeDailyLimit: 10,
  premiumDailyLimit: 150,
};

const INITIAL_USERS: UserAccount[] = [
  {
    id: "usr-1",
    email: "alex.jones@gmail.com",
    tier: "premium",
    role: "user",
    registeredAt: "2026-05-15T10:30:00Z",
    filesCompressedCount: 142,
    storageUsed: 1450000000,
  },
  {
    id: "usr-2",
    email: "ashdev.inovate@gmail.com",
    tier: "premium",
    role: "admin",
    registeredAt: "2026-06-01T08:00:00Z",
    filesCompressedCount: 382,
    storageUsed: 3890000000,
  },
  {
    id: "usr-3",
    email: "sara.smith@yahoo.com",
    tier: "free",
    role: "user",
    registeredAt: "2026-07-01T14:22:00Z",
    filesCompressedCount: 12,
    storageUsed: 120000000,
  },
  {
    id: "usr-4",
    email: "michael.brown@outlook.com",
    tier: "free",
    role: "user",
    registeredAt: "2026-07-10T11:45:00Z",
    filesCompressedCount: 3,
    storageUsed: 35000000,
  },
  {
    id: "usr-5",
    email: "emma.watson@icloud.com",
    tier: "premium",
    role: "user",
    registeredAt: "2026-07-11T02:15:00Z",
    filesCompressedCount: 18,
    storageUsed: 560000000,
  },
];

const INITIAL_SUPPORT_REQUESTS: SupportRequest[] = [
  {
    id: "sup-1",
    email: "sara.smith@yahoo.com",
    subject: "SVG Compression quality query",
    message:
      "I noticed some curves in my SVG got simplified when compressed at Maximum Compression. Is there any way to keep vector paths 100% intact?",
    status: "pending",
    timestamp: "2026-07-11T03:40:00Z",
  },
  {
    id: "sup-2",
    email: "alex.jones@gmail.com",
    subject: "Extended storage activation",
    message:
      "Hello! I updated to premium yesterday. Will my previously compressed files also stay in my account for 30 days instead of 3 days?",
    status: "resolved",
    timestamp: "2026-07-10T16:12:00Z",
  },
];

const INITIAL_FILES = (userIds: string[]): CompressedFile[] => [
  {
    id: "file-1",
    name: "summer_beach_photo.jpg",
    originalSize: 5400000, // 5.15 MB
    compressedSize: 1120000, // 1.07 MB
    percentageSaved: 79,
    fileType: "image",
    format: "jpg",
    compressedUrl: "#",
    timestamp: "2026-07-11T06:45:00Z",
    isFavorite: true,
    compressionLevel: "balanced",
    status: "completed",
    downloadName: "summer_beach_photo_optimized.jpg",
    userId: userIds[1], // ashdev
  },
  {
    id: "file-2",
    name: "project_pitch_presentation.pptx",
    originalSize: 24500000, // 23.36 MB
    compressedSize: 8400000, // 8.01 MB
    percentageSaved: 66,
    fileType: "document",
    format: "pptx",
    compressedUrl: "#",
    timestamp: "2026-07-11T05:30:00Z",
    isFavorite: false,
    compressionLevel: "high",
    status: "completed",
    downloadName: "project_pitch_presentation_compressed.pptx",
    userId: userIds[1], // ashdev
  },
  {
    id: "file-3",
    name: "quarterly_marketing_recap.mp4",
    originalSize: 154000000, // 146.87 MB
    compressedSize: 42300000, // 40.34 MB
    percentageSaved: 72,
    fileType: "video",
    format: "mp4",
    compressedUrl: "#",
    timestamp: "2026-07-10T18:20:00Z",
    isFavorite: true,
    compressionLevel: "max",
    status: "completed",
    downloadName: "quarterly_marketing_recap_compressed.mp4",
    userId: userIds[1], // ashdev
  },
  {
    id: "file-4",
    name: "podcast_episode_12.wav",
    originalSize: 88200000, // 84.11 MB
    compressedSize: 26400000, // 25.18 MB
    percentageSaved: 70,
    fileType: "audio",
    format: "wav",
    compressedUrl: "#",
    timestamp: "2026-07-10T09:12:00Z",
    isFavorite: false,
    compressionLevel: "balanced",
    status: "completed",
    downloadName: "podcast_episode_12_compressed.wav",
    userId: userIds[0], // alex.jones
  },
  {
    id: "file-5",
    name: "confidential_contract_v2.pdf",
    originalSize: 12400000, // 11.83 MB
    compressedSize: 4100000, // 3.91 MB
    percentageSaved: 67,
    fileType: "document",
    format: "pdf",
    compressedUrl: "#",
    timestamp: "2026-07-09T14:05:00Z",
    isFavorite: false,
    compressionLevel: "balanced",
    status: "completed",
    downloadName: "confidential_contract_v2_optimized.pdf",
    userId: userIds[2], // sara.smith
  },
  {
    id: "file-6",
    name: "website_assets_backup.zip",
    originalSize: 342000000, // 326.16 MB
    compressedSize: 256000000, // 244.14 MB
    percentageSaved: 25,
    fileType: "archive",
    format: "zip",
    compressedUrl: "#",
    timestamp: "2026-07-08T11:55:00Z",
    isFavorite: false,
    compressionLevel: "balanced",
    status: "completed",
    downloadName: "website_assets_backup_optimized.zip",
    userId: userIds[0], // alex.jones
  },
];

const INITIAL_LOGS: SystemLog[] = [
  {
    id: "log-1",
    timestamp: "2026-07-11T06:45:00Z",
    email: "ashdev.inovate@gmail.com",
    action: "COMPRESS_FILE",
    status: "success",
    details: "summer_beach_photo.jpg (5.15 MB) optimized to 1.07 MB",
  },
  {
    id: "log-2",
    timestamp: "2026-07-11T05:30:00Z",
    email: "ashdev.inovate@gmail.com",
    action: "COMPRESS_FILE",
    status: "success",
    details: "project_pitch_presentation.pptx (23.36 MB) optimized to 8.01 MB",
  },
  {
    id: "log-3",
    timestamp: "2026-07-11T03:40:00Z",
    email: "sara.smith@yahoo.com",
    action: "SUBMIT_SUPPORT",
    status: "info",
    details: "Created support ticket regarding SVG compression quality",
  },
  {
    id: "log-4",
    timestamp: "2026-07-11T02:15:00Z",
    email: "emma.watson@icloud.com",
    action: "REGISTER",
    status: "success",
    details: "New user registered. Subscribed to Premium Tier",
  },
  {
    id: "log-5",
    timestamp: "2026-07-11T01:50:00Z",
    email: "michael.brown@outlook.com",
    action: "LOGIN",
    status: "info",
    details: "User logged in successfully",
  },
  {
    id: "log-6",
    timestamp: "2026-07-10T22:30:00Z",
    email: "system@opticompress.io",
    action: "PURGE_FILES",
    status: "warning",
    details:
      "Auto-deleted 14 temporary expired files (storage limit reached for Free Tier)",
  },
];

export class MockStorage {
  static init() {
    if (!localStorage.getItem("oc_users")) {
      localStorage.setItem("oc_users", JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem("oc_files")) {
      const userIds = INITIAL_USERS.map((u) => u.id);
      localStorage.setItem("oc_files", JSON.stringify(INITIAL_FILES(userIds)));
    }
    if (!localStorage.getItem("oc_support")) {
      localStorage.setItem(
        "oc_support",
        JSON.stringify(INITIAL_SUPPORT_REQUESTS),
      );
    }
    if (!localStorage.getItem("oc_logs")) {
      localStorage.setItem("oc_logs", JSON.stringify(INITIAL_LOGS));
    }
    if (!localStorage.getItem("oc_limits")) {
      localStorage.setItem("oc_limits", JSON.stringify(DEFAULT_LIMITS));
    }
    if (!localStorage.getItem("oc_queue_status")) {
      localStorage.setItem("oc_queue_status", "idle");
    }
    // Set a default logged in user if not exists
    if (!localStorage.getItem("oc_current_user")) {
      // Default to guest or ashdev (for immediate full functionality testing, let's default to ashdev)
      localStorage.setItem("oc_current_user", JSON.stringify(INITIAL_USERS[1]));
    }
  }

  static getUsers(): UserAccount[] {
    this.init();
    return JSON.parse(localStorage.getItem("oc_users") || "[]");
  }

  static setUsers(users: UserAccount[]) {
    localStorage.setItem("oc_users", JSON.stringify(users));
  }

  static getFiles(): CompressedFile[] {
    this.init();
    return JSON.parse(localStorage.getItem("oc_files") || "[]");
  }

  static setFiles(files: CompressedFile[]) {
    localStorage.setItem("oc_files", JSON.stringify(files));
  }

  static getSupportRequests(): SupportRequest[] {
    this.init();
    return JSON.parse(localStorage.getItem("oc_support") || "[]");
  }

  static setSupportRequests(reqs: SupportRequest[]) {
    localStorage.setItem("oc_support", JSON.stringify(reqs));
  }

  static getLogs(): SystemLog[] {
    this.init();
    return JSON.parse(localStorage.getItem("oc_logs") || "[]");
  }

  static setLogs(logs: SystemLog[]) {
    localStorage.setItem("oc_logs", JSON.stringify(logs));
  }

  static getLimits(): CompressionLimits {
    this.init();
    return JSON.parse(
      localStorage.getItem("oc_limits") || JSON.stringify(DEFAULT_LIMITS),
    );
  }

  static setLimits(limits: CompressionLimits) {
    localStorage.setItem("oc_limits", JSON.stringify(limits));
    this.addLog(
      "system@opticompress.io",
      "UPDATE_LIMITS",
      "success",
      `Compression limits updated by administrator`,
    );
  }

  static getQueueStatus(): "idle" | "processing" | "congested" {
    return (localStorage.getItem("oc_queue_status") as any) || "idle";
  }

  static setQueueStatus(status: "idle" | "processing" | "congested") {
    localStorage.setItem("oc_queue_status", status);
  }

  static getCurrentUser(): UserAccount | null {
    const userStr = localStorage.getItem("oc_current_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  static setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem("oc_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("oc_current_user");
    }
  }

  static addLog(
    email: string,
    action: string,
    status: "success" | "warning" | "info",
    details: string,
  ) {
    const logs = this.getLogs();
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      email,
      action,
      status,
      details,
    };
    logs.unshift(newLog);
    // Keep max 100 logs
    localStorage.setItem("oc_logs", JSON.stringify(logs.slice(0, 100)));
  }
}
