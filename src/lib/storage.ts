import { BUCKETS, publicUrl, supabaseAdmin } from "@/lib/supabase";
import { toDateKey } from "@/lib/utils";

export type UploadKind = "photo" | "video" | "screenshot" | "voice";

function bucketFor(kind: UploadKind): string {
  if (kind === "video") return BUCKETS.videos;
  if (kind === "voice") return BUCKETS.voice;
  return BUCKETS.photos;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function uploadFile(args: {
  kind: UploadKind;
  author: string;
  date: Date;
  file: File | Blob;
  originalName?: string;
  contentType?: string;
}): Promise<{ url: string; path: string; bucket: string }> {
  const bucket = bucketFor(args.kind);
  const dateKey = toDateKey(args.date);
  const ts = Date.now();
  const original = sanitizeName(args.originalName || "file");
  const path = `${dateKey}/${args.author}/${ts}_${original}`;

  const buffer =
    args.file instanceof Blob
      ? Buffer.from(await args.file.arrayBuffer())
      : (args.file as Buffer);

  const supa = supabaseAdmin();
  const { error } = await supa.storage.from(bucket).upload(path, buffer, {
    contentType:
      args.contentType ||
      (args.file instanceof Blob ? args.file.type : undefined) ||
      "application/octet-stream",
    upsert: false,
  });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return { url: publicUrl(bucket, path), path, bucket };
}

export async function deleteByUrl(url: string): Promise<void> {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const prefix = `${supaUrl}/storage/v1/object/public/`;
  if (!url.startsWith(prefix)) return;
  const rest = url.slice(prefix.length);
  const [bucket, ...pathParts] = rest.split("/");
  const path = decodeURI(pathParts.join("/"));
  const supa = supabaseAdmin();
  await supa.storage.from(bucket).remove([path]);
}

export async function ensureBuckets(): Promise<void> {
  const supa = supabaseAdmin();
  const names = Object.values(BUCKETS);
  for (const name of names) {
    const { data } = await supa.storage.getBucket(name);
    if (!data) {
      await supa.storage.createBucket(name, { public: true });
    }
  }
}
