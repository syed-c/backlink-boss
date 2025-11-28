// Follow this setup to get started:
// https://supabase.com/docs/guides/functions/quickstart

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Reset campaign function started");

serve(async (req) => {
  console.log('Reset campaign function invoked');
  
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Declare campaignId outside try block so it's accessible in catch block
  let campaignId: string | null = null;
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid request body' 
      }), { status: 400, headers: corsHeaders });
    }
    
    campaignId = requestBody.campaignId || null;
    
    if (!campaignId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing campaignId' 
      }), { status: 400, headers: corsHeaders });
    }
    
    console.log('Resetting campaign:', campaignId);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables:', { supabaseUrl, serviceRoleKey });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing environment variables' 
      }), { status: 500, headers: corsHeaders });
    }
    
    // Create Supabase client
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );
    
    // First, check if campaign exists
    const { data: campaignExists, error: fetchError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .single();
    
    if (fetchError || !campaignExists) {
      console.error('Campaign not found:', { campaignId, fetchError });
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Campaign not found: ${campaignId}` 
      }), { status: 404, headers: corsHeaders });
    }
    
    // Reset campaign status to queued
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({ 
        status: 'queued',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
      
    if (campaignError) {
      console.error('Error resetting campaign status:', campaignError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to reset campaign status: ${campaignError.message}` 
      }), { status: 500, headers: corsHeaders });
    }
    
    // Reset backlinks to pending
    const { error: backlinkError } = await supabase
      .from('backlinks')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .in('status', ['processing', 'running']);
      
    if (backlinkError) {
      console.warn('Warning: Could not reset backlink statuses:', backlinkError);
      // Don't fail the entire operation if backlink reset fails
    }
    
    console.log('Campaign and backlinks reset successfully');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Campaign and backlinks reset successfully' 
    }), { headers: corsHeaders });
  } catch (error) {
    console.error('Error in reset campaign function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }), { status: 500, headers: corsHeaders });
  }
});