import "dotenv/config";
import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: process.env.INSFORGE_BASE_URL || "https://example.com",
  anonKey: process.env.INSFORGE_API_KEY || "test",
});

console.log('--- InsForge Client Test ---');
console.log('Client exists:', !!insforge);
if (insforge) {
    console.log('Database property:', insforge.database ? 'Defined' : 'Undefined');
    console.log('Auth property:', insforge.auth ? 'Defined' : 'Undefined');
    console.log('Storage property:', insforge.storage ? 'Defined' : 'Undefined');
    console.log('Functions property:', insforge.functions ? 'Defined' : 'Undefined');
    
    if (insforge.database) {
        console.log('Database from method exists:', typeof insforge.database.from === 'function');
    }
}
console.log('---------------------------');
