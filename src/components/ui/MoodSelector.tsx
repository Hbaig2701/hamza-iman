"use client";

import { cn } from "@/lib/utils";

const MOODS = [
  { v: 1, e: "😢", label: "awful" },
  { v: 2, e: "🙁", label: "meh" },
  { v: 3, e: "🙂", label: "okay" },
  { v: 4, e: "😊", label: "good" },
  { v: 5, e: "🤩", label: "amazing" },
];

export function MoodSelector({
  value,
  onChange,
  size = "md",
}: {
  value: number | null;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      {MOODS.map((m) => (
        <button
          key={m.v}
          type="button"
          onClick={() => onChange(m.v)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg transition",
            size === "md" ? "py-1.5 px-2" : "p-1",
            value === m.v
              ? "bg-neutral-100"
              : "hover:bg-neutral-50"
          )}
          aria-label={m.label}
        >
          <span className={cn(size === "md" ? "text-[22px]" : "text-base")}>{m.e}</span>
          {value === m.v && (
            <span className="block w-4 h-[2px] mt-0.5 bg-coral-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export function moodEmoji(v: number) {
  return MOODS.find((m) => m.v === v)?.e || "🙂";
}
