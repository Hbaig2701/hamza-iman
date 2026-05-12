import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  // Pull dates with at least one entry, descending
  const days = await prisma.day.findMany({
    where: { entries: { some: {} } },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 365,
  });
  const set = new Set(days.map((d) => toDateKey(d.date)));

  let streak = 0;
  const cur = new Date();
  // Walk backwards from today (UTC date alignment)
  let probe = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
  // If no entry today yet, the streak may still continue from yesterday — start checking today first.
  while (set.has(toDateKey(probe))) {
    streak += 1;
    probe = new Date(probe.getTime() - 24 * 60 * 60 * 1000);
  }
  return NextResponse.json({ streak });
}
