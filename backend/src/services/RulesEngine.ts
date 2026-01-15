import { v4 as uuidv4 } from "uuid";
import type { RulesConfig, HardRule, CreateHardRuleRequest } from "../types";

export class RulesEngine {
  private config: RulesConfig = {
    hardRules: [],
    defaultRules: [
      "Use TypeScript for all new files",
      "Follow existing code style and conventions",
      "Write tests for new functionality",
      "Use conventional commit messages",
    ],
    sessionRules: {},
  };

  getConfig(): RulesConfig {
    return { ...this.config };
  }

  // Hard Rules
  getHardRules(): HardRule[] {
    return [...this.config.hardRules];
  }

  addHardRule(request: CreateHardRuleRequest): HardRule {
    const rule: HardRule = {
      id: uuidv4(),
      rule: request.rule,
      createdAt: new Date(),
      createdBy: request.createdBy,
    };

    this.config.hardRules.push(rule);
    return rule;
  }

  removeHardRule(id: string): boolean {
    const index = this.config.hardRules.findIndex((r) => r.id === id);
    if (index === -1) return false;

    this.config.hardRules.splice(index, 1);
    return true;
  }

  // Default Rules
  getDefaultRules(): string[] {
    return [...this.config.defaultRules];
  }

  setDefaultRules(rules: string[]): void {
    this.config.defaultRules = [...rules];
  }

  // Session Rules
  getSessionRules(sessionId: string): string[] {
    return this.config.sessionRules[sessionId] || [];
  }

  setSessionRules(sessionId: string, rules: string[]): void {
    this.config.sessionRules[sessionId] = [...rules];
  }

  removeSessionRules(sessionId: string): void {
    delete this.config.sessionRules[sessionId];
  }

  // Generate system prompt with rules
  generateSystemPromptWithRules(
    sessionId: string,
    customSystemPrompt?: string
  ): string {
    const hardRulesText = this.config.hardRules
      .map((r) => `[MANDATORY] ${r.rule}`)
      .join("\n");

    const defaultRulesText = this.config.defaultRules
      .map((r) => `- ${r}`)
      .join("\n");

    const sessionRulesText = (this.config.sessionRules[sessionId] || [])
      .map((r) => `- ${r}`)
      .join("\n");

    let prompt = "";

    if (hardRulesText) {
      prompt += `# HARD RULES (CANNOT BE OVERRIDDEN)\n${hardRulesText}\n\n`;
    }

    if (defaultRulesText) {
      prompt += `# Default Rules\n${defaultRulesText}\n\n`;
    }

    if (sessionRulesText) {
      prompt += `# Session-Specific Rules\n${sessionRulesText}\n\n`;
    }

    if (customSystemPrompt) {
      prompt += `# Custom Instructions\n${customSystemPrompt}\n`;
    }

    return prompt.trim();
  }

  // Validate session configuration against hard rules
  validateSessionConfig(
    config: Record<string, unknown>
  ): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Example validation logic - can be expanded
    for (const rule of this.config.hardRules) {
      // Check for common violations
      if (
        rule.rule.toLowerCase().includes("never commit directly to main") &&
        config.autoCommitToMain
      ) {
        violations.push(rule.rule);
      }

      if (
        rule.rule.toLowerCase().includes("require confirmation") &&
        config.autoApprove
      ) {
        // Note: This is a soft warning, not a violation
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
