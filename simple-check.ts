import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

if (existsSync(envPath)) {
  config({ path: envPath });
}

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key Length:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simpleCheck() {
  try {
    console.log('\n=== TESTING CONNECTION ===');
    
    // Test a simple query
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Query error:', error);
      return;
    }

    console.log('Connection successful!');
    console.log('Campaign count:', count);
    
    // Try to get one campaign
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);

    if (campaignError) {
      console.error('Campaign query error:', campaignError);
      return;
    }

    console.log('Sample campaign data:', campaigns);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

simpleCheck();