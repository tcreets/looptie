const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const clean = (value: string | null) => value?.replace(/\s+/g, " ").trim() || null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const parsed = new URL(body.url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL.");
    const response = await fetch(parsed.href, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Looptie/1.0)" },
    });
    if (!response.ok) throw new Error("Source returned " + response.status + ".");
    const html = await response.text();
    const readMeta = (property: string) => {
      const tags = html.match(/<meta\s+[^>]*>/gi) || [];
      for (const tag of tags) {
        const key = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
        const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
        if (key?.toLowerCase() === property.toLowerCase() && content) return clean(content);
      }
      return null;
    };
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const isYouTube = parsed.hostname === "youtu.be" || parsed.hostname.endsWith("youtube.com");
    let title = readMeta("og:title") || readMeta("twitter:title") || clean(titleMatch?.[1] || null);
    let image = readMeta("og:image") || readMeta("twitter:image");
    let siteName = readMeta("og:site_name") || parsed.hostname.replace(/^www\./, "");
    let creator = readMeta("author") || readMeta("article:author") || null;

    if (isYouTube) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.href)}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
        if (oembedResponse.ok) {
          const oembed = await oembedResponse.json();
          title = clean(oembed.title) || title;
          creator = clean(oembed.author_name) || creator;
          image = clean(oembed.thumbnail_url) || image;
          siteName = "YouTube";
        }
      } catch (oembedError) {
        console.warn("YouTube oEmbed metadata failed:", oembedError);
      }
    }
    return new Response(JSON.stringify({ url: response.url || parsed.href, title, image, siteName, creator }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Could not read link metadata." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});