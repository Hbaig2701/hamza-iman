"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Diamond } from "lucide-react";
import { readableDate, toDateKey } from "@/lib/utils";

export default function MilestonesPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/milestones")
      .then((r) => r.json())
      .then((d) => setItems(d.milestones || []));
  }, []);

  return (
    <div className="space-y-4">
      <Link href="/insights" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3 h-3" />
        Insights
      </Link>
      <h1 className="heading-serif text-2xl">Milestones</h1>
      {items.length === 0 ? (
        <div className="card p-6 text-center text-neutral-500 text-sm">
          No milestones yet. Mark a day as a milestone when something special happens.
        </div>
      ) : (
        <div className="relative ml-3 space-y-3 border-l border-amber-200 pl-5">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/day/${toDateKey(new Date(m.day.date))}`}
              className="block relative card p-3 hover:shadow-card transition"
            >
              <span className="absolute -left-[27px] top-3 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <Diamond className="w-2.5 h-2.5 text-white" />
              </span>
              <div className="text-[11px] uppercase tracking-wide text-amber-700">
                {readableDate(m.day.date)}
              </div>
              <div className="heading-serif text-base text-neutral-800">{m.title}</div>
              {m.description && (
                <p className="text-[13px] text-neutral-600 mt-1">{m.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
