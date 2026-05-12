import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const label = await prisma.label.update({
    where: { id: params.id },
    data: {
      name: body.name ? String(body.name).trim().toLowerCase() : undefined,
      color: body.color || undefined,
    },
  });
  return NextResponse.json({ label });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.label.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
