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

// Supabase configuration - Using service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Using Service Role Key:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addErrorColumn() {
  try {
    console.log('\n=== ADDING ERROR_MESSAGE COLUMN TO CAMPAIGNS TABLE ===');
    
    // Note: We can't directly alter tables with Supabase client
    // We need to use the Supabase dashboard or CLI for this
    // But we can check if the column exists by trying to select it
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('error_message')
      .limit(1);

    if (error && error.message.includes('column "error_message" does not exist')) {
      console.log('❌ Column error_message does not exist');
      console.log('Please add the column manually using Supabase dashboard:');
      console.log('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS error_message TEXT;');
    } else if (error) {
      console.error('Error checking column:', error);
    } else {
      console.log('✅ Column error_message already exists');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addErrorColumn();