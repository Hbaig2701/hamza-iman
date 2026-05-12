import { cookies } from "next/headers";

export type UserId = "hamza" | "iman";

export type Session = {
  user: UserId;
  issuedAt: number;
};

const COOKIE_NAME = "ours_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-fallback-secret-please-change-me";
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const std = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(std);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload) as unknown as BufferSource
  );
  return b64urlEncode(sig);
}

async function verify(payload: string, sig: string): Promise<boolean> {
  try {
    const key = await getKey();
    return await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig) as unknown as BufferSource,
      new TextEncoder().encode(payload) as unknown as BufferSource
    );
  } catch {
    return false;
  }
}

export async function encodeSession(session: Session): Promise<string> {
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify(session)));
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function decodeSession(
  token: string | undefined
): Promise<Session | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!(await verify(payload, sig))) return null;
  try {
    const json = new TextDecoder().decode(b64urlDecode(payload));
    const parsed = JSON.parse(json);
    if (parsed.user !== "hamza" && parsed.user !== "iman") return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return decodeSession(token);
}

export async function setSessionCookie(user: UserId): Promise<void> {
  const session: Session = { user, issuedAt: Date.now() };
  cookies().set({
    name: COOKIE_NAME,
    value: await encodeSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getPinFor(user: UserId): string | undefined {
  if (user === "hamza") return process.env.HAMZA_PIN;
  return process.env.IMAN_PIN;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
