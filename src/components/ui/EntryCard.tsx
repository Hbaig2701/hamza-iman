"use client";

import {
  Star,
  MapPin,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { cn, authorDisplay, authorColor, formatTime } from "@/lib/utils";
import { MediaGrid } from "./MediaGrid";
import { VoicePlayer } from "./VoicePlayer";
import { CommentItem, type CommentDTO } from "./CommentItem";
import { CommentComposer } from "./CommentComposer";
import { useUser } from "@/components/UserContext";

export type EntryDTO = {
  id: string;
  author: string;
  type: string;
  textContent: string | null;
  mediaUrls: string[];
  thumbnailUrls: string[];
  voiceNoteUrl: string | null;
  voiceDurationSec: number | null;
  transcription: string | null;
  locationName: string | null;
  isFavorite: boolean;
  createdAt: string | Date;
  comments?: CommentDTO[];
};

export function EntryCard({
  entry,
  onChange,
}: {
  entry: EntryDTO;
  onChange?: (next: EntryDTO | null) => void;
}) {
  const me = useUser();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draftText, setDraftText] = useState(entry.textContent || "");
  const [draftTranscription, setDraftTranscription] = useState(
    entry.transcription || ""
  );
  const color = authorColor(entry.author);
  const isMine = entry.author === me;
  const comments = entry.comments || [];

  const toggleFavorite = async () => {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}/favorite`, { method: "PUT" });
    if (res.ok) {
      const d = await res.json();
      onChange?.({ ...entry, isFavorite: d.entry.isFavorite });
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!confirm("Delete this entry?")) return;
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) onChange?.(null);
    setBusy(false);
  };

  const startEdit = () => {
    setDraftText(entry.textContent || "");
    setDraftTranscription(entry.transcription || "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraftText(entry.textContent || "");
    setDraftTranscription(entry.transcription || "");
  };

  const saveEdit = async () => {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textContent: draftText.trim() || null,
        transcription: draftTranscription.trim() || null,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      onChange?.({
        ...entry,
        textContent: d.entry.textContent,
        transcription: d.entry.transcription,
      });
      setEditing(false);
    }
    setBusy(false);
  };

  const onCommentAdded = (c: CommentDTO) => {
    onChange?.({ ...entry, comments: [...comments, c] });
    setReplyOpen(false);
  };

  const onCommentChanged = (id: string, next: CommentDTO | null) => {
    const updated =
      next === null
        ? comments.filter((c) => c.id !== id)
        : comments.map((c) => (c.id === id ? next : c));
    onChange?.({ ...entry, comments: updated });
  };

  return (
    <article className="rounded-card bg-neutral-100/60 p-3 space-y-2 animate-fadeIn">
      <header className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", color.dot)} />
          <span className={cn("font-semibold", color.text)}>
            {authorDisplay(entry.author)}
          </span>
          <span className="text-neutral-500">{formatTime(entry.createdAt)}</span>
          {entry.locationName && (
            <span className="flex items-center gap-0.5 text-neutral-500">
              <MapPin className="w-3 h-3" />
              {entry.locationName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={busy}
                className="p-1 rounded hover:bg-white text-teal-500 hover:text-teal-600 transition"
                aria-label="Save"
                title="Save"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={cancelEdit}
                disabled={busy}
                className="p-1 rounded hover:bg-white text-neutral-400 hover:text-neutral-700 transition"
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFavorite}
                disabled={busy}
                className={cn(
                  "p-1 rounded hover:bg-white transition",
                  entry.isFavorite
                    ? "text-amber-500"
                    : "text-neutral-400 hover:text-amber-500"
                )}
                aria-label="Favorite"
              >
                <Star
                  className={cn("w-4 h-4", entry.isFavorite && "fill-current")}
                />
              </button>
              {isMine && (
                <>
                  <button
                    onClick={startEdit}
                    disabled={busy}
                    className="p-1 rounded hover:bg-white text-neutral-400 hover:text-neutral-700 transition"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={remove}
                    disabled={busy}
                    className="p-1 rounded hover:bg-white text-neutral-400 hover:text-coral-500 transition"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="What happened?"
            className="w-full min-h-[80px] rounded-lg border border-neutral-200 bg-white p-2.5 text-[14px] outline-none focus:border-neutral-400 resize-none"
            autoFocus
          />
          {entry.voiceNoteUrl && (
            <textarea
              value={draftTranscription}
              onChange={(e) => setDraftTranscription(e.target.value)}
              placeholder="Transcription"
              className="w-full min-h-[60px] rounded-lg border border-neutral-200 bg-white p-2.5 text-[12px] italic text-neutral-600 outline-none focus:border-neutral-400 resize-none"
            />
          )}
        </div>
      ) : (
        entry.textContent && (
          <p className="text-[14px] leading-relaxed text-neutral-800 whitespace-pre-wrap">
            {entry.textContent}
          </p>
        )
      )}

      {entry.mediaUrls && entry.mediaUrls.length > 0 && (
        <MediaGrid urls={entry.mediaUrls} />
      )}

      {entry.voiceNoteUrl && (
        <VoicePlayer
          url={entry.voiceNoteUrl}
          durationHint={entry.voiceDurationSec || undefined}
        />
      )}

      {!editing && entry.voiceNoteUrl && entry.transcription && (
        <p className="text-[12px] italic text-neutral-600 border-l-2 border-coral-200 pl-2">
          {entry.transcription}
        </p>
      )}

      {(comments.length > 0 || replyOpen) && (
        <div className="pt-1.5 pl-3 ml-1 border-l-2 border-neutral-200 space-y-1.5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onChange={(next) => onCommentChanged(c.id, next)}
            />
          ))}
          {replyOpen && (
            <CommentComposer
              entryId={entry.id}
              onPosted={onCommentAdded}
              onCancel={() => setReplyOpen(false)}
            />
          )}
        </div>
      )}

      {!editing && !replyOpen && (
        <div className="pt-0.5">
          <button
            onClick={() => setReplyOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 transition"
          >
            <MessageCircle className="w-3 h-3" />
            {comments.length === 0
              ? "reply"
              : `reply (${comments.length})`}
          </button>
        </div>
      )}
    </article>
  );
}
