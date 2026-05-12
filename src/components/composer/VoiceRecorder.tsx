"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceRecorder({
  onResult,
  mode,
}: {
  onResult: (data: {
    blob: Blob;
    durationSec: number;
    transcription?: string;
    audioUrl?: string | null;
  }) => void;
  mode: "voice-note" | "voice-to-text";
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const r = recorderRef.current;
      if (r && r.state !== "inactive") r.stop();
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream, { mimeType: getMime() });
      recorderRef.current = r;
      chunksRef.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      r.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: r.mimeType });
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (mode === "voice-to-text") {
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append("file", blob, "voice.webm");
            fd.append("keepAudio", "false");
            fd.append("date", new Date().toISOString().slice(0, 10));
            const res = await fetch("/api/voice/transcribe", { method: "POST", body: fd });
            if (res.ok) {
              const data = await res.json();
              onResult({ blob, durationSec: duration, transcription: data.text });
            } else {
              onResult({ blob, durationSec: duration });
              alert("Transcription failed. Audio kept as-is.");
            }
          } finally {
            setBusy(false);
          }
        } else {
          onResult({ blob, durationSec: duration });
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      startTimeRef.current = Date.now();
      r.start();
      setRecording(true);
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);
    } catch (e: any) {
      alert(e?.message || "Microphone permission denied");
    }
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
    const r = recorderRef.current;
    if (r && r.state !== "inactive") r.stop();
  };

  if (busy) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        Transcribing…
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center justify-between bg-coral-50 rounded-lg px-3 py-2 animate-fadeIn">
        <div className="flex items-center gap-2 text-coral-700 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-coral-500 animate-pulseDot" />
          Recording
          <span className="tabular-nums text-coral-600">{fmt(elapsed)}</span>
        </div>
        <button
          type="button"
          onClick={stop}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-coral-400 hover:bg-coral-500 text-white"
        >
          <Square className="w-3 h-3" />
          Stop
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className={cn(
        "btn-secondary",
        mode === "voice-to-text" && "bg-purple-50 hover:bg-purple-100 text-purple-700"
      )}
    >
      <Mic className="w-4 h-4" />
      {mode === "voice-to-text" ? "Voice to text" : "Record voice note"}
    </button>
  );
}

function getMime(): string {
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
      return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  }
  return "";
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
