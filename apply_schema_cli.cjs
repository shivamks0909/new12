const { execSync } = require('child_process');
const fs = require('fs');

const sql = fs.readFileSync('schema.sql', 'utf8');

try {
  console.log("Applying schema...");
  // Escape quotes for bash/powershell
  const escapedSql = sql.replace(/"/g, '\\"').replace(/`/g, '\\`');
  
  // Actually, let's write it to a temp file and use import if query fails
  const result = execSync(`npx @insforge/cli db query "${escapedSql}"`, { encoding: 'utf8' });
  console.log("Result:", result);
} catch (err) {
  console.error("Failed to apply schema via query:", err.stderr || err.message);
  console.log("Attempting import instead...");
  try {
    const result = execSync(`npx @insforge/cli db import schema.sql`, { encoding: 'utf8' });
    console.log("Import Result:", result);
  } catch (importErr) {
    console.error("Import also failed:", importErr.stderr || importErr.message);
  }
}
