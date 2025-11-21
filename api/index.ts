import type { ServerBuild } from '@remix-run/cloudflare';
import { createRequestHandler } from '@remix-run/cloudflare';

// Import the server build
let serverBuild: ServerBuild;

try {
  serverBuild = (await import('../build/server')) as unknown as ServerBuild;
} catch (error) {
  console.error('Failed to import server build:', error);
  throw error;
}

// Create request handler
const requestHandler = createRequestHandler({
  build: serverBuild,
  mode: process.env.NODE_ENV || 'production',
  getLoadContext: () => ({
    env: process.env as any,
  }),
});

// Vercel Node.js function handler
export default async function vercelHandler(req: any, res: any) {
  try {
    // Convert Vercel request to Fetch API Request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.headers['x-forwarded-host'] || 'localhost';
    const url = new URL(req.url || '/', `${protocol}://${host}`);
    
    // Get request body if present
    let body: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        if (typeof req.body === 'string') {
          body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          body = req.body;
        } else {
          body = JSON.stringify(req.body);
        }
      } else if (req.rawBody) {
        body = req.rawBody;
      }
    }
    
    const request = new Request(url.toString(), {
      method: req.method || 'GET',
      headers: req.headers as HeadersInit,
      body,
    });

    const response = await requestHandler(request);
    
    // Convert Fetch Response to Vercel response
    const bodyText = await response.text();
    
    // Set status
    res.status(response.status);
    
    // Copy headers
    response.headers.forEach((value, key) => {
      // Skip some headers that Vercel handles
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'content-length') {
        res.setHeader(key, value);
      }
    });
    
    // Send response
    res.send(bodyText);
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', errorMessage);
    if (errorStack) {
      console.error('Error stack:', errorStack);
    }
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: errorMessage 
    });
  }
}

