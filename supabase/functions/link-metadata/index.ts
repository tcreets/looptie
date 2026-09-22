const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const decodeHtml = (value: string | null) => {
  if (!value) return null;
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const key = String(entity).toLowerCase();
    if (key.startsWith("#x")) { const code = Number.parseInt(key.slice(2), 16); return Number.isFinite(code) ? String.fromCodePoint(code) : match; }
    if (key.startsWith("#")) { const code = Number.parseInt(key.slice(1), 10); return Number.isFinite(code) ? String.fromCodePoint(code) : match; }
    return named[key] ?? match;
  });
};
const clean = (value: string | null) => decodeHtml(value)?.replace(/\s+/g, " ").trim() || null;
const absoluteUrl = (value: string | null, base: string) => {
  const cleaned = clean(value);
  if (!cleaned) return null;
  try { return new URL(cleaned, base).href; } catch { return null; }
};
const stripTags = (value: string) => clean(value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " ")) || "";
const attr = (tag: string, name: string) => tag.match(new RegExp(name + '=["\\\']([^"\\\']*)["\\\']', "i"))?.[1] || null;

type ArticleBlock =
  | { type: "heading"; text: string; level: number }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; url: string; alt?: string | null };

const extractArticle = (html: string, base: string) => {
  // Work on a throwaway copy. We return text/URLs only, never source HTML.
  let source = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<form\b[\s\S]*?<\/form>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "");

  // Prefer semantic article/main content. Substack posts expose their body in one of these.
  const candidates = [
    source.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1],
    source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1],
    source.match(/<div\b[^>]*class=["'][^"']*(?:body|post-content|available-content|markup|article-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1],
  ].filter(Boolean) as string[];
  if (candidates.length) source = candidates.sort((a, b) => stripTags(b).length - stripTags(a).length)[0];

  const blocks: ArticleBlock[] = [];
  const tokenRe = /<(h[1-4]|p|blockquote|img)\b([^>]*)>([\s\S]*?)<\/\1>|<img\b([^>]*)\/?\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(source)) && blocks.length < 250) {
    const tag = (match[1] || "img").toLowerCase();
    const attrs = match[2] || match[4] || "";
    if (tag === "img") {
      const raw = attr(attrs, "data-src") || attr(attrs, "data-original") || attr(attrs, "src");
      const url = absoluteUrl(raw, base);
      if (!url || url.startsWith("data:")) continue;

      // Reader images should be editorial content, not avatars/icons/UI or tiny responsive placeholders.
      const width = Number.parseInt(attr(attrs, "width") || "", 10);
      const height = Number.parseInt(attr(attrs, "height") || "", 10);
      const className = (attr(attrs, "class") || "").toLowerCase();
      const alt = clean(attr(attrs, "alt"));
      const lowerUrl = url.toLowerCase();
      const looksLikeUi = /avatar|profile|icon|emoji|logo|author|button/.test(className) ||
        /avatar|profile|icon|emoji|logo/.test(lowerUrl);
      const explicitlyTiny = (Number.isFinite(width) && width > 0 && width < 180) ||
        (Number.isFinite(height) && height > 0 && height < 120);
      const substackTinyTransform = /substackcdn\.com\/image\/fetch\/[^/]*(?:w_|h_)(?:\d|%)/i.test(url) &&
        /(?:w_|h_)(?:[1-9]\d?|1[0-7]\d)(?:,|\/)/i.test(url);

      if (looksLikeUi || explicitlyTiny || substackTinyTransform) continue;
      blocks.push({ type: "image", url, alt });
      continue;
    }
    const text = stripTags(match[3] || "");
    if (!text || text.length < 2) continue;
    if (tag.startsWith("h")) blocks.push({ type: "heading", text, level: Number(tag.slice(1)) || 2 });
    else if (tag === "blockquote") blocks.push({ type: "quote", text });
    else blocks.push({ type: "paragraph", text });
  }
  const wordCount = blocks.filter((b) => b.type !== "image").reduce((sum, b: any) => sum + b.text.split(/\s+/).length, 0);
  return wordCount >= 80 ? blocks : [];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const parsed = new URL(body.url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL.");
    const wantsArticle = body.includeArticle === true;

    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const isYouTube = host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
    const isTikTok = host === "tiktok.com" || host.endsWith(".tiktok.com");
    const isInstagram = host === "instagram.com" || host.endsWith(".instagram.com");
    const isLinkedIn = host === "linkedin.com" || host.endsWith(".linkedin.com");
    if (isYouTube) {
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.href)}&format=json`);
      if (oembedResponse.ok) {
        const oembed = await oembedResponse.json();
        return new Response(JSON.stringify({ url: parsed.href, title: clean(oembed.title), image: clean(oembed.thumbnail_url), siteName: "YouTube", creator: clean(oembed.author_name) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const saveApiKey = Deno.env.get("SAVEAPI_KEY");
    const resolveWithSaveApi = async (platform: "instagram" | "tiktok") => {
      if (!saveApiKey) return null;
      try {
        const saveApiUrl = new URL(`https://api.saveapi.org/v1/${platform}`);
        saveApiUrl.searchParams.set("url", parsed.href);
        const r = await fetch(saveApiUrl, { headers: { "Authorization": `Bearer ${saveApiKey}` } });
        const data = await r.json();
        if (!r.ok || !data?.success || !Array.isArray(data.medias)) return null;
        const video = data.medias.find((m: any) => m?.type === "video" && m?.url);
        const first = data.medias.find((m: any) => m?.url);
        const meta = data.meta || {};
        return { url: data.source_url || parsed.href, title: clean(meta.title || meta.caption || null), image: clean(meta.thumbnail || meta.image || (first?.type === "image" ? first.url : null)), siteName: platform === "instagram" ? "Instagram" : "TikTok", creator: clean(meta.author || meta.username || null), mediaUrl: clean(video?.url || null) };
      } catch { return null; }
    };
    if (isInstagram || isTikTok) {
      const resolved = await resolveWithSaveApi(isInstagram ? "instagram" : "tiktok");
      if (resolved?.mediaUrl) return new Response(JSON.stringify(resolved), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (isTikTok) {
      try {
        const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.href)}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Looptie/1.0)" } });
        if (r.ok) {
          const o = await r.json();
          return new Response(JSON.stringify({ url: parsed.href, title: clean(o.title), image: absoluteUrl(o.thumbnail_url, parsed.href), siteName: "TikTok", creator: clean(o.author_name) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch {}
    }

    const response = await fetch(parsed.href, { redirect: "follow", headers: isInstagram ? {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9",
    } : { "User-Agent": "Mozilla/5.0 (compatible; Looptie/1.0)", "Accept": "text/html,application/xhtml+xml" } });
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
    let creator = readMeta("author") || readMeta("article:author") || null;

    if (isInstagram && !mediaUrl) {
      for (const pattern of [/"video_url"\s*:\s*"([^"]+)"/i, /"video_versions"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"/i]) {
        const m = html.match(pattern);
        if (!m?.[1]) continue;
        mediaUrl = absoluteUrl(m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/").replace(/&amp;/g, "&"), response.url || parsed.href);
        if (mediaUrl) break;
      }
    }
    if (isInstagram && !creator) {
      for (const candidate of [readMeta("twitter:creator"), readMeta("profile:username"), readMeta("al:ios:url"), title].filter(Boolean) as string[]) {
        const handle = candidate.match(/@([A-Za-z0-9._]+)/)?.[1];
        if (handle) { creator = "@" + handle; break; }
      }
    }

    const article = wantsArticle && !isInstagram && !isTikTok && !isYouTube ? {
      blocks: extractArticle(html, response.url || parsed.href),
      publishedAt: readMeta("article:published_time") || readMeta("date") || readMeta("datePublished"),
    } : null;

    return new Response(JSON.stringify({ url: response.url || parsed.href, title, image, siteName, creator, mediaUrl, article }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Could not read link metadata." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
