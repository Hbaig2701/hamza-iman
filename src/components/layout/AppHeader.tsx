"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings as SettingsIcon, LogOut, Flame } from "lucide-react";
import { useUser } from "@/components/UserContext";
import { cn, authorDisplay } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const user = useUser();
  const router = useRouter();
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/insights/streak")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStreak(d.streak ?? 0))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 bg-neutral-50/85 backdrop-blur-md border-b border-black/[0.04]">
      <div className="max-w-[680px] mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/today" className="heading-serif text-xl text-neutral-800">
          ours.
        </Link>
        <div className="flex items-center gap-1.5">
          {streak !== null && streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-pill bg-amber-50 text-amber-700 text-[11px] font-medium">
              <Flame className="w-3 h-3" />
              {streak}
            </div>
          )}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-pill text-[11px] font-medium",
              user === "hamza"
                ? "bg-coral-50 text-coral-700"
                : "bg-purple-50 text-purple-700"
            )}
            title={`Signed in as ${authorDisplay(user)}`}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                user === "hamza" ? "bg-coral-400" : "bg-purple-400"
              )}
            />
            {authorDisplay(user)}
          </div>
          <Link
            href="/settings"
            className="p-2 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>
          <button
            onClick={logout}
            className="p-2 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition"
            aria-label="Sign out"
            title="Switch user"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
