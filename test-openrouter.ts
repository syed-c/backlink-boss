import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

if (existsSync(envPath)) {
  config({ path: envPath });
}

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

console.log('OpenRouter API Key:', openRouterApiKey ? 'SET' : 'MISSING');

if (!openRouterApiKey) {
  console.error('Missing OpenRouter API key');
  process.exit(1);
}

async function testOpenRouter() {
  try {
    console.log('\n=== TESTING OPENROUTER API ===');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          { 
            role: 'user', 
            content: 'Say hello world' 
          }
        ],
        temperature: 0.7
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', { status: response.status, errorText });
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOpenRouter();