import { NextRequest, NextResponse } from "next/server";
import { getPinFor, setSessionCookie, UserId } from "@/lib/auth";

// Rate-limiting state per user. Reset after lockout window.
const attempts: Record<UserId, { count: number; lockedUntil: number }> = {
  hamza: { count: 0, lockedUntil: 0 },
  iman: { count: 0, lockedUntil: 0 },
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const user = body?.user as UserId | undefined;
  const pin = (body?.pin as string | undefined) ?? "";

  if (user !== "hamza" && user !== "iman") {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const state = attempts[user];
  if (Date.now() < state.lockedUntil) {
    const wait = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Too many attempts. Wait ${wait}s.`, lockedFor: wait },
      { status: 429 }
    );
  }

  const expected = getPinFor(user);
  if (!expected) {
    return NextResponse.json({ error: "PIN not configured on server" }, { status: 500 });
  }

  if (pin !== expected) {
    state.count += 1;
    if (state.count >= MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCKOUT_MS;
      state.count = 0;
      return NextResponse.json(
        { error: "Too many wrong attempts. Locked for 30s." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Incorrect PIN", remaining: MAX_ATTEMPTS - state.count },
      { status: 401 }
    );
  }

  state.count = 0;
  state.lockedUntil = 0;
  await setSessionCookie(user);
  return NextResponse.json({ ok: true, user });
}
