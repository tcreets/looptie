import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Plus, X, ExternalLink, Link2 } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

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

  return <div style={itemModalOverlay}><div style={itemModalCard} className="pretty-scroll">
    <button onClick={onClose} style={itemModalClose}><ArrowLeft size={22} strokeWidth={2.5} /></button>
    <button type="button" onClick={() => { trackEvent("favorite_clicked", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type, new_value: !itemFavoriteDraft }); onToggleFavorite(); }} style={{ ...favoriteButton, color: itemFavoriteDraft ? "var(--favorite)" : "white" }}><Heart size={28} fill={itemFavoriteDraft ? "var(--favorite)" : "transparent"} color={itemFavoriteDraft ? "var(--favorite)" : "white"} /></button>
    {selectedItem.media_type === "video" ? <video src={selectedItem.image} controls autoPlay playsInline muted={false} style={itemModalMedia} /> : selectedItem.media_type === "link" ? (selectedItem.image ? <img src={selectedItem.image} alt="" style={{...itemModalMedia,objectFit:"cover"}} /> : <div style={linkMediaFallback}><Link2 size={42} /></div>) : <img src={selectedItem.image} alt="" style={{ ...itemModalMedia, objectFit: mediaFit, cursor: "zoom-in" }} onClick={() => { trackEvent("fullscreen_opened", { item_id: selectedItem.id, space: selectedItem.space }); setShowFullscreen(true); }} onLoad={(e) => { const img = e.currentTarget; setMediaFit(img.naturalWidth > img.naturalHeight * 1.3 ? "contain" : "cover"); }} />}
    {showFullscreen && <div style={fullscreenOverlay} onClick={() => setShowFullscreen(false)}><img src={selectedItem.image} alt="" style={fullscreenImage} /></div>}
    <div style={itemModalContent}>
      <p style={itemModalSpace}>{selectedItem.space}</p>
      <p style={itemModalTimestamp}>Added {new Date(selectedItem.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      <textarea data-gramm="false" placeholder="Add a memo, note, or comment..." value={itemNoteDraft} onChange={(e) => setItemNoteDraft(e.target.value)} style={itemModalNote} />
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

const itemModalOverlay = { position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px" };
const itemModalCard = { width: "100%", maxWidth: "430px", maxHeight: "90vh", overflowY: "scroll", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "28px", position: "relative", boxShadow: "var(--shadow)" };
const itemModalClose = { position: "absolute", top: "18px", left: "14px", width: "32px", height: "32px", border: "none", background: "rgba(0,0,0,.45)", borderRadius: "999px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, padding: 0 };
const itemModalMedia = { width: "100%", maxHeight: "60vh", objectFit: "cover", display: "block", background: "var(--bg)" };
const itemModalContent = { padding: "20px", color: "var(--text-primary)" };
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
