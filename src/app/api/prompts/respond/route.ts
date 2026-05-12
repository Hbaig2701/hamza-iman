import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/api";
import { fromDateKey, toDateKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const promptId = body.promptId as string;
  const response = (body.response as string)?.trim();
  if (!promptId) return badRequest("promptId required");
  if (!response) return badRequest("response required");

  const date = fromDateKey(toDateKey(new Date()));

  const upserted = await prisma.promptResponse.upsert({
    where: {
      promptId_author_date: { promptId, author: user, date },
    },
    create: { promptId, author: user, response, date },
    update: { response },
  });
  return NextResponse.json({ response: upserted });
}
