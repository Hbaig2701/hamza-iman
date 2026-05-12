import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 20;
  const prompts = await prisma.prompt.findMany({
    where: { isUsed: true, usedOn: { not: null } },
    orderBy: { usedOn: "desc" },
    take: pageSize,
    skip: (page - 1) * pageSize,
    include: {
      responses: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({
    prompts: prompts.map((p) => ({
      id: p.id,
      question: p.question,
      category: p.category,
      usedOn: p.usedOn,
      responses: p.responses,
      revealed: p.responses.length >= 2,
    })),
    page,
    pageSize,
  });
}
