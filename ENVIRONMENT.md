# Environment Variables

This document describes the environment variables required for the Backlink Boss application.

## Supabase Environment Variables

These variables are required for the application to connect to Supabase:

- `VITE_SUPABASE_URL` - The Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - The Supabase public API key
- `SERVICE_ROLE_KEY` - The Supabase service role key (for server-side operations)

## AI Service Environment Variables

### OpenRouter (Recommended)

To use OpenRouter for AI-powered content generation:

- `OPENROUTER_API_KEY` - Your OpenRouter API key

OpenRouter provides access to various AI models including Google Gemini, OpenAI models, and others.

### Fallback Behavior

If no AI service API key is provided, the application will use template-based fallback generators for content and headings.

## WordPress Integration

For WordPress integration, website credentials are stored in the database rather than environment variables:

- WordPress URL
- WordPress username
- WordPress application password
- Category ID

These are configured per website in the application UI.

## Local Development

For local development, copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual values.