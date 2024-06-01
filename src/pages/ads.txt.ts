import type { APIRoute } from "astro";

const ads = `google.com, pub-6040389729588918, DIRECT, f08c47fec0942fa0`.trim();

export const GET: APIRoute = () =>
  new Response(ads, {
    headers: { "Content-Type": "text/plain" },
  });
