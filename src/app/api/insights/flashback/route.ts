import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const monthDay = { month: now.getUTCMonth() + 1, day: now.getUTCDate() };

  // Get all days matching today's month/day in past
  const days = await prisma.day.findMany({
    where: {
      date: { lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) },
    },
    include: { entries: { orderBy: { createdAt: "asc" }, take: 1 } },
    orderBy: { date: "desc" },
  });

  const matching = days.filter((d) => {
    const m = d.date.getUTCMonth() + 1;
    const dy = d.date.getUTCDate();
    return m === monthDay.month && dy === monthDay.day;
  });

  return NextResponse.json({
    flashbacks: matching.slice(0, 3).map((d) => {
      const first = d.entries[0];
      return {
        date: d.date,
        preview: first?.textContent?.slice(0, 120) || first?.transcription?.slice(0, 120) || null,
        thumbnail: first?.thumbnailUrls?.[0] || first?.mediaUrls?.[0] || null,
      };
    }),
  });
}
