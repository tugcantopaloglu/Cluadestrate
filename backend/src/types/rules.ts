export interface HardRule {
  id: string;
  rule: string;
  createdAt: Date;
  createdBy: string;
}

export interface RulesConfig {
  hardRules: HardRule[];
  defaultRules: string[];
  sessionRules: Record<string, string[]>;
}

export interface CreateHardRuleRequest {
  rule: string;
  createdBy: string;
}

export interface UpdateDefaultRulesRequest {
  rules: string[];
}

export interface UpdateSessionRulesRequest {
  sessionId: string;
  rules: string[];
}
