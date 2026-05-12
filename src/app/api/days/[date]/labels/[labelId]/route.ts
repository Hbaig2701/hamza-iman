import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getOrCreateDay } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { date: string; labelId: string } }
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) return badRequest("invalid date");
  const day = await getOrCreateDay(params.date);
  await prisma.day.update({
    where: { id: day.id },
    data: { labels: { disconnect: { id: params.labelId } } },
  });
  return NextResponse.json({ ok: true });
}
