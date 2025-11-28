import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback heading generator when AI service is not available
function generateFallbackHeading(campaign: { category?: string; location?: string; company_name?: string; keyword_1?: string; keyword_2?: string; keyword_3?: string; keyword_4?: string; keyword_5?: string; }) {
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
  
  return new Response(JSON.stringify({ heading }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}

serve(async (req) => {
  console.log('Generate heading function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let campaignId = null;
  try {
    console.log('Parsing request body...');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid request body format');
    }
    
    const { campaign, websiteId } = requestBody;
    
    // Extract campaignId for error handling
    campaignId = campaign?.id;
    console.log('Extracted campaign and websiteId:', { campaignId, websiteId });
    
    // Validate required data
    if (!campaign) {
      console.error('Missing campaign data in request');
      throw new Error('Missing campaign data');
    }
    
    if (!websiteId) {
      console.error('Missing websiteId in request');
      throw new Error('Missing websiteId');
    }
    
    console.log('Validating campaign fields...');
    // Validate campaign has required fields
    const requiredFields = ['category', 'keyword_1', 'keyword_2', 'keyword_3', 'keyword_4', 'keyword_5', 'location'];
    const missingFields = requiredFields.filter(field => !campaign[field]);
    
    if (missingFields.length > 0) {
      console.error('Campaign missing required fields:', missingFields);
      throw new Error(`Campaign is missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('Creating Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase environment variables check:', {
      supabaseUrl: !!supabaseUrl,
      serviceRoleKey: !!serviceRoleKey
    });
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );
    
    console.log('Supabase client created successfully');
    
    // Check if campaign has a headings file
    if (campaign.headings_file_path) {
      console.log('Campaign has headings file path:', campaign.headings_file_path);
      // Fetch used headings to avoid duplicates
      const { data: usedHeadings, error: usedHeadingsError } = await supabase
        .from('used_headings')
        .select('heading')
        .eq('website_id', websiteId);
      
      if (usedHeadingsError) {
        console.error('Error fetching used headings:', usedHeadingsError);
      }
      
      const usedHeadingsSet = new Set(usedHeadings?.map(h => h.heading) || []);
      console.log('Used headings count:', usedHeadingsSet.size);
      
      // In a real implementation, you would parse the file and select an unused heading
      // For now, we'll return a placeholder with a timestamp to make it unique
      const heading = `Custom Heading from Uploaded File - ${Date.now()}`;
      console.log('Generated custom heading:', heading);
      
      return new Response(JSON.stringify({ heading }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Fetching used headings...');
    // Fetch used headings
    const { data: usedHeadings, error: usedHeadingsError } = await supabase
      .from('used_headings')
      .select('heading')
      .eq('website_id', websiteId);
    
    if (usedHeadingsError) {
      console.error('Error fetching used headings:', usedHeadingsError);
    }
    
    const usedHeadingsList = usedHeadings?.map(h => h.heading).join('\n') || '';
    console.log('Used headings list length:', usedHeadingsList.length);
    
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

    console.log('Preparing to call OpenRouter API...');
    // Use OpenRouter if API key is provided, otherwise use a fallback
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (openRouterApiKey) {
      console.log('OpenRouter API key found, calling API...');
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
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
          throw new Error(`AI service failed: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('OpenRouter API response data:', JSON.stringify(data, null, 2));
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error('Invalid AI response format:', data);
          throw new Error('Invalid AI response format');
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
        return generateFallbackHeading(campaign);
      }
    } else {
      console.log('OPENROUTER_API_KEY not provided, using fallback heading generator');
      return generateFallbackHeading(campaign);
    }
    
  } catch (error) {
    console.error('Error generating heading:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), { status: 500, headers: corsHeaders });
  }
});