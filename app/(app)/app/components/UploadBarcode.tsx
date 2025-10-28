"use client";

import Quagga from "quagga";
import { useRef, useState } from "react";

async function ensureBarcodeDetector() {
  if (typeof window !== "undefined" && !(window as any).BarcodeDetector) {
    await import("@sec-ant/barcode-detector");
  }
}

export default function UploadBarcode({
  handleResult,
}: {
  handleResult: (b: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tryDetectFromCanvas = async (
    canvas: HTMLCanvasElement
  ): Promise<string | null> => {
    // Ensure canvas has valid dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      return null;
    }

    await ensureBarcodeDetector();
    const BarcodeDetector = (window as any).BarcodeDetector;
    const detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    try {
      const bmp = await createImageBitmap(canvas);
      const codes = await detector.detect(bmp);
      if (codes && codes.length > 0) return codes[0].rawValue as string;

      for (const deg of [90, 180, 270]) {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        if (!ctx) continue;
        c.width = deg % 180 === 0 ? canvas.width : canvas.height;
        c.height = deg % 180 === 0 ? canvas.height : canvas.width;
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((deg * Math.PI) / 180);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        if (c.width > 0 && c.height > 0) {
          const bmpR = await createImageBitmap(c);
          const codesR = await detector.detect(bmpR);
          if (codesR && codesR.length > 0) return codesR[0].rawValue as string;
        }
      }
    } catch (err) {
      console.warn("BarcodeDetector failed:", err);
    }
    return null;
  };

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setLoading(true);
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await img.decode();

      // Full image canvas
      const full = document.createElement("canvas");
      const ctx = full.getContext("2d");
      if (!ctx) {
        setError("Failed to create canvas context");
        setLoading(false);
        return;
      }

      // Ensure minimum dimensions
      const minSize = 100;
      full.width = Math.max(img.width, minSize);
      full.height = Math.max(img.height, minSize);

      // Draw image scaled to fit canvas
      ctx.drawImage(img, 0, 0, full.width, full.height);

      // 1) BarcodeDetector (zxing-cpp WASM)
      let text = await tryDetectFromCanvas(full);

      // 2) Quagga fallback with ROI refinement
      if (!text) {
        text = await new Promise<string | null>((resolveOuter) => {
          Quagga.decodeSingle(
            {
              src: url,
              numOfWorkers: 0,
              inputStream: { size: 1280 },
              decoder: {
                readers: [
                  "ean_reader",
                  "ean_8_reader",
                  "upc_reader",
                  "upc_e_reader",
                  "code_128_reader",
                ],
              },
              locate: true,
              halfSample: false,
            } as any,
            async (res: any) => {
              if (res && res.codeResult?.code) {
                resolveOuter(res.codeResult.code as string);
                return;
              }
              if (res && Array.isArray(res.boxes)) {
                for (const box of res.boxes) {
                  if (!Array.isArray(box)) continue;
                  const xs = box.map((p: any) => p.x);
                  const ys = box.map((p: any) => p.y);
                  let minX = Math.max(0, Math.min(...xs));
                  let minY = Math.max(0, Math.min(...ys));
                  let maxX = Math.min(img.width, Math.max(...xs));
                  let maxY = Math.min(img.height, Math.max(...ys));
                  const margin = 24;
                  minX = Math.max(0, Math.floor(minX - margin));
                  minY = Math.max(0, Math.floor(minY - margin));
                  maxX = Math.min(img.width, Math.ceil(maxX + margin));
                  maxY = Math.min(img.height, Math.ceil(maxY + margin));
                  const cw = maxX - minX;
                  const ch = maxY - minY;
                  if (cw <= 10 || ch <= 10) continue;
                  const roi = document.createElement("canvas");
                  const rctx = roi.getContext("2d");
                  if (!rctx) continue;

                  // Ensure minimum ROI dimensions
                  const minROISize = 50;
                  roi.width = Math.max(cw, minROISize);
                  roi.height = Math.max(ch, minROISize);

                  rctx.drawImage(
                    img,
                    minX,
                    minY,
                    cw,
                    ch,
                    0,
                    0,
                    roi.width,
                    roi.height
                  );
                  const val = await tryDetectFromCanvas(roi);
                  if (val) {
                    resolveOuter(val);
                    return;
                  }
                }
              }
              resolveOuter(null);
            }
          );
        });
      }

      URL.revokeObjectURL(url);

      if (text) handleResult(text);
      else setError("No barcode detected in the image");
    } catch (err) {
      setError("Failed to process image");
    }
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="rounded-full font-medium py-2 px-6 bg-primary text-background disabled:opacity-60"
      >
        {loading ? "Detecting..." : "Upload image"}
      </button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
