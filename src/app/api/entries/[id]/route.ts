import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, notFound, unauthorized } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.entry.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.author !== user)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const entry = await prisma.entry.update({
    where: { id: params.id },
    data: {
      textContent: body.textContent ?? existing.textContent,
      transcription: body.transcription ?? existing.transcription,
      locationName: body.locationName ?? existing.locationName,
      locationLat: body.locationLat ?? existing.locationLat,
      locationLng: body.locationLng ?? existing.locationLng,
    },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const existing = await prisma.entry.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.author !== user)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.entry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
