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

async function testCampaign(campaignId: string) {
  try {
    console.log(`\n=== TESTING CAMPAIGN ${campaignId} ===`);
    
    // First, check if campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select(`
        *,
        website:websites!inner(*),
        backlinks(*)
      `)
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

    console.log('Campaign found:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      error_message: campaign.error_message,
      website: {
        url: campaign.website?.url,
        wp_username: campaign.website?.wp_username ? 'SET' : 'MISSING',
        wp_app_password: campaign.website?.wp_app_password ? 'SET' : 'MISSING'
      }
    });
    
    // Check required campaign fields
    const requiredFields = [
      'category', 'location', 'company_name',
      'keyword_1', 'keyword_2', 'keyword_3', 'keyword_4', 'keyword_5'
    ];
    
    const missingFields = requiredFields.filter(field => !campaign[field as keyof typeof campaign]);
    
    if (missingFields.length > 0) {
      console.error('Missing required campaign fields:', missingFields);
    } else {
      console.log('All required campaign fields are present');
    }
    
    // Check backlinks
    console.log(`Campaign has ${campaign.backlinks?.length || 0} backlinks`);
    
    if (campaign.backlinks && campaign.backlinks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const backlinksWithUrls = campaign.backlinks.filter((b: any) => b.url);
      console.log(`Backlinks with URLs: ${backlinksWithUrls.length}`);
      
      if (backlinksWithUrls.length === 0) {
        console.error('No backlinks have URLs');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test the problematic campaign
testCampaign('aa7335c9-14f5-4086-8507-e3fde9e788ee');