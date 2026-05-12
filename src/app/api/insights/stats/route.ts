import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [daysJournaled, totalEntries, totalQuotes, totalBucket, completedBucket, totalMilestones, photosAgg, voiceCount] =
    await Promise.all([
      prisma.day.count({ where: { entries: { some: {} } } }),
      prisma.entry.count(),
      prisma.quote.count(),
      prisma.bucketItem.count(),
      prisma.bucketItem.count({ where: { isCompleted: true } }),
      prisma.milestone.count(),
      prisma.entry.findMany({
        select: { mediaUrls: true },
      }),
      prisma.entry.count({ where: { voiceNoteUrl: { not: null } } }),
    ]);

  const totalPhotos = photosAgg.reduce((sum, e) => sum + (e.mediaUrls?.length || 0), 0);
  const entriesByAuthor = await prisma.entry.groupBy({
    by: ["author"],
    _count: { _all: true },
  });

  const byAuthor: Record<string, number> = { hamza: 0, iman: 0 };
  for (const a of entriesByAuthor) byAuthor[a.author] = a._count._all;

  return NextResponse.json({
    daysJournaled,
    totalEntries,
    totalQuotes,
    totalMilestones,
    totalPhotos,
    voiceNotes: voiceCount,
    bucket: { total: totalBucket, completed: completedBucket },
    entriesByAuthor: byAuthor,
  });
}
