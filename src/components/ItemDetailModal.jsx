import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Plus, X } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

export default function ItemDetailModal({ selectedItem, itemNoteDraft, setItemNoteDraft, itemTagsDraft, setItemTagsDraft, onClose, onSave, onToggleFavorite, itemFavoriteDraft, onDelete }) {
  const [mediaFit, setMediaFit] = useState("cover");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
    if (!tag || itemTagsDraft.includes(tag)) { setTagInput(""); return; }
    setItemTagsDraft([...itemTagsDraft, tag]);
    setTagInput("");
  };
  useEffect(() => { if (selectedItem) trackEvent("item_viewed", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type }); }, [selectedItem?.id]);
  if (!selectedItem) return null;

  return <div style={itemModalOverlay}><div style={itemModalCard} className="pretty-scroll">
    <button onClick={onClose} style={itemModalClose}><ArrowLeft size={22} strokeWidth={2.5} /></button>
    <button type="button" onClick={() => { trackEvent("favorite_clicked", { item_id: selectedItem.id, space: selectedItem.space, media_type: selectedItem.media_type, new_value: !itemFavoriteDraft }); onToggleFavorite(); }} style={{ ...favoriteButton, color: itemFavoriteDraft ? "var(--favorite)" : "white" }}><Heart size={28} fill={itemFavoriteDraft ? "var(--favorite)" : "transparent"} color={itemFavoriteDraft ? "var(--favorite)" : "white"} /></button>
    {selectedItem.media_type === "video" ? <video src={selectedItem.image} controls autoPlay playsInline muted={false} style={itemModalMedia} /> : <img src={selectedItem.image} alt="" style={{ ...itemModalMedia, objectFit: mediaFit, cursor: "zoom-in" }} onClick={() => { trackEvent("fullscreen_opened", { item_id: selectedItem.id, space: selectedItem.space }); setShowFullscreen(true); }} onLoad={(e) => { const img = e.currentTarget; setMediaFit(img.naturalWidth > img.naturalHeight * 1.3 ? "contain" : "cover"); }} />}
    {showFullscreen && <div style={fullscreenOverlay} onClick={() => setShowFullscreen(false)}><img src={selectedItem.image} alt="" style={fullscreenImage} /></div>}
    <div style={itemModalContent}>
      <p style={itemModalSpace}>{selectedItem.space}</p>
      <p style={itemModalTimestamp}>Added {new Date(selectedItem.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      <textarea data-gramm="false" placeholder="Add a memo, note, or comment..." value={itemNoteDraft} onChange={(e) => setItemNoteDraft(e.target.value)} style={itemModalNote} />
      <div style={tagBlock}>
        <div style={tagLabel}>Tags</div>
        {itemTagsDraft.length > 0 && <div style={tagSection}>{itemTagsDraft.map((tag) => <span key={tag} style={tagPill}>#{tag}<button type="button" aria-label={`Remove ${tag} tag`} style={removeTagButton} onClick={() => setItemTagsDraft(itemTagsDraft.filter((currentTag) => currentTag !== tag))}><X size={14} /></button></span>)}</div>}
        <div style={tagInputRow}>
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add a tag" style={tagInputStyle} />
          <button type="button" onClick={addTag} style={addTagButton} disabled={!tagInput.trim()}><Plus size={18} />Add</button>
        </div>
      </div>
      <button style={{ ...modalPrimaryButton, marginTop: "24px" }} onClick={() => { trackEvent("note_saved", { item_id: selectedItem.id, space: selectedItem.space, has_note: itemNoteDraft.trim().length > 0, note_length: itemNoteDraft.trim().length, tag_count: itemTagsDraft.length }); onSave(); }}>Save Changes</button>
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
const modalPrimaryButton = { width: "100%", padding: "14px", borderRadius: "16px", border: "none", background: "var(--brand)", color: "white", fontWeight:"var(--weight-bold)", cursor: "pointer" };
const tagBlock = { marginTop:"20px" };
const tagLabel = { fontSize:"var(--text-sm)", fontWeight:"var(--weight-bold)", marginBottom:"10px" };
const tagSection = { display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"10px" };
const tagPill = { display:"inline-flex", alignItems:"center", gap:"5px", background:"var(--surface-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)", padding:"6px 8px 6px 12px", borderRadius:"999px", fontSize:"var(--text-sm)" };
const removeTagButton = { width:"22px", height:"22px", padding:0, border:"none", borderRadius:"999px", background:"transparent", color:"var(--text-secondary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };
const tagInputRow = { display:"grid", gridTemplateColumns:"1fr auto", gap:"8px" };
const tagInputStyle = { width:"100%", minWidth:0, boxSizing:"border-box", padding:"11px 12px", borderRadius:"14px", border:"1px solid var(--border)", background:"var(--surface-elevated)", color:"var(--text-primary)", outline:"none", fontFamily:"inherit", fontSize:"var(--text-sm)" };
const addTagButton = { border:"none", borderRadius:"14px", background:"var(--surface-elevated)", color:"var(--brand)", padding:"0 12px", fontWeight:"var(--weight-semibold)", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px" };
const favoriteButton = { position: "absolute", top: "14px", right: "14px", width: "38px", height: "38px", border: "none", background: "rgba(0,0,0,.45)", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5, padding: 0 };
const deleteButton = { width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontWeight:"var(--weight-bold)", cursor: "pointer", marginTop: "24px" };
const fullscreenOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" };
const fullscreenImage = { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" };