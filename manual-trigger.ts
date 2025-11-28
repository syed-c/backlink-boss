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

// Supabase configuration - Using SERVICE_ROLE_KEY instead of anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Key:', supabaseServiceKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manualTrigger(campaignId: string) {
  try {
    console.log(`\n=== TESTING SIMPLE-TEST FUNCTION ===`);
    
    // Test the simple test function
    const { data: simpleData, error: simpleError } = await supabase.functions.invoke('simple-test');
    
    console.log('Simple test response:', { simpleData, simpleError });
    
    // Test generate-heading function
    console.log(`\n=== TESTING GENERATE-HEADING FUNCTION ===`);
    const testCampaign = {
      category: 'Test Category',
      location: 'Test Location',
      company_name: 'Test Company',
      keyword_1: 'Keyword 1',
      keyword_2: 'Keyword 2',
      keyword_3: 'Keyword 3',
      keyword_4: 'Keyword 4',
      keyword_5: 'Keyword 5'
    };
    
    const { data: headingData, error: headingError } = await supabase.functions.invoke('generate-heading', {
      body: JSON.stringify({ 
        campaign: testCampaign,
        websiteId: 'test-website-id'
      })
    });
    
    console.log('Generate heading response:', { headingData, headingError });
    
    // Test debug-campaign function
    console.log(`\n=== TESTING DEBUG-CAMPAIGN FUNCTION ===`);
    const { data: debugData, error: debugError } = await supabase.functions.invoke('debug-campaign', {
      body: JSON.stringify({ campaignId })
    });
    
    console.log('Debug campaign response:', { debugData, debugError });
    
    console.log(`\n=== MANUALLY TRIGGERING PROCESS-CAMPAIGN FOR ${campaignId} ===`);
    
    // Try a simple GET request to the health endpoint first
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('https://qqqudnynjmjdutvebpdw.supabase.co/functions/v1/process-campaign/health');
    console.log('Health endpoint response status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health endpoint data:', healthData);
    } else {
      console.log('Health endpoint error:', await healthResponse.text());
    }
    
    // First, reset the campaign status to queued
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'queued' })
      .eq('id', campaignId);
      
    if (updateError) {
      console.error('Error updating campaign status:', updateError);
      return;
    }
    
    console.log('Campaign status updated to queued');
    
    // Now trigger the function
    console.log('Triggering process-campaign function...');
    
    const { data, error } = await supabase.functions.invoke('process-campaign', {
      body: JSON.stringify({ campaignId })
    });
    
    console.log('Function response:', { data, error });
    
    if (error) {
      console.error('Function error:', error);
    }
    
    if (data) {
      console.log('Function data:', data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test with the problematic campaign
manualTrigger('aa7335c9-14f5-4086-8507-e3fde9e788ee');