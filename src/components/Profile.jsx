import { useState } from "react";
import { Settings, Heart, Play } from "lucide-react";

function SmartImage({ src, style }) {
  const [fit, setFit] = useState("cover");
  return <img src={src} loading="lazy" alt="" style={{ ...style, objectFit: fit, background: "var(--bg)" }} onLoad={(e) => { const img = e.currentTarget; setFit(img.naturalWidth > img.naturalHeight ? "contain" : "cover"); }} />;
}

export default function Profile({ items, spaces, setSelectedItem, setTab, profile }) {
  const favoriteItems = items.filter((item) => item.favorite);
  const [profileView, setProfileView] = useState("all");
  const visibleItems = profileView === "favorites" ? favoriteItems : items;
  return (
    <div style={profilePage} className="no-scrollbar">
      <div style={profileStickyTop}>
        <div style={profileHeader}>
          <div style={profileAvatar}>{profile?.display_name?.charAt(0)?.toUpperCase() || "?"}</div>
          <div style={profileTitleBlock}><h1 style={profileTitle}>{profile?.display_name || "Your"}'s Looptie</h1></div>
          <button style={settingsButton} onClick={() => setTab("settings")}><Settings size={20} /></button>
        </div>
        <div style={profileStats}>
          <div style={profileStatCard}><strong style={profileStatNumber}>{items.length}</strong><span style={profileStatLabel}>Saved</span></div>
          <div style={profileStatCard}><strong style={profileStatNumber}>{favoriteItems.length}</strong><span style={profileStatLabel}>Favorites</span></div>
          <div style={profileStatCard}><strong style={profileStatNumber}>{spaces.length}</strong><span style={profileStatLabel}>Spaces</span></div>
        </div>
        <div style={profileTabs}>
          <button style={{ ...profileTab, background: profileView === "all" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "all" ? "var(--brand)" : "var(--border)", color: profileView === "all" ? "white" : "var(--text-primary)" }} onClick={() => setProfileView("all")}>All</button>
          <button style={{ ...profileTab, background: profileView === "favorites" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "favorites" ? "var(--brand)" : "var(--border)", color: profileView === "favorites" ? "white" : "var(--text-primary)" }} onClick={() => setProfileView("favorites")}>Favorites</button>
        </div>
      </div>
      <div style={profileGrid}>
        {visibleItems.length === 0 && <div style={emptyState}><h3>{profileView === "favorites" ? "No favorites yet" : "No items yet"}</h3><p>{profileView === "favorites" ? "Tap the heart on items you want to keep close." : "Add something to Looptie to start your collection."}</p></div>}
        {visibleItems.map((item) => <div style={profileCardItem} key={item.id} onClick={() => setSelectedItem(item)}>
          {item.media_type === "video" ? <video src={item.image} muted playsInline preload="auto" style={profileImage} onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }} /> : <SmartImage src={item.image} style={profileImage} />}
          {item.media_type === "video" && <div style={videoBadge}><Play fill="white" color="white" size={16} /></div>}
          {item.favorite && <div style={profileFavoriteBadge}><Heart fill="var(--favorite)" color="var(--favorite)" size={24} /></div>}
          <div style={profileOverlay}><span>{item.space}</span></div>
        </div>)}
      </div>
    </div>
  );
}

const profilePage = { height: "100%", overflowY: "auto", paddingBottom: "0px", background: "var(--bg)", color: "var(--text-primary)" };
const profileAvatar = { width: "70px", height: "70px", borderRadius: "999px", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight:"var(--weight-bold)" };
const profileStats = { display: "flex", gap: "12px", marginBottom: "24px" };
const profileStatCard = { flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "14px 10px", textAlign: "center" };
const profileGrid = { columnCount:2, columnGap:"12px", padding:"0 10px 0" };
const profileCardItem = { display: "inline-block", width: "100%", marginBottom: "12px", breakInside: "avoid", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden", position: "relative", cursor: "pointer" };
const profileImage = { width: "100%", height: "auto", display: "block", objectFit: "cover" };
const profileOverlay = { position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "6px 10px", borderRadius: "999px", fontSize: "12px", color: "white" };
const profileTitleBlock = { display: "flex", flexDirection: "column", justifyContent: "center" };
const profileTitle = { margin: 0, color: "var(--text-primary)", fontSize:"var(--text-xl)", fontWeight: "800", lineHeight: 1.1 };
const profileHeader = { display:"flex", alignItems:"center", gap:"14px", marginBottom:"14px", justifyContent:"space-between" };
const profileStatNumber = { display: "block", fontSize:"var(--text-lg)", color: "var(--text-primary)", lineHeight: 1 };
const profileStatLabel = { display: "block", marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" };
const profileTabs = { display: "flex", gap: "10px", marginBottom: "18px" };
const profileTab = { border: "1px solid var(--border)", borderRadius: "999px", padding: "9px 14px", fontWeight:"var(--weight-bold)", cursor: "pointer" };
const profileFavoriteBadge = { position: "absolute", top: "10px", right: "10px", color: "var(--favorite)", fontSize: "22px", zIndex: 2, textShadow: "0 2px 10px rgba(0,0,0,.5)" };
const profileStickyTop = { position: "sticky", top: 0, zIndex: 10, background: "var(--bg)", paddingBottom: "14px" };
const emptyState = { marginTop: "80px", textAlign: "center", color: "var(--text-secondary)", columnSpan: "all" };
const settingsButton = { marginLeft: "auto", width: "38px", height: "38px", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--surface-elevated)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const videoBadge = { position: "absolute", top: "10px", left: "10px", width: "32px", height: "32px", borderRadius: "999px", background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 };