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
    
    // Create a proper Cloudflare Pages context
    // The handler expects a PagesFunction context
    const context: any = {
      request: new Request(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined,
      }),
      env: {},
      waitUntil: (promise: Promise<any>) => {
        // In Edge Runtime, we can't truly wait, but we can start the promise
        promise.catch(() => {});
      },
      passThroughOnException: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
      params: {},
      functionPath: url.pathname,
    };

    const response = await handler(context);
    
    // Ensure proper headers for HTML responses
    if (response.headers.get('content-type')?.includes('text/html')) {
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return response;
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

