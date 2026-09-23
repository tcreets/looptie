import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Pause, Play, SquarePen, Heart, ArrowDownUp, Check, Link2, BookmarkPlus, FileText } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

function getYouTubeId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      return parsed.searchParams.get("v") || (parsed.pathname.startsWith("/shorts/") ? parsed.pathname.split("/")[2] : "");
    }
  } catch {}
  return "";
}

function getTikTokId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "tiktok.com" && !host.endsWith(".tiktok.com")) return "";
    return parsed.pathname.match(/\/video\/(\d+)/)?.[1] || "";
  } catch {}
  return "";
}

function getInstagramEmbedUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "instagram.com" && !host.endsWith(".instagram.com")) return "";
    const match = parsed.pathname.match(/^\/(p|reel|reels|tv)\/([^/]+)/i);
    if (!match) return "";
    const type = match[1].toLowerCase() === "reels" ? "reel" : match[1].toLowerCase();
    return `https://www.instagram.com/${type}/${match[2]}/embed/`;
  } catch {}
  return "";
}

function InstagramEmbed({ url, title, style }) {
  const embedRef = useRef(null);
  useEffect(() => {
    const process = () => window.instgrm?.Embeds?.process?.();
    const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (existing) { process(); return; }
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = process;
    document.body.appendChild(script);
  }, [url]);
  return <div ref={embedRef} style={style}>
    <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" style={instagramBlockquote}>
      <a href={url} target="_blank" rel="noreferrer">{title || "View this post on Instagram"}</a>
    </blockquote>
  </div>;
}

function getArticleSourceLabel(item) {
  const platform = (item.source_platform || "").trim();
  const url = (item.source_url || "").toLowerCase();
  if (url.includes("substack.com") || platform.toLowerCase().includes("substack")) return "Substack";
  if (platform) return platform.replace(/^www\./i, "");
  try { return new URL(item.source_url).hostname.replace(/^www\./i, ""); } catch { return "Web"; }
}

function isArticleLink(item) {
  return item.media_type === "link" && !getYouTubeId(item.source_url) && !getTikTokId(item.source_url) && !getInstagramEmbedUrl(item.source_url);
}

function SmartImage({ src, style }) {
  return <img src={src} loading="lazy" alt="" style={{ ...style, objectFit: "cover", background: "var(--bg)" }} />;
}

