"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Check,
  X,
  Trash2,
  CalendarHeart,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { authorDisplay, cn, toDateKey, todayKey } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  description: string | null;
  addedBy: string;
  isCompleted: boolean;
  completedAt: string | null;
};

type Countdown = {
  id: string;
  title: string;
  emoji: string | null;
  targetDate: string;
};

type ModalKind = null | "item" | "countdown";

export function BucketView() {
  const [items, setItems] = useState<Item[]>([]);
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);

  const loadAll = () => {
    fetch("/api/bucket").then((r) => r.json()).then((d) => setItems(d.items || []));
    fetch("/api/countdowns").then((r) => r.json()).then((d) => setCountdowns(d.countdowns || []));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggle = async (item: Item) => {
    const r = await fetch(`/api/bucket/${item.id}/complete`, { method: "PUT" });
    if (r.ok) {
      const d = await r.json();
      setItems((arr) => arr.map((x) => (x.id === item.id ? d.item : x)));
    }
  };

  const remove = async (item: Item) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/bucket/${item.id}`, { method: "DELETE" });
    setItems((arr) => arr.filter((x) => x.id !== item.id));
  };

  const removeCountdown = async (c: Countdown) => {
    if (!confirm("Delete countdown?")) return;
    await fetch(`/api/countdowns/${c.id}`, { method: "DELETE" });
    setCountdowns((arr) => arr.filter((x) => x.id !== c.id));
  };

  const incomplete = items.filter((i) => !i.isCompleted);
  const completed = items.filter((i) => i.isCompleted);
  const total = items.length;
  const done = completed.length;
  const pctDone = total === 0 ? 0 : Math.round((done / total) * 100);

  const today = new Date(todayKey() + "T00:00:00Z");

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">Bucket list</div>
        <h1 className="heading-serif text-2xl">Things we&apos;ll do together</h1>
      </div>

      <div className="card p-3 space-y-2">
        <div className="flex items-center justify-between text-[12px] text-neutral-600">
          <span>
            {done} of {total} done
          </span>
          <span>{pctDone}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full bg-coral-400" style={{ width: `${pctDone}%` }} />
        </div>
      </div>

      {countdowns.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-wide text-neutral-500">Countdowns</h2>
            <button onClick={() => setModal("countdown")} className="btn-ghost text-xs">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {countdowns.map((c) => {
              const target = new Date(toDateKey(new Date(c.targetDate)) + "T00:00:00Z");
              const days = Math.round((target.getTime() - today.getTime()) / 86400000);
              return (
                <div
                  key={c.id}
                  className="card p-3 bg-gradient-to-br from-pink-50 to-white border-pink-100 relative"
                >
                  <button
                    onClick={() => removeCountdown(c)}
                    className="absolute top-1 right-1 p-1 text-pink-300 hover:text-pink-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="text-[11px] text-pink-700 font-medium flex items-center gap-1">
                    {c.emoji ? <span>{c.emoji}</span> : <CalendarHeart className="w-3 h-3" />}
                    {c.title}
                  </div>
                  {days === 0 ? (
                    <div className="heading-serif text-xl text-pink-700 mt-0.5">Today!</div>
                  ) : (
                    <>
                      <div className="heading-serif text-2xl text-pink-700 leading-none mt-0.5">
                        {Math.abs(days)}
                      </div>
                      <div className="text-[11px] text-pink-600">
                        {days < 0 ? "days ago" : "days away"}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {countdowns.length === 0 && (
        <button
          onClick={() => setModal("countdown")}
          className="btn-secondary w-full"
        >
          <CalendarHeart className="w-4 h-4" />
          Add a countdown
        </button>
      )}

      <section className="space-y-2">
        <h2 className="text-[11px] uppercase tracking-wide text-neutral-500">To do</h2>
        {incomplete.length === 0 ? (
          <div className="card p-6 text-center text-neutral-500 text-sm">
            Nothing on the list. Add your first dream below.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {incomplete.map((i) => (
              <BucketItem key={i.id} item={i} onToggle={toggle} onDelete={remove} />
            ))}
          </ul>
        )}
      </section>

      {completed.length > 0 && (
        <section className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-500"
          >
            {showCompleted ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <ul className="space-y-1.5">
              {completed.map((i) => (
                <BucketItem key={i.id} item={i} onToggle={toggle} onDelete={remove} />
              ))}
            </ul>
          )}
        </section>
      )}

      <button
        className="fab right-4 bottom-20"
        onClick={() => setModal("item")}
        aria-label="Add bucket item"
      >
        <Plus className="w-6 h-6" />
      </button>

      {modal === "item" && (
        <AddItemModal onClose={() => setModal(null)} onPosted={loadAll} />
      )}
      {modal === "countdown" && (
        <AddCountdownModal onClose={() => setModal(null)} onPosted={loadAll} />
      )}
    </div>
  );
}

function BucketItem({
  item,
  onToggle,
  onDelete,
}: {
  item: Item;
  onToggle: (i: Item) => void;
  onDelete: (i: Item) => void;
}) {
  return (
    <li
      className={cn(
        "card p-3 flex items-start gap-3",
        item.isCompleted && "opacity-60"
      )}
    >
      <button
        onClick={() => onToggle(item)}
        className={cn(
          "shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition mt-0.5",
          item.isCompleted
            ? "bg-coral-400 border-coral-400 text-white"
            : "border-neutral-300 hover:border-coral-400"
        )}
      >
        {item.isCompleted && <Check className="w-3 h-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[14px] text-neutral-800",
            item.isCompleted && "line-through"
          )}
        >
          {item.title}
        </div>
        {item.description && (
          <p className="text-[12px] text-neutral-500 mt-0.5">{item.description}</p>
        )}
        <div className="text-[10px] text-neutral-400 mt-0.5">
          added by {authorDisplay(item.addedBy)}
        </div>
      </div>
      <button
        onClick={() => onDelete(item)}
        className="p-1 text-neutral-300 hover:text-coral-500"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

function AddItemModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const r = await fetch("/api/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
    });
    setSubmitting(false);
    if (r.ok) {
      onPosted();
      onClose();
    }
  };

  return (
    <ModalShell title="Add to bucket list" onClose={onClose}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. See the northern lights"
        className="input-base"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional details"
        className="w-full min-h-[80px] rounded-lg border border-neutral-200 bg-white p-3 text-[14px] outline-none focus:border-neutral-400 resize-none"
      />
      <button onClick={submit} disabled={submitting} className="btn-primary w-full">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Add
      </button>
    </ModalShell>
  );
}

function AddCountdownModal({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted: () => void;
}) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [targetDate, setTargetDate] = useState(todayKey());
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const r = await fetch("/api/countdowns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), emoji: emoji || null, targetDate }),
    });
    setSubmitting(false);
    if (r.ok) {
      onPosted();
      onClose();
    }
  };

  return (
    <ModalShell title="New countdown" onClose={onClose}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Trip to Italy"
        className="input-base"
      />
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
          placeholder="Emoji"
          className="input-base w-24 text-center"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="input-base flex-1"
        />
      </div>
      <button onClick={submit} disabled={submitting} className="btn-primary w-full">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Save
      </button>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-50 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-serif text-lg">{title}</h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
