"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { EntryCard, type EntryDTO } from "@/components/ui/EntryCard";
import { authorDisplay, cn, shortDate } from "@/lib/utils";

export default function FavoritesPage() {
  const [entries, setEntries] = useState<EntryDTO[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/entries?favorites=true")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []));
    fetch("/api/quotes?favorites=true")
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes || []));
  }, []);

  return (
    <div className="space-y-4">
      <Link href="/insights" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3 h-3" />
        Insights
      </Link>
      <h1 className="heading-serif text-2xl">Favorites</h1>

      {quotes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wide text-neutral-500">Quotes</h2>
          {quotes.map((q) => (
            <div key={q.id} className="card p-3 flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-current shrink-0 mt-0.5" />
              <div>
                <p className="font-serif italic text-[14px] text-neutral-800">
                  &ldquo;{q.text}&rdquo;
                </p>
                <div
                  className={cn(
                    "text-[11px] mt-1",
                    q.saidBy === "hamza" ? "text-coral-600" : "text-purple-600"
                  )}
                >
                  — {authorDisplay(q.saidBy)}, {shortDate(q.date)}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {entries.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[11px] uppercase tracking-wide text-neutral-500">Entries</h2>
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </section>
      ) : (
        quotes.length === 0 && (
          <div className="card p-6 text-center text-neutral-500 text-sm">
            Nothing favorited yet. Tap the star on entries and quotes you love.
          </div>
        )
      )}
    </div>
  );
}
