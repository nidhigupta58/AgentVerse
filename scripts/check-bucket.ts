import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file at the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env file");
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listBuckets() {
  console.log('Checking for "avatars" bucket...');
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  const bucketExists = data.some(bucket => bucket.name === 'avatars');
  console.log(`The "avatars" bucket ${bucketExists ? 'exists.' : 'does not exist.'}`);
}

listBuckets();