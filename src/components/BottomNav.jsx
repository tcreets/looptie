import React from "react";
import { Home, Layers3, User, Search, Plus } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

export default function BottomNav({ defaultFeed, setActiveFeed, setTab, setSelectedSpace }) {
  return (
    <div style={navStyle}>
      <button aria-label="Home" title="Home" onClick={() => { trackEvent("tab_changed", { tab: "home" }); setActiveFeed(defaultFeed); setTab("home"); }} style={navButton}><Home size={24} /></button>
      <button aria-label="Spaces" title="Spaces" onClick={() => { trackEvent("tab_changed", { tab: "spaces" }); setTab("spaces"); setSelectedSpace(null); }} style={navButton}><Layers3 size={24} /></button>
      <button aria-label="Add content" title="Add content" onClick={() => { trackEvent("tab_changed", { tab: "add" }); setTab("add"); }} style={addNavButton}><Plus size={30} strokeWidth={3} /></button>
      <button aria-label="Search" title="Search" onClick={() => { trackEvent("tab_changed", { tab: "search" }); setTab("search"); }} style={navButton}><Search size={24} /></button>
      <button aria-label="Profile" title="Profile" onClick={() => { trackEvent("tab_changed", { tab: "profile" }); setTab("profile"); }} style={navButton}><User size={24} /></button>
    </div>
  );
}

const navStyle = { display:"flex", alignItems:"center", justifyContent:"space-around", padding:"12px 18px", borderTop:"1px solid var(--border)", background:"var(--surface)" };
const navButton = { width:"44px", height:"44px", background:"transparent", color:"var(--text-primary)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 };
const addNavButton = { width:"52px", height:"52px", borderRadius:"18px", border:"none", background:"var(--brand)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, lineHeight:1 };
