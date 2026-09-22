import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { ArrowLeft, Heart, Plus, X, ExternalLink, Link2, MoreHorizontal } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";
import { canUseNativeArticleReader, mountNativeArticleReader, updateNativeArticleReaderFrame, unmountNativeArticleReader } from "../utils/nativeArticleReader";

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

export default function ItemDetailModal({ selectedItem, itemTagsDraft, setItemTagsDraft, onClose, onSaveTags, onToggleFavorite, itemFavoriteDraft, onDelete, canDeleteItem = false }) {
  const [mediaFit, setMediaFit] = useState("cover");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [openNoteMenuId, setOpenNoteMenuId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [articleData, setArticleData] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");
  const noteInputRef = useRef(null);
  const articleReaderRef = useRef(null);
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
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null)); }, []);
  useEffect(() => { if (selectedItem) trackEvent("item_viewed", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type }); }, [selectedItem?.id]);
  useEffect(() => {
    if (!selectedItem) return;
    let cancelled = false;
    setNotesLoading(true);
    supabase.from("item_notes").select("*").eq("item_id", selectedItem.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading notes:", error);
        else setNotes(data || []);
        setNotesLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedItem?.id]);

  const resizeNoteInput = (element) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  };

  useEffect(() => {
    resizeNoteInput(noteInputRef.current);
  }, [noteDraft]);

  const saveNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    if (editingNoteId) {
      const { data, error } = await supabase.from("item_notes").update({ content, updated_at: new Date().toISOString() }).eq("id", editingNoteId).select().single();
      if (!error) setNotes(prev => prev.map(note => note.id === editingNoteId ? data : note));
    } else {
      const { data, error } = await supabase.from("item_notes").insert({ item_id: selectedItem.id, user_id: currentUserId || (await supabase.auth.getUser()).data.user?.id, content }).select().single();
      if (!error) setNotes(prev => [data, ...prev]);
    }
    setNoteDraft("");
    setEditingNoteId(null);
    setOpenNoteMenuId(null);
  };

  const deleteNote = async (id) => {
    const { error } = await supabase.from("item_notes").delete().eq("id", id);
    if (!error) setNotes(prev => prev.filter(note => note.id !== id));
  };
    if (!selectedItem) return null;

  const isArticle = selectedItem.media_type === "link" && !getYouTubeId(selectedItem.source_url) && !getTikTokId(selectedItem.source_url) && !getInstagramEmbedUrl(selectedItem.source_url);
  const nativeArticleReader = isArticle && canUseNativeArticleReader();

  useEffect(() => {
    if (!isArticle || !selectedItem?.source_url) { setArticleData(null); setArticleError(""); return; }
    let cancelled = false;
    setArticleLoading(true);
    setArticleError("");
    supabase.functions.invoke("link-metadata", { body: { url: selectedItem.source_url, includeArticle: true } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.article?.blocks?.length) {
          setArticleError("This article could not be opened in Reader.");
          setArticleData(null);
        } else {
          setArticleData(data);
        }
        setArticleLoading(false);
      });
    return () => { cancelled = true; };
  }, [isArticle, selectedItem?.source_url]);

  useEffect(() => {
    if (!nativeArticleReader || !articleReaderRef.current || !selectedItem?.source_url) return;
    const syncReader = () => {
      const rect = articleReaderRef.current?.getBoundingClientRect();
      if (!rect) return;
      updateNativeArticleReaderFrame(rect);
    };
    const rect = articleReaderRef.current.getBoundingClientRect();
    mountNativeArticleReader({ url: selectedItem.source_url, rect }).catch((error) => console.error("Native article reader failed:", error));
    window.addEventListener("resize", syncReader);
    window.addEventListener("scroll", syncReader, true);
    return () => {
      window.removeEventListener("resize", syncReader);
      window.removeEventListener("scroll", syncReader, true);
      unmountNativeArticleReader();
    };
  }, [nativeArticleReader, selectedItem?.source_url]);

  return <div style={itemModalOverlay}><div style={itemModalCard} className="pretty-scroll">
    <button onClick={onClose} style={itemModalClose}><ArrowLeft size={22} strokeWidth={2.5} /></button>
    <button type="button" onClick={() => { trackEvent("favorite_clicked", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type, new_value: !itemFavoriteDraft }); onToggleFavorite(); }} style={{ ...favoriteButton, color: itemFavoriteDraft ? "var(--favorite)" : "white" }}><Heart size={28} fill={itemFavoriteDraft ? "var(--favorite)" : "transparent"} color={itemFavoriteDraft ? "var(--favorite)" : "white"} /></button>
    {(selectedItem.media_url || selectedItem.media_type === "video") ? <video src={selectedItem.media_url || selectedItem.image} controls autoPlay playsInline muted={false} style={itemModalMedia} /> : selectedItem.media_type === "link" && getYouTubeId(selectedItem.source_url) ? <iframe src={`https://www.youtube.com/embed/${getYouTubeId(selectedItem.source_url)}?autoplay=1&playsinline=1&rel=0`} title={selectedItem.source_title || "YouTube video"} style={itemDetailEmbed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : selectedItem.media_type === "link" && getTikTokId(selectedItem.source_url) ? <iframe src={`https://www.tiktok.com/player/v1/${getTikTokId(selectedItem.source_url)}?autoplay=1&loop=1&controls=1&volume_control=1&rel=0`} title={selectedItem.source_title || "TikTok video"} style={itemDetailEmbed} allow="autoplay; fullscreen" allowFullScreen /> : selectedItem.media_type === "link" && getInstagramEmbedUrl(selectedItem.source_url) ? <InstagramEmbed url={selectedItem.source_url} title={selectedItem.source_title} /> : selectedItem.media_type === "link" ? <div style={articleWebWrap}><div style={articleWebChrome}><span style={articleWebSource}>{selectedItem.source_platform || "Web"}</span><a href={selectedItem.source_url} target="_blank" rel="noreferrer" style={articleWebExternal}>Open externally <ExternalLink size={13} /></a></div>{articleLoading ? <div style={articleDevFallback}><div style={articleDevFallbackTitle}>Opening Reader…</div></div> : articleData?.article?.blocks?.length ? <div style={articleReader}><div style={articleReaderInner}>{articleData.image && <img src={articleData.image} alt="" style={articleReaderHero} />}<h1 style={articleReaderTitle}>{articleData.title || selectedItem.source_title}</h1>{(articleData.creator || selectedItem.source_creator) && <p style={articleReaderByline}>{articleData.creator || selectedItem.source_creator}</p>}<div style={articleReaderBody}>{articleData.article.blocks.map((block, index) => block.type === "image" ? <img key={index} src={block.url} alt={block.alt || ""} style={articleReaderImage} /> : block.type === "heading" ? <h2 key={index} style={articleReaderHeading}>{block.text}</h2> : block.type === "quote" ? <blockquote key={index} style={articleReaderQuote}>{block.text}</blockquote> : <p key={index} style={articleReaderParagraph}>{block.text}</p>)}</div></div></div> : nativeArticleReader ? <div ref={articleReaderRef} style={nativeArticleSlot} aria-label="Article reader" /> : <div style={articleDevFallback}><div style={articleDevFallbackTitle}>Article unavailable</div><div style={articleDevFallbackText}>{articleError || "Looptie could not extract this article."}</div><a href={selectedItem.source_url} target="_blank" rel="noreferrer" style={articleDevFallbackLink}>View original <ExternalLink size={14} /></a></div>}</div> : <img src={selectedItem.image} alt="" style={{ ...itemModalMedia, objectFit: mediaFit, cursor: "zoom-in" }} onClick={() => { trackEvent("fullscreen_opened", { item_id: selectedItem.id, space: selectedItem.space }); setShowFullscreen(true); }} onLoad={(e) => { const img = e.currentTarget; setMediaFit(img.naturalWidth > img.naturalHeight * 1.3 ? "contain" : "cover"); }} />}
    {showFullscreen && <div style={fullscreenOverlay} onClick={() => setShowFullscreen(false)}><img src={selectedItem.image} alt="" style={fullscreenImage} /></div>}
    <div style={itemModalContent}>
      <p style={itemModalSpace}>{selectedItem.space}</p>
      <p style={itemModalTimestamp}>Added {selectedItem.added_by_name ? `by ${selectedItem.added_by_name} · ` : ""}{new Date(selectedItem.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      {selectedItem.source_title && <h1 style={itemTitle}>{selectedItem.source_title}</h1>}
      {selectedItem.source_creator && <p style={itemCreator}>{selectedItem.source_creator}</p>}
      <div id="looptie-notes" style={notesBlock}>
        <div style={notesHeading}><span>Notes</span><span style={notesHint}>{notes.length} {notes.length === 1 ? "note" : "notes"}</span></div>
        {notesLoading ? <p style={emptyNotes}>Loading notes…</p> : notes.length === 0 ? <p style={emptyNotes}>No notes yet.</p> :
          <div style={notesList}>{notes.map(note => <div key={note.id} style={noteCard}>
            <div style={noteTopRow}>
              <div style={noteAuthorRow}><span style={noteAuthor}>{note.user_id === currentUserId ? "You" : (note.author_name || "Looptie member")}</span><span style={noteTimestamp}>{new Date(note.created_at).toLocaleString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" })}{note.updated_at !== note.created_at ? " · Edited" : ""}</span></div>
              {note.user_id === currentUserId && <div style={noteMenuWrap}>
                <button type="button" aria-label="Note options" style={noteMenuButton} onClick={() => setOpenNoteMenuId(openNoteMenuId === note.id ? null : note.id)}><MoreHorizontal size={18} /></button>
                {openNoteMenuId === note.id && <div style={noteMenu}>
                  <button type="button" style={noteMenuEdit} onClick={() => { setEditingNoteId(note.id); setNoteDraft(note.content); setOpenNoteMenuId(null); }}>Edit</button>
                  <button type="button" style={noteMenuDelete} onClick={() => { setOpenNoteMenuId(null); deleteNote(note.id); }}>Delete</button>
                </div>}
              </div>}
            </div>
            {editingNoteId === note.id ? <div style={inlineNoteEditor}>
              <textarea autoFocus ref={noteInputRef} rows={1} data-gramm="false" value={noteDraft} onChange={(e) => { setNoteDraft(e.target.value); resizeNoteInput(e.currentTarget); }} style={noteComposerInput} />
              <div style={noteComposerActions}>
                <button type="button" style={noteTextButton} onClick={() => { setEditingNoteId(null); setNoteDraft(""); }}>Cancel</button>
                <button type="button" style={noteSaveButton} disabled={!noteDraft.trim()} onClick={saveNote}>Save</button>
              </div>
            </div> : <p style={noteContent}>{note.content}</p>}
          </div>)}</div>}
        {!editingNoteId && <div style={noteComposer}>
          <textarea ref={noteInputRef} rows={1} data-gramm="false" placeholder="Add a note…" value={noteDraft} onChange={(e) => { setNoteDraft(e.target.value); resizeNoteInput(e.currentTarget); }} style={noteComposerInput} />
          <div style={noteComposerActions}>
            <button type="button" style={noteSaveButton} disabled={!noteDraft.trim()} onClick={saveNote}>Add</button>
          </div>
        </div>}
      </div>
      <div id="looptie-tags" style={tagBlock}>
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
      {selectedItem.source_url && <div id="looptie-information" style={informationBlock}>
        <div style={informationTitle}>Information</div>
        <div style={informationRow}><span style={informationLabel}>Source</span><span>{selectedItem.source_platform || "Web"}</span></div>
        {selectedItem.source_title && <div style={informationRow}><span style={informationLabel}>Title</span><span>{selectedItem.source_title}</span></div>}
        {selectedItem.source_creator && <div style={informationRow}><span style={informationLabel}>Creator</span><span>{selectedItem.source_creator}</span></div>}
        <div style={informationRow}><span style={informationLabel}>Original link</span><a href={selectedItem.source_url} target="_blank" rel="noreferrer" style={sourceLink}>View original <ExternalLink size={14} /></a></div>
        <div style={informationRow}><span style={informationLabel}>Saved</span><span>{new Date(selectedItem.created_at).toLocaleString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" })}</span></div>
      </div>}
      {canDeleteItem && <button style={deleteButton} onClick={() => { trackEvent("item_deleted", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type }); onDelete(); }}>Delete Item</button>}
    </div>
  </div></div>;
}

const itemModalOverlay = { position: "fixed", inset: 0, background: "var(--bg)", zIndex: 200, display: "block", padding: 0 };
const itemModalCard = { width: "100%", height: "100dvh", overflowY: "auto", background: "var(--bg)", position: "relative" };
const itemModalClose = { position: "absolute", top: "18px", left: "14px", width: "32px", height: "32px", border: "none", background: "rgba(0,0,0,.45)", borderRadius: "999px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, padding: 0 };
const itemModalMedia = { width: "100%", maxHeight: "58vh", objectFit: "cover", display: "block", background: "var(--surface)" };
const articleWebWrap = { width:"100%", height:"72vh", minHeight:"560px", background:"var(--surface)", display:"flex", flexDirection:"column" };
const articleWebChrome = { height:"42px", flex:"0 0 42px", padding:"0 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", background:"var(--bg)" };
const articleWebSource = { fontSize:"var(--text-xs)", color:"var(--text-secondary)", fontWeight:"var(--weight-semibold)" };
const articleWebExternal = { display:"inline-flex", alignItems:"center", gap:"4px", fontSize:"var(--text-xs)", color:"var(--text-secondary)", textDecoration:"none" };
const nativeArticleSlot = { width:"100%", flex:1, minHeight:0, background:"var(--surface)" };
const articleReader = { flex:1, overflowY:"auto", background:"var(--bg)" };
const articleReaderInner = { width:"min(680px, 100%)", boxSizing:"border-box", margin:"0 auto", padding:"28px 22px 48px" };
const articleReaderHero = { width:"100%", maxHeight:"380px", objectFit:"cover", borderRadius:"18px", marginBottom:"28px" };
const articleReaderTitle = { margin:"0 0 10px", fontSize:"clamp(30px, 6vw, 44px)", lineHeight:1.08, letterSpacing:"-.025em", color:"var(--text-primary)" };
const articleReaderByline = { margin:"0 0 30px", color:"var(--text-secondary)", fontSize:"var(--text-sm)" };
const articleReaderBody = { color:"var(--text-primary)" };
const articleReaderParagraph = { margin:"0 0 22px", fontSize:"18px", lineHeight:1.72 };
const articleReaderHeading = { margin:"34px 0 14px", fontSize:"24px", lineHeight:1.25 };
const articleReaderQuote = { margin:"28px 0", paddingLeft:"18px", borderLeft:"3px solid var(--brand)", color:"var(--text-secondary)", fontSize:"19px", lineHeight:1.65 };
const articleReaderImage = { width:"100%", height:"auto", display:"block", borderRadius:"14px", margin:"26px 0" };
const articleDevFallback = { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px", padding:"28px", textAlign:"center", background:"var(--surface)" };
const articleDevFallbackTitle = { color:"var(--text-primary)", fontSize:"var(--text-md)", fontWeight:"var(--weight-bold)" };
const articleDevFallbackText = { maxWidth:"420px", color:"var(--text-secondary)", fontSize:"var(--text-sm)", lineHeight:1.5 };
const articleDevFallbackLink = { display:"inline-flex", alignItems:"center", gap:"5px", marginTop:"4px", color:"var(--brand)", textDecoration:"none", fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)" };
const itemDetailEmbed = { width:"100%", height:"58vh", minHeight:"360px", border:0, display:"block", background:"black" };
const itemModalContent = { width:"min(760px, 100%)", boxSizing:"border-box", margin:"0 auto", padding:"22px 20px 110px", color: "var(--text-primary)" };
const itemModalSpace = { color: "var(--brand)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-bold)", margin: "0 0 8px" };
const itemModalTimestamp = { color: "var(--text-muted)", fontSize:"var(--text-sm)", margin: "0 0 18px" };
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

const notesBlock = { margin:"2px 0 8px" };
const noteComposer = { display:"flex", alignItems:"flex-end", gap:"8px", border:"1px solid var(--border)", borderRadius:"14px", background:"var(--surface-elevated)", padding:"8px 8px 8px 12px", marginTop:"12px", marginBottom:"18px" };
const inlineNoteEditor = { display:"flex", alignItems:"flex-end", gap:"8px", border:"1px solid var(--border)", borderRadius:"14px", background:"var(--surface-elevated)", padding:"8px 8px 8px 12px", marginTop:"7px", marginBottom:"5px" };
const noteComposerInput = { flex:1, width:"100%", minHeight:"24px", maxHeight:"160px", boxSizing:"border-box", border:0, outline:"none", resize:"none", background:"transparent", color:"var(--text-primary)", fontFamily:"inherit", fontSize:"var(--text-sm)", lineHeight:1.5, padding:"5px 0" };
const noteComposerActions = { display:"flex", alignItems:"center", gap:"4px", flexShrink:0 };
const noteSaveButton = { border:0, borderRadius:"999px", padding:"8px 12px", background:"var(--brand)", color:"white", fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)", cursor:"pointer" };
const noteTextButton = { border:0, background:"transparent", color:"var(--brand)", padding:"4px", cursor:"pointer", fontWeight:"var(--weight-medium)" };
const noteDeleteButton = { border:0, background:"transparent", color:"var(--danger)", padding:"4px", cursor:"pointer", fontWeight:"var(--weight-medium)" };
const notesList = { display:"flex", flexDirection:"column", gap:"10px" };
const noteCard = { position:"relative", borderBottom:"1px solid var(--border)", padding:"6px 2px 12px" };
const noteContent = { margin:"7px 0 5px", whiteSpace:"pre-wrap", color:"var(--text-primary)", fontSize:"var(--text-md)", lineHeight:1.55 };
const noteTopRow = { display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px" };
const noteAuthorRow = { display:"flex", alignItems:"baseline", gap:"7px" };
const noteAuthor = { color:"var(--text-primary)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)" };
const noteTimestamp = { color:"var(--text-muted)", fontSize:"var(--text-xs)" };
const noteMenuWrap = { position:"relative", flexShrink:0 };
const noteMenuButton = { width:"30px", height:"30px", border:0, borderRadius:"999px", background:"transparent", color:"var(--text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:0 };
const noteMenu = { position:"absolute", top:"30px", right:0, zIndex:20, minWidth:"112px", padding:"6px", border:"1px solid var(--border)", borderRadius:"12px", background:"var(--surface-elevated)", boxShadow:"0 10px 30px rgba(0,0,0,.28)" };
const noteMenuEdit = { width:"100%", border:0, borderRadius:"8px", background:"transparent", color:"var(--text-primary)", textAlign:"left", padding:"9px 10px", fontSize:"var(--text-sm)", cursor:"pointer" };
const noteMenuDelete = { ...noteMenuEdit, color:"var(--danger)" };
const emptyNotes = { color:"var(--text-muted)", fontSize:"var(--text-sm)", margin:"4px 0 18px" };
