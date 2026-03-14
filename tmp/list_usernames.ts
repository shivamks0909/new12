
import { DatabaseStorage } from "../server/storage.ts";

async function main() {
  const storage = new DatabaseStorage();
  try {
    const users = await storage.listSupplierUsers();
    users.forEach(u => console.log(`USER: ${u.username} CODE: ${u.supplierCode}`));
  } catch (e) {
    console.error(e);
  }
}
main();
