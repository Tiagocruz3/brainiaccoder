import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

// Import the server build with better error handling
let serverBuild: ServerBuild;
let handler: any;

try {
  console.log('Importing server build...');
  serverBuild = (await import('../build/server')) as unknown as ServerBuild;
  console.log('Server build imported successfully');
  
  console.log('Creating handler...');
  handler = createPagesFunctionHandler({
    build: serverBuild,
  });
  console.log('Handler created successfully');
} catch (error) {
  console.error('Failed to initialize:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  throw error;
}

// Vercel Node.js function handler
export default async function vercelHandler(req: any, res: any) {
  try {
    console.log('Request received:', req.method, req.url);
    
    // Convert Vercel request to Fetch API Request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.headers['x-forwarded-host'] || 'localhost';
    const url = new URL(req.url || '/', `${protocol}://${host}`);
    
    console.log('Constructed URL:', url.toString());
    
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

    console.log('Creating Cloudflare context...');
    // Create Cloudflare Pages context
    const context: any = {
      request,
      env: process.env as any,
      waitUntil: (promise: Promise<any>) => {
        promise.catch((err) => console.error('waitUntil error:', err));
      },
      passThroughOnException: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
      params: {},
      functionPath: url.pathname,
    };

    console.log('Calling handler...');
    const response = await handler(context);
    console.log('Handler responded with status:', response.status);
    
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
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', errorMessage);
    if (errorStack) {
      console.error('Error stack:', errorStack);
    }
    // Log the full error object
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: errorMessage 
      });
    }
  }
}

