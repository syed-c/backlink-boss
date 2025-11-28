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
    console.log('Testing service key');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    console.log('Supabase client created successfully');
    
    // Test a simple database query
    const { data, error } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database query failed:', error);
      throw error;
    }
    
    console.log('Database query successful');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Service key test successful',
      data: data
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Error in test function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), { status: 500, headers: corsHeaders });
  }
});