export type CompressionLevel = 'high' | 'balanced' | 'max';

export interface CompressedFile {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  percentageSaved: number;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'archive';
  format: string;
  compressedUrl: string;
  timestamp: string;
  isFavorite: boolean;
  compressionLevel: CompressionLevel;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
  downloadName: string;
  userId: string;
}

export interface UserAccount {
  id: string;
  email: string;
  tier: 'free' | 'premium';
  role: 'user' | 'admin';
  registeredAt: string;
  filesCompressedCount: number;
  storageUsed: number; // in bytes
}

export interface SupportRequest {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  timestamp: string;
}

export interface CompressionLimits {
  freeMaxUploadSize: number; // in MB
  premiumMaxUploadSize: number; // in MB
  freeStorageDurationDays: number;
  premiumStorageDurationDays: number;
  freeDailyLimit: number;
  premiumDailyLimit: number;
}
