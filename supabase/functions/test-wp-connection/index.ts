import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Method not allowed. Use POST.' 
      }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { url, username, password } = await req.json();
    
    // Validate input
    if (!url || !username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields: url, username, password' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test WordPress connection
    const response = await fetch(`${url}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        'User-Agent': 'BacklinkBoss/1.0'
      },
      redirect: 'follow'
    });
    
    if (response.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Connection successful' 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } else {
      const errorMessage = response.status === 401 
        ? 'Invalid credentials' 
        : `WordPress API error: ${response.status} ${response.statusText}`;
        
      return new Response(JSON.stringify({ 
        success: false, 
        message: errorMessage 
      }), { 
        status: response.status >= 400 && response.status < 500 ? response.status : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('WordPress connection test error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: `Connection failed: ${errorMessage}`
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});