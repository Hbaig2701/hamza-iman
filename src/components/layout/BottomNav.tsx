"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Notebook, Calendar, BarChart3, Quote, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/today", label: "Today", Icon: Notebook },
  { href: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/insights", label: "Insights", Icon: BarChart3 },
  { href: "/quotes", label: "Quotes", Icon: Quote },
  { href: "/bucket", label: "Bucket", Icon: ListChecks },
];

export default function BottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-black/[0.06]">
      <div className="max-w-[680px] mx-auto grid grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 gap-0.5 transition relative",
                active ? "text-coral-500" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              {active && (
                <span className="absolute top-0 w-8 h-[2px] bg-coral-400 rounded-b-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
