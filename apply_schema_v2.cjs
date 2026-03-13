const { createClient } = require("@insforge/sdk");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const client = createClient({
  baseUrl: process.env.INSFORGE_BASE_URL,
  anonKey: process.env.INSFORGE_API_KEY
});

async function run() {
  const schema = fs.readFileSync("schema.sql", "utf8");
  // Split schema by semicolon but handle potential issues
  const queries = schema.split(";").map(q => q.trim()).filter(q => q.length > 0);

  console.log(`Executing ${queries.length} queries...`);
  if (queries.length === 0) {
    console.log("No queries found in schema.sql!");
  }

  for (let query of queries) {
    // Strip SQL comments
    const cleanQuery = query.replace(/--.*$/gm, "").trim();
    if (cleanQuery.length === 0) continue;
    
    console.log(`Executing query (${cleanQuery.length} chars): ${cleanQuery.substring(0, 50).replace(/\n/g, " ")}...`);
    try {
      const { data, error } = await client.database.rpc("run_raw_sql", { query_text: cleanQuery }); 
      if (error) {
        console.warn(`Query Warning: ${error.message}`);
      } else {
        console.log("Result:", data || "OK");
      }
    } catch (e) {
      console.error(`Execution error: ${e.message}`);
    }
  }
}

run().then(() => console.log("Done.")).catch(console.error);
