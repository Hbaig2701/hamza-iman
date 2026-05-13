import { NextRequest, NextResponse } from "next/server";
import { BUCKETS, publicUrl, supabaseAdmin } from "@/lib/supabase";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

type Kind = "photo" | "screenshot" | "video" | "voice";

const KIND_BUCKET: Record<Kind, string> = {
  photo: BUCKETS.photos,
  screenshot: BUCKETS.photos,
  video: BUCKETS.videos,
  voice: BUCKETS.voice,
};

// Generous caps — practical limits are now disk + bandwidth, not Vercel's 4.5 MB function body limit.
const MAX_BYTES: Record<Kind, number> = {
  photo: 50 * 1024 * 1024, // 50 MB
  screenshot: 50 * 1024 * 1024,
  video: 1024 * 1024 * 1024, // 1 GB
  voice: 25 * 1024 * 1024, // 25 MB (matches Whisper)
};

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.files)) return badRequest("files required");
  const date = body.date as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");

  const supa = supabaseAdmin();
  const uploads: Array<{
    kind: Kind;
    bucket: string;
    path: string;
    token: string;
    signedUrl: string;
    publicUrl: string;
    contentType: string;
  }> = [];

  for (const f of body.files) {
    const kind = f.kind as Kind;
    if (!KIND_BUCKET[kind]) return badRequest(`invalid kind: ${kind}`);
    if (typeof f.size === "number" && f.size > MAX_BYTES[kind]) {
      const mb = (MAX_BYTES[kind] / 1024 / 1024).toFixed(0);
      return badRequest(`${f.name || "file"} too large (max ${mb} MB)`);
    }
    const bucket = KIND_BUCKET[kind];
    const name = sanitize(f.name || "file");
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${date}/${user}/${Date.now()}_${rand}_${name}`;

    const { data, error } = await supa.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to sign upload" },
        { status: 500 }
      );
    }

    uploads.push({
      kind,
      bucket,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl: publicUrl(bucket, data.path),
      contentType: f.type || "application/octet-stream",
    });
  }

  return NextResponse.json({ uploads });
}
