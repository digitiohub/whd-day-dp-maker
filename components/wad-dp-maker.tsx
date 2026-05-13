"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import {
  Download,
  ImagePlus,
  LoaderCircle,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const FRAME_CONFIG = {
  id: "mothers-day-dp-2026",
  src: "/doctor_dp.png",
  outputSize: 900,
  photoX: 64,
  photoY: 64,
  photoWidth: 772,
  photoHeight: 594,
} as const;

const DEFAULT_CROP: Point = { x: 0, y: 0 };
const DEFAULT_ZOOM = 1.05;
const CROP_ASPECT = FRAME_CONFIG.photoWidth / FRAME_CONFIG.photoHeight;

type GeneratedAsset = {
  file: File;
  url: string;
};

type DrawFramedPhotoParams = {
  context: CanvasRenderingContext2D;
  cropArea: Area;
  frame: HTMLImageElement;
  photo: HTMLImageElement;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image asset."));
    image.src = src;
  });
}

function drawFramedPhoto({
  context,
  cropArea,
  frame,
  photo,
}: DrawFramedPhotoParams) {
  context.clearRect(0, 0, FRAME_CONFIG.outputSize, FRAME_CONFIG.outputSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, FRAME_CONFIG.outputSize, FRAME_CONFIG.outputSize);

  context.drawImage(
    photo,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    FRAME_CONFIG.photoX,
    FRAME_CONFIG.photoY,
    FRAME_CONFIG.photoWidth,
    FRAME_CONFIG.photoHeight
  );
  context.drawImage(
    frame,
    0,
    0,
    FRAME_CONFIG.outputSize,
    FRAME_CONFIG.outputSize
  );
}

async function renderFramedJpg({
  cropArea,
  frame,
  photo,
}: Omit<DrawFramedPhotoParams, "context">) {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_CONFIG.outputSize;
  canvas.height = FRAME_CONFIG.outputSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create the image canvas.");
  }

  drawFramedPhoto({
    context,
    cropArea,
    frame,
    photo,
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.95)
  );

  if (!blob) {
    throw new Error("Unable to export the JPG.");
  }

  return blob;
}

function buildFileName() {
  return "mothers-day-2026-dp.jpg";
}

