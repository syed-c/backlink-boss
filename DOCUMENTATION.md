# Backlink Boss Documentation

## Table of Contents
1. [Data Schema](#data-schema)
2. [API Endpoints](#api-endpoints)
3. [Deployment Details](#deployment-details)

## Data Schema

The Backlink Boss application uses the following database tables to manage backlink campaigns:

### user_profiles
Stores user profile information and preferences.
- `id` (UUID, PK) - References auth.users(id)
- `display_name` (TEXT) - User's display name
- `groq_api_key` (TEXT) - User's Groq API key
- `notification_email` (BOOLEAN) - Email notification preference
- `notification_failure` (BOOLEAN) - Failure notification preference
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record update timestamp

### websites
Stores information about WordPress websites.
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - References auth.users(id)
- `name` (TEXT) - Website name
- `url` (TEXT) - Website URL
- `wp_username` (TEXT) - WordPress username
- `wp_app_password` (TEXT) - WordPress application password
- `category_id` (INTEGER) - WordPress category ID
- `heading_sheet_id` (TEXT) - Google Sheets ID for headings
- `heading_sheet_name` (TEXT) - Google Sheets name (default: 'Headings')
- `image_model` (TEXT) - Image generation model (default: 'gptimage')
- `image_width` (INTEGER) - Image width (default: 1600)
- `image_height` (INTEGER) - Image height (default: 900)
- `status` (TEXT) - Connection status ('connected', 'disconnected')
- `last_tested_at` (TIMESTAMPTZ) - Last connection test timestamp
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record update timestamp

### campaigns
Stores information about backlink campaigns.
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - References auth.users(id)
- `website_id` (UUID, FK) - References websites(id)
- `name` (TEXT) - Campaign name
- `location` (TEXT) - Target location
- `category` (TEXT) - Business category
- `company_name` (TEXT) - Company name
- `page_type` (TEXT) - Page type
- `keyword_1` to `keyword_5` (TEXT) - SEO keywords
- `status` (TEXT) - Campaign status ('queued', 'running', 'completed', 'failed', 'stopped')
- `total_backlinks` (INTEGER) - Total backlinks in campaign
- `indexed_backlinks` (INTEGER) - Number of indexed backlinks
- `failed_backlinks` (INTEGER) - Number of failed backlinks
- `csv_file_path` (TEXT) - Path to CSV file
- `headings_file_path` (TEXT) - Path to headings file
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record update timestamp
- `completed_at` (TIMESTAMPTZ) - Campaign completion timestamp

### backlinks
Stores information about individual backlinks in campaigns.
- `id` (UUID, PK) - Unique identifier
- `campaign_id` (UUID, FK) - References campaigns(id)
- `url` (TEXT) - Backlink URL
- `status` (TEXT) - Backlink status ('pending', 'processing', 'indexed', 'failed')
- `indexed_blog_url` (TEXT) - Indexed blog URL
- `heading_generated` (TEXT) - Generated heading
- `error_message` (TEXT) - Error message if failed
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record update timestamp
- `indexed_at` (TIMESTAMPTZ) - Indexing completion timestamp

### index_history
Stores history of indexed content.
- `id` (UUID, PK) - Unique identifier
- `campaign_id` (UUID, FK) - References campaigns(id)
- `website_id` (UUID, FK) - References websites(id)
- `user_id` (UUID, FK) - References auth.users(id)
- `heading` (TEXT) - Generated heading
- `indexed_url` (TEXT) - Indexed URL
- `backlinks_count` (INTEGER) - Number of backlinks
- `content_preview` (TEXT) - Content preview
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

### used_headings
Tracks headings that have been used to avoid duplication.
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - References auth.users(id)
- `website_id` (UUID, FK) - References websites(id)
- `heading` (TEXT) - Generated heading
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

## API Endpoints

The application uses Supabase Edge Functions for backend processing. All functions are deployed to the Supabase platform and can be invoked using the Supabase client.

### process-campaign
Main function that orchestrates the backlink processing workflow.
- **Endpoint**: `/functions/v1/process-campaign`
- **Method**: POST
- **Body**: `{ campaignId: string }`
- **Description**: Processes a campaign by generating headings and content for backlinks.

### generate-heading
Generates SEO-optimized headings for blog posts.
- **Endpoint**: `/functions/v1/generate-heading`
- **Method**: POST
- **Body**: `{ campaign: object, websiteId: string }`
- **Description**: Uses AI services to generate question-style SEO headings.

### generate-content
Generates SEO-optimized blog post content.
- **Endpoint**: `/functions/v1/generate-content`
- **Method**: POST
- **Body**: `{ campaign: object, heading: string, backlinks: array }`
- **Description**: Creates blog post content with embedded backlinks.

### reset-campaign
Resets a campaign and its backlinks to initial state.
- **Endpoint**: `/functions/v1/reset-campaign`
- **Method**: POST
- **Body**: `{ campaignId: string }`
- **Description**: Resets campaign status to 'queued' and backlinks to 'pending'.

### test-wp-connection
Tests WordPress website connectivity.
- **Endpoint**: `/functions/v1/test-wp-connection`
- **Method**: POST
- **Body**: `{ url: string, username: string, password: string }`
- **Description**: Verifies WordPress REST API connectivity with provided credentials.

### debug-campaign
Provides detailed debugging information for a campaign.
- **Endpoint**: `/functions/v1/debug-campaign`
- **Method**: POST
- **Body**: `{ campaignId: string }`
- **Description**: Retrieves detailed campaign information for troubleshooting.

## Deployment Details

### Prerequisites
1. Node.js 18+
2. Supabase account and project
3. OpenRouter API key (optional, for AI features)
4. WordPress websites with REST API enabled

### Environment Variables
The following environment variables must be set:

#### Frontend (.env file)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase public API key

#### Backend (Supabase Functions Environment Variables)
- `SERVICE_ROLE_KEY` - Supabase service role key
- `OPENROUTER_API_KEY` - OpenRouter API key (optional)

### Deployment Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backlink-boss
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

4. **Deploy Supabase functions**:
   ```bash
   supabase functions deploy process-campaign
   supabase functions deploy generate-heading
   supabase functions deploy generate-content
   supabase functions deploy reset-campaign
   supabase functions deploy test-wp-connection
   supabase functions deploy debug-campaign
   ```

5. **Apply database schema**:
   ```bash
   supabase db push
   ```

6. **Build and deploy frontend**:
   ```bash
   npm run build
   # Deploy the contents of the dist/ folder to your hosting provider
   ```

### Supabase Functions Details

All functions are written in TypeScript and run on the Deno runtime provided by Supabase Edge Functions. They communicate with the Supabase database using the Supabase JavaScript client.

#### Function Dependencies
- `@supabase/supabase-js` - Supabase client library
- OpenRouter API for AI content generation (optional)

#### Function Environment Variables
These must be set in the Supabase dashboard under Project Settings > API > Edge Functions:
- `SUPABASE_URL` - Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `OPENROUTER_API_KEY` - For AI-powered content generation

### WordPress Integration

The application integrates with WordPress sites using the REST API. Each website requires:
1. WordPress username
2. Application password (not regular password)
3. Category ID for blog posts
4. Site URL with REST API enabled

### AI Services

The application can use OpenRouter to generate SEO-optimized content. If no API key is provided, it falls back to template-based content generation.

Supported models:
- Google Gemini
- OpenAI models
- Other models available through OpenRouter

### Monitoring and Logging

All Supabase functions output detailed logs that can be viewed in the Supabase dashboard under Functions > Logs. These logs are essential for debugging issues with campaign processing.