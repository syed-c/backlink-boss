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
    const { url, username, password } = await req.json();
    
    const response = await fetch(`${url}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`
      }
    });
    
    if (response.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Connection successful' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid credentials or URL' 
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      message: errorMessage 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});