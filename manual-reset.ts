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

async function manualReset(campaignId: string) {
  try {
    console.log(`\n=== MANUALLY RESETTING CAMPAIGN ${campaignId} ===`);
    
    // First, check if campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (fetchError) {
      console.error('Error fetching campaign:', fetchError);
      return;
    }

    if (!campaign) {
      console.error('Campaign not found');
      return;
    }

    console.log('Current campaign status:', campaign.status);
    console.log('Last updated:', campaign.updated_at);
    
    // Reset campaign status to queued
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        status: 'queued',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign status:', updateError);
      return;
    }

    console.log('Campaign status updated to queued');
    
    // Reset backlinks to pending
    const { error: backlinkError } = await supabase
      .from('backlinks')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId);

    if (backlinkError) {
      console.error('Error updating backlink statuses:', backlinkError);
      return;
    }

    console.log('Backlink statuses updated to pending');
    console.log('✅ Manual reset completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Reset the problematic campaign
manualReset('4e949b87-060b-4b44-9b9f-6634b13ee758');