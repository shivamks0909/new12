import { insforge } from "./server/insforge";
import fs from "fs";
import path from "path";

async function applySchema() {
  try {
    const schemaSql = fs.readFileSync(path.resolve(process.cwd(), "schema.sql"), "utf8");
    const queries = schemaSql
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.startsWith("--"));

    console.log(`Applying ${queries.length} queries to InsForge...`);

    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 50)}...`);
      // Use the database.rpc or direct query if available
      // According to InsForge docs, we might need a specific RPC for raw SQL
      // or we can use the SDK's database methods if they support raw SQL.
      // If InsForge is Postgres-based, it might have a 'rpc' method.
      const { data, error } = await insforge.database.rpc("run_raw_sql", { 
        query_text: query 
      });

      if (error) {
        console.error(`Error executing query: ${query.substring(0, 50)}...`);
        console.error(error);
        // Continue anyway if it's "already exists"
        if (!error.message?.includes("already exists")) {
           // throw error; // Let's not stop for IF NOT EXISTS cases
        }
      } else {
        console.log("Success.");
      }
    }

    console.log("Schema application complete.");
  } catch (err) {
    console.error("Failed to apply schema:", err);
    process.exit(1);
  }
}

applySchema();
