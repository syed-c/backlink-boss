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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Backlink {
  id: string;
  status: string;
}

interface CampaignWithBacklinks {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  indexed_backlinks: number | null;
  total_backlinks: number | null;
  backlinks: Backlink[];
}

interface ProcessingBacklink {
  id: string;
  url: string;
  status: string;
  campaign: {
    name: string;
    id: string;
  } | null;
}

async function diagnoseCampaigns() {
  try {
    console.log('Diagnosing campaign issues...\n');
    
    // Get all campaigns with detailed information
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        backlinks(id, status)
      `)
      .order('created_at', { ascending: false });

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
      return;
    }

    console.log('=== ALL CAMPAIGNS ===');
    (campaigns as CampaignWithBacklinks[]).forEach(campaign => {
      // Count backlinks by status
      const backlinkStatuses: Record<string, number> = {};
      if (campaign.backlinks && Array.isArray(campaign.backlinks)) {
        campaign.backlinks.forEach((backlink) => {
          backlinkStatuses[backlink.status] = (backlinkStatuses[backlink.status] || 0) + 1;
        });
      }
      
      console.log(`\nCampaign: ${campaign.name} (${campaign.id})`);
      console.log(`  Status: ${campaign.status}`);
      console.log(`  Created: ${campaign.created_at}`);
      console.log(`  Updated: ${campaign.updated_at}`);
      console.log(`  Completed: ${campaign.completed_at || 'Not completed'}`);
      console.log(`  Backlinks: ${campaign.indexed_backlinks || 0}/${campaign.total_backlinks || 0}`);
      
      if (Object.keys(backlinkStatuses).length > 0) {
        console.log('  Backlink Statuses:');
        Object.entries(backlinkStatuses).forEach(([status, count]) => {
          console.log(`    ${status}: ${count}`);
        });
      }
      
      // Check if campaign might be stuck
      if (campaign.status === 'running') {
        const lastUpdated = new Date(campaign.updated_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        
        console.log(`  Last updated: ${timeDiffMinutes.toFixed(1)} minutes ago`);
        
        const processingCount = backlinkStatuses['processing'] || 0;
        if (timeDiffMinutes > 30 || processingCount === 0) {
          console.log('  ⚠️  POTENTIALLY STUCK CAMPAIGN');
        }
      }
    });
    
    // Check for any backlinks that are in 'processing' status
    console.log('\n=== PROCESSING BACKLINKS ===');
    const { data: processingBacklinks, error: backlinkError } = await supabase
      .from('backlinks')
      .select(`
        id,
        url,
        status,
        campaign:campaigns(name, id)
      `)
      .eq('status', 'processing');

    if (backlinkError) {
      console.error('Error fetching processing backlinks:', backlinkError);
    } else {
      console.log(`Found ${processingBacklinks.length} backlinks in processing status:`);
      if (processingBacklinks.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processingBacklinks.forEach((backlink: any) => {
          console.log(`  - ${backlink.url} (${backlink.id})`);
          console.log(`    Campaign: ${backlink.campaign?.name || 'Unknown'} (${backlink.campaign?.id || 'Unknown'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

diagnoseCampaigns();