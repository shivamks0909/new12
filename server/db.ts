import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
