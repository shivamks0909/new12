import { db } from './server/db.ts';
import { projects } from './shared/schema.ts';

async function check() {
    try {
        const allProjects = await db.select().from(projects);
        console.log('Local Projects:', JSON.stringify(allProjects, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error querying local db:', err.message);
        process.exit(1);
    }
}

check();
