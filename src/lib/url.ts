import "server-only";
import { headers } from "next/headers";

/**
 * The app's public address, for links in emails. Production must set APP_URL: building
 * links from the request's Host header would let anyone send a reset link to their own site.
 */
export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("Set APP_URL to the app's public address.");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"}://${host}`;
}
