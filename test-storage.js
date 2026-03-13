import { storage } from "./server/storage.js";

async function test() {
  console.log("Importing storage module...");
  try {
    const admin = await storage.getAdminByUsername("admin");
    console.log("Admin lookup successful:", admin);
  } catch (err) {
    console.error("Error during storage lookup:", err);
  }
}

test();
