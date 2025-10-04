import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

const connectionString = process.env.DB;

if (!connectionString) {
  throw new Error("Missing required DB connection string in environment variable `DB`");
}

const client = neon(connectionString);

export const db = drizzle(client, {
  schema,
});

export type Database = typeof db;
