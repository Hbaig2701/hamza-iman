import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/utils";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function getCurrentUser() {
  const s = await getSession();
  return s?.user || null;
}

/** Find or create a Day row for the given YYYY-MM-DD key. */
export async function getOrCreateDay(dateKey: string) {
  const date = fromDateKey(dateKey);
  const existing = await prisma.day.findUnique({ where: { date } });
  if (existing) return existing;
  return prisma.day.create({ data: { date } });
}
