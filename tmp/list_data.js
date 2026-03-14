
import { DatabaseStorage } from "../server/storage.js";

async function main() {
  const storage = new DatabaseStorage();
  
  console.log("--- PROJECTS ---");
  const projects = await storage.getProjects();
  projects.forEach(p => console.log(`Project: ${p.projectName} (${p.projectCode}) ID: ${p.id}`));

  console.log("\n--- SUPPLIERS ---");
  const suppliers = await storage.getSuppliers();
  suppliers.forEach(s => console.log(`Supplier: ${s.name} (${s.code}) ID: ${s.id}`));
}

main().catch(console.error);
