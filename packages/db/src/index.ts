import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { dbConfig } from "@repo/config";
import * as schema from "./schema.js";

const { Pool } = pg;

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: dbConfig.url,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

export * from "./schema.js";

// Export drizzle-orm utilities to ensure version consistency
export { eq, and, or, not, sql, desc, asc } from "drizzle-orm";
