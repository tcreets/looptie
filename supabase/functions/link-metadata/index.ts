const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const decodeHtml = (value: string | null) => {
  if (!value) return null;
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const key = String(entity).toLowerCase();
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return named[key] ?? match;
  });
};
const clean = (value: string | null) => decodeHtml(value)?.replace(/\s+/g, " ").trim() || null;
const absoluteUrl = (value: string | null, base: string) => {
  const cleaned = clean(value);
  if (!cleaned) return null;
  try { return new URL(cleaned, base).href; } catch { return null; }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const parsed = new URL(body.url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL.");

    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const isYouTube = host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
    const isTikTok = host === "tiktok.com" || host.endsWith(".tiktok.com");
    const isInstagram = host === "instagram.com" || host.endsWith(".instagram.com");
    const isLinkedIn = host === "linkedin.com" || host.endsWith(".linkedin.com");
    if (isYouTube) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.href)}&format=json`;
      const oembedResponse = await fetch(oembedUrl);
      if (oembedResponse.ok) {
        const oembed = await oembedResponse.json();
        return new Response(JSON.stringify({
          url: parsed.href,
          title: clean(oembed.title),
          image: clean(oembed.thumbnail_url),
          siteName: "YouTube",
          creator: clean(oembed.author_name),
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.warn("YouTube oEmbed returned", oembedResponse.status);
    }

    const saveApiKey = Deno.env.get("SAVEAPI_KEY");
    const resolveWithSaveApi = async (platform: "instagram" | "tiktok") => {
      if (!saveApiKey) {
        console.warn("SAVEAPI_KEY is not configured.");
        return null;
      }
      try {
        const saveApiUrl = new URL(`https://api.saveapi.org/v1/${platform}`);
        saveApiUrl.searchParams.set("url", parsed.href);
        const saveApiResponse = await fetch(saveApiUrl, {
          headers: { "Authorization": `Bearer ${saveApiKey}` },
        });
        const saveApi = await saveApiResponse.json();
        if (!saveApiResponse.ok || !saveApi?.success || !Array.isArray(saveApi.medias)) {
          console.warn(`SaveAPI ${platform} resolve failed:`, saveApi?.error?.code || saveApiResponse.status);
          return null;
        }
        const video = saveApi.medias.find((media: any) => media?.type === "video" && media?.url);
        const firstMedia = saveApi.medias.find((media: any) => media?.url);
        if (!video?.url && !firstMedia?.url) return null;
        const meta = saveApi.meta || {};
        return {
          url: saveApi.source_url || parsed.href,
          title: clean(meta.title || meta.caption || null),
          image: clean(meta.thumbnail || meta.image || (firstMedia?.type === "image" ? firstMedia.url : null)),
          siteName: platform === "instagram" ? "Instagram" : "TikTok",
          creator: clean(meta.author || meta.username || null),
          mediaUrl: clean(video?.url || null),
        };
      } catch (saveApiError) {
        console.warn(`SaveAPI ${platform} resolve error:`, saveApiError);
        return null;
      }
    };

    if (isInstagram || isTikTok) {
      const resolved = await resolveWithSaveApi(isInstagram ? "instagram" : "tiktok");
      if (resolved?.mediaUrl) {
        return new Response(JSON.stringify(resolved), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (isTikTok) {
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.href)}`;
        const oembedResponse = await fetch(oembedUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Looptie/1.0)" } });
        if (oembedResponse.ok) {
          const oembed = await oembedResponse.json();
          return new Response(JSON.stringify({
            url: parsed.href,
            title: clean(oembed.title),
            image: absoluteUrl(oembed.thumbnail_url, parsed.href),
            siteName: "TikTok",
            creator: clean(oembed.author_name),
          }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.warn("TikTok oEmbed returned", oembedResponse.status);
      } catch (oembedError) {
        console.warn("TikTok oEmbed metadata failed:", oembedError);
      }
    }

    const response = await fetch(parsed.href, {
      redirect: "follow",
      headers: isInstagram ? {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      } : { "User-Agent": "Mozilla/5.0 (compatible; Looptie/1.0)" },
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
    let title = readMeta("og:title") || readMeta("twitter:title") || clean(titleMatch?.[1] || null);
    let image = absoluteUrl(readMeta("og:image:secure_url") || readMeta("og:image") || readMeta("twitter:image:src") || readMeta("twitter:image"), response.url || parsed.href);
    let siteName = readMeta("og:site_name") || (isInstagram ? "Instagram" : isTikTok ? "TikTok" : isLinkedIn ? "LinkedIn" : host);
    let mediaUrl = absoluteUrl(readMeta("og:video:secure_url") || readMeta("og:video:url") || readMeta("og:video") || readMeta("twitter:player:stream"), response.url || parsed.href);

    // Instagram does not consistently expose og:video to server-side requests.
    // Public Reel/Post HTML can still contain a direct video_url in its embedded JSON.
    if (isInstagram && !mediaUrl) {
      const videoPatterns = [
        /"video_url"\s*:\s*"([^"]+)"/i,
        /"video_versions"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i,
      ];
      for (const pattern of videoPatterns) {
        const match = html.match(pattern);
        if (!match?.[1]) continue;
        const decodedVideoUrl = match[1]
          .replace(/\\u0026/g, "&")
          .replace(/\\\//g, "/")
          .replace(/&amp;/g, "&");
        mediaUrl = absoluteUrl(decodedVideoUrl, response.url || parsed.href);
        if (mediaUrl) break;
      }
    }
    let creator = readMeta("author") || readMeta("article:author") || null;
    if (isInstagram && !creator) {
      const creatorCandidates = [
        readMeta("twitter:creator"),
        readMeta("profile:username"),
        readMeta("al:ios:url"),
        title,
      ].filter(Boolean) as string[];
      for (const candidate of creatorCandidates) {
        const handle = candidate.match(/@([A-Za-z0-9._]+)/)?.[1];
        if (handle) { creator = "@" + handle; break; }
      }
    }

    if (isYouTube) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.href)}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
        if (oembedResponse.ok) {
          const oembed = await oembedResponse.json();
          title = clean(oembed.title) || title;
          creator = clean(oembed.author_name) || creator;
          image = absoluteUrl(oembed.thumbnail_url, parsed.href) || image;
          siteName = "YouTube";
        }
      } catch (oembedError) {
        console.warn("YouTube oEmbed metadata failed:", oembedError);
      }
    }
    return new Response(JSON.stringify({ url: response.url || parsed.href, title, image, siteName, creator, mediaUrl }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Could not read link metadata." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});