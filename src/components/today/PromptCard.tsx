"use client";

import { useEffect, useState } from "react";
import { Sparkle, Loader2 } from "lucide-react";
import { useUser } from "@/components/UserContext";
import { authorDisplay, cn } from "@/lib/utils";

export function PromptCard() {
  const me = useUser();
  const other = me === "hamza" ? "iman" : "hamza";
  const [data, setData] = useState<any>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/prompts/today");
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!data?.prompt) return null;

  const myResponse = data.responses?.[me] ?? null;
  const theirResponse = data.responses?.[other] ?? null;
  const revealed = data.revealed;

  const submit = async () => {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/prompts/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: data.prompt.id, response: draft.trim() }),
      });
      setDraft("");
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-4 space-y-3 bg-gradient-to-br from-purple-50 to-white border-purple-100">
      <header className="flex items-center gap-2 text-purple-700 text-xs font-medium">
        <Sparkle className="w-3.5 h-3.5" />
        Today&rsquo;s prompt
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase tracking-wide">
          {data.prompt.category}
        </span>
      </header>
      <p className="text-[15px] heading-serif text-neutral-800">
        {data.prompt.question}
      </p>

      {!myResponse ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Your answer (private until both respond)"
            className="w-full min-h-[70px] rounded-lg border border-purple-100 bg-white p-2.5 text-[14px] outline-none focus:border-purple-300 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-neutral-500">
              {theirResponse
                ? `${authorDisplay(other)} has answered. Yours stays hidden until you reply.`
                : "Both of you see the same question."}
            </div>
            <button
              onClick={submit}
              disabled={submitting || !draft.trim()}
              className="btn-primary"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit
            </button>
          </div>
        </div>
      ) : !revealed ? (
        <div className="rounded-lg bg-white border border-purple-100 px-3 py-2 text-[12px] text-purple-700">
          You answered. Waiting for {authorDisplay(other)}…
        </div>
      ) : revealOpen ? (
        <div className="grid sm:grid-cols-2 gap-2">
          <div
            className={cn(
              "rounded-lg p-3 text-[13px] border",
              "bg-coral-50 border-coral-100 text-coral-900"
            )}
          >
            <div className="text-[10px] uppercase tracking-wide text-coral-600 mb-1">
              Hamza
            </div>
            {data.responses.hamza?.response}
          </div>
          <div className="rounded-lg p-3 text-[13px] border bg-purple-50 border-purple-100 text-purple-900">
            <div className="text-[10px] uppercase tracking-wide text-purple-600 mb-1">
              Iman
            </div>
            {data.responses.iman?.response}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setRevealOpen(true)}
          className="btn-primary w-full"
        >
          Both answered — tap to reveal
        </button>
      )}
    </div>
  );
}
