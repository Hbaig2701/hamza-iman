"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Download,
  LogOut,
  Loader2,
} from "lucide-react";
import { useUser } from "@/components/UserContext";
import { authorDisplay, cn } from "@/lib/utils";

type Label = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  dayCount: number;
};

const COLOR_PALETTE = [
  "#D85A30",
  "#7F77DD",
  "#1D9E75",
  "#C84A72",
  "#C68220",
  "#888780",
  "#3C3489",
  "#0E5A42",
];

export function SettingsView() {
  const me = useUser();
  const router = useRouter();
  const [labels, setLabels] = useState<Label[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/labels").then((r) => r.json()).then((d) => setLabels(d.labels || []));
  };
  useEffect(load, []);

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName("");
    setBusy(false);
    load();
  };

  const remove = async (l: Label) => {
    if (!confirm(`Delete label "${l.name}"? It will be removed from ${l.dayCount} days.`)) return;
    await fetch(`/api/labels/${l.id}`, { method: "DELETE" });
    load();
  };

  const updateColor = async (l: Label, color: string) => {
    await fetch(`/api/labels/${l.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    load();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <Link href="/today" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3 h-3" />
        Back
      </Link>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">Settings</div>
        <h1 className="heading-serif text-2xl">Yours and ours</h1>
        <div className="text-[12px] text-neutral-500 mt-1">
          Signed in as{" "}
          <span
            className={cn(
              "font-medium",
              me === "hamza" ? "text-coral-600" : "text-purple-600"
            )}
          >
            {authorDisplay(me)}
          </span>
        </div>
      </div>

      <section className="card p-4 space-y-3">
        <h2 className="heading-serif text-base">Labels</h2>
        <div className="space-y-1.5">
          {labels.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50"
            >
              <div className="relative group">
                <span
                  className="w-5 h-5 rounded-full block border"
                  style={{ backgroundColor: l.color }}
                />
                <div className="absolute z-10 hidden group-hover:flex gap-1 p-1 bg-white border border-neutral-200 rounded-lg shadow top-6 left-0">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateColor(l, c)}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[14px] text-neutral-800 flex-1">{l.name}</span>
              <span className="text-[11px] text-neutral-500">{l.dayCount} days</span>
              <button
                onClick={() => remove(l)}
                className="p-1 text-neutral-400 hover:text-coral-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-black/[0.06] pt-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">
            Add label
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name"
              className="input-base flex-1"
            />
            <button onClick={create} disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={cn(
                  "w-6 h-6 rounded-full border transition",
                  newColor === c && "ring-2 ring-offset-1 ring-neutral-400"
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="heading-serif text-base">Your data</h2>
        <p className="text-[12px] text-neutral-500">
          Download everything as a JSON file. Includes entries, labels, quotes, bucket items,
          milestones, moods, prompts.
        </p>
        <a href="/api/export" className="btn-secondary inline-flex">
          <Download className="w-4 h-4" />
          Export JSON
        </a>
      </section>

      <section className="card p-4 space-y-2">
        <h2 className="heading-serif text-base">PIN</h2>
        <p className="text-[12px] text-neutral-500">
          PINs are configured server-side via environment variables
          (<code className="text-[11px] bg-neutral-100 px-1 rounded">HAMZA_PIN</code>,{" "}
          <code className="text-[11px] bg-neutral-100 px-1 rounded">IMAN_PIN</code>). Update
          them in your hosting environment and redeploy.
        </p>
      </section>

      <button onClick={logout} className="btn-secondary w-full">
        <LogOut className="w-4 h-4" />
        Sign out
      </button>

      <div className="text-center text-[11px] text-neutral-400 pt-3">
        ours. v1.0 · for hamza & iman
      </div>
    </div>
  );
}
