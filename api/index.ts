import type { ServerBuild } from '@remix-run/cloudflare';
import { createRequestHandler } from '@remix-run/cloudflare-pages';

// Import the server build
let serverBuild: ServerBuild;

try {
  serverBuild = (await import('../build/server')) as unknown as ServerBuild;
} catch (error) {
  console.error('Failed to import server build:', error);
  throw error;
}

// Create request handler that works with standard Fetch API (compatible with Vercel Edge Runtime)
const requestHandler = createRequestHandler({
  build: serverBuild,
  mode: process.env.NODE_ENV || 'production',
  getLoadContext: () => ({
    env: process.env as any,
  }),
});

// Vercel Edge Function handler
export const config = {
  runtime: 'edge',
};

export default async function edgeHandler(request: Request): Promise<Response> {
  try {
    // Use the request handler directly with Fetch API Request/Response
    // This is compatible with Vercel Edge Runtime
    const response = await requestHandler(request);
    
    // Return the response directly (Edge Runtime uses Fetch API)
    return response;
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', errorMessage);
    if (errorStack) {
      console.error('Error stack:', errorStack);
    }
    return new Response(`Internal Server Error: ${errorMessage}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

