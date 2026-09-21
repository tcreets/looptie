import { useState } from "react";
import { ArrowLeft, Check, Heart, MoveRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

export default function SpaceDetail({ selectedSpace, setSelectedSpace, spaces, feedItems, setFeedItems, setSelectedItem, setUploadSpace, setTab }) {
  const [isSelectingItems, setIsSelectingItems] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const selectedSpaceRecord = spaces.find((feed) => feed.name === selectedSpace);
  const selectedSpaceItems = feedItems.filter((item) => selectedSpaceRecord && item.space_id ? item.space_id === selectedSpaceRecord.id : item.space === selectedSpace);

  const moveSelectedItems = async (newSpaceName) => {
    if (!selectedItemIds.length) return;
    const { error } = await supabase.from("items").update({ space: newSpaceName }).in("id", selectedItemIds);
    if (error) { alert(error.message); return; }
    setFeedItems((prev) => prev.map((item) => selectedItemIds.includes(item.id) ? { ...item, space: newSpaceName } : item));
    setSelectedItemIds([]); setIsSelectingItems(false); setShowMoveMenu(false);
  };

  const deleteSelectedItems = async () => {
    if (!selectedItemIds.length) return;
    const confirmDelete = window.confirm(`Delete ${selectedItemIds.length} item${selectedItemIds.length > 1 ? "s" : ""} from ${selectedSpace}?`);
    if (!confirmDelete) return;
    const storagePaths = feedItems.filter((item) => selectedItemIds.includes(item.id)).map((item) => item.storagePath || item.storage_path).filter(Boolean);
    if (storagePaths.length) { const { error: storageError } = await supabase.storage.from("looptie-uploads").remove(storagePaths); if (storageError) { alert(storageError.message); return; } }
    const { error } = await supabase.from("items").delete().in("id", selectedItemIds);
    if (error) { alert(error.message); return; }
    setFeedItems((prev) => prev.filter((item) => !selectedItemIds.includes(item.id)));
    setSelectedItemIds([]); setIsSelectingItems(false); setShowMoveMenu(false);
  };

  return <div style={spaceDetailScreen} className="no-scrollbar">
    <div style={spaceDetailHeader}>
      <button onClick={() => setSelectedSpace(null)} style={backButton} aria-label="Back"><ArrowLeft size={22} strokeWidth={2.5} /></button>
      <div style={spaceTitleBlock}>
        <div style={spaceTitle}>{selectedSpace}</div>
        <div style={spaceItemCount}>{selectedSpaceItems.length} {selectedSpaceItems.length === 1 ? "item" : "items"}</div>
      </div>
      <button style={selectButton} onClick={() => { setIsSelectingItems((prev) => !prev); setSelectedItemIds([]); setShowMoveMenu(false); }}>
        {isSelectingItems ? "Cancel" : "Select"}
      </button>
    </div>
    {selectedSpaceItems.length === 0 && <p style={emptyStateText}>Build a feed that pulls you back into this world.</p>}
    <div style={spaceDetailGrid}>
      {selectedSpaceItems.map((item) => <div key={item.id} style={{ ...spaceDetailCard, border: selectedItemIds.includes(item.id) ? "3px solid var(--brand)" : "1px solid var(--border)" }} onClick={() => { if (isSelectingItems) setSelectedItemIds((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]); else setSelectedItem(item); }}>
        {item.media_type === "video" ? <video src={item.image} style={spaceDetailImage} muted playsInline preload="metadata" /> : <img src={item.image} loading="lazy" alt="" style={spaceDetailImage} />}
        {isSelectingItems && selectedItemIds.includes(item.id) && <div style={selectedCheck}><Check size={18} strokeWidth={3} /></div>}
        {item.favorite && <div style={spaceFavoriteIndicator}><Heart size={22} fill="var(--favorite)" color="var(--favorite)" /></div>}
      </div>)}
      {!isSelectingItems && <button style={addToSpaceCard} onClick={() => { setUploadSpace(selectedSpace); setTab("add"); }}><span>Add to {selectedSpace}</span><div style={addItemPlus}><Plus size={24} strokeWidth={3} /></div></button>}
    </div>
    {isSelectingItems && selectedItemIds.length > 0 && <div style={bulkActionBar}><div style={bulkActionButtons}>
      <button style={bulkMoveButton} onClick={() => setShowMoveMenu((prev) => !prev)}><MoveRight size={18} strokeWidth={2.5} />Move {selectedItemIds.length}</button>
      <button style={bulkDeleteButton} onClick={deleteSelectedItems}><Trash2 size={18} strokeWidth={2.5} />Delete</button>
    </div>{showMoveMenu && <div style={moveMenu}>{spaces.filter((space) => space.name !== selectedSpace).map((space) => <button key={space.id} style={moveMenuItem} onClick={() => moveSelectedItems(space.name)}>{space.name}</button>)}</div>}</div>}
  </div>;
}

const spaceDetailHeader = { display:"grid", gridTemplateColumns:"44px 1fr auto", alignItems:"center", gap:"12px", padding:"10px 14px 14px", background:"var(--bg)", position:"sticky", top:0, zIndex:60 };
const backButton = { width:"42px", height:"42px", borderRadius:"999px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--shadow)" };
const spaceTitleBlock = { minWidth:0 };
const spaceTitle = { fontSize:"var(--text-xl)", fontWeight:"var(--weight-bold)", lineHeight:"var(--leading-tight)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };
const spaceItemCount = { marginTop:"2px", color:"var(--text-secondary)", fontSize:"var(--text-sm)" };
const selectButton = { border:"none", background:"transparent", color:"var(--brand)", fontSize:"var(--text-md)", fontWeight:"var(--weight-semibold)", cursor:"pointer", padding:"10px 2px 10px 10px" };
const spaceDetailGrid = { columnCount:2, columnGap:"12px", padding:"0 14px 160px" };
const spaceDetailCard = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", overflow: "hidden", cursor: "pointer", breakInside: "avoid", marginBottom: "12px", position: "relative" };
const spaceDetailImage = { width: "100%", height: "auto", display: "block" };
const addToSpaceCard = { width: "100%", minHeight: "180px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", background: "transparent", border: "1px dashed var(--text-muted)", borderRadius: "24px", color: "var(--text-primary)", fontSize:"var(--text-md)", fontWeight:"var(--weight-semibold)", cursor: "pointer", padding: "20px", textAlign: "center", breakInside: "avoid", marginBottom: "16px", boxSizing: "border-box" };
const addItemPlus = { width: "36px", height: "36px", borderRadius: "999px", background: "var(--surface-elevated)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" };
const emptyStateText = { color: "var(--text-primary)", fontSize:"var(--text-lg)", fontWeight:"var(--weight-semibold)", lineHeight: 1.5, padding: "28px 20px 18px" };
const spaceDetailScreen = { height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "120px", color: "var(--text-primary)" };
const spaceFavoriteIndicator = { position: "absolute", top: "10px", right: "10px", zIndex: 20, textShadow: "0 2px 10px rgba(0,0,0,.7)", pointerEvents: "none" };
const selectedCheck = { position: "absolute", top: "10px", right: "10px", width: "30px", height: "30px", borderRadius: "999px", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 };
const bulkActionBar = { position: "fixed", left: "50%", bottom: "88px", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "430px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "24px", padding: "12px", zIndex: 100, boxShadow: "var(--shadow)" };
const bulkActionButtons = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" };
const bulkMoveButton = { width: "100%", border: "none", background: "var(--brand)", color: "white", padding: "14px", borderRadius: "16px", fontWeight:"var(--weight-bold)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" };
const bulkDeleteButton = { width: "100%", border: "none", background: "var(--danger)", color: "white", padding: "14px", borderRadius: "16px", fontWeight:"var(--weight-bold)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" };
const moveMenu = { marginTop: "12px", display: "grid", gap: "8px", maxHeight: "220px", overflowY: "auto" };
const moveMenuItem = { border: "1px solid var(--border)", background: "var(--surface-elevated)", color: "var(--text-primary)", padding: "12px", borderRadius: "14px", cursor: "pointer" };
