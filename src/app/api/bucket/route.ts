import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.bucketItem.findMany({
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string)?.trim();
  if (!title) return badRequest("title required");
  const item = await prisma.bucketItem.create({
    data: {
      title,
      description: body.description || null,
      addedBy: user,
    },
  });
  return NextResponse.json({ item });
}
