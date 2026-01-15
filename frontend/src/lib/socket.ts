import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    if (s.connected) {
      resolve(s);
      return;
    }

    s.connect();

    const onConnect = () => {
      s.off("connect_error", onError);
      resolve(s);
    };

    const onError = (error: Error) => {
      s.off("connect", onConnect);
      reject(error);
    };

    s.once("connect", onConnect);
    s.once("connect_error", onError);
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}

export type SocketEventCallback = (...args: any[]) => void;

export function subscribeToSession(
  sessionId: string,
  callbacks: {
    onOutput?: (data: { sessionId: string; type: string; content: string; timestamp: number }) => void;
    onStatus?: (data: { sessionId: string; status: string }) => void;
    onUsage?: (data: { sessionId: string; tokensUsed: number; requestCount: number }) => void;
    onInput?: (data: { sessionId: string; input: string; timestamp: number }) => void;
    onError?: (data: { sessionId: string; error: string }) => void;
  }
): () => void {
  const s = getSocket();

  // Join session room
  s.emit("session:join", sessionId);

  // Set up listeners
  if (callbacks.onOutput) s.on("session:output", callbacks.onOutput);
  if (callbacks.onStatus) s.on("session:status", callbacks.onStatus);
  if (callbacks.onUsage) s.on("session:usage", callbacks.onUsage);
  if (callbacks.onInput) s.on("session:input", callbacks.onInput);
  if (callbacks.onError) s.on("session:error", callbacks.onError);

  // Return cleanup function
  return () => {
    s.emit("session:leave", sessionId);
    if (callbacks.onOutput) s.off("session:output", callbacks.onOutput);
    if (callbacks.onStatus) s.off("session:status", callbacks.onStatus);
    if (callbacks.onUsage) s.off("session:usage", callbacks.onUsage);
    if (callbacks.onInput) s.off("session:input", callbacks.onInput);
    if (callbacks.onError) s.off("session:error", callbacks.onError);
  };
}

export function sendSessionInput(sessionId: string, input: string): void {
  const s = getSocket();
  s.emit("session:input", { sessionId, input });
}
