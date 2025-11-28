# Backlink Boss - Project Information

## Overview

Backlink Boss is a comprehensive backlink management and automation platform built on Supabase. The application automates the process of creating SEO-optimized blog content with embedded backlinks, posting it to WordPress websites, and tracking the indexing progress. It's designed for digital marketers and SEO professionals who need to efficiently manage large-scale backlink campaigns.

## Core Purpose

The primary purpose of Backlink Boss is to automate the tedious process of creating and publishing SEO-optimized content with backlinks across multiple WordPress websites. Instead of manually creating blog posts, the system automatically generates high-quality, relevant content that includes strategically placed backlinks, publishes it to target websites, and tracks the results.

## Key Features

### 1. Website Management
- Connect multiple WordPress websites with REST API access
- Store and manage WordPress credentials securely
- Test website connectivity to ensure proper integration
- Configure website-specific settings like categories, image dimensions, and AI models

### 2. Campaign Management
- Create and manage backlink campaigns with customizable parameters
- Upload CSV files containing backlink URLs
- Define campaign parameters including:
  - Target location
  - Business category
  - Company name
  - SEO keywords (5 primary keywords)
  - Page type
- Track campaign progress and status

### 3. Automated Content Generation
- AI-powered heading generation using OpenRouter API
- SEO-optimized blog post content creation with embedded backlinks
- Automatic image generation and uploading
- Content customization based on campaign parameters

### 4. WordPress Integration
- Direct posting to WordPress sites via REST API
- Featured image generation and attachment
- Category assignment for published posts
- Status tracking of published content

### 5. Analytics and Tracking
- Dashboard with key metrics (websites, campaigns, backlinks, success rate)
- Detailed campaign progress tracking
- History of indexed content
- Performance monitoring

### 6. User Management
- Secure authentication with Supabase Auth
- User profiles with preferences
- Role-based access control

## Architecture

### Frontend
- Built with React and TypeScript
- Uses Vite as the build tool
- Implements responsive design with Tailwind CSS
- Component-based architecture with reusable UI elements
- Real-time updates using Supabase Realtime

### Backend
- Serverless architecture using Supabase Edge Functions
- Database powered by PostgreSQL with Supabase
- Authentication handled by Supabase Auth
- File storage using Supabase Storage (for uploaded CSV files)

### Supabase Services
1. **Database**: PostgreSQL with custom schema for campaigns, websites, backlinks, etc.
2. **Authentication**: Secure user authentication and authorization
3. **Edge Functions**: Serverless functions for business logic
4. **Realtime**: Live updates for campaign progress
5. **Storage**: File storage for campaign data files

### External Integrations
1. **OpenRouter API**: AI services for content generation
2. **Pollinations API**: Image generation
3. **WordPress REST API**: Content publishing

## Data Flow

### Campaign Creation Process
1. User creates a new campaign via the web interface
2. CSV file with backlink URLs is uploaded
3. Campaign parameters are configured (keywords, location, category, etc.)
4. Campaign is saved to the database with "queued" status

