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
  runtime: '@vercel/edge',
};

export default async function edgeHandler(request: Request): Promise<Response> {
  try {
    // Create a Cloudflare Pages context compatible object
    const context = {
      request,
      env: {},
      waitUntil: (promise: Promise<any>) => promise,
      passThroughOnException: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    };

    return await handler(context as any);
  } catch (error) {
    console.error('Handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

