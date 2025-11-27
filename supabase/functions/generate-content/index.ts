import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  
  html = html.replace(/<[^\/>][^>]*><\/[^>]+>/g, '');
  
  return html.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign, heading, backlinks } = await req.json();
    
    const backlinkUrls = backlinks.map((b: any) => b.url).join('\n');
    
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
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    content = cleanHTML(content);
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
    
    return new Response(JSON.stringify({ content }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Error generating content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), { status: 500, headers: corsHeaders });
  }
});