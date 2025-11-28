import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Debug campaign function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { campaignId } = await req.json();
    
    console.log('Received campaignId:', campaignId);
    
    if (!campaignId) {
      return new Response(JSON.stringify({ error: 'Missing campaignId' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    console.log('Supabase client created');

    // Fetch campaign data
    console.log('Fetching campaign data...');
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        website:websites!inner(*),
        backlinks(*)
      `)
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch campaign',
        details: campaignError.message 
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('Campaign fetched successfully:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status
    });

    // Test calling generate-heading function
    console.log('Calling generate-heading function...');
    const { data: headingData, error: headingError } = await supabase.functions.invoke('generate-heading', {
      body: JSON.stringify({ 
        campaign,
        websiteId: campaign.website_id 
      })
    });

    if (headingError) {
      console.error('Heading generation error:', headingError);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate heading',
        details: headingError.message 
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('Heading generated successfully:', headingData);

    return new Response(JSON.stringify({ 
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name
      },
      heading: headingData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});