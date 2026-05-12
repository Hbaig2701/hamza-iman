"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type UserId = "hamza" | "iman";

export default function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/today";

  const [selected, setSelected] = useState<UserId | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [lockedFor, setLockedFor] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleDigit = async (d: string) => {
    if (submitting || lockedFor > 0) return;
    setError(null);
    if (d === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next4 = pin + d;
    setPin(next4);
    if (next4.length === 4 && selected) {
      await submit(selected, next4);
    }
  };

  const submit = async (user: UserId, pinValue: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pin: pinValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Try again");
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 450);
        if (data.lockedFor) {
          setLockedFor(data.lockedFor);
          const iv = setInterval(() => {
            setLockedFor((s) => {
              if (s <= 1) {
                clearInterval(iv);
                return 0;
              }
              return s - 1;
            });
          }, 1000);
        }
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-neutral-50">
      <div className="mb-10 text-center">
        <h1 className="heading-serif text-5xl text-neutral-800">ours.</h1>
        <p className="text-neutral-500 mt-2 text-sm">your shared memory capsule</p>
      </div>

      {!selected ? (
        <div className="w-full max-w-sm space-y-3 animate-fadeIn">
          <button
            onClick={() => setSelected("hamza")}
            className="w-full flex items-center gap-4 p-5 rounded-card bg-coral-50 hover:bg-coral-100 border border-coral-100 transition"
          >
            <div className="w-12 h-12 rounded-full bg-coral-400 flex items-center justify-center text-white font-medium text-lg">
              H
            </div>
            <div className="text-left">
              <div className="text-coral-800 font-medium text-lg heading-serif">
                Hamza
              </div>
              <div className="text-coral-600 text-xs">Continue as Hamza</div>
            </div>
          </button>
          <button
            onClick={() => setSelected("iman")}
            className="w-full flex items-center gap-4 p-5 rounded-card bg-purple-50 hover:bg-purple-100 border border-purple-100 transition"
          >
            <div className="w-12 h-12 rounded-full bg-purple-400 flex items-center justify-center text-white font-medium text-lg">
              I
            </div>
            <div className="text-left">
              <div className="text-purple-800 font-medium text-lg heading-serif">
                Iman
              </div>
              <div className="text-purple-600 text-xs">Continue as Iman</div>
            </div>
          </button>
        </div>
      ) : (
        <div className={cn("w-full max-w-sm animate-fadeIn", shake && "animate-shake")}>
          <div className="text-center mb-6">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-medium",
                selected === "hamza"
                  ? "bg-coral-50 text-coral-700"
                  : "bg-purple-50 text-purple-700"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  selected === "hamza" ? "bg-coral-400" : "bg-purple-400"
                )}
              />
              {selected === "hamza" ? "Hamza" : "Iman"}
              <button
                className="ml-1 opacity-60 hover:opacity-100"
                onClick={() => {
                  setSelected(null);
                  setPin("");
                  setError(null);
                }}
              >
                change
              </button>
            </div>
            <p className="text-neutral-600 mt-4 text-sm">Enter your 4-digit PIN</p>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 transition",
                  i < pin.length
                    ? selected === "hamza"
                      ? "bg-coral-400 border-coral-400"
                      : "bg-purple-400 border-purple-400"
                    : "border-neutral-300"
                )}
              />
            ))}
          </div>

          {error && (
            <div className="text-center text-sm text-coral-600 mb-3">{error}</div>
          )}
          {lockedFor > 0 && (
            <div className="text-center text-xs text-neutral-500 mb-3">
              Locked. Try again in {lockedFor}s.
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"].map(
              (k, i) => {
                if (k === "")
                  return <div key={i} aria-hidden className="h-14" />;
                if (k === "back")
                  return (
                    <button
                      key={i}
                      onClick={() => handleDigit("back")}
                      disabled={lockedFor > 0 || submitting}
                      className="h-14 rounded-card bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium transition disabled:opacity-50"
                    >
                      ⌫
                    </button>
                  );
                return (
                  <button
                    key={i}
                    onClick={() => handleDigit(k)}
                    disabled={lockedFor > 0 || submitting}
                    className="h-14 rounded-card bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xl font-medium transition disabled:opacity-50"
                  >
                    {k}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      <div className="mt-10 text-[11px] text-neutral-400">
        for hamza & iman · private journal
      </div>
    </main>
  );
}
