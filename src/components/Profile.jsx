import { useState } from "react";
import { Settings, Heart, Play, BookmarkPlus } from "lucide-react";

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
          <div style={profileStatCard}><strong style={profileStatNumber}>{spaces.length}</strong><span style={profileStatLabel}>Feeds</span></div>
        </div>
        <div style={profileTabs}>
          <button style={{ ...profileTab, background: profileView === "all" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "all" ? "var(--brand)" : "var(--border)", color: profileView === "all" ? "white" : "var(--text-primary)" }} onClick={() => setProfileView("all")}>All</button>
          <button style={{ ...profileTab, background: profileView === "favorites" ? "var(--brand)" : "var(--surface-elevated)", borderColor: profileView === "favorites" ? "var(--brand)" : "var(--border)", color: profileView === "favorites" ? "white" : "var(--text-primary)" }} onClick={() => setProfileView("favorites")}>Favorites</button>
        </div>
      </div>
      <div style={profileGrid}>
        {visibleItems.length === 0 && (
          <div style={emptyState}>
            <div style={emptyIllustration} aria-hidden="true">
              <div style={emptyCardBack} />
              <div style={emptyCardFront}>
                {profileView === "favorites"
                  ? <Heart size={34} strokeWidth={1.9} fill="var(--brand-soft)" />
                  : <BookmarkPlus size={34} strokeWidth={1.9} />}
              </div>
              <div style={emptySpark}>✦</div>
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
const emptyState = { width: "100%", maxWidth: "360px", margin: "56px auto 0", padding: "10px 24px 28px", textAlign: "center", color: "var(--text-secondary)", columnSpan: "all", breakInside: "avoid" };
const emptyIllustration = { width: "112px", height: "104px", margin: "0 auto 22px", position: "relative" };
const emptyCardBack = { position: "absolute", width: "74px", height: "82px", left: "10px", top: "4px", borderRadius: "20px", background: "var(--brand-soft)", transform: "rotate(-9deg)", opacity: 0.7 };
const emptyCardFront = { position: "absolute", width: "78px", height: "86px", right: "7px", bottom: 0, borderRadius: "22px", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 12px 30px rgba(82, 38, 188, .14)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" };
const emptySpark = { position: "absolute", top: "0", right: "0", color: "var(--brand)", fontSize: "24px", lineHeight: 1 };
const emptyTitle = { margin: "0 0 9px", color: "var(--text-primary)", fontSize: "22px", lineHeight: 1.15, fontWeight: 800 };
const emptyCopy = { maxWidth: "310px", margin: "0 auto 22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 };
const emptyButton = { minHeight: "46px", padding: "0 20px", border: 0, borderRadius: "999px", background: "var(--brand)", color: "white", fontWeight: "var(--weight-bold)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 8px 20px rgba(82, 38, 188, .22)" };
const settingsButton = { marginLeft: "auto", width: "38px", height: "38px", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--surface-elevated)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const videoBadge = { position: "absolute", top: "10px", left: "10px", width: "32px", height: "32px", borderRadius: "999px", background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 };