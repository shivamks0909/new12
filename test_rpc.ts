import { insforge } from "./server/insforge";

async function test() {
  console.log("Checking for SQL execution capability...");
  try {
    // Try a simple RPC call that might exist for executing SQL
    const { data, error } = await (insforge.database as any).rpc('exec_sql', { 
      query: 'SELECT 1' 
    });
    
    if (error) {
      console.log("RPC 'exec_sql' not found or failed:", error.message);
    } else {
      console.log("RPC 'exec_sql' works!", data);
    }
  } catch (err: any) {
    console.log("Error testing RPC:", err.message);
  }
}

test();
