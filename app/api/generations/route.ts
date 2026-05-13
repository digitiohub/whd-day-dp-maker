import { NextResponse } from "next/server";

import { logGeneration } from "@/lib/generations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { frameId?: unknown };
    const frameId = typeof payload.frameId === "string" ? payload.frameId : "";
    const result = await logGeneration(frameId);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save the generation.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
