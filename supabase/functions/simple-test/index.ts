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
    console.log('Simple test function invoked');
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    console.log('Supabase client created');
    
    // Test database connection
    const { data, error } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);
    
    console.log('Database test result:', { data, error });
    
    if (error) {
      throw new Error(`Database test failed: ${error.message}`);
    }
    
    // Test function invocation
    const { data: funcData, error: funcError } = await supabase.functions.invoke('test-env');
    
    console.log('Function invocation test result:', { funcData, funcError });
    
    if (funcError) {
      throw new Error(`Function invocation test failed: ${funcError.message}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      dbTest: { data, error },
      funcTest: { funcData, funcError }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple test error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});