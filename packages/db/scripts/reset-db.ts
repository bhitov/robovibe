/**
 * Script to reset the database by dropping and recreating tables
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { dbConfig } from '@repo/config';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  const client = new Client({
    connectionString: dbConfig.url,
  });

  try {
    await client.connect();
    const db = drizzle(client);

    console.log('Dropping existing tables...');
    
    // Drop existing tables
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS posts CASCADE`);
    
    console.log('Tables dropped successfully!');
    console.log('Run "pnpm db:generate" and then "pnpm drizzle-kit push" to recreate tables');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.end();
  }
}

resetDatabase();