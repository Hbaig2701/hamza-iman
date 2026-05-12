"use client";

import { cn } from "@/lib/utils";

export function Pill({
  color,
  children,
  className,
  onClick,
  selected,
}: {
  color?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const style = color
    ? {
        backgroundColor: hexA(color, 0.12),
        color: darken(color),
        borderColor: hexA(color, 0.2),
      }
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "pill border transition",
        !color &&
          (selected
            ? "bg-neutral-200 text-neutral-800 border-neutral-300"
            : "bg-neutral-100 text-neutral-600 border-transparent hover:bg-neutral-200"),
        onClick && "cursor-pointer hover:brightness-105",
        selected && "ring-1 ring-offset-1 ring-neutral-300",
        className
      )}
    >
      {children}
    </button>
  );
}

function hexA(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darken(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 50);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 50);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 50);
  return `rgb(${r}, ${g}, ${b})`;
}
