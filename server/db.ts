import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

export const pool = new pg.Pool({
  connectionString,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") 
    ? { rejectUnauthorized: false } 
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
