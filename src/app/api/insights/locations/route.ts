import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await prisma.entry.findMany({
    where: {
      AND: [{ locationLat: { not: null } }, { locationLng: { not: null } }],
    },
    select: {
      id: true,
      author: true,
      locationName: true,
      locationLat: true,
      locationLng: true,
      mediaUrls: true,
      thumbnailUrls: true,
      textContent: true,
      transcription: true,
      day: { select: { date: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({
    points: entries.map((e) => ({
      id: e.id,
      author: e.author,
      lat: e.locationLat,
      lng: e.locationLng,
      name: e.locationName,
      date: e.day.date,
      preview:
        (e.textContent || e.transcription || "").slice(0, 80) || null,
      thumbnail: e.thumbnailUrls?.[0] || e.mediaUrls?.[0] || null,
    })),
  });
}
