import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, notFound, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("invalid body");

  const text: string | null =
    typeof body.textContent === "string" && body.textContent.trim()
      ? body.textContent.trim()
      : null;
  const mediaUrls: string[] = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];
  const thumbnailUrls: string[] = Array.isArray(body.thumbnailUrls)
    ? body.thumbnailUrls
    : mediaUrls;

  if (!text && mediaUrls.length === 0) {
    return badRequest("comment needs text or media");
  }

  const entry = await prisma.entry.findUnique({ where: { id: params.id } });
  if (!entry) return notFound();

  const comment = await prisma.comment.create({
    data: {
      entryId: entry.id,
      author: user,
      textContent: text,
      mediaUrls,
      thumbnailUrls,
    },
  });

  return NextResponse.json({ comment });
}
