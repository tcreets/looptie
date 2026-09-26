import { useState } from "react";
import { Settings, Heart, Play, BookmarkPlus } from "lucide-react";
import Activity from "./Activity";

function SmartImage({ src, style }) {
  const [fit, setFit] = useState("cover");
  return <img src={src} loading="lazy" alt="" style={{ ...style, objectFit: fit, background: "var(--bg)" }} onLoad={(e) => { const img = e.currentTarget; setFit(img.naturalWidth > img.naturalHeight ? "contain" : "cover"); }} />;
}

export default function Profile({ items, spaces, setSelectedItem, setTab, profile, activities = [], hasUnreadActivity = false, markAllRead, onOpenActivityFeed }) {
  const favoriteItems = items.filter((item) => item.favorite);
  const [profileView, setProfileView] = useState("all");
  const visibleItems = profileView === "favorites" ? favoriteItems : items;
  const openActivity = () => { setProfileView("activity"); markAllRead?.(); };
  return (
    <div style={profilePage} className="no-scrollbar">
      <div style={profileStickyTop}>
        <div style={profileHeader}>
          <div style={profileAvatar}>{profile?.display_name?.charAt(0)?.toUpperCase() || "?"}</div>
          <div style={profileTitleBlock}><h1 style={profileTitle}>{profile?.display_name || "Your"}'s Looptie</h1></div>
          <button style={settingsButton} aria-label="Settings" onClick={() => setTab("settings")}><Settings size={20} /></button>
        </div>
        <div style={profileStats}>
          <div style={profileStatCard}><strong style={profileStatNumber}>{items.length}</strong><span style={profileStatLabel}>Saved</span></div>
          <div style={profileStatCard}><strong style={profileStatNumber}>{favoriteItems.length}</strong><span style={profileStatLabel}>Favorites</span></div>
          <div style={profileStatCard}><strong style={profileStatNumber}>{spaces.length}</strong><span style={profileStatLabel}>Feeds</span></div>
        </div>
        <div style={profileTabs}>
          <button style={{ ...profileTab, background: profileView === "all" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "all" ? "var(--brand)" : "var(--border)", color: profileView === "all" ? "white" : "var(--text-primary)" }} onClick={() => setProfileView("all")}>Saves</button>
          <button style={{ ...profileTab, background: profileView === "favorites" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "favorites" ? "var(--brand)" : "var(--border)", color: profileView === "favorites" ? "white" : "var(--text-primary)" }} onClick={() => setProfileView("favorites")}>Favorites</button>
          <button style={{ ...profileTab, position:"relative", background: profileView === "activity" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "activity" ? "var(--brand)" : "var(--border)", color: profileView === "activity" ? "white" : "var(--text-primary)" }} onClick={openActivity}>Activity{hasUnreadActivity && <span style={activityDot} />}</button>
        </div>
      </div>
      {profileView === "activity" ? <Activity activities={activities} spaces={spaces} items={items} onOpenItem={setSelectedItem} onOpenFeed={onOpenActivityFeed} /> : <div style={profileGrid}>
        {visibleItems.length === 0 && (
          <div style={emptyState}>
            <div style={emptyVisual} aria-hidden="true">
              <div style={{ ...emptyBackCard, transform: "rotate(-9deg) translate(-8px, 5px)" }} />
              <div style={{ ...emptyBackCard, transform: "rotate(8deg) translate(8px, 5px)" }} />
              <div style={emptyFrontCard}>
                {profileView === "favorites"
                  ? <Heart size={34} strokeWidth={1.8} />
                  : <BookmarkPlus size={34} strokeWidth={1.8} />}
              </div>
            </div>
            <h2 style={emptyTitle}>{profileView === "favorites" ? "Keep your favorites close" : "Your collection starts here"}</h2>
            <p style={emptyCopy}>
              {profileView === "favorites"
                ? "Tap the heart on anything you want to find again fast."
                : "Save something worth revisiting and it’ll show up right here."}
            </p>
            {profileView === "all" && <button style={emptyButton} onClick={() => setTab("add")}><BookmarkPlus size={18} /> Add your first save</button>}
          </div>
        )}
        {visibleItems.map((item) => <div style={profileCardItem} key={item.id} onClick={() => setSelectedItem(item)}>
          {item.media_type === "video" ? <video src={item.image} muted playsInline preload="metadata" style={profileImage} onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }} /> : <SmartImage src={item.image} style={profileImage} />}
          {item.media_type === "video" && <div style={videoBadge}><Play fill="white" color="white" size={16} /></div>}
          {item.favorite && <div style={profileFavoriteBadge}><Heart fill="var(--favorite)" color="var(--favorite)" size={24} /></div>}
          <div style={profileOverlay}><span>{item.space}</span></div>
        </div>)}
      </div>}
    </div>
  );
}

