import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, endOfMonthUTC } from "@/lib/utils";
import { badRequest } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) return badRequest("month is required (YYYY-MM)");
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return badRequest("invalid month");

  const start = startOfMonthUTC(y, m);
  const end = endOfMonthUTC(y, m);

  const days = await prisma.day.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      labels: true,
      milestone: true,
      _count: { select: { entries: true } },
      entries: {
        select: { id: true, mediaUrls: true, thumbnailUrls: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    days: days.map((d) => {
      const firstMedia = d.entries.find((e) => e.mediaUrls.length > 0);
      const cover =
        d.coverImage ||
        (firstMedia
          ? firstMedia.thumbnailUrls[0] || firstMedia.mediaUrls[0]
          : null);
      const mediaCount = d.entries.reduce(
        (sum, e) => sum + (e.mediaUrls?.length || 0),
        0
      );
      return {
        id: d.id,
        date: d.date,
        coverImage: cover,
        labels: d.labels,
        milestone: d.milestone,
        entryCount: d._count.entries,
        mediaCount,
      };
    }),
  });
}
