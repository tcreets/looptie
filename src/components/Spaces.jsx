import { useEffect, useState } from "react";
import { Plus, Star, MoreVertical, Pencil, Trash2, Share2, Users, LogOut } from "lucide-react";
import SpaceDetail from "./SpaceDetail";
import FeedShareModal from "./FeedShareModal";
import FeedMembersModal from "./FeedMembersModal";
import { trackEvent } from "../utils/trackEvent";
import { supabase } from "../utils/supabaseClient";

function SpaceCover({ items }) {
  const coverItems = items.slice(0, 3);
  if (coverItems.length === 0) return <div style={emptyCover} />;

  return <div style={{ ...coverGrid, gridTemplateColumns: coverItems.length === 1 ? "1fr" : coverItems.length === 2 ? "1fr 1fr" : "1.35fr .85fr", gridTemplateRows: coverItems.length < 3 ? "1fr" : "1fr 1fr" }}>
    {coverItems.map((item, index) => {
      const media = item.image;
      const tileStyle = coverItems.length === 3 && index === 0 ? { ...coverTile, gridRow: "1 / 3" } : coverTile;
      return item.media_type === "video"
        ? <video key={item.id} src={media} muted playsInline preload="metadata" style={tileStyle} />
        : <img key={item.id} src={media} alt="" loading="lazy" style={tileStyle} />;
    })}
  </div>;
}

