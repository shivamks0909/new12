const { createClient } = require("@insforge/sdk");
const dotenv = require("dotenv");
dotenv.config();

const client = createClient({
  baseUrl: process.env.INSFORGE_BASE_URL,
  anonKey: process.env.INSFORGE_API_KEY
});

async function run() {
  const hash = "$2b$10$JRV4yoR9JEuqD.Nk2nXmyeEnmgLhqRhzUZBtiboov8TRE72nEsE0W"; // admin123
  const { data, error } = await client.database
    .from("admins")
    .update({ password_hash: hash })
    .eq("username", "admin");
    
  if (error) {
    console.error("Update error:", error);
  } else {
    console.log("Password updated successfully");
  }
}

run();
