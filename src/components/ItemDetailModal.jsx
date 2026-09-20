import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, Plus, X, ExternalLink, Link2 } from "lucide-react";
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

function InstagramEmbed({ url, title }) {
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
  return <div ref={embedRef} style={instagramDetailWrap}>
    <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" style={instagramDetailBlockquote}>
      <a href={url} target="_blank" rel="noreferrer">{title || "View this post on Instagram"}</a>
    </blockquote>
  </div>;
}

export default function ItemDetailModal({ selectedItem, itemNoteDraft, setItemNoteDraft, itemTagsDraft, setItemTagsDraft, onClose, onSaveMemo, onSaveTags, onToggleFavorite, itemFavoriteDraft, onDelete }) {
  const [mediaFit, setMediaFit] = useState("cover");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [memoSaveStatus, setMemoSaveStatus] = useState("saved");
  const addTag = async () => {
    const tag = tagInput.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
    if (!tag || itemTagsDraft.includes(tag)) { setTagInput(""); return; }
    const nextTags = [...itemTagsDraft, tag];
    setItemTagsDraft(nextTags);
    setTagInput("");
    setShowTagInput(false);
    const saved = await onSaveTags(nextTags);
    if (!saved) setItemTagsDraft(itemTagsDraft);
  };

  const removeTag = async (tag) => {
    const previousTags = itemTagsDraft;
    const nextTags = itemTagsDraft.filter((currentTag) => currentTag !== tag);
    setItemTagsDraft(nextTags);
    const saved = await onSaveTags(nextTags);
    if (!saved) setItemTagsDraft(previousTags);
  };
  useEffect(() => { if (selectedItem) trackEvent("item_viewed", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type }); }, [selectedItem?.id]);
  useEffect(() => {
    if (!selectedItem || itemNoteDraft === (selectedItem.note || "")) {
      setMemoSaveStatus("saved");
      return;
    }
    setMemoSaveStatus("saving");
    const timer = setTimeout(async () => {
      const saved = await onSaveMemo(itemNoteDraft);
      setMemoSaveStatus(saved ? "saved" : "error");
    }, 800);
    return () => clearTimeout(timer);
  }, [itemNoteDraft, selectedItem?.id]);
    if (!selectedItem) return null;

  const isArticle = selectedItem.media_type === "link" && !getYouTubeId(selectedItem.source_url) && !getTikTokId(selectedItem.source_url) && !getInstagramEmbedUrl(selectedItem.source_url);

  return <div style={itemModalOverlay}><div style={itemModalCard} className="pretty-scroll">
    <button onClick={onClose} style={itemModalClose}><ArrowLeft size={22} strokeWidth={2.5} /></button>
    <button type="button" onClick={() => { trackEvent("favorite_clicked", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type, new_value: !itemFavoriteDraft }); onToggleFavorite(); }} style={{ ...favoriteButton, color: itemFavoriteDraft ? "var(--favorite)" : "white" }}><Heart size={28} fill={itemFavoriteDraft ? "var(--favorite)" : "transparent"} color={itemFavoriteDraft ? "var(--favorite)" : "white"} /></button>
    {selectedItem.media_type === "video" ? <video src={selectedItem.image} controls autoPlay playsInline muted={false} style={itemModalMedia} /> : selectedItem.media_type === "link" && getYouTubeId(selectedItem.source_url) ? <iframe src={`https://www.youtube.com/embed/${getYouTubeId(selectedItem.source_url)}?autoplay=1&playsinline=1&rel=0`} title={selectedItem.source_title || "YouTube video"} style={itemDetailEmbed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : selectedItem.media_type === "link" && getTikTokId(selectedItem.source_url) ? <iframe src={`https://www.tiktok.com/player/v1/${getTikTokId(selectedItem.source_url)}?autoplay=1&loop=1&controls=1&volume_control=1&rel=0`} title={selectedItem.source_title || "TikTok video"} style={itemDetailEmbed} allow="autoplay; fullscreen" allowFullScreen /> : selectedItem.media_type === "link" && getInstagramEmbedUrl(selectedItem.source_url) ? <InstagramEmbed url={selectedItem.source_url} title={selectedItem.source_title} /> : selectedItem.media_type === "link" ? (selectedItem.image ? <img src={selectedItem.image} alt="" style={{...itemModalMedia,objectFit:"cover"}} /> : <div style={linkMediaFallback}><Link2 size={42} /></div>) : <img src={selectedItem.image} alt="" style={{ ...itemModalMedia, objectFit: mediaFit, cursor: "zoom-in" }} onClick={() => { trackEvent("fullscreen_opened", { item_id: selectedItem.id, space: selectedItem.space }); setShowFullscreen(true); }} onLoad={(e) => { const img = e.currentTarget; setMediaFit(img.naturalWidth > img.naturalHeight * 1.3 ? "contain" : "cover"); }} />}
    {showFullscreen && <div style={fullscreenOverlay} onClick={() => setShowFullscreen(false)}><img src={selectedItem.image} alt="" style={fullscreenImage} /></div>}
    <div style={itemModalContent}>
      <p style={itemModalSpace}>{selectedItem.space}</p>
      <p style={itemModalTimestamp}>Added {new Date(selectedItem.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      {selectedItem.source_title && <h1 style={itemTitle}>{selectedItem.source_title}</h1>}
      {selectedItem.source_creator && <p style={itemCreator}>{selectedItem.source_creator}</p>}
      {isArticle && <>
        <button type="button" onClick={() => { window.location.href = selectedItem.source_url; }} style={articleOpenButton}>Open article</button>
        <p style={articleLaunchHint}>On mobile, articles will open as a scrollable webpage inside Looptie.</p>
      </>}
      <div style={notesHeading}><span>Notes</span><span style={notesHint}>Your note</span></div>
      <textarea data-gramm="false" placeholder="Add a note..." value={itemNoteDraft} onChange={(e) => setItemNoteDraft(e.target.value)} style={itemModalNote} />
      <div style={saveStatus}>{memoSaveStatus === "saving" ? "Saving…" : memoSaveStatus === "error" ? "Couldn’t save" : "Saved"}</div>
      <div style={tagBlock}>
        <div style={tagLabel}>Tags</div>
        <div style={tagSection}>
          {itemTagsDraft.map((tag) => <span key={tag} style={tagPill}>#{tag}<button type="button" aria-label={`Remove ${tag} tag`} style={removeTagButton} onClick={() => removeTag(tag)}><X size={14} /></button></span>)}
          {!showTagInput && <button type="button" style={showAddTagButton} onClick={() => setShowTagInput(true)}><Plus size={15} />Add tag</button>}
        </div>
        {showTagInput && <div style={tagInputRow}>
          <input autoFocus value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } if (e.key === "Escape") { setTagInput(""); setShowTagInput(false); } }} placeholder="Add a tag…" style={tagInputStyle} />
          <button type="button" onClick={addTag} style={addTagButton} disabled={!tagInput.trim()}>Add</button>
        </div>}
      </div>
      {selectedItem.source_url && <div style={informationBlock}>
        <div style={informationTitle}>Information</div>
        <div style={informationRow}><span style={informationLabel}>Source</span><span>{selectedItem.source_platform || "Web"}</span></div>
        {selectedItem.source_title && <div style={informationRow}><span style={informationLabel}>Title</span><span>{selectedItem.source_title}</span></div>}
        {selectedItem.source_creator && <div style={informationRow}><span style={informationLabel}>Creator</span><span>{selectedItem.source_creator}</span></div>}
        <div style={informationRow}><span style={informationLabel}>Original link</span><a href={selectedItem.source_url} target="_blank" rel="noreferrer" style={sourceLink}>View original <ExternalLink size={14} /></a></div>
        <div style={informationRow}><span style={informationLabel}>Saved</span><span>{new Date(selectedItem.created_at).toLocaleString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" })}</span></div>
      </div>}
      <button style={deleteButton} onClick={() => { trackEvent("item_deleted", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type }); onDelete(); }}>Delete Item</button>
    </div>
  </div></div>;
}

const itemModalOverlay = { position: "fixed", inset: 0, background: "var(--bg)", zIndex: 200, display: "block", padding: 0 };
const itemModalCard = { width: "100%", height: "100dvh", overflowY: "auto", background: "var(--bg)", position: "relative" };
const itemModalClose = { position: "absolute", top: "18px", left: "14px", width: "32px", height: "32px", border: "none", background: "rgba(0,0,0,.45)", borderRadius: "999px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, padding: 0 };
const itemModalMedia = { width: "100%", maxHeight: "58vh", objectFit: "cover", display: "block", background: "var(--surface)" };
const itemDetailEmbed = { width:"100%", height:"58vh", minHeight:"360px", border:0, display:"block", background:"black" };
const itemModalContent = { width:"min(760px, 100%)", boxSizing:"border-box", margin:"0 auto", padding:"22px 20px 110px", color: "var(--text-primary)" };
const itemModalSpace = { color: "var(--brand)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-bold)", margin: "0 0 8px" };
const itemModalTimestamp = { color: "var(--text-muted)", fontSize:"var(--text-sm)", margin: "0 0 18px" };
const itemModalNote = { width: "100%", minHeight: "190px", boxSizing: "border-box", padding: "14px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface-elevated)", color: "var(--text-primary)", fontSize:"var(--text-md)", lineHeight: 1.5, paddingBottom: "24px", resize: "none", outline: "none", fontFamily: "inherit" };
const saveStatus = { marginTop:"6px", textAlign:"right", color:"var(--text-muted)", fontSize:"var(--text-xs)" };
const tagBlock = { marginTop:"20px" };
const tagLabel = { fontSize:"var(--text-sm)", fontWeight:"var(--weight-bold)", marginBottom:"10px" };
const tagSection = { display:"flex", flexWrap:"wrap", alignItems:"center", gap:"8px" };
const tagPill = { display:"inline-flex", alignItems:"center", gap:"5px", background:"var(--surface-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)", padding:"6px 8px 6px 12px", borderRadius:"999px", fontSize:"var(--text-sm)" };
const removeTagButton = { width:"22px", height:"22px", padding:0, border:"none", borderRadius:"999px", background:"transparent", color:"var(--text-secondary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };
const showAddTagButton = { display:"inline-flex", alignItems:"center", gap:"4px", border:"none", background:"transparent", color:"var(--text-secondary)", padding:"6px 2px", fontSize:"var(--text-sm)", fontWeight:"var(--weight-medium)", cursor:"pointer" };
const tagInputRow = { display:"grid", gridTemplateColumns:"1fr auto", gap:"8px", marginTop:"10px" };
const tagInputStyle = { width:"100%", minWidth:0, boxSizing:"border-box", padding:"11px 12px", borderRadius:"14px", border:"1px solid var(--border)", background:"var(--surface-elevated)", color:"var(--text-primary)", outline:"none", fontFamily:"inherit", fontSize:"var(--text-sm)" };
const addTagButton = { border:"none", background:"transparent", color:"var(--brand)", padding:"0 4px", fontWeight:"var(--weight-semibold)", cursor:"pointer" };
const favoriteButton = { position: "absolute", top: "14px", right: "14px", width: "38px", height: "38px", border: "none", background: "rgba(0,0,0,.45)", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5, padding: 0 };
const deleteButton = { display:"block", margin:"34px auto 6px", padding:"6px 10px", border:"none", background:"transparent", color:"var(--danger)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-medium)", cursor:"pointer" };
const fullscreenOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" };
const fullscreenImage = { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" };
const linkMediaFallback = { width:"100%", minHeight:"240px", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface-elevated)", color:"var(--brand)" };
const informationBlock = { marginTop:"28px", padding:"18px", border:"1px solid var(--border)", borderRadius:"18px", background:"var(--surface-elevated)" };
const informationTitle = { fontSize:"var(--text-md)", fontWeight:"var(--weight-bold)", marginBottom:"16px" };
const informationRow = { display:"grid", gridTemplateColumns:"100px 1fr", gap:"14px", padding:"8px 0", fontSize:"var(--text-sm)", lineHeight:"var(--leading-normal)" };
const informationLabel = { color:"var(--text-secondary)" };
const sourceLink = { display:"inline-flex", alignItems:"center", gap:"5px", color:"var(--brand)", textDecoration:"none", fontWeight:"var(--weight-medium)" };

const instagramDetailWrap = { width:"100%", minHeight:"420px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", background:"var(--surface)" };
const instagramDetailBlockquote = { width:"100%", minWidth:0, margin:"0 auto", background:"var(--surface)" };

const itemTitle = { margin:"4px 0 6px", fontSize:"clamp(24px, 5vw, 34px)", lineHeight:1.12, letterSpacing:"-.02em", fontWeight:"var(--weight-bold)" };
const itemCreator = { margin:"0 0 18px", color:"var(--text-secondary)", fontSize:"var(--text-sm)" };
const notesHeading = { display:"flex", justifyContent:"space-between", alignItems:"center", margin:"2px 0 10px", fontSize:"var(--text-md)", fontWeight:"var(--weight-bold)" };
const notesHint = { color:"var(--text-muted)", fontSize:"var(--text-xs)", fontWeight:"var(--weight-medium)" };

const articleLaunchPage = { position:"fixed", inset:0, zIndex:200, overflowY:"auto", background:"var(--bg)" };
const articleLaunchBack = { position:"fixed", top:"18px", left:"14px", width:"36px", height:"36px", border:"none", background:"rgba(0,0,0,.55)", borderRadius:"999px", color:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 };
const articleLaunchContent = { width:"min(760px, 100%)", margin:"0 auto", paddingBottom:"48px" };
const articleLaunchImage = { width:"100%", maxHeight:"48vh", objectFit:"cover", display:"block", marginBottom:"24px" };
const articleOpenButton = { margin:"20px 20px 8px", width:"calc(100% - 40px)", minHeight:"48px", border:0, borderRadius:"999px", background:"var(--accent)", color:"white", fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)", cursor:"pointer" };
const articleLaunchHint = { margin:"0 20px", color:"var(--text-secondary)", fontSize:"var(--text-xs)", lineHeight:1.5, textAlign:"center" };
