import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, getOrCreateDay, unauthorized } from "@/lib/api";
import { fromDateKey } from "@/lib/utils";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const favorites = searchParams.get("favorites");
  const author = searchParams.get("author");

  const where: any = {};
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");
    where.day = { date: fromDateKey(date) };
  }
  if (favorites === "true") where.isFavorite = true;
  if (author) where.author = author;

  const entries = await prisma.entry.findMany({
    where,
    include: {
      day: { select: { date: true, id: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const contentType = req.headers.get("content-type") || "";

  // Multipart with file uploads
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const date = (form.get("date") as string) || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");
    const textContent = (form.get("textContent") as string) || null;
    const transcription = (form.get("transcription") as string) || null;
    const locationName = (form.get("locationName") as string) || null;
    const locationLat = form.get("locationLat")
      ? Number(form.get("locationLat"))
      : null;
    const locationLng = form.get("locationLng")
      ? Number(form.get("locationLng"))
      : null;
    const voiceDurationSec = form.get("voiceDurationSec")
      ? Math.round(Number(form.get("voiceDurationSec")))
      : null;
    const type = (form.get("type") as string) || "TEXT";

    const photoFiles = form.getAll("photos").filter((f) => f instanceof File) as File[];
    const videoFiles = form.getAll("videos").filter((f) => f instanceof File) as File[];
    const screenshotFiles = form
      .getAll("screenshots")
      .filter((f) => f instanceof File) as File[];
    const voiceFile = form.get("voiceNote");

    const day = await getOrCreateDay(date);
    const dayDate = day.date;

    const mediaUrls: string[] = [];
    const thumbnailUrls: string[] = [];

    for (const f of [...photoFiles, ...screenshotFiles]) {
      const { url } = await uploadFile({
        kind: photoFiles.includes(f) ? "photo" : "screenshot",
        author: user,
        date: dayDate,
        file: f,
        originalName: f.name,
      });
      mediaUrls.push(url);
      thumbnailUrls.push(url); // No transform pipeline yet; thumbnail = original
    }
    for (const f of videoFiles) {
      const { url } = await uploadFile({
        kind: "video",
        author: user,
        date: dayDate,
        file: f,
        originalName: f.name,
      });
      mediaUrls.push(url);
      thumbnailUrls.push("");
    }

    let voiceNoteUrl: string | null = null;
    if (voiceFile && voiceFile instanceof File && voiceFile.size > 0) {
      const { url } = await uploadFile({
        kind: "voice",
        author: user,
        date: dayDate,
        file: voiceFile,
        originalName: voiceFile.name || "voice.webm",
      });
      voiceNoteUrl = url;
    }

    const inferredType =
      voiceNoteUrl && !textContent && !transcription
        ? "VOICE_NOTE"
        : voiceNoteUrl
        ? "MIXED"
        : videoFiles.length > 0
        ? "VIDEO"
        : screenshotFiles.length > 0 && photoFiles.length === 0
        ? "SCREENSHOT"
        : photoFiles.length > 0 && textContent
        ? "MIXED"
        : photoFiles.length > 0
        ? "PHOTO"
        : "TEXT";

    const entry = await prisma.entry.create({
      data: {
        dayId: day.id,
        author: user,
        type: (type as any) || (inferredType as any),
        textContent,
        transcription,
        mediaUrls,
        thumbnailUrls,
        voiceNoteUrl,
        voiceDurationSec,
        locationName,
        locationLat: locationLat ?? undefined,
        locationLng: locationLng ?? undefined,
      },
    });
    return NextResponse.json({ entry });
  }

  // JSON-only entry (text)
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("invalid body");
  const date = body.date as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");
  const day = await getOrCreateDay(date);
  const entry = await prisma.entry.create({
    data: {
      dayId: day.id,
      author: user,
      type: body.type || "TEXT",
      textContent: body.textContent || null,
      transcription: body.transcription || null,
      mediaUrls: body.mediaUrls || [],
      thumbnailUrls: body.thumbnailUrls || [],
      voiceNoteUrl: body.voiceNoteUrl || null,
      voiceDurationSec: body.voiceDurationSec ?? null,
      locationName: body.locationName || null,
      locationLat: body.locationLat ?? null,
      locationLng: body.locationLng ?? null,
    },
  });
  return NextResponse.json({ entry });
}
