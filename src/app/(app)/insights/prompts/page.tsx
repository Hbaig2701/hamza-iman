"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { shortDate, cn } from "@/lib/utils";

export default function PromptHistoryPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/prompts/history")
      .then((r) => r.json())
      .then((d) => setItems(d.prompts || []));
  }, []);

  return (
    <div className="space-y-4">
      <Link href="/insights" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3 h-3" />
        Insights
      </Link>
      <h1 className="heading-serif text-2xl">Prompt history</h1>

      {items.length === 0 ? (
        <div className="card p-6 text-center text-neutral-500 text-sm">
          No prompts answered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const hamza = p.responses.find((r: any) => r.author === "hamza");
            const iman = p.responses.find((r: any) => r.author === "iman");
            return (
              <div key={p.id} className="card p-4 space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-purple-700">
                  {p.category} · {p.usedOn && shortDate(p.usedOn)}
                </div>
                <p className="heading-serif text-[15px] text-neutral-800">{p.question}</p>
                {p.revealed ? (
                  <div className="grid sm:grid-cols-2 gap-2 mt-1">
                    <ResponseBlock author="hamza" text={hamza?.response} />
                    <ResponseBlock author="iman" text={iman?.response} />
                  </div>
                ) : (
                  <div className="text-[12px] text-neutral-500">
                    Not both answered.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResponseBlock({ author, text }: { author: "hamza" | "iman"; text?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-[13px] border",
        author === "hamza"
          ? "bg-coral-50 border-coral-100 text-coral-900"
          : "bg-purple-50 border-purple-100 text-purple-900"
      )}
    >
      <div
        className={cn(
          "text-[10px] uppercase tracking-wide mb-1",
          author === "hamza" ? "text-coral-600" : "text-purple-600"
        )}
      >
        {author === "hamza" ? "Hamza" : "Iman"}
      </div>
      {text || "—"}
    </div>
  );
}
