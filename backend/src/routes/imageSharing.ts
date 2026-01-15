import { Hono } from "hono";
import { ImageSharingManager } from "../services/ImageSharingManager";

export function createImageSharingRoutes(imageSharingManager: ImageSharingManager) {
  const router = new Hono();

  // Get stats
  router.get("/stats", (c) => {
    return c.json(imageSharingManager.getStats());
  });

  // List recent images
  router.get("/recent", (c) => {
    const limit = parseInt(c.req.query("limit") || "10");
    return c.json(imageSharingManager.listRecentImages(limit));
  });

  // Upload image
  router.post("/upload", async (c) => {
    const data = await c.req.json();
    try {
      const image = await imageSharingManager.uploadImage(data);
      return c.json(image, 201);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Capture screenshot
  router.post("/screenshot", async (c) => {
    const data = await c.req.json();
    try {
      const image = await imageSharingManager.captureScreenshot(data);
      return c.json(image, 201);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Capture remote screenshot
  router.post("/screenshot/remote", async (c) => {
    const data = await c.req.json();
    try {
      const image = await imageSharingManager.captureRemoteScreenshot(data);
      return c.json(image, 201);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Paste from clipboard
  router.post("/clipboard", async (c) => {
    const { sessionId, base64Data, mimeType } = await c.req.json();
    try {
      const image = await imageSharingManager.pasteFromClipboard(sessionId, base64Data, mimeType);
      return c.json(image, 201);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  // Get image by ID
  router.get("/:id", (c) => {
    const { id } = c.req.param();
    const image = imageSharingManager.getImage(id);
    if (!image) {
      return c.json({ error: "Image not found" }, 404);
    }
    return c.json(image);
  });

  // Get image content
  router.get("/:id/content", (c) => {
    const { id } = c.req.param();
    const content = imageSharingManager.getImageContent(id);
    if (!content) {
      return c.json({ error: "Image not found" }, 404);
    }
    const image = imageSharingManager.getImage(id);
    c.header("Content-Type", image?.mimeType || "image/png");
    return c.body(content);
  });

  // Get image as base64
  router.get("/:id/base64", (c) => {
    const { id } = c.req.param();
    const base64 = imageSharingManager.getImageBase64(id);
    if (!base64) {
      return c.json({ error: "Image not found" }, 404);
    }
    const image = imageSharingManager.getImage(id);
    return c.json({
      base64,
      mimeType: image?.mimeType,
      dataUri: `data:${image?.mimeType};base64,${base64}`,
    });
  });

  // Get thumbnail
  router.get("/:id/thumbnail", (c) => {
    const { id } = c.req.param();
    const content = imageSharingManager.getThumbnailContent(id);
    if (!content) {
      return c.json({ error: "Thumbnail not found" }, 404);
    }
    const image = imageSharingManager.getImage(id);
    c.header("Content-Type", image?.mimeType || "image/png");
    return c.body(content);
  });

  // Delete image
  router.delete("/:id", (c) => {
    const { id } = c.req.param();
    const success = imageSharingManager.deleteImage(id);
    if (!success) {
      return c.json({ error: "Image not found" }, 404);
    }
    return c.json({ success: true });
  });

  // Mark image as used in message
  router.post("/:id/used/:messageId", (c) => {
    const { id, messageId } = c.req.param();
    imageSharingManager.markUsedInMessage(id, messageId);
    return c.json({ success: true });
  });

  // Session-specific routes
  router.get("/session/:sessionId", (c) => {
    const { sessionId } = c.req.param();
    return c.json(imageSharingManager.listSessionImages(sessionId));
  });

  return router;
}
