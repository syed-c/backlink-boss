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
    const { campaign, websiteId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Fetch used headings
    const { data: usedHeadings } = await supabase
      .from('used_headings')
      .select('heading')
      .eq('website_id', websiteId);
    
    const usedHeadingsList = usedHeadings?.map(h => h.heading).join('\n') || '';
    
    const prompt = `Create a single SEO-optimized question-style heading using these details:

Category: "${campaign.category}"
Primary Keywords: ${campaign.keyword_1}, ${campaign.keyword_2}, ${campaign.keyword_3}, ${campaign.keyword_4}, ${campaign.keyword_5}
Location: "${campaign.location}"

Do NOT use these headings:
${usedHeadingsList}

Examples of heading style:
- What Does a [Category] in [Location] Do?
- How Can a [Location] [Category] Help Me?
- Why Should I Hire a [Category] in [Location]?
- When Should I Contact a [Category] After [Event]?
- Who Is the Best [Category] in [Location]?`;

    const systemMessage = `You are an expert SEO strategist specializing in question-based headlines.

Generate ONE unique heading using Who/What/Why/When/Where/How format.

SEO Requirements:
- Include category and keywords naturally
- Focus on search intent
- Maximum 70 characters
- Highly clickable

Output: Only the final heading as plain text (no numbering, HTML, or explanation)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      })
    });
    
    const data = await response.json();
    const heading = data.choices[0].message.content.trim();
    
    return new Response(JSON.stringify({ heading }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Error generating heading:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), { status: 500, headers: corsHeaders });
  }
});