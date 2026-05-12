"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function MediaGrid({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  if (!urls?.length) return null;

  const layout =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
      ? "grid-cols-2"
      : urls.length === 3
      ? "grid-cols-3"
      : "grid-cols-3";

  return (
    <>
      <div className={cn("grid gap-1 rounded-lg overflow-hidden", layout)}>
        {urls.slice(0, 6).map((url, i) => {
          const isVideo = isVideoUrl(url);
          return (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className={cn(
                "relative bg-neutral-100 overflow-hidden",
                urls.length === 1 ? "aspect-[4/3]" : "aspect-square"
              )}
            >
              {isVideo ? (
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
              {urls.length > 6 && i === 5 && (
                <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm font-medium">
                  +{urls.length - 6}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {isVideoUrl(urls[lightbox]) ? (
            <video
              src={urls[lightbox]}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urls[lightbox]}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
    </>
  );
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|m4v)$/i.test(url.split("?")[0]);
}
