import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Settings, Heart, Play } from "lucide-react";

export default function Profile({ 
  items,
  spaces,
  setSelectedItem,
  setTab,
  profile,
}) {
    const favoriteItems = items.filter((item) => item.favorite);
    const [profileView, setProfileView] = useState("all");
    const visibleItems = profileView === "favorites" ? favoriteItems : items;
    return (
      <div style={profilePage} className="no-scrollbar">
        <div style={profileStickyTop}>
          <div style={profileHeader}>
          <div style={profileAvatar}>
            {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
            
            <div style={profileTitleBlock}>
              <h1 style={profileTitle}>{profile?.display_name || "Your"}'s Looptie</h1>
              <p style={profileSubtitle}>
                Your saved media, spaces, and favorites.
              </p>
            </div>
            <button
              style={settingsButton}
              onClick={() => setTab("settings")}
            >
              <Settings size={20} />
            </button>
          </div>
          <div style={profileStats}>
            <div style={profileStatCard}>
              <strong style={profileStatNumber}>{items.length}</strong>
              <span style={profileStatLabel}>Items</span>
            </div>
            
            <div style={profileStatCard}>
              <strong style={profileStatNumber}>
                {favoriteItems.length}
              </strong>
              <span style={profileStatLabel}>Favorites</span>
            </div>
            
            <div style={profileStatCard}>
              <strong style={profileStatNumber}>{spaces.length}</strong>
              <span style={profileStatLabel}>Spaces</span>
            </div>
          </div>
            
          <div style={profileTabs}>
            <button
              style={{
                ...profileTab,
                background:
                  profileView === "all" ? "#7c3aed" : "#18181b",
              }}
              onClick={() => setProfileView("all")}
            >
              All
            </button>
            
            <button
              style={{
                ...profileTab,
                background:
                  profileView === "favorites"
                    ? "#7c3aed"
                    : "#18181b",
              }}
              onClick={() => setProfileView("favorites")}
            >
              Favorites
            </button>
          </div>
        </div>
        <div style={profileGrid}>

        {visibleItems.length === 0 && (
          <div style={emptyState}>
            <h3>No favorites yet</h3>
            <p>Tap the heart on items you want to keep close.</p>
          </div>
        )}
      
        {visibleItems.map((item) => (
            <div
            style={profileCardItem}
            key={item.id}
            onClick={() => setSelectedItem(item)}
          >
            {item.media_type === "video" ? (
              <video
                src={item.image}
                muted
                playsInline
                preload="auto"
                style={profileImage}
                onLoadedData={(e) => {
                  e.currentTarget.currentTime = 0.1;
                }}
              />
            ) : (
              <img
                src={item.image}
                loading="lazy"
                alt=""
                style={profileImage}
              />
            )}

            {item.media_type === "video" && (
              <div style={videoBadge}>
                <Play fill="white" color="white" size={16} />
              </div>
            )}
          
            {item.favorite && (
              <div style={profileFavoriteBadge}>
               <Heart fill="#ef4444" color="#ef4444" size={24}/>
              </div>
            )}
          
            <div style={profileOverlay}>
              <span>{item.space}</span>
            </div>
          </div>
          ))}
        </div>
      </div>
    );
  }

  const profilePage = {
    height: "100%",
    overflowY: "auto",
    paddingBottom: "0px",
    background: "#050505",
  };

  const profileAvatar = {
    width: "70px",
    height: "70px",
    borderRadius: "999px",
    background: "#8b5cf6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "700",
  };
  
  const profileStats = {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
  };

  const profileStatCard = {
    flex: 1,
    background: "linear-gradient(145deg, #26223a, #1d1a2b)",
    border: "1px solid #4c4563",
    borderRadius: "18px",
    padding: "14px 10px",
    textAlign: "center",
    boxShadow: "0 4px 18px rgba(124, 58, 237, 0.12)",
  };

  
  const profileGrid = {
    columnCount: 2,
    columnGap: "12px",
    paddingBottom: "0px",
  };
  
  const profileCardItem = {
    display: "inline-block",
    width: "100%",
    marginBottom: "12px",
    breakInside: "avoid",
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "20px",
    overflow: "hidden",
    position: "relative",
    cursor: "pointer",
  };
  
  const profileImage = {
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "cover",
  };
  
  const profileOverlay = {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    color: "white",
  };

  const profileTitleBlock = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };
  
  const profileTitle = {
    margin: 0,
    color: "white",
    fontSize: "24px",
    fontWeight: "800",
    lineHeight: 1.1,
  };
  
  const profileSubtitle = {
    margin: "6px 0 0",
    color: "#b3adbf",
    fontSize: "13px",
  };
  
  const profileHeader = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px",
    justifyContent: "space-between",
  };

  const profileStatNumber = {
    display: "block",
    fontSize: "18px",
    color: "white",
    lineHeight: 1,
  };
  
  const profileStatLabel = {
    display: "block",
    marginTop: "4px",
    fontSize: "11px",
    color: "#a1a1aa",
  };

  const profileTabs = {
    display: "flex",
    gap: "10px",
    marginBottom: "18px",
  };
  
  const profileTab = {
    border: "1px solid #27272a",
    borderRadius: "999px",
    padding: "9px 14px",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  };

  const profileFavoriteBadge = {
    position: "absolute",
    top: "10px",
    left: "10px",
    color: "#ef4444",
    fontSize: "22px",
    zIndex: 2,
    textShadow: "0 2px 10px rgba(0,0,0,.5)",
  };

  const profileStickyTop = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#050505",
    paddingBottom: "14px",
  };

  const emptyState = {
    marginTop: "80px",
    textAlign: "center",
    color: "#a1a1aa",
    columnSpan: "all",
  };

  const settingsButton = {
    marginLeft: "auto",
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    border: "1px solid #27272a",
    background: "#18181b",
    color: "#d4d4d8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const videoBadge = {
  position: "absolute",
  top: "10px",
  right: "10px",
  width: "32px",
  height: "32px",
  borderRadius: "999px",
  background: "rgba(0,0,0,.65)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3,
};