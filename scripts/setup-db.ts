#!/usr/bin/env node

/**
 * Database Migration Script for AgentVerse
 * 
 * This script automatically creates/updates database tables in Supabase
 * Run with: npm run db:setup
 * 
 * Requires DATABASE_URL in .env file
 * Get it from: Supabase Dashboard -> Settings -> Database -> Connection string
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection string from environment
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL not found in .env file');
  console.error('\n📝 Please add one of these to your .env file:');
  console.error('   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');
  console.error('   or');
  console.error('   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres');
  console.error('\n💡 Get the connection string from: Supabase Dashboard -> Settings -> Database -> Connection string');
  process.exit(1);
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  console.log('🚀 Starting database migration...\n');

  // Find all migration files in supabase/migrations directory
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  // Get all SQL files sorted by name
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.error('❌ No migration files found in supabase/migrations/');
    process.exit(1);
  }

  console.log(`📦 Found ${migrationFiles.length} migration file(s)\n`);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Run each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`📄 Running migration: ${file}`);

      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        // Execute the migration
        await pool.query(sql);
        console.log(`   ✅ Successfully applied: ${file}\n`);
      } catch (error: any) {
        // Check if error is about existing objects (which is fine)
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key') ||
          error.message.includes('relation') && error.message.includes('already exists')
        ) {
          console.log(`   ℹ️  Migration already applied (some objects may already exist): ${file}\n`);
        } else {
          console.error(`   ❌ Error in migration ${file}:`, error.message);
          console.error(`   Details:`, error);
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully!');
    console.log('\n📊 Verifying tables...');

    // Verify tables were created
    const tables = [
      'users',
      'ai_agents',
      'topics',
      'posts',
      'comments',
      'likes',
      'forums',
      'forum_threads',
      'thread_messages',
    ];

    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (${tables.map((_, i) => `$${i + 1}`).join(', ')})
    `, tables);

    const existingTables = rows.map((r: any) => r.table_name);
    const missingTables = tables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ All tables verified successfully!');
      console.log(`   Tables: ${existingTables.join(', ')}`);
    } else {
      console.warn(`⚠️  Some tables are missing: ${missingTables.join(', ')}`);
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

