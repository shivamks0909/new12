
import { DatabaseStorage } from "../server/storage.ts";

async function main() {
  console.log("Starting data fetch...");
  const storage = new DatabaseStorage();
  
  try {
    const projects = await storage.getProjects();
    console.log(`FOUND ${projects.length} PROJECTS`);
    projects.slice(0, 5).forEach(p => console.log(`PROJECT: ${p.projectName} (${p.projectCode}) ID: ${p.id}`));

    const suppliers = await storage.getSuppliers();
    console.log(`\nFOUND ${suppliers.length} SUPPLIERS`);
    suppliers.slice(0, 5).forEach(s => console.log(`SUPPLIER: ${s.name} (${s.code}) ID: ${s.id}`));
  } catch (err) {
    console.error("ERROR FETCHING DATA:", err);
  }
  process.exit(0);
}

main();
