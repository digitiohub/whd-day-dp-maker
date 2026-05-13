import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";

export const WAD_FRAME_ID = "mothers-day-dp-2026";
export const GENERATION_EVENTS_COLLECTION = "wad_generation_events";
export const GENERATION_TOTALS_COLLECTION = "wad_generation_totals";

type GenerationEventDocument = {
  _id?: ObjectId;
  frameId: typeof WAD_FRAME_ID;
  generatedAt: Date;
};

type GenerationTotalDocument = {
  _id: "global";
  totalGenerations: number;
  updatedAt: Date;
};

export type RecentGenerationEvent = {
  id: string;
  frameId: string;
  generatedAt: Date;
};

let indexesPromise: Promise<void> | null = null;

async function getGenerationEventsCollection() {
  const db = await getDb();

  return db.collection<GenerationEventDocument>(GENERATION_EVENTS_COLLECTION);
}

async function getGenerationTotalsCollection() {
  const db = await getDb();

  return db.collection<GenerationTotalDocument>(GENERATION_TOTALS_COLLECTION);
}

export async function ensureGenerationIndexes() {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const events = await getGenerationEventsCollection();

      await Promise.all([
        events.createIndex(
          { generatedAt: -1 },
          { name: "wad_event_generated_at_desc" }
        ),
        events.createIndex(
          { frameId: 1, generatedAt: -1 },
          { name: "wad_event_frame_generated_at" }
        ),
      ]);
    })();
  }

  return indexesPromise;
}

function getStartOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function logGeneration(frameId: string) {
  if (frameId !== WAD_FRAME_ID) {
    throw new Error("Unknown frame ID.");
  }

  await ensureGenerationIndexes();

  const generatedAt = new Date();
  const [events, totals] = await Promise.all([
    getGenerationEventsCollection(),
    getGenerationTotalsCollection(),
  ]);

  const [, totalDocument] = await Promise.all([
    events.insertOne({
      frameId,
      generatedAt,
    }),
    totals.findOneAndUpdate(
      { _id: "global" },
      {
        $inc: { totalGenerations: 1 },
        $set: { updatedAt: generatedAt },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    ),
  ]);

  return {
    totalGenerations: totalDocument?.totalGenerations ?? 1,
  };
}

export async function getGenerationStats() {
  await ensureGenerationIndexes();

  const startOfToday = getStartOfToday();
  const [events, totals] = await Promise.all([
    getGenerationEventsCollection(),
    getGenerationTotalsCollection(),
  ]);

  const [totalDocument, todayCount, recentEvents] = await Promise.all([
    totals.findOne({ _id: "global" }),
    events.countDocuments({
      generatedAt: {
        $gte: startOfToday,
      },
    }),
    events
      .find({})
      .sort({ generatedAt: -1 })
      .limit(25)
      .toArray(),
  ]);

  return {
    totalGenerations: totalDocument?.totalGenerations ?? 0,
    todayCount,
    recentEvents: recentEvents.map((event) => ({
      id: event._id?.toString() ?? "",
      frameId: event.frameId,
      generatedAt: event.generatedAt,
    })) satisfies RecentGenerationEvent[],
  };
}
