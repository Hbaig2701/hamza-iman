"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { cn, authorDisplay, authorColor, formatTime } from "@/lib/utils";
import { MediaGrid } from "./MediaGrid";
import { useUser } from "@/components/UserContext";

export type CommentDTO = {
  id: string;
  author: string;
  textContent: string | null;
  mediaUrls: string[];
  thumbnailUrls: string[];
  createdAt: string | Date;
};

export function CommentItem({
  comment,
  onChange,
}: {
  comment: CommentDTO;
  onChange?: (next: CommentDTO | null) => void;
}) {
  const me = useUser();
  const isMine = comment.author === me;
  const color = authorColor(comment.author);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.textContent || "");

  const remove = async () => {
    if (!confirm("Delete comment?")) return;
    setBusy(true);
    const r = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (r.ok) onChange?.(null);
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    const r = await fetch(`/api/comments/${comment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textContent: draft }),
    });
    if (r.ok) {
      const d = await r.json();
      onChange?.({ ...comment, textContent: d.comment.textContent });
      setEditing(false);
    }
    setBusy(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg p-2.5 border text-[13px] space-y-1.5",
        comment.author === "hamza"
          ? "bg-coral-50/70 border-coral-100/60"
          : "bg-purple-50/70 border-purple-100/60"
      )}
    >
      <header className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", color.dot)} />
          <span className={cn("font-semibold", color.text)}>
            {authorDisplay(comment.author)}
          </span>
          <span className="text-neutral-500">{formatTime(comment.createdAt)}</span>
        </div>
        {isMine && (
          <div className="flex items-center gap-0.5 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={save}
                  disabled={busy}
                  className="p-1 rounded hover:bg-white/80 text-teal-600 transition"
                  aria-label="Save"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(comment.textContent || "");
                  }}
                  className="p-1 rounded hover:bg-white/80 text-neutral-500 transition"
                  aria-label="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 rounded hover:bg-white/80 text-neutral-400 hover:text-neutral-700 transition"
                  aria-label="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={remove}
                  className="p-1 rounded hover:bg-white/80 text-neutral-400 hover:text-coral-500 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </header>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full min-h-[50px] rounded-md border border-neutral-200 bg-white p-2 text-[13px] outline-none focus:border-neutral-400 resize-none"
          autoFocus
        />
      ) : (
        comment.textContent && (
          <p className="whitespace-pre-wrap leading-snug text-neutral-800">
            {comment.textContent}
          </p>
        )
      )}
      {comment.mediaUrls?.length > 0 && (
        <div className="mt-1">
          <MediaGrid urls={comment.mediaUrls} />
        </div>
      )}
    </div>
  );
}
