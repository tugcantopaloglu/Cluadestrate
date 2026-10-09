export const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

export function isLocalRequest(host: string | undefined, origin: string | undefined): boolean {
  return typeof host === "string"
    && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)
    && (origin === undefined || allowedOrigins.includes(origin));
}

export function getListenHost(): string {
  const host = process.env.HOST || "127.0.0.1";
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error("HOST must be a loopback address. Use a secured tunnel for remote agents.");
  }
  return host;
}
