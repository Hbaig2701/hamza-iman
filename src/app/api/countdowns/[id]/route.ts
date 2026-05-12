import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.title) data.title = body.title;
  if ("emoji" in body) data.emoji = body.emoji || null;
  if (body.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(body.targetDate))
    data.targetDate = fromDateKey(body.targetDate);
  if ("isActive" in body) data.isActive = !!body.isActive;
  const countdown = await prisma.countdown.update({ where: { id: params.id }, data });
  return NextResponse.json({ countdown });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.countdown.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
