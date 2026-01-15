import * as fs from "fs";
import * as path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class Storage<T extends { id: string }> {
  private filePath: string;
  private cache: Map<string, T> = new Map();
  private loaded: boolean = false;

  constructor(collection: string) {
    this.filePath = path.join(DATA_DIR, `${collection}.json`);
    this.load();
  }

  private load(): void {
    if (this.loaded) return;

    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        const items: T[] = JSON.parse(data);
        items.forEach((item) => this.cache.set(item.id, item));
      }
    } catch (error) {
      console.error(`Error loading ${this.filePath}:`, error);
    }

    this.loaded = true;
  }

  private save(): void {
    try {
      const items = Array.from(this.cache.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));
    } catch (error) {
      console.error(`Error saving ${this.filePath}:`, error);
      throw error;
    }
  }

  getAll(): T[] {
    return Array.from(this.cache.values());
  }

  getById(id: string): T | undefined {
    return this.cache.get(id);
  }

  create(item: T): T {
    this.cache.set(item.id, item);
    this.save();
    return item;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this.cache.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, id } as T;
    this.cache.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.cache.has(id);
    if (existed) {
      this.cache.delete(id);
      this.save();
    }
    return existed;
  }

  find(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.getAll().find(predicate);
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.cache.size;
    return this.find(predicate).length;
  }

  clear(): void {
    this.cache.clear();
    this.save();
  }
}

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
