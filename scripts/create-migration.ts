#!/usr/bin/env node

/**
 * Migration File Generator for AgentVerse
 * 
 * Creates a new migration file with timestamp and optional description
 * Usage: npm run db:new <description>
 * Example: npm run db:new add_user_preferences
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get migration name from command line arguments
const args = process.argv.slice(2);
const description = args[0] || 'migration';

// Sanitize description (remove spaces, special chars, make lowercase)
const sanitizedDescription = description
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

// Generate timestamp in format: YYYYMMDDHHMMSS
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

// Generate migration file name: YYYYMMDDHHMMSS_description.sql
const migrationFileName = `${timestamp}_${sanitizedDescription}.sql`;

// Get migrations directory
const migrationsDir = path.join(__dirname, '../supabase/migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Full path to migration file
const migrationFilePath = path.join(migrationsDir, migrationFileName);

// Migration template
const migrationTemplate = `-- Migration: ${description}
-- Created: ${now.toISOString()}
-- Description: ${description}

-- Add your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column TEXT;

`;

// Check if file already exists
if (fs.existsSync(migrationFilePath)) {
  console.error(`❌ Migration file already exists: ${migrationFileName}`);
  process.exit(1);
}

// Write migration file
try {
  fs.writeFileSync(migrationFilePath, migrationTemplate, 'utf-8');
  console.log(`✅ Created migration file: ${migrationFileName}`);
  console.log(`📁 Location: ${migrationFilePath}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Edit the migration file: ${migrationFilePath}`);
  console.log(`   2. Add your SQL statements`);
  console.log(`   3. Run: npm run db:setup`);
} catch (error: any) {
  console.error(`❌ Error creating migration file:`, error.message);
  process.exit(1);
}

