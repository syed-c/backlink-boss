import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Process campaign function invoked');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Log environment variables for debugging
  console.log('Environment variables check:', {
    SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    OPENROUTER_API_KEY: !!Deno.env.get('OPENROUTER_API_KEY')
  });
  
  // Health check endpoint
  const url = new URL(req.url);
  if (req.method === 'GET' && url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Test endpoint
  if (req.method === 'GET' && url.pathname.endsWith('/test')) {
    return new Response(JSON.stringify({ message: 'Test endpoint working', envVars: {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      OPENROUTER_API_KEY: !!Deno.env.get('OPENROUTER_API_KEY')
    }}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Log the full request body for debugging
  if (req.method === 'POST') {
    try {
      const bodyText = await req.text();
      console.log('Request body text:', bodyText);
      // Reset the body stream for later use
      req = new Request(req, { body: bodyText });
    } catch (err) {
      console.error('Error reading request body:', err);
    }
  }

  // Declare campaignId outside try block so it's accessible in catch block
  let campaignId: string | null = null;
  try {
    console.log('Process campaign function - entering try block');
    console.log('Received request:', { method: req.method, headers: Object.fromEntries(req.headers.entries()) });
    
    // Handle case where body might be empty or malformed
    let requestBody: { campaignId?: string } = {};
    if (req.body) {
      try {
        requestBody = await req.json();
        console.log('Parsed request body:', requestBody);
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        requestBody = {};
      }
    } else {
      console.error('Request body is empty');
      requestBody = {};
    }
    
    campaignId = requestBody.campaignId || null;
    
    console.log('Parsed campaignId:', campaignId);
    
    if (!campaignId) {
      console.error('Missing campaignId in request');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing campaignId in request body' 
      }), { status: 400, headers: corsHeaders });
    }
    
    console.log('Processing campaign:', campaignId);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:', { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey });
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing environment variables',
        details: {
          supabaseUrl: !!supabaseUrl,
          serviceRoleKey: !!serviceRoleKey
        }
      }), { status: 500, headers: corsHeaders });
    }
    
    // Add more detailed logging for environment variables
    console.log('Environment variables values check:', {
      SUPABASE_URL: supabaseUrl ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? 'SET' : 'NOT SET',
      OPENROUTER_API_KEY: Deno.env.get('OPENROUTER_API_KEY') ? 'SET' : 'NOT SET'
    });
    
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Supabase client created successfully');
    
    console.log('Supabase client created');
    
    // Test database connection
    try {
      console.log('Testing database connection...');
      const { data: test_data, error: test_error } = await supabase
        .from('campaigns')
        .select('id')
        .limit(1);
      
      console.log('Database connection test result:', { test_data, test_error });
      
      if (test_error) {
        console.error('Database connection test failed:', {
          message: test_error.message,
          hint: test_error.hint,
          code: test_error.code
        });
        
        // If this is an auth error, return early
        if (test_error.message.includes('Invalid API key')) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid API key. Please check your SERVICE_ROLE_KEY environment variable.',
            details: {
              message: test_error.message,
              hint: test_error.hint
            }
          }), { status: 500, headers: corsHeaders });
        }
      }
    } catch (test_err) {
      console.error('Database connection test exception:', test_err);
    }
    
    // Fetch campaign with website and pending backlinks
    console.log('Attempting to fetch campaign with ID:', campaignId);
    
    let campaign;
    
    // First, try to fetch just the campaign to see if it exists
    const { data: basicCampaign, error: basicCampaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    console.log('Basic campaign fetch result:', { basicCampaign, basicCampaignError });
    
    if (basicCampaignError || !basicCampaign) {
      console.error('Basic campaign fetch failed:', basicCampaignError);
      throw new Error(`Basic campaign fetch failed: ${basicCampaignError?.message || 'Unknown error'}`);
    }
    
    // Now try to fetch with website data only (simplified)
    console.log('Fetching campaign with website data...');
    const { data: campaignWithWebsite, error: websiteError } = await supabase
      .from('campaigns')
      .select(`
        *,
        website:websites!inner(*),
        backlinks(*)
      `)
      .eq('id', campaignId)
      .single();
    
    console.log('Campaign with website fetch result:', { 
      campaignWithWebsite: campaignWithWebsite ? {
        id: campaignWithWebsite.id,
        name: campaignWithWebsite.name,
        backlinks: Array.isArray(campaignWithWebsite.backlinks) ? campaignWithWebsite.backlinks.length : 'Not array',
        website: campaignWithWebsite.website ? 'Present' : 'Missing'
      } : null,
      websiteError 
    });
    
    if (websiteError) {
      console.error('Campaign with website fetch error:', websiteError);
      // Try without the join as a fallback
      console.log('Trying fallback query without join...');
      const { data: fallbackCampaign, error: fallbackError } = await supabase
        .from('campaigns')
        .select(`
          *,
          backlinks(*)
        `)
        .eq('id', campaignId)
        .single();
      
      if (fallbackError || !fallbackCampaign) {
        console.error('Fallback campaign fetch failed:', fallbackError);
        throw new Error(`Campaign not found: ${campaignId}. Error: ${fallbackError?.message || 'Unknown error'}`);
      }
      
      // Fetch website separately
      const { data: websiteData, error: websiteFetchError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', fallbackCampaign.website_id)
        .single();
      
      if (websiteFetchError || !websiteData) {
        console.error('Website fetch failed:', websiteFetchError);
        throw new Error(`Website not found for campaign: ${campaignId}. Error: ${websiteFetchError?.message || 'Unknown error'}`);
      }
      
      // Combine the data
      campaign = {
        ...fallbackCampaign,
        website: websiteData
      };
      
      console.log('Fallback campaign data:', {
        id: campaign.id,
        name: campaign.name,
        backlinks: Array.isArray(campaign.backlinks) ? campaign.backlinks.length : 'Not array'
      });
    } else {
      // Use the joined data
      campaign = campaignWithWebsite;
      console.log('Campaign fetched with website:', {
        id: campaign.id,
        name: campaign.name,
        backlinks: Array.isArray(campaign.backlinks) ? campaign.backlinks.length : 'Not array'
      });
    }
    
    // Add more detailed logging
    console.log('Campaign details:', {
      id: campaign.id,
      status: campaign.status,
      website_id: campaign.website_id,
      total_backlinks: campaign.total_backlinks,
      indexed_backlinks: campaign.indexed_backlinks
    });
    
    // Check if campaign is already running
    if (campaign.status === 'running') {
      console.warn(`Campaign ${campaignId} is already running`);
      // Check when the campaign was last updated to determine if it's stuck
      const lastUpdated = new Date(campaign.updated_at);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdated.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Also check if there are actually any processing backlinks
      const { data: processingBacklinks, error: backlinkError } = await supabase
        .from('backlinks')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('status', 'processing');
      
      if (backlinkError) {
        console.error('Error checking backlinks status:', backlinkError);
      }
      
      // Consider campaign stuck if:
      // 1. It hasn't been updated in over 30 minutes, OR
      // 2. There are no processing backlinks (it's idle despite showing as running)
      const isStuck = minutesDiff > 30 || !processingBacklinks || processingBacklinks.length === 0;
      
      if (isStuck) {
        console.log(`Campaign ${campaignId} appears to be stuck (last updated ${minutesDiff} minutes ago, processing backlinks: ${processingBacklinks?.length || 0}). Allowing restart.`);
        // Update the campaign status to reset it
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ 
            status: 'queued',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
          
        if (updateError) {
          console.error('Error resetting stuck campaign:', updateError);
        } else {
          console.log(`Campaign ${campaignId} status reset to queued`);
        }
      } else {
        console.log(`Campaign ${campaignId} was last updated ${minutesDiff} minutes ago and has ${processingBacklinks?.length || 0} processing backlinks`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Campaign ${campaignId} is already running. Please stop the current processing or reset the campaign if it's stuck.` 
        }), { status: 409, headers: corsHeaders });
      }
    }
    
    // Validate campaign has required data
    console.log('Validating campaign data...');
    if (!campaign.website) {
      throw new Error(`Campaign ${campaignId} is missing website data. Please ensure the campaign is associated with a valid website.`);
    }
    
    console.log('Website data:', {
      url: campaign.website.url,
      wp_username: !!campaign.website.wp_username,
      wp_app_password: !!campaign.website.wp_app_password
    });
    
    if (!campaign.website.url) {
      throw new Error(`Campaign ${campaignId} website is missing URL. Please check the website configuration.`);
    }
    
    if (!campaign.website.wp_username) {
      throw new Error(`Campaign ${campaignId} website is missing WordPress username. Please check the website configuration.`);
    }
    
    if (!campaign.website.wp_app_password) {
      throw new Error(`Campaign ${campaignId} website is missing WordPress application password. Please check the website configuration.`);
    }
    
    // Validate campaign has required keywords
    console.log('Validating campaign keywords...');
    const missingKeywords: string[] = [];
    if (!campaign.keyword_1) missingKeywords.push('keyword_1');
    if (!campaign.keyword_2) missingKeywords.push('keyword_2');
    if (!campaign.keyword_3) missingKeywords.push('keyword_3');
    if (!campaign.keyword_4) missingKeywords.push('keyword_4');
    if (!campaign.keyword_5) missingKeywords.push('keyword_5');
    
    if (missingKeywords.length > 0) {
      throw new Error(`Campaign ${campaignId} is missing required keywords: ${missingKeywords.join(', ')}`);
    }
    
    if (!campaign.category) {
      throw new Error(`Campaign ${campaignId} is missing category. Please ensure all required campaign fields are filled.`);
    }
    
    if (!campaign.location) {
      throw new Error(`Campaign ${campaignId} is missing location. Please ensure all required campaign fields are filled.`);
    }
    
    if (!campaign.company_name) {
      throw new Error(`Campaign ${campaignId} is missing company name. Please ensure all required campaign fields are filled.`);
    }
    
    console.log('All validation passed, updating campaign status to running...');
    // Update campaign status to running
    await supabase
      .from('campaigns')
      .update({ status: 'running' })
      .eq('id', campaignId);
    
    console.log('Getting next batch of pending backlinks...');
    // Get next batch of pending backlinks (5 at a time)
    console.log('Campaign backlinks data type:', typeof campaign.backlinks);
    console.log('Campaign backlinks data:', campaign.backlinks);
    
    if (!campaign.backlinks) {
      console.warn('Campaign backlinks is null or undefined');
      campaign.backlinks = [];
    }
    
    if (!Array.isArray(campaign.backlinks)) {
      console.warn('Campaign backlinks is not an array:', campaign.backlinks);
      campaign.backlinks = [];
    }
    
    // Filter for both pending and processing backlinks to handle stuck campaigns
    const availableBacklinks = campaign.backlinks
      .filter((b: { status: string; url?: string }) => 
        (b.status === 'pending' || b.status === 'processing') && b.url)
      .slice(0, 5);
    
    console.log('Available backlinks count:', availableBacklinks.length);
    
    // Validate backlinks have URLs
    for (const backlink of availableBacklinks) {
      if (!backlink.url) {
        console.error('Backlink missing URL:', backlink);
        throw new Error(`Backlink ${backlink.id} is missing URL`);
      }
    }
    
    // If no available backlinks, check if campaign has any backlinks at all
    if (availableBacklinks.length === 0 && campaign.backlinks.length === 0) {
      console.warn('Campaign has no backlinks:', campaignId);
      // Update campaign status to failed since it has no backlinks
      await supabase
        .from('campaigns')
        .update({ 
          status: 'failed',
          error_message: 'Campaign has no backlinks to process'
        })
        .eq('id', campaignId);
        
      return new Response(JSON.stringify({ 
        success: false,
        error: `Campaign ${campaignId} has no backlinks to process` 
      }), { status: 400, headers: corsHeaders });
    }
    
    if (availableBacklinks.length === 0) {
      // Campaign completed (no more pending or processing backlinks)
      console.log('No available backlinks, marking campaign as completed...');
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
    
    console.log('Updating backlinks to processing status...');
    // Update backlinks to processing
    await supabase
      .from('backlinks')
      .update({ status: 'processing' })
      .in('id', availableBacklinks.map((b: { id: string }) => b.id));
    
    console.log('Generating heading...');
    // Generate heading using Supabase client instead of direct HTTP call
    console.log('Calling generate-heading function with:', { 
      campaignId: campaign.id,
      websiteId: campaign.website_id,
      campaignName: campaign.name
    });
    
    let headingData = null;
    let headingError = null;
    
    try {
      console.log('About to invoke generate-heading function...');
      const result = await supabase.functions.invoke('generate-heading', {
        body: { 
          campaign,
          websiteId: campaign.website_id 
        }
      });
      console.log('Generate-heading function invocation result:', result);
      
      if (result.error) {
        headingError = result.error;
        console.error('Generate-heading function returned error:', headingError);
      } else {
        headingData = result.data;
        console.log('Generate-heading function returned data:', headingData);
      }
    } catch (invokeError) {
      console.error('Exception during generate-heading function invocation:', invokeError);
      headingError = invokeError;
    }
    
    if (headingError) {
      console.error('Heading generation failed:', headingError);
      // Update campaign status to failed
      try {
        await supabase
          .from('campaigns')
          .update({ status: 'failed' })
          .eq('id', campaignId);
        console.log('Campaign status updated to failed');
      } catch (updateError) {
        console.error('Failed to update campaign status:', updateError);
      }
      throw new Error(`Heading generation failed: ${headingError.message || headingError}`);
    }
    
    if (!headingData) {
      console.error('Heading generation returned no data');
      throw new Error('Heading generation returned no data');
    }
    
    const { heading } = headingData;
    console.log('Heading generated successfully:', heading);
    
    console.log('Generating content...');
    // Generate content using Supabase client instead of direct HTTP call
    console.log('Calling generate-content function with:', { 
      campaignId: campaign.id,
      heading,
      backlinksCount: availableBacklinks.length
    });
    
    let contentData, contentError;
    try {
      const result = await supabase.functions.invoke('generate-content', {
        body: { 
          campaign,
          heading,
          backlinks: availableBacklinks 
        }
      });
      contentData = result.data;
      contentError = result.error;
      console.log('Generate-content response:', { contentData, contentError });
    } catch (invokeError) {
      console.error('Exception during generate-content invocation:', invokeError);
      contentError = invokeError;
    }
    
    if (contentError) {
      console.error('Content generation failed:', contentError);
      // Update campaign status to failed
      await supabase
        .from('campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      throw new Error(`Content generation failed: ${contentError.message || contentError}`);
    }
    
    const { content } = contentData;
    
    // Check if content exists
    if (!content) {
      throw new Error('Generated content is empty');
    }
    
    console.log('Content generated, length:', content.length);
    // Generate image prompt using OpenRouter (optional)
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    let imagePrompt = '';
    
    if (openRouterApiKey) {
      try {
        const imagePromptResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b:free',
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
        
        if (!imagePromptResponse.ok) {
          const errorText = await imagePromptResponse.text();
          console.error('Image prompt generation failed:', { status: imagePromptResponse.status, errorText });
          // Continue without image prompt instead of throwing error
          imagePrompt = `Featured image for: ${heading}`;
        } else {
          const imagePromptData = await imagePromptResponse.json();
          imagePrompt = imagePromptData.choices?.[0]?.message?.content?.trim() || '';
        }
      } catch (imagePromptError) {
        console.error('Image prompt generation error:', imagePromptError);
        // Continue without image prompt
        imagePrompt = `Featured image for: ${heading}`;
      }
    } else {
      console.log('OPENROUTER_API_KEY not provided, skipping image prompt generation');
      imagePrompt = `Featured image for: ${heading}`;
    }
    
    let wpImageData: { id?: number } | null = null;
    
    // Generate image using Pollinations (optional)
    try {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${campaign.website?.image_width || 1200}&height=${campaign.website?.image_height || 630}&model=${campaign.website?.image_model || 'flux'}&nologo=true`;
      
      const imageResponse = await fetch(imageUrl);
      
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob();
        
        // Upload image to WordPress
        const formData = new FormData();
        formData.append('file', imageBlob, 'featured-image.jpg');
        
        const wpImageResponse = await fetch(
          `${campaign.website?.url}/wp-json/wp/v2/media`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${campaign.website?.wp_username}:${campaign.website?.wp_app_password}`)}`
            },
            body: formData
          }
        );
        
        const wpImageResponseText = await wpImageResponse.text();
        
        if (wpImageResponse.ok) {
          wpImageData = JSON.parse(wpImageResponseText);
        } else {
          console.error('WordPress media upload failed:', { status: wpImageResponse.status, responseText: wpImageResponseText });
        }
      } else {
        const errorText = await imageResponse.text();
        console.error('Image generation failed:', { status: imageResponse.status, errorText });
      }
    } catch (imageError) {
      console.error('Image generation or upload error:', imageError);
    }
    
    // Post article to WordPress
    console.log('Posting to WordPress:', {
      url: campaign.website?.url,
      title: heading,
      contentLength: content.length,
      featuredMediaId: wpImageData?.id,
      categoryId: campaign.website?.category_id
    });
    
    const wpPostResponse = await fetch(
      `${campaign.website?.url}/wp-json/wp/v2/posts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${campaign.website?.wp_username}:${campaign.website?.wp_app_password}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: heading,
          content: content,
          status: 'publish',
          ...(wpImageData?.id && { featured_media: wpImageData.id }),
          categories: [campaign.website?.category_id]
        })
      }
    );
    
    console.log('WordPress post response status:', wpPostResponse.status);
    const wpPostResponseText = await wpPostResponse.text();
    console.log('WordPress post response body:', wpPostResponseText);
    
    if (!wpPostResponse.ok) {
      console.error('WordPress post failed:', { status: wpPostResponse.status, responseText: wpPostResponseText });
      throw new Error(`WordPress post failed: ${wpPostResponse.status} ${wpPostResponseText}`);
    }
    
    let wpPostData;
    try {
      wpPostData = JSON.parse(wpPostResponseText);
    } catch (parseError) {
      console.error('Error parsing WordPress post response:', parseError);
      throw new Error(`Failed to parse WordPress post response: ${parseError.message}`);
    }
    
    // Update backlinks as indexed
    await supabase
      .from('backlinks')
      .update({
        status: 'indexed',
        indexed_blog_url: wpPostData?.link,
        heading_generated: heading,
        indexed_at: new Date().toISOString()
      })
      .in('id', availableBacklinks.map((b: { id: string }) => b.id));
    
    // Save to history
    await supabase.from('index_history').insert({
      campaign_id: campaignId,
      website_id: campaign.website_id,
      user_id: campaign.user_id,
      heading: heading,
      indexed_url: wpPostData?.link,
      backlinks_count: availableBacklinks.length
    });
    
    // Save used heading
    await supabase.from('used_headings').insert({
      user_id: campaign.user_id,
      website_id: campaign.website_id,
      heading: heading
    });
    
    // Update campaign progress
    const currentIndexed = campaign.indexed_backlinks || 0;
    await supabase
      .from('campaigns')
      .update({
        indexed_backlinks: currentIndexed + availableBacklinks.length
      })
      .eq('id', campaignId);
    
    // Check for more backlinks
    const { data: remainingBacklinks } = await supabase
      .from('backlinks')
      .select('id')
      .eq('campaign_id', campaignId)
      .in('status', ['pending', 'processing']); // Check for both pending and processing
    
    if (remainingBacklinks && remainingBacklinks.length > 0) {
      // Instead of using setTimeout, we'll return a response indicating more work is needed
      // The client can then decide whether to trigger the next batch
      return new Response(JSON.stringify({
        success: true,
        indexed: availableBacklinks.length,
        remaining: remainingBacklinks.length,
        message: 'Batch processed, more backlinks remaining'
      }), { headers: corsHeaders });
    } else {
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      return new Response(JSON.stringify({
        success: true,
        indexed: availableBacklinks.length,
        remaining: 0,
        message: 'Campaign completed'
      }), { headers: corsHeaders });
    }
    
  } catch (error) {
    console.error('Error processing campaign:', error);
    console.error('Error stack:', error.stack);
    
    // Update campaign status to failed with error message
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && serviceRoleKey && campaignId) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        // Try to update with error_message column, but handle case where it doesn't exist
        try {
          await supabase
            .from('campaigns')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', campaignId);
        } catch (updateError) {
          // If error_message column doesn't exist, update without it
          console.warn('Could not update error_message column, updating status only:', updateError);
          await supabase
            .from('campaigns')
            .update({ 
              status: 'failed'
            })
            .eq('id', campaignId);
        }
      } else {
        console.warn('Missing environment variables or campaignId for error update, skipping campaign status update');
      }
    } catch (updateError) {
      console.error('Failed to update campaign status to failed:', updateError);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    };
    
    // Provide more user-friendly error messages for common issues
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes('AI service failed')) {
      userFriendlyMessage = 'Failed to generate content using AI service. Please check your OpenRouter API key or try again later.';
    } else if (errorMessage.includes('WordPress post failed')) {
      userFriendlyMessage = 'Failed to post content to WordPress. Please check your website credentials and ensure your WordPress site is accessible.';
    } else if (errorMessage.includes('missing required')) {
      userFriendlyMessage = `Campaign configuration error: ${errorMessage}`;
    } else if (errorMessage.includes('Heading generation failed')) {
      userFriendlyMessage = 'Failed to generate heading. Please check your campaign configuration and try again.';
    } else if (errorMessage.includes('Content generation failed')) {
      userFriendlyMessage = 'Failed to generate content. Please check your campaign configuration and try again.';
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: userFriendlyMessage,
      details: errorDetails
    }), { status: 500, headers: corsHeaders });
  }
});