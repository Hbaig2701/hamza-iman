"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Star, Trash2, X, Loader2 } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { useUser } from "@/components/UserContext";
import { authorDisplay, cn, shortDate, todayKey } from "@/lib/utils";

type Quote = {
  id: string;
  text: string;
  saidBy: string;
  addedBy: string;
  date: string;
  isFavorite: boolean;
};

type Filter = "all" | "hamza" | "iman" | "favorites";

export function QuotesView() {
  const me = useUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "hamza" || filter === "iman") params.set("saidBy", filter);
    if (filter === "favorites") params.set("favorites", "true");
    if (search.trim()) params.set("q", search.trim());
    const r = await fetch(`/api/quotes?${params.toString()}`);
    const d = await r.json();
    setQuotes(d.quotes || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleFav = async (q: Quote) => {
    const r = await fetch(`/api/quotes/${q.id}/favorite`, { method: "PUT" });
    if (r.ok) {
      const d = await r.json();
      setQuotes((qs) => qs.map((x) => (x.id === q.id ? d.quote : x)));
    }
  };

  const remove = async (q: Quote) => {
    if (!confirm("Delete quote?")) return;
    await fetch(`/api/quotes/${q.id}`, { method: "DELETE" });
    setQuotes((qs) => qs.filter((x) => x.id !== q.id));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">Quote wall</div>
        <h1 className="heading-serif text-2xl">The things you said</h1>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Pill selected={filter === "all"} onClick={() => setFilter("all")}>All</Pill>
        <Pill
          selected={filter === "hamza"}
          onClick={() => setFilter("hamza")}
          color="#D85A30"
        >
          Hamza
        </Pill>
        <Pill
          selected={filter === "iman"}
          onClick={() => setFilter("iman")}
          color="#7F77DD"
        >
          Iman
        </Pill>
        <Pill selected={filter === "favorites"} onClick={() => setFilter("favorites")}>
          <Star className="w-3 h-3" />
          Favorites
        </Pill>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quotes…"
          className="input-base pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center text-neutral-400 text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin inline" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="card p-6 text-center text-neutral-500 text-sm">
          No quotes yet. Tap + to add one.
        </div>
      ) : (
        <div className="space-y-2.5">
          {quotes.map((q) => (
            <article
              key={q.id}
              className={cn(
                "card p-4 relative",
                q.saidBy === "hamza" ? "bg-coral-50/30" : "bg-purple-50/30"
              )}
            >
              <span
                className={cn(
                  "absolute top-2 left-3 heading-serif text-3xl leading-none opacity-30",
                  q.saidBy === "hamza" ? "text-coral-400" : "text-purple-400"
                )}
              >
                &ldquo;
              </span>
              <div className="pl-6 pr-2">
                <p className="font-serif italic text-[15px] leading-relaxed text-neutral-800">
                  {q.text}
                </p>
                <div
                  className={cn(
                    "text-[11px] mt-2",
                    q.saidBy === "hamza" ? "text-coral-600" : "text-purple-600"
                  )}
                >
                  — {authorDisplay(q.saidBy)}, {shortDate(q.date)}{" "}
                  <span className="text-neutral-400">
                    · added by {authorDisplay(q.addedBy)}
                  </span>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-0.5">
                <button
                  onClick={() => toggleFav(q)}
                  className={cn(
                    "p-1.5 rounded hover:bg-white transition",
                    q.isFavorite ? "text-amber-500" : "text-neutral-400 hover:text-amber-500"
                  )}
                >
                  <Star className={cn("w-4 h-4", q.isFavorite && "fill-current")} />
                </button>
                {q.addedBy === me && (
                  <button
                    onClick={() => remove(q)}
                    className="p-1.5 rounded hover:bg-white text-neutral-400 hover:text-coral-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <button
        className="fab right-4 bottom-20"
        onClick={() => setComposerOpen(true)}
        aria-label="Add quote"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddQuoteModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={load}
      />
    </div>
  );
}

function AddQuoteModal({
  open,
  onClose,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [text, setText] = useState("");
  const [saidBy, setSaidBy] = useState<"hamza" | "iman">("hamza");
  const [date, setDate] = useState(todayKey());
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const r = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), saidBy, date }),
    });
    setSubmitting(false);
    if (r.ok) {
      setText("");
      onPosted();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-50 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-serif text-lg">Add a quote</h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did they say?"
          className="w-full min-h-[100px] rounded-lg border border-neutral-200 bg-white p-3 text-[14px] outline-none focus:border-neutral-400 resize-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-neutral-500">Said by</span>
          <div className="flex gap-1">
            <button
              onClick={() => setSaidBy("hamza")}
              className={cn(
                "pill border",
                saidBy === "hamza"
                  ? "bg-coral-400 text-white border-coral-400"
                  : "bg-coral-50 text-coral-700 border-coral-100"
              )}
            >
              Hamza
            </button>
            <button
              onClick={() => setSaidBy("iman")}
              className={cn(
                "pill border",
                saidBy === "iman"
                  ? "bg-purple-400 text-white border-purple-400"
                  : "bg-purple-50 text-purple-700 border-purple-100"
              )}
            >
              Iman
            </button>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-base"
        />
        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save quote
        </button>
      </div>
    </div>
  );
}
