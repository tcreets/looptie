import { useState } from "react";
import { Plus, Star, MoreVertical, Pencil, Trash2 } from "lucide-react";
import SpaceDetail from "./SpaceDetail";
import { trackEvent } from "../utils/trackEvent";

export default function Spaces({ spaces, defaultFeed, setDefaultFeed, selectedSpace, setSelectedSpace, feedItems, setFeedItems, setSelectedItem, setShowNewSpaceForm, setUploadSpace, setTab, onDeleteSpace, renameSpace }) {
  const [openMenuSpaceId, setOpenMenuSpaceId] = useState(null);
  const [renamingSpace, setRenamingSpace] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  if (selectedSpace !== null) return <SpaceDetail selectedSpace={selectedSpace} setSelectedSpace={setSelectedSpace} spaces={spaces} feedItems={feedItems} setFeedItems={setFeedItems} setSelectedItem={setSelectedItem} setUploadSpace={setUploadSpace} setTab={setTab} />;

  return <div style={{ color: "var(--text-primary)" }}>
    <p style={subtitleStyle}>Your spaces</p>
    <div style={spacesGrid}>
      {spaces.map((space) => <div key={space.id} onClick={() => { trackEvent("space_opened", { space: space.name, source: "spaces_tab_card" }); setSelectedSpace(space.name); }} style={{ ...spaceCard, cursor: "pointer", border: defaultFeed === space.name ? "2px solid var(--brand)" : "1px solid var(--border)" }}>
        <button onClick={(e) => { e.stopPropagation(); setDefaultFeed(space.name); trackEvent("default_space_changed", { space: space.name, source: "spaces_tab" }); }} style={starButton}><Star size={20} fill={defaultFeed === space.name ? "var(--brand)" : "transparent"} color={defaultFeed === space.name ? "var(--brand)" : "var(--text-muted)"} /></button>
        <button onClick={(e) => { e.stopPropagation(); setOpenMenuSpaceId(openMenuSpaceId === space.id ? null : space.id); }} style={menuButton}><MoreVertical size={18} /></button>
        {openMenuSpaceId === space.id && <div style={spaceMenu}>
          <button style={spaceMenuItem} onClick={(e) => { e.stopPropagation(); setRenamingSpace(space); setRenameDraft(space.name); setOpenMenuSpaceId(null); }}><Pencil size={15} strokeWidth={2.5} /><span>Rename</span></button>
          <button style={{ ...spaceMenuItem, color: "var(--danger)" }} onClick={(e) => { e.stopPropagation(); setOpenMenuSpaceId(null); onDeleteSpace(space.name); }}><Trash2 size={15} strokeWidth={2.5} /><span>Delete</span></button>
        </div>}
        <div style={spaceContent}><h3 style={{ margin: 0 }}>{space.name}</h3><p style={spaceItemsText}>{feedItems.filter((item) => item.space === space.name).length} items</p></div>
      </div>)}
      <div style={newSpaceCard} onClick={() => { trackEvent("new_space_clicked", { source: "spaces_tab" }); setShowNewSpaceForm(true); }}><h3 style={{ margin: 0 }}>New Space</h3><div style={newSpacePlus}><Plus size={20} strokeWidth={3} /></div></div>
    </div>

    {renamingSpace && <div style={modalOverlay}><div style={modalCard}>
      <h2 style={modalTitle}>Rename Space</h2><p style={modalSubtitle}>Update the name for this space.</p>
      <input style={modalInput} value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} autoFocus />
      <button style={modalPrimaryButton} onClick={async () => { const success = await renameSpace({ spaceId: renamingSpace.id, oldName: renamingSpace.name, newName: renameDraft, feedItems, setFeedItems, setSelectedSpace }); if (!success) return; setRenamingSpace(null); setRenameDraft(""); }}>Save Name</button>
      <button style={modalSecondaryButton} onClick={() => { setRenamingSpace(null); setRenameDraft(""); }}>Cancel</button>
    </div></div>}
  </div>;
}

const subtitleStyle = { color: "var(--text-secondary)", marginBottom: "24px" };
const spacesGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
const spaceCard = { background: "var(--surface)", borderRadius: "24px", padding: "24px", border: "1px solid var(--border)", minHeight: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" };
const starButton = { position: "absolute", top: "14px", right: "14px", background: "transparent", border: "none", cursor: "pointer" };
const menuButton = { position: "absolute", top: "14px", left: "14px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" };
const spaceMenu = { position: "absolute", top: "42px", left: "14px", background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "14px", padding: "6px", zIndex: 20, boxShadow: "var(--shadow)" };
const spaceMenuItem = { display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: "var(--text-primary)", textAlign: "left", cursor: "pointer" };
const spaceContent = { display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", transform: "translateY(-6px)" };
const spaceItemsText = { color: "var(--text-secondary)", margin: 0 };
const newSpaceCard = { ...spaceCard, border: "1px dashed var(--text-muted)", background: "transparent", gap: "18px", cursor: "pointer" };
const newSpacePlus = { width: "42px", height: "42px", borderRadius: "999px", background: "var(--surface-elevated)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", transform: "translateY(-8px)" };
const modalOverlay = { position: "fixed", inset: 0, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", zIndex: 1000 };
const modalCard = { width: "100%", maxWidth: "360px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "28px", padding: "24px", boxShadow: "var(--shadow)" };
const modalTitle = { color: "var(--text-primary)", fontSize: "24px", fontWeight: "700", marginBottom: "8px" };
const modalSubtitle = { color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" };
const modalInput = { width: "100%", boxSizing: "border-box", padding: "16px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-primary)", fontSize: "16px", marginBottom: "16px" };
const modalPrimaryButton = { width: "100%", padding: "14px", borderRadius: "16px", border: "none", background: "var(--brand)", color: "white", fontWeight: "bold", cursor: "pointer" };
const modalSecondaryButton = { width: "100%", padding: "14px", borderRadius: "16px", border: "none", background: "transparent", color: "var(--text-secondary)", marginTop: "10px", cursor: "pointer" };