import React from "react";
import { Home, Layers3, User, Search, Plus } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

export default function BottomNav({ setTab, setSelectedSpace, hasUnreadActivity = false }) {
  return (
    <div style={navWrap}>
      <div style={navStyle}>
        <button aria-label="Home" title="Home" onClick={() => { trackEvent("tab_changed", { tab: "home" }); setTab("home"); }} style={navButton}><Home size={24} /></button>
        <button aria-label="Feeds" title="Feeds" onClick={() => { trackEvent("tab_changed", { tab: "spaces" }); setTab("spaces"); setSelectedSpace(null); }} style={navButton}><Layers3 size={24} /></button>
        <button aria-label="Add content" title="Add content" onClick={() => { trackEvent("tab_changed", { tab: "add" }); setTab("add"); }} style={addNavButton}><Plus size={30} strokeWidth={3} /></button>
        <button aria-label="Search" title="Search" onClick={() => { trackEvent("tab_changed", { tab: "search" }); setTab("search"); }} style={navButton}><Search size={24} /></button>
        <button aria-label="Profile" title="Profile" onClick={() => { trackEvent("tab_changed", { tab: "profile" }); setTab("profile"); }} style={{...navButton,position:"relative"}}><User size={24} />{hasUnreadActivity && <span style={profileActivityDot} />}</button>
      </div>
    </div>
  );
}

const navWrap = { position:"fixed", left:0, right:0, bottom:0, zIndex:120, padding:"8px 14px 12px", background:"transparent", pointerEvents:"none" };
const navStyle = { display:"flex", alignItems:"center", justifyContent:"space-around", minHeight:"62px", padding:"4px 10px", border:"1px solid var(--border)", borderRadius:"24px", background:"color-mix(in srgb, var(--surface) 92%, transparent)", boxShadow:"0 8px 28px rgba(0,0,0,.18)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", pointerEvents:"auto" };
const navButton = { width:"44px", height:"44px", background:"transparent", color:"var(--text-primary)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 };
const addNavButton = { width:"50px", height:"50px", borderRadius:"17px", border:"none", background:"var(--brand)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, lineHeight:1, boxShadow:"0 5px 16px rgba(var(--brand-rgb),.28)" };

const profileActivityDot = { position:"absolute", top:"5px", right:"5px", width:"11px", height:"11px", borderRadius:"999px", background:"var(--favorite)", boxShadow:"0 0 0 2px var(--surface), 0 1px 5px rgba(var(--brand-rgb),.45)" };