const profilePage = { height: "100%", overflowY: "auto", paddingBottom: "0px", background: "var(--bg)", color: "var(--text-primary)" };
const profileAvatar = { width: "52px", height: "52px", flexShrink: 0, borderRadius: "999px", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight:"var(--weight-bold)" };
const profileStats = { display: "flex", gap: "8px", marginBottom: "16px" };
const profileStatCard = { flex: 1, minWidth: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "11px 6px", textAlign: "center" };
const profileGrid = { columnCount:2, columnGap:"12px", padding:"0 14px 110px" };
const profileCardItem = { display: "inline-block", width: "100%", marginBottom: "12px", breakInside: "avoid", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden", position: "relative", cursor: "pointer" };
const profileImage = { width: "100%", height: "auto", display: "block", objectFit: "cover" };
const profileOverlay = { position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "6px 10px", borderRadius: "999px", fontSize: "12px", color: "white" };
const profileTitleBlock = { display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 };
const profileTitle = { margin: 0, color: "var(--text-primary)", fontSize:"var(--text-xl)", fontWeight: "800", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const profileHeader = { display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" };
const profileStatNumber = { display: "block", fontSize:"var(--text-lg)", color: "var(--text-primary)", lineHeight: 1 };
const profileStatLabel = { display: "block", marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" };
const profileTabs = { display: "flex", gap: "8px" };
const profileTab = { border: "1px solid var(--border)", borderRadius: "999px", padding: "9px 14px", fontWeight:"var(--weight-bold)", cursor: "pointer" };
const profileFavoriteBadge = { position: "absolute", top: "10px", right: "10px", color: "var(--favorite)", fontSize: "22px", zIndex: 2, textShadow: "0 2px 10px rgba(0,0,0,.5)" };
const profileStickyTop = { position: "sticky", top: 0, zIndex: 10, background: "var(--bg)", padding: "12px 14px 16px" };
const emptyState = { width: "min(100% - 40px, 420px)", margin: "56px auto 0", paddingBottom: "28px", textAlign: "center", color: "var(--text-secondary)", columnSpan: "all", breakInside: "avoid", display: "flex", flexDirection: "column", alignItems: "center" };
const emptyVisual = { width: "112px", height: "96px", position: "relative", marginBottom: "24px" };
const emptyBackCard = { position: "absolute", width: "70px", height: "82px", top: "7px", left: "21px", borderRadius: "20px", background: "var(--surface-elevated)", border: "1px solid var(--border)" };
const emptyFrontCard = { position: "absolute", width: "76px", height: "88px", top: 0, left: "18px", borderRadius: "22px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow)" };
const emptyTitle = { margin: "0 0 10px", fontSize: "var(--text-xl)", color: "var(--text-primary)" };
const emptyCopy = { maxWidth: "340px", margin: "0 0 24px", fontSize: "var(--text-md)", lineHeight: "var(--leading-normal)", color: "var(--text-secondary)" };
const emptyButton = { border: "none", borderRadius: "999px", padding: "13px 19px", background: "var(--brand)", color: "white", fontWeight: "var(--weight-bold)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 8px 22px rgba(var(--brand-rgb),.22)" };
const settingsButton = { marginLeft: "auto", width: "40px", height: "40px", flexShrink: 0, borderRadius: "999px", border: "1px solid var(--border)", background: "var(--surface-elevated)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const videoBadge = { position: "absolute", top: "10px", left: "10px", width: "32px", height: "32px", borderRadius: "999px", background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 };

const activityDot = { position:"absolute", top:"3px", right:"4px", width:"9px", height:"9px", borderRadius:"999px", background:"var(--favorite)", boxShadow:"0 0 0 2px var(--surface-elevated)" };