### Content Generation and Publishing Process
1. User initiates campaign processing
2. [process-campaign](file:///D:/Projects/backlink-boss/supabase/functions/process-campaign/index.ts) function retrieves campaign data and pending backlinks
3. [generate-heading](file:///D:/Projects/backlink-boss/supabase/functions/generate-heading/index.ts) function creates an SEO-optimized heading using AI
4. [generate-content](file:///D:/Projects/backlink-boss/supabase/functions/generate-content/index.ts) function creates blog content with embedded backlinks
5. Image is generated using Pollinations API
6. Content is posted to WordPress via REST API
7. Backlink status is updated to "indexed"
8. Process repeats for remaining backlinks in batches

### Monitoring and Tracking
1. Real-time updates are pushed to the frontend
2. Campaign progress is tracked in the database
3. History of published content is maintained
4. Analytics are calculated and displayed on the dashboard

## Database Schema

The application uses six main tables:

1. **user_profiles**: Stores user preferences and settings
2. **websites**: Contains WordPress website configurations
3. **campaigns**: Tracks backlink campaigns and their status
4. **backlinks**: Individual backlink URLs with status tracking
5. **index_history**: History of published content
6. **used_headings**: Previously used headings to avoid duplication

Each table implements Row Level Security (RLS) policies to ensure users can only access their own data.

## Supabase Functions

### process-campaign
The main orchestration function that coordinates the entire content generation and publishing workflow. It handles batching of backlinks, status management, and error handling.

### generate-heading
Uses AI services to create SEO-optimized question-style headings based on campaign parameters.

### generate-content
Creates full blog posts with embedded backlinks, following SEO best practices and content guidelines.

### reset-campaign
Resets campaign status and backlinks to allow reprocessing of failed or stuck campaigns.

### test-wp-connection
Verifies WordPress website connectivity and credentials.

### debug-campaign
Provides detailed debugging information for troubleshooting campaign issues.

## AI and Content Generation

### Heading Generation
- Uses OpenRouter API with various AI models
- Generates question-style headings for better SEO
- Falls back to template-based generation if AI service is unavailable
- Ensures uniqueness by tracking previously used headings

### Content Generation
- Creates 1500-1700 word blog posts
- Strategically places backlinks using campaign keywords
- Follows SEO best practices for structure and formatting
- Generates HTML content ready for WordPress publishing

### Image Generation
- Creates featured images using Pollinations API
- Customizable dimensions and AI models per website
- Automatically uploads images to WordPress as featured media

## WordPress Integration

### Requirements
- WordPress site with REST API enabled
- Application password for authentication (more secure than regular passwords)
- Proper category setup for blog posts
- Permalink structure that supports SEO

### Features
- Direct content publishing via REST API
- Featured image attachment
- Category assignment
- Published post status management

## Error Handling and Recovery

### Common Error Scenarios
1. **AI Service Failures**: Fallback to template-based content generation
2. **WordPress Connectivity Issues**: Clear error messages and retry mechanisms
3. **Campaign Processing Failures**: Automatic campaign status updates and error logging
4. **Stuck Campaigns**: Detection and recovery mechanisms

### Recovery Mechanisms
- Campaign reset functionality
- Manual intervention options
- Detailed error logging for troubleshooting
- Status monitoring and alerts

## Security

### Data Protection
- All database connections use SSL encryption
- User authentication via Supabase Auth
- Row Level Security policies for data isolation
- Secure storage of WordPress credentials

### Access Control
- JWT-based authentication
- Role-based permissions
- API key protection for external services
- Secure credential handling

## Deployment

### Prerequisites
- Supabase account with a configured project
- OpenRouter API key (optional but recommended)
- WordPress websites with REST API enabled
- Node.js 18+ for local development

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public API key
- `SERVICE_ROLE_KEY`: Service role key for backend functions
- `OPENROUTER_API_KEY`: API key for AI services

### Deployment Steps
1. Set up Supabase project
2. Apply database schema
3. Deploy Edge Functions
4. Configure environment variables
5. Build and deploy frontend application

## User Interface

### Dashboard
- Overview of key metrics
- Quick access to main features
- Recent activity feed

### Websites Management
- List of connected WordPress sites
- Website connectivity testing
- Configuration management

### Campaign Management
- Campaign creation wizard
- Batch processing controls
- Detailed campaign views
- Progress tracking

### History and Analytics
- Published content history
- Performance metrics
- Campaign success rates

## Future Enhancements

### Planned Features
1. Enhanced analytics and reporting
2. Multi-language support
3. Advanced scheduling options
4. Integration with additional CMS platforms
5. Improved AI model selection and tuning
6. Team collaboration features

### Scalability Considerations
1. Support for larger campaign batches
2. Improved parallel processing
3. Enhanced error handling for high-volume campaigns
4. Better resource management for AI services

## Technical Stack

### Frontend
- React 18+
- TypeScript
- Vite build system
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Supabase JavaScript client

### Backend
- Supabase Edge Functions (Deno runtime)
- PostgreSQL database
- Supabase Auth
- Supabase Storage

### External Services
- OpenRouter API for AI services
- Pollinations API for image generation
- WordPress REST API

### Development Tools
- ESLint for code quality
- TypeScript for type safety
- React DevTools for debugging
- Supabase CLI for local development

## Troubleshooting

### Common Issues
1. **Campaign Processing Failures**: Check campaign configuration and WordPress connectivity
2. **AI Generation Errors**: Verify OpenRouter API key and quota
3. **WordPress Posting Issues**: Confirm credentials and category IDs
4. **Database Connection Problems**: Check Supabase configuration

### Debugging Tools
1. Supabase function logs
2. Browser developer tools
3. WordPress debug logs
4. Manual testing endpoints

## Best Practices

### Campaign Creation
1. Ensure high-quality backlink sources
2. Provide accurate campaign parameters
3. Test WordPress connectivity before starting campaigns
4. Monitor campaign progress regularly

### Content Optimization
1. Use relevant keywords naturally
2. Focus on providing value to readers
3. Maintain consistent branding
4. Regularly review and update content strategies

### System Maintenance
1. Keep WordPress sites updated
2. Monitor API usage quotas
3. Regular backup of campaign data
4. Review and rotate API keys periodically