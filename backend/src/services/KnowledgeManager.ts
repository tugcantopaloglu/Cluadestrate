import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import { Storage, generateId } from "./Storage";
import type {
  KnowledgeItem,
  CreateKnowledgeInput,
  KnowledgeSearchResult,
} from "../types/knowledge";

export class KnowledgeManager extends EventEmitter {
  private storage: Storage<KnowledgeItem>;

  constructor() {
    super();
    this.storage = new Storage<KnowledgeItem>("knowledge");
  }

  list(): KnowledgeItem[] {
    return this.storage.getAll().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): KnowledgeItem | undefined {
    return this.storage.getById(id);
  }

  create(input: CreateKnowledgeInput): KnowledgeItem {
    const now = new Date().toISOString();
    const item: KnowledgeItem = {
      id: generateId(),
      title: input.title,
      description: input.description,
      type: input.type,
      content: input.content,
      tags: input.tags,
      filePath: input.filePath,
      size: Buffer.byteLength(input.content, "utf-8"),
      sessionIds: [],
      createdAt: now,
      updatedAt: now,
    };

    this.storage.create(item);
    this.emit("knowledge:created", item);
    return item;
  }

  update(id: string, updates: Partial<Omit<KnowledgeItem, "id" | "createdAt">>): KnowledgeItem | undefined {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate size if content changed
    if (updates.content) {
      updateData.size = Buffer.byteLength(updates.content, "utf-8");
    }

    const item = this.storage.update(id, updateData);
    if (item) {
      this.emit("knowledge:updated", item);
    }
    return item;
  }

  delete(id: string): boolean {
    const deleted = this.storage.delete(id);
    if (deleted) {
      this.emit("knowledge:deleted", { id });
    }
    return deleted;
  }

  search(query: string): KnowledgeSearchResult[] {
    const items = this.storage.getAll();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const results: KnowledgeSearchResult[] = [];

    for (const item of items) {
      let relevance = 0;
      const matchedTags: string[] = [];
      let matchedContent: string | undefined;

      // Check title match
      if (item.title.toLowerCase().includes(queryLower)) {
        relevance += 10;
      }

      // Check description match
      if (item.description.toLowerCase().includes(queryLower)) {
        relevance += 5;
      }

      // Check tag matches
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(queryLower) || queryWords.some((w) => tag.toLowerCase().includes(w))) {
          relevance += 3;
          matchedTags.push(tag);
        }
      }

      // Check content matches
      const contentLower = item.content.toLowerCase();
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          relevance += 1;
          if (!matchedContent) {
            const index = contentLower.indexOf(word);
            const start = Math.max(0, index - 50);
            const end = Math.min(item.content.length, index + word.length + 50);
            matchedContent = item.content.substring(start, end);
            if (start > 0) matchedContent = "..." + matchedContent;
            if (end < item.content.length) matchedContent += "...";
          }
        }
      }

      if (relevance > 0) {
        results.push({
          item,
          relevance,
          matchedTags,
          matchedContent,
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // Import from file
  async importFromFile(filePath: string): Promise<KnowledgeItem> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    let type: KnowledgeItem["type"] = "document";
    if ([".ts", ".js", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".h"].includes(ext)) {
      type = "code";
    } else if ([".json", ".yaml", ".yml", ".toml", ".ini", ".env"].includes(ext)) {
      type = "config";
    }

    return this.create({
      title: fileName,
      description: `Imported from ${filePath}`,
      type,
      content,
      tags: [ext.replace(".", ""), "imported"],
      filePath,
    });
  }

  // Sync with file (update if file changed)
  async syncWithFile(id: string): Promise<KnowledgeItem | undefined> {
    const item = this.storage.getById(id);
    if (!item || !item.filePath) {
      return undefined;
    }

    if (!fs.existsSync(item.filePath)) {
      throw new Error(`File not found: ${item.filePath}`);
    }

    const content = fs.readFileSync(item.filePath, "utf-8");
    return this.update(id, { content });
  }

  // Associate with session
  addToSession(id: string, sessionId: string): KnowledgeItem | undefined {
    const item = this.storage.getById(id);
    if (!item) return undefined;

    if (!item.sessionIds.includes(sessionId)) {
      return this.update(id, {
        sessionIds: [...item.sessionIds, sessionId],
      });
    }
    return item;
  }

  // Remove from session
  removeFromSession(id: string, sessionId: string): KnowledgeItem | undefined {
    const item = this.storage.getById(id);
    if (!item) return undefined;

    return this.update(id, {
      sessionIds: item.sessionIds.filter((sid) => sid !== sessionId),
    });
  }

  // Get knowledge for a session
  getForSession(sessionId: string): KnowledgeItem[] {
    return this.storage.find((item) => item.sessionIds.includes(sessionId));
  }

  // Generate CLAUDE.md content for a session
  generateClaudeMd(sessionId: string): string {
    const items = this.getForSession(sessionId);
    if (items.length === 0) {
      return "";
    }

    let content = "# Session Knowledge Base\n\n";
    content += "This document contains curated knowledge for this Claude session.\n\n";

    for (const item of items) {
      content += `## ${item.title}\n\n`;
      content += `*${item.description}*\n\n`;
      if (item.tags.length > 0) {
        content += `**Tags:** ${item.tags.join(", ")}\n\n`;
      }
      content += "```\n";
      content += item.content;
      content += "\n```\n\n";
      content += "---\n\n";
    }

    return content;
  }

  getStats(): {
    total: number;
    totalSize: number;
    byType: Record<string, number>;
    sessionsUsing: number;
  } {
    const items = this.storage.getAll();
    const byType: Record<string, number> = {};
    const sessionsUsing = new Set<string>();

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      item.sessionIds.forEach((sid) => sessionsUsing.add(sid));
    }

    return {
      total: items.length,
      totalSize: items.reduce((sum, item) => sum + item.size, 0),
      byType,
      sessionsUsing: sessionsUsing.size,
    };
  }
}
