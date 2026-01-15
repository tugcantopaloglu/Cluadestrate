import { create } from "zustand";
import type { Session, SessionOutput, BackgroundTask } from "@/types/session";

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  outputs: Record<string, SessionOutput[]>;
  tasks: Record<string, BackgroundTask[]>;

  // Actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;

  // Output actions
  addOutput: (sessionId: string, output: SessionOutput) => void;
  clearOutputs: (sessionId: string) => void;

  // Task actions
  setTasks: (sessionId: string, tasks: BackgroundTask[]) => void;
  addTask: (sessionId: string, task: BackgroundTask) => void;
  updateTask: (sessionId: string, taskId: string, updates: Partial<BackgroundTask>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  activeSessionId: null,
  outputs: {},
  tasks: {},

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),

  setActiveSession: (id) => set({ activeSessionId: id }),

  addOutput: (sessionId, output) =>
    set((state) => ({
      outputs: {
        ...state.outputs,
        [sessionId]: [...(state.outputs[sessionId] || []), output].slice(-1000), // Keep last 1000
      },
    })),

  clearOutputs: (sessionId) =>
    set((state) => ({
      outputs: {
        ...state.outputs,
        [sessionId]: [],
      },
    })),

  setTasks: (sessionId, tasks) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [sessionId]: tasks,
      },
    })),

  addTask: (sessionId, task) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [sessionId]: [...(state.tasks[sessionId] || []), task],
      },
    })),

  updateTask: (sessionId, taskId, updates) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [sessionId]: (state.tasks[sessionId] || []).map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      },
    })),
}));
