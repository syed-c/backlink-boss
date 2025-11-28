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

async function resetStuckCampaigns() {
  try {
    console.log('\n=== FINDING AND RESETTING STUCK CAMPAIGNS ===');
    
    // Get all running campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'running');

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
      return;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No running campaigns found');
      return;
    }

    console.log(`Found ${campaigns.length} running campaigns:`);
    
    for (const campaign of campaigns) {
      console.log(`\n--- Checking campaign: ${campaign.name} (${campaign.id}) ---`);
      
      // Check when the campaign was last updated
      const lastUpdated = new Date(campaign.updated_at);
      const now = new Date();
      const timeDiffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
      
      console.log(`  Last updated: ${timeDiffMinutes.toFixed(1)} minutes ago`);
      
      // Check for processing backlinks
      const { data: processingBacklinks, error: backlinkError } = await supabase
        .from('backlinks')
        .select('*', { count: 'exact' })
        .eq('campaign_id', campaign.id)
        .eq('status', 'processing');

      if (backlinkError) {
        console.error('  Error checking backlinks:', backlinkError);
        continue;
      }

      const processingCount = processingBacklinks?.length || 0;
      console.log(`  Processing backlinks: ${processingCount}`);
      
      // Consider campaign stuck if:
      // 1. It hasn't been updated in over 30 minutes, OR
      // 2. There are no processing backlinks (it's idle despite showing as running)
      const isStuck = timeDiffMinutes > 30 || processingCount === 0;
      
      if (isStuck) {
        console.log(`  ⚠️  Campaign appears to be stuck. Resetting...`);
        
        // Reset campaign status to queued
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ 
            status: 'queued',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        if (updateError) {
          console.error('  Error updating campaign status:', updateError);
          continue;
        }

        console.log('  Campaign status updated to queued');
        
        // Reset backlinks to pending
        const { error: backlinkError2 } = await supabase
          .from('backlinks')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign.id);

        if (backlinkError2) {
          console.error('  Error updating backlink statuses:', backlinkError2);
          continue;
        }

        console.log('  Backlink statuses updated to pending');
        console.log('  ✅ Campaign reset completed!');
      } else {
        console.log('  🔄 Campaign appears to be actively processing');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetStuckCampaigns();