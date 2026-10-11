"use client";

import { useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { buttonSecondary, panelClass } from "@/components/ui";

// Four modules of empty margin around the code is the QR specification's
// "quiet zone". Scanners struggle without it, so exports include it too.
const QUIET_ZONE = 4;

export function LinkQrCode({ url, slug }: { url: string; slug: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function download(href: string, extension: "png" | "svg") {
    const link = document.createElement("a");
    link.download = `setu-${slug}.${extension}`;
    link.href = href;
    link.click();
  }

  function handlePng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    download(canvas.toDataURL("image/png"), "png");
  }

  function handleSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const markup = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    download(objectUrl, "svg");
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <section className={`${panelClass} flex flex-col gap-5 p-5 sm:p-6`}>
      <h2 className="text-2xl font-bold">QR code</h2>

      <div className="flex justify-center border-2 border-border bg-white p-3 shadow-hard-3">
        <QRCodeSVG
          ref={svgRef}
          value={url}
          size={256}
          level="M"
          marginSize={QUIET_ZONE}
          title={`QR code for ${url}`}
          className="h-auto w-full max-w-64"
        />
      </div>

      {/* A larger, hidden canvas so the PNG download is sharp when printed. */}
      <QRCodeCanvas
        ref={canvasRef}
        value={url}
        size={1024}
        level="M"
        marginSize={QUIET_ZONE}
        className="hidden"
        aria-hidden="true"
      />

      <p className="break-all text-center font-mono text-xs text-muted-foreground">
        {url}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={handlePng} className={buttonSecondary}>
          <Download className="size-4" aria-hidden="true" />
          Download PNG
        </button>
        <button type="button" onClick={handleSvg} className={buttonSecondary}>
          <Download className="size-4" aria-hidden="true" />
          Download SVG
        </button>
      </div>
    </section>
  );
}
