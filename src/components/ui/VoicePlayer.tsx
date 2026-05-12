"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoicePlayer({ url, durationHint }: { url: string; durationHint?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    const onTime = () => setTime(a.currentTime);
    const onLoad = () => setDuration(a.duration || durationHint || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoad);
      a.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [url, durationHint]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.playbackRate = speed;
      a.play();
      setPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const ratio = duration ? Math.min(1, time / duration) : 0;
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration)
      audioRef.current.currentTime = Math.max(0, Math.min(duration, x * duration));
  };

  // Generate static-looking waveform bars (deterministic per url)
  const bars = generateBars(url);

  return (
    <div className="flex items-center gap-3 bg-coral-50 rounded-lg p-2.5">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-coral-400 hover:bg-coral-500 text-white flex items-center justify-center transition shrink-0"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
      </button>
      <div
        className="flex items-center gap-[2px] flex-1 h-8 cursor-pointer"
        onClick={seek}
      >
        {bars.map((h, i) => {
          const active = i / bars.length <= ratio;
          return (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={cn(
                "w-[3px] rounded-full transition-colors",
                active ? "bg-coral-500" : "bg-coral-200"
              )}
            />
          );
        })}
      </div>
      <div className="text-[11px] text-coral-700 tabular-nums">{fmt(duration - time)}</div>
      <button
        onClick={cycleSpeed}
        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-coral-100 text-coral-700 hover:bg-coral-200 shrink-0"
      >
        {speed}x
      </button>
    </div>
  );
}

function fmt(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function generateBars(seed: string, count = 36): number[] {
  // Simple PRNG-ish hash by char codes — produces a stable visual per URL.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const v = ((h >>> 8) & 0x7fff) / 0x7fff;
    out.push(25 + v * 75);
  }
  return out;
}