export default function Spaces({ user, spaces, setSpaces, defaultFeed, setDefaultFeed, selectedSpace, setSelectedSpace, feedItems, setFeedItems, setSelectedItem, setShowNewSpaceForm, setUploadSpace, setTab, onDeleteSpace, renameSpace }) {
  const [openMenuSpaceId, setOpenMenuSpaceId] = useState(null);
  const [renamingSpace, setRenamingSpace] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [sharingFeed, setSharingFeed] = useState(null);
  const [managingFeed, setManagingFeed] = useState(null);
  const [sharedFeedIds, setSharedFeedIds] = useState(new Set());

  useEffect(() => {
    if (openMenuSpaceId === null) return;
    const closeMenu = (event) => {
      if (!event.target.closest("[data-feed-menu]")) setOpenMenuSpaceId(null);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [openMenuSpaceId]);

  useEffect(() => {
    const ownerFeedIds = spaces.filter((space) => space.user_id === user?.id).map((space) => space.id);
    if (ownerFeedIds.length === 0) {
      setSharedFeedIds(new Set());
      return;
    }

    let active = true;
    const loadSharedFeeds = async () => {
      const { data, error } = await supabase
        .from("feed_members")
        .select("feed_id")
        .in("feed_id", ownerFeedIds)
        .neq("role", "owner");
      if (!active) return;
      if (error) {
        console.error("Could not check shared Feed access:", error);
        return;
      }
      setSharedFeedIds(new Set((data || []).map((membership) => membership.feed_id)));
    };

    loadSharedFeeds();
    const refreshSharedFeeds = () => loadSharedFeeds();
    window.addEventListener("focus", refreshSharedFeeds);
    document.addEventListener("visibilitychange", refreshSharedFeeds);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshSharedFeeds);
      document.removeEventListener("visibilitychange", refreshSharedFeeds);
    };
  }, [spaces, user?.id]);

  const updateSharedFeedStatus = (feedId, hasCollaborators) => {
    setSharedFeedIds((current) => {
      const next = new Set(current);
      if (hasCollaborators) next.add(feedId);
      else next.delete(feedId);
      return next;
    });
  };

  const leaveFeed = async (feed) => {
    if (!window.confirm(`Leave the ${feed.name} Feed? You’ll lose access unless someone shares it with you again.`)) return;
    const { error } = await supabase.rpc("leave_feed", { target_feed_id: feed.id });
    if (error) { alert(error.message); return; }

    const remainingFeeds = spaces.filter((space) => space.id !== feed.id);
    setSpaces(remainingFeeds);
    setFeedItems((prev) => prev.filter((item) => item.space_id ? item.space_id !== feed.id : item.space !== feed.name));
    setOpenMenuSpaceId(null);

    if (defaultFeed === feed.name && remainingFeeds.length > 0) {
      await setDefaultFeed(remainingFeeds[0].name);
    }
  };

  if (selectedSpace !== null) return <SpaceDetail selectedSpace={selectedSpace} setSelectedSpace={setSelectedSpace} spaces={spaces} feedItems={feedItems} setFeedItems={setFeedItems} setSelectedItem={setSelectedItem} setUploadSpace={setUploadSpace} setTab={setTab} />;

  return <div style={spacesPage}>
    <div style={spacesGrid}>
      {spaces.map((space) => {
        // feedItems are kept in their existing order; the first three saved to a Space become its cover.
        const spaceItems = feedItems.filter((item) => item.space_id ? item.space_id === space.id : item.space === space.name);
        return <div key={space.id} onClick={() => { if (openMenuSpaceId !== null) { setOpenMenuSpaceId(null); return; } trackEvent("space_opened", { space: space.name, source: "spaces_tab_card" }); setSelectedSpace(space.name); }} style={{ ...spaceCard, ...(spaceItems.length === 0 ? emptySpaceCard : {}) }}>
          {spaceItems.length > 0 && <SpaceCover items={spaceItems} />}
          {spaceItems.length > 0 && <div style={coverShade} />}
          <button aria-label={defaultFeed === space.name ? `${space.name} is your default space` : `Make ${space.name} your default space`} onClick={(e) => { e.stopPropagation(); setDefaultFeed(space.name); trackEvent("default_space_changed", { space: space.name, source: "spaces_tab" }); }} style={{ ...starButton, ...(spaceItems.length === 0 ? emptyCardControl : {}) }}><Star size={21} strokeWidth={2.2} fill={defaultFeed === space.name ? "var(--brand)" : "transparent"} color={defaultFeed === space.name ? "var(--brand)" : (spaceItems.length === 0 ? "var(--text-muted)" : "white")} /></button>
          <button data-feed-menu aria-label={`More options for ${space.name}`} onClick={(e) => { e.stopPropagation(); setOpenMenuSpaceId(openMenuSpaceId === space.id ? null : space.id); }} style={{ ...menuButton, ...(spaceItems.length === 0 ? emptyCardControl : {}) }}><MoreVertical size={20} /></button>
          {openMenuSpaceId === space.id && <div data-feed-menu style={spaceMenu}>
            {space.user_id === user?.id && <button style={spaceMenuItem} onClick={(e) => { e.stopPropagation(); setSharingFeed(space); setOpenMenuSpaceId(null); }}><Share2 size={15} strokeWidth={2.5} /><span>Share Feed</span></button>}
            {space.user_id === user?.id && sharedFeedIds.has(space.id) && <button style={spaceMenuItem} onClick={(e) => { e.stopPropagation(); setManagingFeed(space); setOpenMenuSpaceId(null); }}><Users size={15} strokeWidth={2.5} /><span>Manage access</span></button>}
            {space.user_id === user?.id && <button style={spaceMenuItem} onClick={(e) => { e.stopPropagation(); setRenamingSpace(space); setRenameDraft(space.name); setOpenMenuSpaceId(null); }}><Pencil size={15} strokeWidth={2.5} /><span>Rename</span></button>}
            {space.user_id === user?.id && <button style={{ ...spaceMenuItem, color: "var(--danger)" }} onClick={(e) => { e.stopPropagation(); setOpenMenuSpaceId(null); onDeleteSpace(space.name); }}><Trash2 size={15} strokeWidth={2.5} /><span>Delete</span></button>}
            {space.user_id !== user?.id && <button style={{ ...spaceMenuItem, color: "var(--danger)" }} onClick={(e) => { e.stopPropagation(); leaveFeed(space); }}><LogOut size={15} strokeWidth={2.5} /><span>Leave Feed</span></button>}
          </div>}
          <div style={{ ...spaceContent, ...(spaceItems.length === 0 ? emptySpaceContent : {}) }}><h3 style={{ ...spaceName, ...(spaceItems.length === 0 ? emptySpaceName : {}) }}>{space.name}</h3><p style={{ ...spaceItemsText, ...(spaceItems.length === 0 ? emptySpaceItemsText : {}) }}>{space.user_id !== user?.id && <><Users size={13} /> Shared · </>}{spaceItems.length} items</p></div>
        </div>;
      })}
      <div style={newSpaceCard} onClick={() => { trackEvent("new_space_clicked", { source: "spaces_tab" }); setShowNewSpaceForm(true); }}>
        <div style={newSpacePlus}><Plus size={22} strokeWidth={2.8} /></div>
        <h3 style={newSpaceLabel}>New Space</h3>
      </div>
    </div>

    {sharingFeed && <FeedShareModal feed={sharingFeed} onClose={() => setSharingFeed(null)} />}
    {managingFeed && <FeedMembersModal feed={managingFeed} onClose={() => setManagingFeed(null)} onMembershipChange={updateSharedFeedStatus} />}

    {renamingSpace && <div style={modalOverlay}><div style={modalCard}>
      <h2 style={modalTitle}>Rename Space</h2><p style={modalSubtitle}>Update the name for this space.</p>
      <input style={modalInput} value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} autoFocus />
      <button style={modalPrimaryButton} onClick={async () => { const success = await renameSpace({ spaceId: renamingSpace.id, oldName: renamingSpace.name, newName: renameDraft, feedItems, setFeedItems, setSelectedSpace }); if (!success) return; setRenamingSpace(null); setRenameDraft(""); }}>Save Name</button>
      <button style={modalSecondaryButton} onClick={() => { setRenamingSpace(null); setRenameDraft(""); }}>Cancel</button>
    </div></div>}
  </div>;
}

