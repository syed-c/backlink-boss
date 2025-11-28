import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Mock campaign data for testing
    const mockCampaign = {
      id: 'test-campaign-id',
      category: 'Plumbing',
      location: 'Dubai',
      company_name: 'Test Company',
      keyword_1: 'emergency plumber',
      keyword_2: 'plumbing repair',
      keyword_3: 'water heater',
      keyword_4: 'drain cleaning',
      keyword_5: 'leak detection'
    };

    console.log('Testing generate-heading function with mock data');

    // Call the generate-heading function directly
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.functions.invoke('generate-heading', {
      body: JSON.stringify({
        campaign: mockCampaign,
        websiteId: 'test-website-id'
      })
    });

    if (error) {
      console.error('Error calling generate-heading:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log('Generate-heading response:', data);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
});