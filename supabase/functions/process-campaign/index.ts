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
    const { campaignId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Fetch campaign with website and pending backlinks
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        website:websites(*),
        backlinks(*)
      `)
      .eq('id', campaignId)
      .single();
    
    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }
    
    // Update campaign status to running
    await supabase
      .from('campaigns')
      .update({ status: 'running' })
      .eq('id', campaignId);
    
    // Get next batch of pending backlinks (5 at a time)
    const pendingBacklinks = campaign.backlinks
      .filter((b: any) => b.status === 'pending')
      .slice(0, 5);
    
    if (pendingBacklinks.length === 0) {
      // Campaign completed
      await supabase
        .from('campaigns')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Campaign completed' 
      }), { headers: corsHeaders });
    }
    
    // Update backlinks to processing
    await supabase
      .from('backlinks')
      .update({ status: 'processing' })
      .in('id', pendingBacklinks.map((b: any) => b.id));
    
    // Generate heading
    const headingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-heading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ 
        campaign,
        websiteId: campaign.website_id 
      })
    });
    
    const { heading } = await headingResponse.json();
    
    // Generate content
    const contentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ 
        campaign,
        heading,
        backlinks: pendingBacklinks 
      })
    });
    
    const { content } = await contentResponse.json();
    
    // Generate image using Lovable AI
    const imagePromptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional image prompt engineer. Generate ONE detailed, realistic featured image prompt for AI generation. No text, graphics, or watermarks. Realistic editorial style.' 
          },
          { 
            role: 'user', 
            content: `Create image prompt for: "${heading}"`
          }
        ],
        temperature: 0.7
      })
    });
    
    const imagePromptData = await imagePromptResponse.json();
    const imagePrompt = imagePromptData.choices[0].message.content.trim();
    
    // Generate image using Pollinations
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${campaign.website.image_width}&height=${campaign.website.image_height}&model=${campaign.website.image_model}&nologo=true`;
    
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    // Upload image to WordPress
    const formData = new FormData();
    formData.append('file', imageBlob, 'featured-image.jpg');
    
    const wpImageResponse = await fetch(
      `${campaign.website.url}/wp-json/wp/v2/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${campaign.website.wp_username}:${campaign.website.wp_app_password}`)}`
        },
        body: formData
      }
    );
    
    const wpImageData = await wpImageResponse.json();
    
    // Post article to WordPress
    const wpPostResponse = await fetch(
      `${campaign.website.url}/wp-json/wp/v2/posts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${campaign.website.wp_username}:${campaign.website.wp_app_password}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: heading,
          content: content,
          status: 'publish',
          featured_media: wpImageData.id,
          categories: [campaign.website.category_id]
        })
      }
    );
    
    const wpPostData = await wpPostResponse.json();
    
    // Update backlinks as indexed
    await supabase
      .from('backlinks')
      .update({
        status: 'indexed',
        indexed_blog_url: wpPostData.link,
        heading_generated: heading,
        indexed_at: new Date().toISOString()
      })
      .in('id', pendingBacklinks.map((b: any) => b.id));
    
    // Save to history
    await supabase.from('index_history').insert({
      campaign_id: campaignId,
      website_id: campaign.website_id,
      user_id: campaign.user_id,
      heading: heading,
      indexed_url: wpPostData.link,
      backlinks_count: pendingBacklinks.length
    });
    
    // Save used heading
    await supabase.from('used_headings').insert({
      user_id: campaign.user_id,
      website_id: campaign.website_id,
      heading: heading
    });
    
    // Update campaign progress
    await supabase
      .from('campaigns')
      .update({
        indexed_backlinks: campaign.indexed_backlinks + pendingBacklinks.length
      })
      .eq('id', campaignId);
    
    // Check for more backlinks
    const { data: remainingBacklinks } = await supabase
      .from('backlinks')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    
    if (remainingBacklinks && remainingBacklinks.length > 0) {
      // Process next batch
      setTimeout(async () => {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-campaign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ campaignId })
        });
      }, 1000);
    } else {
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    }
    
    return new Response(JSON.stringify({
      success: true,
      indexed: pendingBacklinks.length,
      remaining: remainingBacklinks?.length || 0
    }), { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error processing campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), { status: 500, headers: corsHeaders });
  }
});