
import { DatabaseStorage } from "../server/storage.ts";

async function main() {
  const storage = new DatabaseStorage();
  try {
    const users = await storage.listSupplierUsers();
    for (const u of users) {
      const access = await storage.getSupplierProjectAccess(u.id);
      console.log(`USER: ${u.username} has access to ${access.length} projects.`);
      access.forEach(a => console.log(` - Project: ${a.projectCode}`));
    }
  } catch (e) {
    console.error(e);
  }
}
main();