export default function HomeFeed({ spaces, activeFeed, setActiveFeed, feedRef, filteredFeedItems, setSelectedItem, onAddContent }) {
  const [mutedVideos, setMutedVideos] = useState({});
  const [pausedVideos, setPausedVideos] = useState({});
  const [mutedYouTube, setMutedYouTube] = useState({});
  const [mutedTikTok, setMutedTikTok] = useState({});
  const [sortOrder, setSortOrder] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeItemId, setActiveItemId] = useState(null);
  const videoRefs = useRef({});
  const youtubeRefs = useRef({});
  const tiktokRefs = useRef({});
  const handlePillWheel = (e) => {
    const scroller = e.currentTarget;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!delta) return;
    scroller.scrollLeft += delta;
    e.preventDefault();
  };
  const sortedFeedItems = [...filteredFeedItems].sort((a, b) => {
    if (sortOrder === "favorites") return Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
    const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
    const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
    return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
  });

  useEffect(() => {
    const root = feedRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll("[data-feed-card-id]"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.intersectionRatio >= 0.6) {
        setActiveItemId(visible[0].target.dataset.feedCardId);
      }
    }, { root, threshold: [0, 0.25, 0.6, 0.75, 1] });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [filteredFeedItems, feedRef]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([itemId, video]) => {
      if (!video) return;
      if (String(itemId) === String(activeItemId)) {
        video.play().catch(() => {});
        setPausedVideos((prev) => ({ ...prev, [itemId]: false }));
      } else {
        video.pause();
        if (video.currentTime) video.currentTime = 0;
        setPausedVideos((prev) => ({ ...prev, [itemId]: true }));
      }
    });
  }, [activeItemId]);

  useLayoutEffect(() => {
    // Reset before the browser paints the newly selected Feed so the user
    // never sees it render at the previous Feed's scroll position.
    if (feedRef.current) feedRef.current.scrollTop = 0;
    Object.values(videoRefs.current).forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });
    Object.values(youtubeRefs.current).forEach((frame) => {
      frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "stopVideo", args: [] }), "*");
    });
    Object.values(tiktokRefs.current).forEach((frame) => {
      frame?.contentWindow?.postMessage({ type: "pause", value: undefined, "x-tiktok-player": true }, "*");
    });
    setPausedVideos({});
    setActiveItemId(null);
  }, [activeFeed, feedRef]);

  return (
    <div style={homeStyle}>
      <div style={feedControlsStyle}>
      <div style={feedSelectorStyle} className="horizontal-pretty-scrollbar" onWheel={handlePillWheel}>
        {spaces.map((feed) => {
          const active = activeFeed === feed.name;
          return <button key={feed.id} onClick={() => {
            trackEvent("space_opened", { space: feed.name, source: "home_feed_pill" });
            feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
            setActiveFeed(feed.name);
          }} style={{ ...feedButtonStyle, background: active ? "var(--brand)" : "var(--surface-elevated)", color: active ? "white" : "var(--text-primary)", borderColor: active ? "var(--brand)" : "var(--border)" }}>{feed.name}</button>;
        })}
      </div>
      <div style={sortWrap}>
        <button type="button" style={sortButton} aria-label="Sort feed" title="Sort" onClick={() => setShowSortMenu((prev) => !prev)}><ArrowDownUp size={20} /></button>
        {showSortMenu && <div style={sortMenu}>
          {[["newest","Newest"],["oldest","Oldest"],["favorites","Favorites first"]].map(([value,label]) => <button key={value} type="button" style={sortMenuItem} onClick={() => { setSortOrder(value); setShowSortMenu(false); requestAnimationFrame(() => { if (feedRef.current) { feedRef.current.scrollTop = 0; feedRef.current.scrollTo({ top: 0, behavior: "auto" }); } }); }}><span>{label}</span>{sortOrder === value && <Check size={17} color="var(--brand)" />}</button>)}
        </div>}
      </div>
      </div>

      <div style={feedViewport}>
      <div ref={feedRef} style={feedList} className="pretty-scroll">
        {filteredFeedItems.length === 0 && <div style={emptyState}>
          <div style={emptyVisual} aria-hidden="true">
            <div style={{ ...emptyBackCard, transform:"rotate(-9deg) translate(-8px, 5px)" }} />
            <div style={{ ...emptyBackCard, transform:"rotate(8deg) translate(8px, 5px)" }} />
            <div style={emptyFrontCard}><BookmarkPlus size={34} strokeWidth={1.8} /></div>
          </div>
          <h2 style={emptyTitle}>Start your {activeFeed} Feed</h2>
          <p style={emptyCopy}>Save something you want to revisit. Your Feed will come to life here.</p>
          <button type="button" style={emptyButton} onClick={onAddContent}><BookmarkPlus size={18} />Add your first save</button>
        </div>}
        {sortedFeedItems.map((item) => (
          <div key={item.id} data-feed-card-id={item.id} style={feedCard}>
            {item.media_type === "video" || (item.media_type === "link" && item.media_url && (getInstagramEmbedUrl(item.source_url) || getTikTokId(item.source_url))) ? <video data-item-id={item.id} ref={(el) => { if (el) videoRefs.current[item.id] = el; }} src={item.media_url || item.image} style={videoStyle} autoPlay muted loop playsInline preload="metadata" /> : item.media_type === "link" && getYouTubeId(item.source_url) ? <iframe data-item-id={item.id} ref={(el) => { if (el) youtubeRefs.current[item.id] = el; }} src={String(activeItemId) === String(item.id) ? `https://www.youtube.com/embed/${getYouTubeId(item.source_url)}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&rel=0` : "about:blank"} title={item.source_title || "YouTube video"} style={youtubeEmbed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : item.media_type === "link" && getTikTokId(item.source_url) ? <iframe data-item-id={item.id} ref={(el) => { if (el) tiktokRefs.current[item.id] = el; }} src={String(activeItemId) === String(item.id) ? `https://www.tiktok.com/player/v1/${getTikTokId(item.source_url)}?autoplay=1&loop=1&controls=1&volume_control=1&rel=0` : "about:blank"} title={item.source_title || "TikTok video"} style={youtubeEmbed} allow="autoplay; fullscreen" allowFullScreen /> : item.media_type === "link" && getInstagramEmbedUrl(item.source_url) ? <InstagramEmbed url={item.source_url} title={item.source_title} style={instagramEmbedWrap} /> : item.media_type === "link" && !item.image ? <div style={linkFallback}>{isArticleLink(item) ? <div style={articleFallbackContent}><div style={articleFallbackIcon}><FileText size={30} strokeWidth={1.9} /></div><h2 style={articleFallbackDomain}>{getArticleSourceLabel(item)}</h2><div style={articleFallbackType}>Article</div></div> : <><div style={linkFallbackIcon}><Link2 size={34} /></div><div style={linkFallbackSource}>{item.source_platform || "Web"}</div><h2 style={linkFallbackTitle}>{item.source_title || "Saved link"}</h2></>}</div> : <SmartImage src={item.image} style={imageStyle} />}
            {!(isArticleLink(item) && !item.image) && <div style={overlayStyle} />}
            {isArticleLink(item) && <><div style={articleIndicator} aria-label="Article"><FileText size={22} strokeWidth={2.2} /></div>{item.image && <div style={articleMetadata}><h2 style={articleFeedTitle}>{item.source_title || "Saved article"}</h2><div style={articleFeedMeta}>{[item.source_creator, getArticleSourceLabel(item)].filter(Boolean).join(" · ")}</div></div>}</>}
            {item.favorite && <div style={favoriteIndicator}><Heart fill="var(--favorite)" color="var(--favorite)" size={28} /></div>}
            <div style={floatingActions}>
              {(item.media_type === "video" || (item.media_type === "link" && item.media_url && (getInstagramEmbedUrl(item.source_url) || getTikTokId(item.source_url)))) && <>
                <button type="button" style={floatingIconButton} onClick={async (e) => { e.stopPropagation(); const video = videoRefs.current[item.id]; if (!video) return; if (video.paused) { await video.play(); setPausedVideos((prev) => ({ ...prev, [item.id]: false })); } else { video.pause(); setPausedVideos((prev) => ({ ...prev, [item.id]: true })); } }}>{pausedVideos[item.id] ? <Play size={30} strokeWidth={2.5} /> : <Pause size={30} strokeWidth={2.5} />}</button>
                <button type="button" style={floatingIconButton} onClick={async (e) => { e.stopPropagation(); const video = videoRefs.current[item.id]; if (!video) return; const isCurrentlyMuted = video.muted; video.muted = !isCurrentlyMuted; video.volume = isCurrentlyMuted ? 1 : 0; await video.play(); setMutedVideos((prev) => ({ ...prev, [item.id]: !isCurrentlyMuted })); }}>{mutedVideos[item.id] === false ? <Volume2 size={30} strokeWidth={2.5} /> : <VolumeX size={30} strokeWidth={2.5} />}</button>
              </>}
              {item.media_type === "link" && getYouTubeId(item.source_url) && <button type="button" style={floatingIconButton} aria-label={mutedYouTube[item.id] ? "Mute YouTube video" : "Unmute YouTube video"} title={mutedYouTube[item.id] ? "Mute" : "Unmute"} onClick={(e) => {
                e.stopPropagation();
                const frame = youtubeRefs.current[item.id];
                if (!frame?.contentWindow) return;
                const isUnmuted = Boolean(mutedYouTube[item.id]);
                frame.contentWindow.postMessage(JSON.stringify({ event:"command", func:isUnmuted ? "mute" : "unMute", args:[] }), "*");
                frame.contentWindow.postMessage(JSON.stringify({ event:"command", func:"playVideo", args:[] }), "*");
                setMutedYouTube((prev) => ({ ...prev, [item.id]: !isUnmuted }));
              }}>{mutedYouTube[item.id] ? <Volume2 size={30} strokeWidth={2.5} /> : <VolumeX size={30} strokeWidth={2.5} />}</button>}
              {item.media_type === "link" && getTikTokId(item.source_url) && !item.media_url && <button type="button" style={floatingIconButton} aria-label={mutedTikTok[item.id] ? "Mute TikTok video" : "Unmute TikTok video"} title={mutedTikTok[item.id] ? "Mute" : "Unmute"} onClick={(e) => {
                e.stopPropagation();
                const frame = tiktokRefs.current[item.id];
                if (!frame?.contentWindow) return;
                const isUnmuted = Boolean(mutedTikTok[item.id]);
                frame.contentWindow.postMessage({ type:isUnmuted ? "mute" : "unMute", value:undefined, "x-tiktok-player":true }, "*");
                frame.contentWindow.postMessage({ type:"play", value:undefined, "x-tiktok-player":true }, "*");
                setMutedTikTok((prev) => ({ ...prev, [item.id]: !isUnmuted }));
              }}>{mutedTikTok[item.id] ? <Volume2 size={30} strokeWidth={2.5} /> : <VolumeX size={30} strokeWidth={2.5} />}</button>}
              <button type="button" style={floatingIconButton} onClick={() => { trackEvent("item_opened", { item_id: item.id, space: item.space, media_type: item.media_type }); setSelectedItem(item); }}><SquarePen size={32} strokeWidth={2.8} /></button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

const feedControlsStyle = { display:"flex", alignItems:"center", gap:"6px", paddingRight:"14px", position:"relative", zIndex:3, width:"100%", minWidth:0, boxSizing:"border-box" };
const feedSelectorStyle = { display:"flex", gap:"10px", margin:"0 0 16px", padding:"12px 8px 8px 16px", boxSizing:"border-box", overflowX:"auto", overflowY:"hidden", flex:"1 1 0", minWidth:0, width:0, maxWidth:"none", touchAction:"pan-x", whiteSpace:"nowrap", WebkitOverflowScrolling:"touch", scrollbarWidth:"none", WebkitMaskImage:"linear-gradient(to right, black 0, black calc(100% - 28px), transparent 100%)", maskImage:"linear-gradient(to right, black 0, black calc(100% - 28px), transparent 100%)" };
const feedButtonStyle = { border:"1px solid var(--border)", borderRadius:"999px", padding:"10px 16px", fontWeight:"var(--weight-bold)", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" };
const feedViewport = { position:"relative", flex:1, minHeight:0 };
const feedList = { display:"grid", gap:"18px", paddingBottom:"96px", height:"100%", boxSizing:"border-box", minHeight:0, overflowY:"auto", scrollSnapType:"y mandatory", WebkitOverflowScrolling:"touch" };
const feedCard = { position:"relative", height:"100%", minHeight:"calc(100vh - 118px)", borderRadius:"28px", overflow:"hidden", border:"1px solid var(--border)", background:"var(--surface)", scrollSnapAlign:"start", scrollSnapStop:"always" };
const imageStyle = { width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block" };
const videoStyle = { ...imageStyle, objectFit:"contain", background:"#000" };
const overlayStyle = { position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,.35), transparent)", pointerEvents:"none" };
const articleIndicator = { position:"absolute", top:"18px", left:"18px", width:"44px", height:"44px", borderRadius:"999px", display:"flex", alignItems:"center", justifyContent:"center", color:"white", background:"rgba(0,0,0,.48)", border:"1px solid rgba(255,255,255,.18)", backdropFilter:"blur(8px)", zIndex:4 };
const articleMetadata = { position:"absolute", left:"22px", right:"88px", bottom:"64px", zIndex:4, color:"white", textShadow:"0 2px 12px rgba(0,0,0,.75)", pointerEvents:"none" };
const articleFeedTitle = { margin:"0 0 7px", fontSize:"clamp(24px, 5vw, 38px)", lineHeight:1.08, letterSpacing:"-.02em", fontWeight:"var(--weight-bold)", color:"white" };
const articleFeedMeta = { fontSize:"var(--text-md)", color:"rgba(255,255,255,.78)", fontWeight:"var(--weight-medium)" };
const favoriteIndicator = { position:"absolute", top:"18px", left:"18px", color:"var(--favorite)", fontSize:"30px", zIndex:3, textShadow:"0 2px 10px rgba(0,0,0,.6)", opacity:.9 };
const emptyState = { alignSelf:"start", justifySelf:"center", width:"min(100% - 40px, 420px)", marginTop:"clamp(70px, 16vh, 150px)", textAlign:"center", color:"var(--text-secondary)", display:"flex", flexDirection:"column", alignItems:"center" };
const emptyVisual = { width:"112px", height:"96px", position:"relative", marginBottom:"24px" };
const emptyBackCard = { position:"absolute", width:"70px", height:"82px", top:"7px", left:"21px", borderRadius:"20px", background:"var(--surface-elevated)", border:"1px solid var(--border)" };
const emptyFrontCard = { position:"absolute", width:"76px", height:"88px", top:0, left:"18px", borderRadius:"22px", background:"var(--accent-bg)", border:"1px solid var(--accent-border)", color:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--shadow)" };
const emptyTitle = { margin:"0 0 10px", fontSize:"var(--text-xl)", color:"var(--text-primary)" };
const emptyCopy = { maxWidth:"340px", margin:"0 0 24px", fontSize:"var(--text-md)", lineHeight:"var(--leading-normal)", color:"var(--text-secondary)" };
const emptyButton = { border:"none", borderRadius:"999px", padding:"13px 19px", background:"var(--brand)", color:"white", fontWeight:"var(--weight-bold)", display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", boxShadow:"0 8px 22px rgba(var(--brand-rgb),.22)" };
const homeStyle = { height:"100%", display:"flex", flexDirection:"column", minHeight:0 };
const floatingActions = { position:"absolute", right:"20px", bottom:"108px", display:"flex", flexDirection:"column", gap:"22px", zIndex:10 };
const floatingIconButton = { border:"none", background:"transparent", color:"white", cursor:"pointer", padding:"8px", display:"flex", alignItems:"center", justifyContent:"center", touchAction:"manipulation" };
const sortWrap = { position:"relative", flexShrink:0, alignSelf:"flex-start", marginTop:"12px" };
const sortButton = { width:"40px", height:"40px", borderRadius:"999px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };
const sortMenu = { position:"absolute", top:"48px", right:0, width:"180px", padding:"6px", border:"1px solid var(--border)", borderRadius:"16px", background:"var(--surface)", boxShadow:"var(--shadow)", zIndex:80 };
const sortMenuItem = { width:"100%", border:"none", background:"transparent", color:"var(--text-primary)", padding:"11px 10px", borderRadius:"11px", display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:"var(--text-sm)", cursor:"pointer" };

const linkFallback = { width:"100%", height:"100%", minHeight:"calc(100vh - 118px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", padding:"40px", boxSizing:"border-box", textAlign:"center", background:"var(--surface)" };
const articleFallbackContent = { position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px", borderRadius:"inherit", overflow:"hidden", background:"radial-gradient(ellipse 82% 76% at -10% 105%, var(--article-glow-strong) 0%, var(--article-glow-mid) 34%, var(--article-glow-soft) 56%, transparent 76%), radial-gradient(ellipse 72% 68% at 108% -8%, var(--article-glow-strong) 0%, var(--article-glow-mid) 32%, var(--article-glow-soft) 54%, transparent 76%), linear-gradient(145deg, var(--article-fallback-start), var(--article-fallback-end))" };
const articleFallbackIcon = { width:"52px", height:"52px", borderRadius:"999px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--brand)", background:"color-mix(in srgb, var(--surface-elevated) 82%, transparent)", border:"1px solid var(--border)", backdropFilter:"blur(8px)" };
const articleFallbackDomain = { margin:"8px 0 0", color:"var(--text-primary)", fontSize:"clamp(24px, 5vw, 34px)", lineHeight:1.1, fontWeight:"var(--weight-bold)" };
const articleFallbackType = { color:"var(--text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-medium)" };
const linkFallbackIcon = { width:"72px", height:"72px", borderRadius:"22px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--brand)", background:"var(--surface-elevated)", border:"1px solid var(--border)" };
const linkFallbackSource = { color:"var(--text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)" };
const linkFallbackTitle = { margin:0, maxWidth:"520px", color:"var(--text-primary)", fontSize:"var(--text-xl)", lineHeight:"var(--leading-tight)" };

const youtubeEmbed = { width:"100%", height:"100%", minHeight:"calc(100vh - 118px)", border:0, display:"block", background:"black" };

const instagramEmbedWrap = { width:"100%", minHeight:"calc(100vh - 118px)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"auto", background:"var(--surface)" };
const instagramBlockquote = { width:"100%", minWidth:0, margin:"0 auto", background:"var(--surface)" };
