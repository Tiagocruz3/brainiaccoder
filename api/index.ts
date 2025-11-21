import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

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

// Vercel Edge Function handler
export const config = {
  runtime: 'edge',
};

export default async function edgeHandler(request: Request): Promise<Response> {
  try {
    // Get the URL from the request
    const url = new URL(request.url);
    
    // Create a Cloudflare Pages context
    const context: any = {
      request,
      env: {},
      waitUntil: (promise: Promise<any>) => {
        // In Edge Runtime, we can't truly wait, but we can start the promise
        promise.catch(console.error);
      },
      passThroughOnException: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
      params: {},
      functionPath: url.pathname,
    };

    const response = await handler(context);
    
    // Return the response directly (Edge Runtime uses Fetch API)
    return response;
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Internal Server Error: ${errorMessage}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

