"use client";

import { useRef, useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Video,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { cn, todayKey } from "@/lib/utils";
import type { CommentDTO } from "./CommentItem";

type Pending = { file: File; kind: "photo" | "video"; previewUrl: string };

export function CommentComposer({
  entryId,
  onPosted,
  onCancel,
}: {
  entryId: string;
  onPosted: (c: CommentDTO) => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  );
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  // Object URLs need lifecycle management
  useEffect(() => {
    return () => {
      for (const p of pending) URL.revokeObjectURL(p.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | null, kind: "photo" | "video") => {
    if (!files) return;
    const next: Pending[] = [];
    for (const f of Array.from(files)) {
      next.push({ file: f, kind, previewUrl: URL.createObjectURL(f) });
    }
    setPending((cur) => [...cur, ...next]);
  };

  const removePending = (i: number) => {
    setPending((cur) => {
      const p = cur[i];
      if (p) URL.revokeObjectURL(p.previewUrl);
      return cur.filter((_, j) => j !== i);
    });
  };

  const submit = async () => {
    if (!text.trim() && pending.length === 0) {
      setError("Add a reply or attach something.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let mediaUrls: string[] = [];
      if (pending.length > 0) {
        setProgress({ done: 0, total: pending.length });
        const signRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: todayKey(),
            files: pending.map((p) => ({
              kind: p.kind,
              name: p.file.name,
              type: p.file.type,
              size: p.file.size,
            })),
          }),
        });
        if (!signRes.ok) {
          const d = await signRes.json().catch(() => ({}));
          throw new Error(d.error || "Could not prepare upload");
        }
        const { uploads } = (await signRes.json()) as {
          uploads: Array<{ signedUrl: string; publicUrl: string }>;
        };
        for (let i = 0; i < pending.length; i++) {
          const p = pending[i];
          const target = uploads[i];
          const put = await fetch(target.signedUrl, {
            method: "PUT",
            body: p.file,
            headers: { "Content-Type": p.file.type || "application/octet-stream" },
          });
          if (!put.ok) {
            const msg = await put.text().catch(() => "");
            throw new Error(`Upload failed (${put.status})${msg ? ": " + msg.slice(0, 120) : ""}`);
          }
          mediaUrls.push(target.publicUrl);
          setProgress({ done: i + 1, total: pending.length });
        }
      }

      const res = await fetch(`/api/entries/${entryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textContent: text.trim() || null,
          mediaUrls,
          thumbnailUrls: mediaUrls,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to post");
      }
      const { comment } = await res.json();
      // Free object URLs
      for (const p of pending) URL.revokeObjectURL(p.previewUrl);
      setText("");
      setPending([]);
      onPosted(comment);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2.5 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply…"
        className="w-full min-h-[60px] rounded-md border border-neutral-200 bg-white p-2 text-[13px] outline-none focus:border-neutral-400 resize-none"
        autoFocus
      />
      {pending.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {pending.map((p, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden bg-neutral-100"
            >
              {p.kind === "video" ? (
                <video src={p.previewUrl} className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={() => removePending(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-[12px] text-coral-600">{error}</div>}
      {progress && (
        <div className="text-[11px] text-neutral-600 space-y-1">
          Uploading {progress.done} / {progress.total}…
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-coral-400 transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="btn-ghost text-xs"
            disabled={submitting}
            aria-label="Add photo"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>photo</span>
          </button>
          <button
            type="button"
            onClick={() => videoInput.current?.click()}
            className="btn-ghost text-xs"
            disabled={submitting}
            aria-label="Add video"
          >
            <Video className="w-3.5 h-3.5" />
            <span>video</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="btn-ghost text-xs"
            >
              cancel
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={cn("btn-primary text-xs px-3 py-1.5")}
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            reply
          </button>
        </div>
      </div>
      <input
        ref={photoInput}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => {
          addFiles(e.target.files, "photo");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInput}
        type="file"
        multiple
        accept="video/*"
        hidden
        onChange={(e) => {
          addFiles(e.target.files, "video");
          e.target.value = "";
        }}
      />
    </div>
  );
}
