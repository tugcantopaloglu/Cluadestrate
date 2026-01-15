export type KnowledgeType = "document" | "code" | "config" | "template";

export interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  type: KnowledgeType;
  content: string;
  tags: string[];
  filePath?: string; // If synced from a file
  size: number; // Size in bytes
  sessionIds: string[]; // Sessions using this knowledge
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeInput {
  title: string;
  description: string;
  type: KnowledgeType;
  content: string;
  tags: string[];
  filePath?: string;
}

export interface KnowledgeSearchResult {
  item: KnowledgeItem;
  relevance: number;
  matchedTags: string[];
  matchedContent?: string;
}
