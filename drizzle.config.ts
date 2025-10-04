import "dotenv/config";

import type { Config } from "drizzle-kit";

if (!process.env.DB) {
  throw new Error("Missing required DB connection string in environment variable `DB`");
}

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB,
  },
} satisfies Config;
