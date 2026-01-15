import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import {
  SessionImage,
  ImageUploadRequest,
  ScreenshotRequest,
  RemoteScreenshotRequest,
  ImageProcessingOptions,
  ImageStats,
} from "../types/imageSharing";

export class ImageSharingManager extends EventEmitter {
  private images: Map<string, SessionImage> = new Map();
  private storagePath: string;
  private thumbnailPath: string;
  private maxImageSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    super();
    this.storagePath = path.join(process.cwd(), "data", "images");
    this.thumbnailPath = path.join(process.cwd(), "data", "thumbnails");
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailPath)) {
      fs.mkdirSync(this.thumbnailPath, { recursive: true });
    }
  }

  // Upload image from base64
  async uploadImage(request: ImageUploadRequest): Promise<SessionImage> {
    const { sessionId, filename, mimeType, base64Data } = request;

    // Validate mime type
    if (!this.isValidImageType(mimeType)) {
      throw new Error(`Invalid image type: ${mimeType}`);
    }

    // Decode base64
    const buffer = Buffer.from(base64Data, "base64");

    // Check size
    if (buffer.length > this.maxImageSize) {
      throw new Error(`Image too large. Max size: ${this.maxImageSize / 1024 / 1024}MB`);
    }

    return this.storeImage(sessionId, filename, mimeType, buffer, "upload");
  }

  // Capture screenshot (local)
  async captureScreenshot(request: ScreenshotRequest): Promise<SessionImage> {
    const { sessionId, captureType } = request;

    // In production, would use native screenshot APIs
    // For now, create a placeholder
    const filename = `screenshot_${Date.now()}.png`;
    const placeholder = this.createPlaceholderImage(800, 600);

    const image = await this.storeImage(
      sessionId,
      filename,
      "image/png",
      placeholder,
      "screenshot"
    );

    this.emit("screenshot:captured", image);
    return image;
  }

  // Capture screenshot from remote host
  async captureRemoteScreenshot(request: RemoteScreenshotRequest): Promise<SessionImage> {
    const { sessionId, hostId, captureType, region } = request;

    // In production, would connect to remote host and capture
    const filename = `remote_screenshot_${hostId}_${Date.now()}.png`;
    const placeholder = this.createPlaceholderImage(1920, 1080);

    const image = await this.storeImage(
      sessionId,
      filename,
      "image/png",
      placeholder,
      "remote"
    );

    image.remoteCapture = {
      hostId,
      captureType,
      region,
    };

    this.images.set(image.id, image);
    this.emit("screenshot:remote-captured", image);
    return image;
  }

  // Store image from clipboard
  async pasteFromClipboard(sessionId: string, base64Data: string, mimeType: string): Promise<SessionImage> {
    const filename = `clipboard_${Date.now()}.${this.getExtension(mimeType)}`;
    const buffer = Buffer.from(base64Data, "base64");

    const image = await this.storeImage(sessionId, filename, mimeType, buffer, "clipboard");
    this.emit("image:pasted", image);
    return image;
  }

  // Store image from integration (Slack/Telegram/Discord)
  async storeIntegrationImage(
    sessionId: string,
    platform: "slack" | "telegram" | "discord",
    messageId: string,
    chatId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<SessionImage> {
    const image = await this.storeImage(sessionId, filename, mimeType, buffer, "integration");

    image.integrationSource = {
      platform,
      messageId,
      chatId,
    };

    this.images.set(image.id, image);
    this.emit("image:from-integration", image);
    return image;
  }

  // Core storage method
  private async storeImage(
    sessionId: string,
    filename: string,
    mimeType: string,
    buffer: Buffer,
    source: SessionImage["source"]
  ): Promise<SessionImage> {
    const id = randomUUID();
    const ext = this.getExtension(mimeType);
    const storageName = `${id}.${ext}`;
    const filePath = path.join(this.storagePath, storageName);
    const thumbPath = path.join(this.thumbnailPath, `${id}_thumb.${ext}`);

    // Write original image
    fs.writeFileSync(filePath, buffer);

    // Generate thumbnail (in production, would use sharp or similar)
    const thumbnail = this.createThumbnail(buffer);
    fs.writeFileSync(thumbPath, thumbnail);

    // Get dimensions (simplified - in production use image-size library)
    const dimensions = this.getImageDimensions(buffer);

    const image: SessionImage = {
      id,
      sessionId,
      source,
      filename,
      mimeType,
      size: buffer.length,
      dimensions,
      storagePath: filePath,
      thumbnailPath: thumbPath,
      uploadedAt: new Date(),
      usedInMessages: [],
    };

    this.images.set(id, image);
    this.emit("image:stored", image);
    return image;
  }

  // Get image
  getImage(id: string): SessionImage | undefined {
    return this.images.get(id);
  }

  // Get image content
  getImageContent(id: string): Buffer | null {
    const image = this.images.get(id);
    if (!image || !fs.existsSync(image.storagePath)) return null;
    return fs.readFileSync(image.storagePath);
  }

  // Get image as base64
  getImageBase64(id: string): string | null {
    const content = this.getImageContent(id);
    if (!content) return null;
    return content.toString("base64");
  }

  // Get thumbnail content
  getThumbnailContent(id: string): Buffer | null {
    const image = this.images.get(id);
    if (!image || !fs.existsSync(image.thumbnailPath)) return null;
    return fs.readFileSync(image.thumbnailPath);
  }

  // List images for session
  listSessionImages(sessionId: string): SessionImage[] {
    return Array.from(this.images.values())
      .filter((img) => img.sessionId === sessionId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  // List recent images
  listRecentImages(limit: number = 10): SessionImage[] {
    return Array.from(this.images.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, limit);
  }

  // Delete image
  deleteImage(id: string): boolean {
    const image = this.images.get(id);
    if (!image) return false;

    // Delete files
    if (fs.existsSync(image.storagePath)) {
      fs.unlinkSync(image.storagePath);
    }
    if (fs.existsSync(image.thumbnailPath)) {
      fs.unlinkSync(image.thumbnailPath);
    }

    this.images.delete(id);
    this.emit("image:deleted", { id });
    return true;
  }

  // Mark image as used in message
  markUsedInMessage(imageId: string, messageId: string): void {
    const image = this.images.get(imageId);
    if (image && !image.usedInMessages.includes(messageId)) {
      image.usedInMessages.push(messageId);
      this.images.set(imageId, image);
    }
  }

  // Get stats
  getStats(): ImageStats {
    const images = Array.from(this.images.values());

    const bySession: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const img of images) {
      bySession[img.sessionId] = (bySession[img.sessionId] || 0) + 1;
      bySource[img.source] = (bySource[img.source] || 0) + 1;
    }

    return {
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
      bySession,
      bySource,
      recentCaptures: this.listRecentImages(5),
    };
  }

  // Utility methods
  private isValidImageType(mimeType: string): boolean {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
    ];
    return validTypes.includes(mimeType.toLowerCase());
  }

  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "image/bmp": "bmp",
    };
    return extensions[mimeType.toLowerCase()] || "png";
  }

  private getImageDimensions(buffer: Buffer): { width: number; height: number } {
    // Simplified dimension detection - in production use image-size library
    // This is a basic PNG header check
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      // PNG
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    // Default fallback
    return { width: 0, height: 0 };
  }

  private createPlaceholderImage(width: number, height: number): Buffer {
    // Create a simple gray placeholder
    // In production, would use actual screenshot capture
    const header = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    ]);
    return Buffer.concat([header, Buffer.alloc(100)]); // Minimal placeholder
  }

  private createThumbnail(buffer: Buffer): Buffer {
    // In production, would resize using sharp or similar
    // For now, return the same buffer (placeholder behavior)
    return buffer;
  }
}
