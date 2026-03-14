
import { DatabaseStorage } from "../server/storage.ts";

async function main() {
  const storage = new DatabaseStorage();
  try {
    const users = await storage.listSupplierUsers();
    console.log("SUPPLIER_USERS:", JSON.stringify(users, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
