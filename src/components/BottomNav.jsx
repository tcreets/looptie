import React from "react";
import { Home, Grid3X3, User, Search, Plus } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

export default function BottomNav({
  defaultFeed,
  setActiveFeed,
  setTab,
  setSelectedSpace,
}) {
  return (
    <div style={navStyle}>
      <button
        onClick={() => {
          trackEvent("tab_changed", { tab: "home" });
          setActiveFeed(defaultFeed);
          setTab("home");
        }}
        style={navButton}
      >
        <Home size={22} />
        <span>Home</span>
      </button>

      <button
        onClick={() => {
          trackEvent("tab_changed", { tab: "spaces" });
          setTab("spaces");
          setSelectedSpace(null);
        }}
        style={navButton}
      >
        <Grid3X3 size={22} />
        <span>Spaces</span>
      </button>

      <button
        onClick={() => {
          trackEvent("tab_changed", { tab: "add" });
          setTab("add");
        }}
        style={addNavButton}
      >
        <div style={{ transform: "translateY(2px)" }}>
          <Plus size={30} strokeWidth={3} />
        </div>
      </button>

      <button
        onClick={() => {
          trackEvent("tab_changed", { tab: "search" });
          setTab("search");
        }}
        style={navButton}
      >
        <Search size={22} />
        <span>Search</span>
      </button>

      <button
        onClick={() => {
          trackEvent("tab_changed", { tab: "profile" });
          setTab("profile");
        }}
        style={navButton}
      >
        <User size={22} />
        <span>Profile</span>
      </button>
    </div>
  );
}

const navStyle = {
  display: "flex",
  justifyContent: "space-around",
  padding: "18px",
  borderTop: "1px solid #222",
  background: "#0a0a0a",
};

const navButton = {
  background: "transparent",
  color: "white",
  border: "none",
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
};

const addNavButton = {
  width: "52px",
  height: "52px",
  borderRadius: "18px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontSize: "30px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  paddingBottom: "4px",
  lineHeight: 1,
};