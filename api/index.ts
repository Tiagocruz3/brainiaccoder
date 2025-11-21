import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the server build
let serverBuild: ServerBuild;

try {
  serverBuild = (await import('../build/server')) as unknown as ServerBuild;
} catch (error) {
  console.error('Failed to import server build:', error);
  throw error;
}

const handler = createPagesFunctionHandler({
  build: serverBuild,
});

// Use Node.js runtime for better compatibility
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Convert Vercel request to Fetch API Request
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    const request = new Request(url.toString(), {
      method: req.method || 'GET',
      headers: req.headers as HeadersInit,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body 
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined,
    });

    // Create Cloudflare Pages context
    const context: any = {
      request,
      env: process.env as any,
      waitUntil: (promise: Promise<any>) => {
        // Start the promise but don't block
        promise.catch(console.error);
      },
      passThroughOnException: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
      params: {},
      functionPath: url.pathname,
    };

    const response = await handler(context);
    
    // Convert Fetch Response to Vercel response
    const body = await response.text();
    
    // Set status
    res.status(response.status);
    
    // Copy headers
    response.headers.forEach((value, key) => {
      // Skip some headers that Vercel handles
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });
    
    // Send response
    res.send(body);
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage, error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: errorMessage 
    });
  }
}

