"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";

export function LinkQrCode({ url, slug }: { url: string; slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `setu-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="animate-fade-up flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6">
      <div className="rounded-md bg-white p-3">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={200}
          level="M"
          marginSize={0}
        />
      </div>
      <p className="text-center text-sm text-text-faint">{url}</p>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97]"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download PNG
      </button>
    </div>
  );
}
