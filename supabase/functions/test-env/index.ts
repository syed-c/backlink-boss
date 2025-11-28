import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log all environment variables (safely)
    const envVars = {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      OPENROUTER_API_KEY: !!Deno.env.get('OPENROUTER_API_KEY')
    };

    console.log('Environment variables check:', envVars);

    return new Response(JSON.stringify({ 
      success: true,
      envVars
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking environment variables:', error);
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});