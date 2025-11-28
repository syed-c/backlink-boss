import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback heading generator when AI service is not available
function generateFallbackHeading(campaign: { category?: string; location?: string; company_name?: string; keyword_1?: string; keyword_2?: string; keyword_3?: string; keyword_4?: string; keyword_5?: string; }) {
  // Validate required fields for fallback
  if (!campaign.category || !campaign.location || !campaign.company_name) {
    return { error: 'Missing required campaign fields for fallback heading generation' };
  }
  
  const keywords = [
    campaign.keyword_1,
    campaign.keyword_2,
    campaign.keyword_3,
    campaign.keyword_4,
    campaign.keyword_5
  ].filter(Boolean);
  
  const keywordString = keywords.join(', ');
  
  // Simple template-based heading generation
  const templates = [
    `What is ${campaign.category} in ${campaign.location}?`,
    `Best ${campaign.category} Services in ${campaign.location}`,
    `Why Choose ${campaign.company_name} for ${campaign.category}`,
    `Top ${campaign.category} Solutions in ${campaign.location}`,
    `How ${campaign.company_name} Helps with ${keywordString}`
  ];
  
  // Select a random template
  const heading = templates[Math.floor(Math.random() * templates.length)];
  
  return { heading };
}

Deno.serve(async (req) => {
  console.log("generate-heading invoked");

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle request body properly (Supabase may have already parsed it)
    let body;
    try {
      const text = await req.text();
      console.log("RAW BODY:", text);
      body = JSON.parse(text);
    } catch (e) {
      console.error("Body was already parsed, using directly");
      body = await req.json();
    }
    
    const { campaign, websiteId } = body;
    
    console.log('Received campaign object keys:', Object.keys(campaign || {}));
    console.log('Received campaign object:', campaign);
    console.log('Received websiteId:', websiteId);
    
    if (!campaign) {
      console.error('Missing campaign data in request');
      return new Response(JSON.stringify({ error: 'Missing campaign data' }), { status: 400, headers: corsHeaders });
    }
    
    if (!websiteId) {
      console.error('Missing websiteId in request');
      return new Response(JSON.stringify({ error: 'Missing websiteId' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    console.log("env:", { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey, openRouterKey: !!openRouterKey });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), { status: 500, headers: corsHeaders });
    }

    if (!openRouterKey) {
      console.error("Missing OPENROUTER_API_KEY");
      return new Response("Missing OPENROUTER_API_KEY", { status: 500 });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate campaign has required fields
    const requiredFields = ['category', 'keyword_1', 'keyword_2', 'keyword_3', 'keyword_4', 'keyword_5', 'location'];
    const missingFields = requiredFields.filter(field => !campaign[field]);
    
    console.log('Campaign fields check:', {
      hasCategory: !!campaign.category,
      hasKeyword1: !!campaign.keyword_1,
      hasKeyword2: !!campaign.keyword_2,
      hasKeyword3: !!campaign.keyword_3,
      hasKeyword4: !!campaign.keyword_4,
      hasKeyword5: !!campaign.keyword_5,
      hasLocation: !!campaign.location,
      missingFields: missingFields
    });
    
    if (missingFields.length > 0) {
      console.error('Campaign missing required fields:', missingFields);
      return new Response(JSON.stringify({ 
        error: `Campaign is missing required fields: ${missingFields.join(', ')}`
      }), { status: 400, headers: corsHeaders });
    }

    // Generate heading using OpenRouter
    const prompt = `Create a single SEO-optimized question-style heading using these details:

Category: "${campaign.category}"
Primary Keywords: ${campaign.keyword_1}, ${campaign.keyword_2}, ${campaign.keyword_3}, ${campaign.keyword_4}, ${campaign.keyword_5}
Location: "${campaign.location}"

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

    console.log('Calling OpenRouter API...');
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b:free',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8
        })
      });
      
      console.log('OpenRouter API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI service error:', { status: response.status, errorText });
        return new Response(JSON.stringify({ 
          error: `AI service failed: ${response.status} ${errorText}`
        }), { status: response.status, headers: corsHeaders });
      }
      
      const data = await response.json();
      console.log('OpenRouter API response data:', JSON.stringify(data, null, 2));
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('Invalid AI response format:', data);
        return new Response(JSON.stringify({ 
          error: 'Invalid AI response format'
        }), { status: 500, headers: corsHeaders });
      }
      
      const heading = data.choices[0].message.content.trim();
      console.log('Generated heading from AI:', heading);
      
      return new Response(JSON.stringify({ heading }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      // Fall back to a simple heading generator
      console.log('Falling back to simple heading generator...');
      const fallbackResult = generateFallbackHeading(campaign);
      if (fallbackResult.error) {
        return new Response(JSON.stringify({ error: fallbackResult.error }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ heading: fallbackResult.heading }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
  } catch (error) {
    console.error("generate-heading internal error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: corsHeaders });
  }
});