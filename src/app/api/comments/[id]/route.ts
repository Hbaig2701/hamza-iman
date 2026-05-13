import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, notFound, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const existing = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.author !== user)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const comment = await prisma.comment.update({
    where: { id: params.id },
    data: {
      textContent:
        typeof body.textContent === "string"
          ? body.textContent.trim() || null
          : existing.textContent,
    },
  });
  return NextResponse.json({ comment });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const existing = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  if (existing.author !== user)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
