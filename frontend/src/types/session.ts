import type * as Model from "../../../backend/src/types/session";
import type { Wire } from "./api";

export type SessionStatus = Wire<Model.SessionStatus>;
export type SessionMode = Wire<Model.SessionMode>;
export type ModelId = Wire<Model.ModelId>;
export type ThinkingMode = Wire<Model.ThinkingMode>;
export type ThinkingBudget = Wire<Model.ThinkingBudget>;
export type SessionConfig = Wire<Model.SessionConfig>;
export type SessionProcess = Wire<Model.SessionProcess>;
export type SessionUsage = Wire<Model.SessionUsage>;
export type SessionGit = Wire<Model.SessionGit>;
export type Session = Wire<Model.Session>;
export type SessionOutput = Wire<Model.SessionOutput>;
export type BackgroundTask = Wire<Model.BackgroundTask>;
