"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { authorDisplay, cn, toDateKey, shortDate } from "@/lib/utils";

type Point = {
  id: string;
  author: string;
  lat: number;
  lng: number;
  name: string | null;
  date: string;
  preview: string | null;
  thumbnail: string | null;
};

export default function MapPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [selected, setSelected] = useState<Point | null>(null);

  useEffect(() => {
    fetch("/api/insights/locations")
      .then((r) => r.json())
      .then((d) => setPoints(d.points || []));
  }, []);

  return (
    <div className="space-y-4">
      <Link href="/insights" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3 h-3" />
        Insights
      </Link>
      <h1 className="heading-serif text-2xl">Memory map</h1>
      <p className="text-[12px] text-neutral-500">
        Every place you&apos;ve tagged on an entry.
      </p>

      {points.length === 0 ? (
        <div className="card p-6 text-center text-neutral-500 text-sm">
          No locations yet. Tag a place on an entry to drop a pin.
        </div>
      ) : (
        <>
          <div className="card p-4 space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              All places
            </div>
            <ul className="space-y-2">
              {points.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    "rounded-lg p-2 cursor-pointer transition",
                    selected?.id === p.id ? "bg-neutral-100" : "hover:bg-neutral-50"
                  )}
                  onClick={() => setSelected(p)}
                >
                  <div className="flex items-center gap-2 text-[13px] text-neutral-800">
                    <MapPin
                      className={cn(
                        "w-3.5 h-3.5",
                        p.author === "hamza" ? "text-coral-500" : "text-purple-500"
                      )}
                    />
                    {p.name || `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {authorDisplay(p.author)} · {shortDate(p.date)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {selected && (
            <div className="card p-3 space-y-2">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                {selected.name || "Pin"}
              </div>
              <div className="flex gap-3">
                {selected.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.thumbnail}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover bg-neutral-100"
                  />
                )}
                <div className="flex-1 text-[13px] text-neutral-700">
                  {selected.preview || "—"}
                </div>
              </div>
              <Link
                href={`/day/${toDateKey(new Date(selected.date))}`}
                className="btn-secondary inline-flex"
              >
                Open day
              </Link>
              <a
                className="btn-ghost inline-flex"
                target="_blank"
                rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=14/${selected.lat}/${selected.lng}`}
              >
                View on OpenStreetMap
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
