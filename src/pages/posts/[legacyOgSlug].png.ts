import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { slug as githubSlug } from "github-slugger";
import { renderPostOgImage } from "@/utils/generateOgImages";
import config from "@/config";

/**
 * AstroPaper v4 published every generated OG image at `/posts/{slugified-title}.png`.
 * v6 publishes them at `/posts/{slug}/index.png` instead, so the old paths are kept
 * alive here for links and social-card caches that still point at them.
 */
export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("posts").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts.map(post => ({
    params: { legacyOgSlug: githubSlug(post.data.title) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, url }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  return renderPostOgImage(
    props as Parameters<typeof renderPostOgImage>[0],
    url
  );
};
