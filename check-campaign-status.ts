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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCampaignStatus() {
  try {
    console.log('Checking campaign status...');
    
    // Get all campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
      return;
    }

    console.log('\n=== CAMPAIGNS ===');
    campaigns.forEach(campaign => {
      console.log(`- ${campaign.name} (${campaign.id}): ${campaign.status}`);
      console.log(`  Updated: ${campaign.updated_at}`);
      console.log(`  Backlinks: ${campaign.indexed_backlinks || 0}/${campaign.total_backlinks || 0}`);
    });

    // For each running campaign, check backlink status
    const runningCampaigns = campaigns.filter(c => c.status === 'running');
    
    if (runningCampaigns.length > 0) {
      console.log('\n=== RUNNING CAMPAIGNS BACKLINK STATUS ===');
      
      for (const campaign of runningCampaigns) {
        console.log(`\nCampaign: ${campaign.name} (${campaign.id})`);
        
        const { data: backlinks, error: backlinkError } = await supabase
          .from('backlinks')
          .select('id, url, status')
          .eq('campaign_id', campaign.id);

        if (backlinkError) {
          console.error('Error fetching backlinks:', backlinkError);
          continue;
        }

        console.log(`Total backlinks: ${backlinks.length}`);
        
        const statusCounts: Record<string, number> = {};
        backlinks.forEach(backlink => {
          statusCounts[backlink.status] = (statusCounts[backlink.status] || 0) + 1;
        });
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
        
        // Show some sample backlinks
        const processingBacklinks = backlinks.filter(b => b.status === 'processing');
        if (processingBacklinks.length > 0) {
          console.log('Sample processing backlinks:');
          processingBacklinks.slice(0, 3).forEach(b => {
            console.log(`  - ${b.url}`);
          });
        }
      }
    } else {
      console.log('\nNo campaigns are currently running.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCampaignStatus();