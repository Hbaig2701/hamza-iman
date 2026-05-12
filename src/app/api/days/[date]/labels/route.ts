import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getOrCreateDay } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  const dateKey = params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return badRequest("invalid date");
  const body = await req.json().catch(() => ({}));
  const labelIds: string[] = Array.isArray(body?.labelIds) ? body.labelIds : [];
  const day = await getOrCreateDay(dateKey);
  const updated = await prisma.day.update({
    where: { id: day.id },
    data: {
      labels: { set: labelIds.map((id) => ({ id })) },
    },
    include: { labels: true },
  });
  return NextResponse.json(updated);
}
