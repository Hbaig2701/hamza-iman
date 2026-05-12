import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const item = await prisma.bucketItem.update({
    where: { id: params.id },
    data: {
      title: body.title || undefined,
      description: body.description ?? undefined,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.bucketItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
