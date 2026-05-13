import { MongoClient } from "mongodb";

import { getMongoConfig } from "@/lib/config";

declare global {
  var wadMongoClientPromise: Promise<MongoClient> | undefined;
}

function createMongoClient() {
  const { uri } = getMongoConfig();
  const client = new MongoClient(uri);

  return client.connect();
}

export async function getMongoClient() {
  if (!globalThis.wadMongoClientPromise) {
    globalThis.wadMongoClientPromise = createMongoClient();
  }

  return globalThis.wadMongoClientPromise;
}

export async function getDb() {
  const { dbName } = getMongoConfig();
  const client = await getMongoClient();

  return client.db(dbName);
}
