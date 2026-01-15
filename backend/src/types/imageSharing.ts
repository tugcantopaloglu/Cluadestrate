// Image Sharing Types

export interface SessionImage {
  id: string;
  sessionId: string;
  source: "upload" | "screenshot" | "clipboard" | "remote" | "integration";
  filename: string;
  mimeType: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  storagePath: string;
  thumbnailPath: string;
  base64?: string;
  remoteCapture?: {
    hostId: string;
    captureType: "fullscreen" | "window" | "region";
    region?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  integrationSource?: {
    platform: "slack" | "telegram" | "discord";
    messageId: string;
    chatId: string;
  };
  uploadedAt: Date;
  usedInMessages: string[];
}

export interface ImageUploadRequest {
  sessionId: string;
  filename: string;
  mimeType: string;
  base64Data: string;
}

export interface ScreenshotRequest {
  sessionId: string;
  captureType: "fullscreen" | "window" | "region";
  hostId?: string;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RemoteScreenshotRequest {
  sessionId: string;
  hostId: string;
  captureType: "fullscreen" | "window" | "region";
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageProcessingOptions {
  resize?: {
    maxWidth: number;
    maxHeight: number;
  };
  quality?: number;
  format?: "jpeg" | "png" | "webp";
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ImageStats {
  totalImages: number;
  totalSize: number;
  bySession: Record<string, number>;
  bySource: Record<string, number>;
  recentCaptures: SessionImage[];
}