export function WadDpMaker() {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Point>(DEFAULT_CROP);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (generatedAsset) {
        URL.revokeObjectURL(generatedAsset.url);
      }
    };
  }, [generatedAsset]);

  useEffect(() => {
    let isActive = true;

    void loadImage(FRAME_CONFIG.src)
      .then((image) => {
        if (isActive) {
          setFrameImage(image);
        }
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage("Unable to load the Mother's Day frame.");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!photoUrl) {
      return;
    }

    let isActive = true;

    void loadImage(photoUrl)
      .then((image) => {
        if (isActive) {
          setPhotoImage(image);
        }
      })
      .catch(() => {
        if (isActive) {
          setPhotoImage(null);
          setErrorMessage("Unable to load that photo. Please try another file.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [photoUrl]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;

    if (!canvas || !photoImage || !frameImage || !croppedAreaPixels) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    canvas.width = FRAME_CONFIG.outputSize;
    canvas.height = FRAME_CONFIG.outputSize;
    drawFramedPhoto({
      context,
      cropArea: croppedAreaPixels,
      frame: frameImage,
      photo: photoImage,
    });
  }, [croppedAreaPixels, frameImage, photoImage]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setErrorMessage(null);
    setGeneratedAsset((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a JPG, PNG, or other image file.");
      event.target.value = "";
      return;
    }

    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    setPhotoUrl(URL.createObjectURL(file));
    setCrop(DEFAULT_CROP);
    setZoom(DEFAULT_ZOOM);
  }

  async function logGeneration() {
    const response = await fetch("/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        frameId: FRAME_CONFIG.id,
      }),
    });

    if (!response.ok) {
      throw new Error("The image was created, but the count could not be saved.");
    }

    return (await response.json()) as { totalGenerations: number };
  }

  async function handleGenerate() {
    if (!photoImage || !frameImage || !croppedAreaPixels) {
      setErrorMessage(
        "Upload and position a photo before generating the Mother's Day DP."
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const blob = await renderFramedJpg({
        cropArea: croppedAreaPixels,
        frame: frameImage,
        photo: photoImage,
      });
      const file = new File([blob], buildFileName(), { type: "image/jpeg" });
      const url = URL.createObjectURL(file);

      setGeneratedAsset((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
        }

        return { file, url };
      });

      try {
        await logGeneration();
      } catch {}
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate the DP."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    setErrorMessage(null);
    setCrop(DEFAULT_CROP);
    setZoom(DEFAULT_ZOOM);
    setGeneratedAsset((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });
  }

  const canGenerate = Boolean(photoImage && frameImage && croppedAreaPixels);

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-3 py-3 text-[var(--ink)] sm:px-4 sm:py-4 lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-7xl items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-[0_18px_60px_rgba(12,26,35,0.10)] sm:p-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-green)]">
                Mother's Day
              </p>
              <h1 className="font-heading text-4xl leading-none font-semibold text-[var(--ink)] sm:text-5xl">
                Mother's Day 2026 DP Maker
              </h1>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-[0_18px_60px_rgba(12,26,35,0.10)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Photo editor
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                  Position the photo
                </h2>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(23,81,128,0.22)] transition hover:bg-[var(--brand-blue-strong)]">
                <ImagePlus className="size-4" />
                Upload Photo
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  type="file"
                />
              </label>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--stage-bg)]">
              <div className="relative aspect-[772/594] w-full">
                {photoUrl ? (
                  <Cropper
                    aspect={CROP_ASPECT}
                    crop={crop}
                    image={photoUrl}
                    maxZoom={4}
                    minZoom={1}
                    objectFit="horizontal-cover"
                    onCropChange={setCrop}
                    onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                    onZoomChange={setZoom}
                    showGrid={false}
                    zoom={zoom}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-white text-[var(--brand-blue)] shadow-sm">
                      <ImagePlus className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        Upload a photo
                      </p>
                      <p className="mt-1 max-w-sm text-sm leading-5 text-[var(--muted-ink)]">
                        Use a clear portrait. You can adjust crop and zoom before
                        generating the final DP.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    className="text-sm font-medium text-[var(--ink)]"
                    htmlFor="zoom"
                  >
                    Zoom
                  </label>
                  <span className="text-sm text-[var(--muted-ink)]">
                    {zoom.toFixed(2)}x
                  </span>
                </div>
                <input
                  className="w-full accent-[var(--brand-blue)]"
                  disabled={!photoUrl}
                  id="zoom"
                  max={4}
                  min={1}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  step={0.01}
                  type="range"
                  value={zoom}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="h-10 bg-[var(--brand-blue)] px-4 text-white hover:bg-[var(--brand-blue-strong)]"
                  disabled={!canGenerate || isGenerating}
                  onClick={handleGenerate}
                  type="button"
                >
                  {isGenerating ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Generate JPG
                </Button>
                <Button
                  className="h-10 px-4"
                  onClick={handleReset}
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw className="size-4" />
                  Reset
                </Button>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {errorMessage}
              </div>
            ) : null}

          </div>

          <aside className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-[0_18px_60px_rgba(12,26,35,0.10)] sm:p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-green)]">
                  Preview
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                  Final JPG
                </h2>
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--panel-border)] bg-white">
                {photoImage && croppedAreaPixels ? (
                  <canvas
                    ref={previewCanvasRef}
                    className="block aspect-square h-auto w-full"
                  />
                ) : (
                  <Image
                    alt="Mother's Day DP frame preview"
                    className="h-auto w-full"
                    height={900}
                    src={FRAME_CONFIG.src}
                    width={900}
                  />
                )}
              </div>

              {generatedAsset ? (
                <Button
                  asChild
                  className="h-10 w-full bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-strong)]"
                >
                  <a download={generatedAsset.file.name} href={generatedAsset.url}>
                    <Download className="size-4" />
                    Download JPG
                  </a>
                </Button>
              ) : (
                <div className="rounded-lg bg-white px-4 py-3 text-sm leading-5 text-[var(--muted-ink)]">
                  Generate the image to unlock the JPG download.
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