const spacesPage = { color:"var(--text-primary)", height:"100%", overflowY:"auto", overscrollBehavior:"contain", WebkitOverflowScrolling:"touch", boxSizing:"border-box", padding:"12px 0 28px" };
const spacesGrid = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" };
const spaceCard = { background:"var(--surface)", borderRadius:"20px", border:"1px solid var(--border)", minHeight:"170px", overflow:"visible", position:"relative", cursor:"pointer", boxSizing:"border-box" };
const coverGrid = { position:"absolute", inset:0, overflow:"hidden", borderRadius:"inherit", display:"grid", gridTemplateRows:"1fr 1fr", gap:"2px", background:"var(--surface-elevated)" };
const coverTile = { width:"100%", height:"100%", minWidth:0, minHeight:0, objectFit:"cover", display:"block" };
const emptyCover = { position:"absolute", inset:0, background:"var(--surface-elevated)" };
const emptySpaceCard = { background:"var(--surface)", border:"1px solid var(--border)" };
const emptyCardControl = { background:"transparent", color:"var(--text-secondary)", backdropFilter:"none", WebkitBackdropFilter:"none" };
const emptySpaceContent = { left:"16px", right:"16px", bottom:"14px" };
const emptySpaceName = { color:"var(--text-primary)", textShadow:"none" };
const emptySpaceItemsText = { color:"var(--text-secondary)", textShadow:"none" };
const coverShade = { position:"absolute", inset:0, borderRadius:"inherit", background:"linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.22) 48%, rgba(0,0,0,.18) 100%)", pointerEvents:"none" };
const starButton = { position:"absolute", top:"10px", right:"10px", width:"40px", height:"40px", display:"flex", alignItems:"center", justifyContent:"center", padding:0, background:"rgba(0,0,0,.22)", border:"none", borderRadius:"999px", color:"white", cursor:"pointer", zIndex:4, backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)" };
const menuButton = { position:"absolute", top:"10px", left:"10px", width:"40px", height:"40px", display:"flex", alignItems:"center", justifyContent:"center", padding:0, background:"rgba(0,0,0,.22)", border:"none", borderRadius:"999px", color:"white", cursor:"pointer", zIndex:4, backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)" };
const spaceMenu = { position:"absolute", top:"54px", left:"10px", background:"var(--surface-elevated)", border:"1px solid var(--border)", borderRadius:"14px", padding:"6px", zIndex:20, boxShadow:"var(--shadow)" };
const spaceMenuItem = { display:"flex", alignItems:"center", gap:"8px", width:"100%", padding:"10px 14px", border:"none", background:"transparent", color:"var(--text-primary)", textAlign:"left", cursor:"pointer" };
const spaceContent = { position:"absolute", left:"16px", right:"16px", bottom:"14px", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:"3px", zIndex:3, textAlign:"left" };
const spaceName = { margin:0, fontSize:"var(--text-lg)", fontWeight:"var(--weight-bold)", color:"white", textShadow:"0 1px 8px rgba(0,0,0,.45)" };
const spaceItemsText = { display:"flex", alignItems:"center", gap:"4px", color:"rgba(255,255,255,.78)", margin:0, fontSize:"var(--text-sm)", textShadow:"0 1px 6px rgba(0,0,0,.45)" };
const newSpaceCard = { ...spaceCard, minHeight:"170px", border:"1px dashed var(--text-muted)", background:"transparent", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px" };
const newSpacePlus = { width:"42px", height:"42px", borderRadius:"999px", background:"var(--surface-elevated)", color:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center" };
const newSpaceLabel = { margin:0, fontSize:"var(--text-md)", fontWeight:"var(--weight-semibold)", color:"var(--text-primary)" };
const modalOverlay = { position:"fixed", inset:0, background:"var(--overlay)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", zIndex:1000 };
const modalCard = { width:"100%", maxWidth:"360px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"28px", padding:"24px", boxShadow:"var(--shadow)" };
const modalTitle = { color:"var(--text-primary)", fontSize:"var(--text-xl)", fontWeight:"var(--weight-bold)", marginBottom:"8px" };
const modalSubtitle = { color:"var(--text-secondary)", fontSize:"var(--text-sm)", marginBottom:"12px" };
const modalInput = { width:"100%", boxSizing:"border-box", padding:"16px", borderRadius:"16px", border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text-primary)", fontSize:"var(--text-md)", marginBottom:"16px" };
const modalPrimaryButton = { width:"100%", padding:"14px", borderRadius:"16px", border:"none", background:"var(--brand)", color:"white", fontWeight:"var(--weight-bold)", cursor:"pointer" };
const modalSecondaryButton = { width:"100%", padding:"14px", borderRadius:"16px", border:"none", background:"transparent", color:"var(--text-secondary)", marginTop:"10px", cursor:"pointer" };