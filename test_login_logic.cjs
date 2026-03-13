const { createClient } = require("@insforge/sdk");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const client = createClient({
  baseUrl: process.env.INSFORGE_BASE_URL,
  anonKey: process.env.INSFORGE_API_KEY
});

async function test() {
  const { data, error } = await client.database.from("admins").select("*").eq("username", "admin").single();
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  console.log("Raw DB Data:", data);
  const password = "admin123";
  const valid = await bcrypt.compare(password, data.password_hash);
  console.log("Password valid:", valid);
}

test();
