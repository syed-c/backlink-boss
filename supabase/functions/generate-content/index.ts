import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback content generator when AI service is not available
function generateFallbackContent(campaign: { category?: string; location?: string; company_name?: string; keyword_1?: string; keyword_2?: string; keyword_3?: string; keyword_4?: string; keyword_5?: string; }, heading: string, backlinks: { url: string }[]) {
  const backlinkUrls = backlinks.map(b => b.url).join('\n');
  
  // Simple template-based content generation
  const content = `
    <h1>${heading}</h1>
    
    <p>Welcome to our guide on ${campaign.category} in ${campaign.location}. At ${campaign.company_name}, we specialize in providing top-quality ${campaign.category} services to meet your needs.</p>
    
    <h2>Why Choose Our ${campaign.category} Services?</h2>
    
    <p>Our team of experienced professionals understands the importance of quality ${campaign.category} in ${campaign.location}. We pride ourselves on delivering exceptional results and customer satisfaction.</p>
    
    <h2>Our Approach to ${campaign.category}</h2>
    
    <p>We take a comprehensive approach to ${campaign.category}, ensuring that every aspect of our service meets the highest standards. Our process includes:</p>
    
    <ul>
      <li>Thorough consultation to understand your specific needs</li>
      <li>Customized solutions tailored to your situation</li>
      <li>Ongoing support throughout the process</li>
      <li>Transparent communication at every step</li>
    </ul>
    
    <h2>Important Resources</h2>
    
    <p>For more information about ${campaign.category}, check out these valuable resources:</p>
    
    <ul>
      ${backlinks.map((b, i) => `<li><a href="${b.url}">${campaign[`keyword_${i+1}`] || `Resource ${i+1}`}</a></li>`).join('\n')}
    </ul>
    
    <h2>Get Started Today</h2>
    
    <p>Ready to experience the difference our ${campaign.category} services can make? Contact ${campaign.company_name} today to schedule your consultation. Our team is standing by to answer your questions and help you get started on the path to success.</p>
    
    <p>Don't wait - reach out to us today and discover why so many people in ${campaign.location} trust ${campaign.company_name} for their ${campaign.category} needs.</p>
  `;
  
  return new Response(JSON.stringify({ content }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}

function cleanHTML(html: string): string {
  html = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/—/g, '-')
    .replace(/\\n/g, '')
    .replace(/\n/g, '');
  
  html = html.replace(/<(?!\/?(?:h1|h2|h3|h4|p|ul|ol|li|a)(\s|>)).*?>/gi, '');
  
  html = html.replace(/<a([^>]+)>/gi, match => {
    const hrefMatch = match.match(/href=(['"]).*?\1/);
    return hrefMatch ? `<a ${hrefMatch[0]}>` : `<a>`;
  });
  
  html = html.replace(/<[^/>][^>]*><\/[^>]+>/g, '');
  
  return html.trim();
}

Deno.serve(async (req) => {
  console.log('Generate content function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle request body properly (Supabase may have already parsed it)
    let requestBody;
    try {
      const text = await req.text();
      console.log("RAW BODY:", text);
      requestBody = JSON.parse(text);
    } catch (e) {
      console.error("Body was already parsed, using directly");
      requestBody = await req.json();
    }
    
    const { campaign, heading, backlinks } = requestBody;
    
    console.log('Extracted parameters:', { 
      campaignId: campaign?.id, 
      headingLength: heading?.length, 
      backlinksCount: backlinks?.length 
    });
    
    // Validate required data
    if (!campaign) {
      console.error('Missing campaign data in request');
      throw new Error('Missing campaign data');
    }
    
    if (!heading) {
      console.error('Missing heading in request');
      throw new Error('Missing heading');
    }
    
    if (!Array.isArray(backlinks)) {
      console.error('Missing or invalid backlinks array in request');
      throw new Error('Missing or invalid backlinks array');
    }
    
    console.log('Validating campaign fields...');
    // Validate campaign has required fields
    const requiredFields = ['category', 'location', 'company_name', 'keyword_1', 'keyword_2', 'keyword_3', 'keyword_4', 'keyword_5'];
    const missingFields = requiredFields.filter(field => !campaign[field]);
    
    if (missingFields.length > 0) {
      console.error('Campaign missing required fields:', missingFields);
      throw new Error(`Campaign is missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate backlinks have URLs
    for (const backlink of backlinks) {
      if (!backlink.url) {
        console.error('Backlink missing URL:', backlink);
        throw new Error('Backlink is missing URL');
      }
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
    
    const backlinkUrls = backlinks.map((b: { url: string }) => b.url).join('\n');
    console.log('Backlink URLs count:', backlinkUrls.split('\n').length);
    
    const prompt = `Write a blog post using this heading as <h1>:
${heading}

Category: ${campaign.category}
Service: ${campaign.category}
Location: ${campaign.location}

Insert EXACTLY these links as href attributes:
${backlinkUrls}

Anchor Texts (use each once):
${campaign.keyword_1}
${campaign.keyword_2}
${campaign.keyword_3}
${campaign.keyword_4}
${campaign.keyword_5}

Content Rules:
- 1500–1700 words of unique, helpful, local content
- Informational ONLY: no legal claims or outcomes
- Interlink ONLY on these 5 anchor keywords
- Spread links naturally throughout content
- Use third-person perspective (they/their, not we/our)
- Add conclusion section mentioning ${campaign.company_name}

Format Required:
- <h1> (heading provided)
- <h2> for main sections
- <h3>/<h4> for subpoints
- <p>, <ul>, <ol>, <li> for readability`;

    const systemMessage = `You are an expert SEO content writer creating publish-ready HTML blog posts.

STRICT FORMAT:
- HTML only: <h1>, <h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>, <a>
- No inline styles, no schema markup
- Proper heading hierarchy

CONTENT RULES:
- 1500–1700 words total
- Human-written, helpful, educational
- NO legal advice, case results, guarantees
- NO pricing, contact info, attorney names
- Third-person perspective only
- Mention company ONLY in conclusion

LINKING RULES:
- Use given keywords as anchor text ONCE each
- Spread links evenly (not clustered)
- Natural and informational placement

OUTPUT: Final HTML only, no comments or explanations`;

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
            temperature: 0.7
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
        
        let content = data.choices[0].message.content.trim();
        console.log('Generated content length:', content.length);
        
        content = cleanHTML(content);
        content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
        console.log('Cleaned content length:', content.length);
        
        return new Response(JSON.stringify({ content }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (aiError) {
        console.error('AI service error:', aiError);
        // Fall back to a simple content generator
        console.log('Falling back to simple content generator...');
        return generateFallbackContent(campaign, heading, backlinks);
      }
    } else {
      console.log('OPENROUTER_API_KEY not provided, using fallback content generator');
      return generateFallbackContent(campaign, heading, backlinks);
    }
    
  } catch (error) {
    console.error('Error generating content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), { status: 500, headers: corsHeaders });
  }
});