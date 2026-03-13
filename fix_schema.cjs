const { execSync } = require('child_process');
const fs = require('fs');

const tables = [
  "project_s2s_config",
  "s2s_logs",
  "supplier_assignments",
  "activity_logs",
  "respondents",
  "suppliers",
  "country_surveys",
  "projects",
  "clients",
  "admins"
];

async function run() {
  console.log("Cleaning up existing tables...");
  for (const table of tables) {
    try {
      execSync(`npx @insforge/cli db query "DROP TABLE IF EXISTS ${table} CASCADE;"`, { stdio: 'ignore' });
    } catch (e) {}
  }

  console.log("Reading schema.sql...");
  let sql = fs.readFileSync('schema.sql', 'utf8');
  
  // Remove comments
  sql = sql.replace(/--.*$/gm, '');

  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  console.log(`Executing ${statements.length} statements...`);
  for (const statement of statements) {
    try {
      fs.writeFileSync('temp_query.sql', statement + ';');
      console.log(`Executing: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
      execSync(`powershell -Command "npx @insforge/cli db query (Get-Content temp_query.sql -Raw)"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Error executing statement.`);
    }
  }
  
  if (fs.existsSync('temp_query.sql')) fs.unlinkSync('temp_query.sql');
  console.log("Schema fix complete.");
}

run();
