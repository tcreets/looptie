import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

const getStoredTheme = () => localStorage.getItem("looptie-theme") || "system";
const applyTheme = (theme) => {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("looptie-theme", theme);
};

export default function SettingsScreen({ profile, spaces, defaultFeed, setDefaultFeed, setActiveFeed, setProfile, setTab, user, deleteAllUserItemsAndStorage }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [selectedDefault, setSelectedDefault] = useState(defaultFeed || "");
  const [theme, setTheme] = useState(getStoredTheme);

  const changeTheme = (nextTheme) => { setTheme(nextTheme); applyTheme(nextTheme); };

  const saveSettings = async () => {
    const cleanName = displayName.trim();
    if (!selectedDefault) { alert("Choose a default feed."); return; }
    const { data, error } = await supabase.from("profiles").update({ display_name: cleanName, default_space: selectedDefault }).eq("user_id", user.id).select().single();
    if (error) { alert(error.message); return; }
    const { error: spacesError } = await supabase.from("spaces").update({ is_default: false }).eq("user_id", user.id);
    if (spacesError) { alert(spacesError.message); return; }
    const { error: defaultSpaceError } = await supabase.from("spaces").update({ is_default: true }).eq("user_id", user.id).eq("name", selectedDefault);
    if (defaultSpaceError) { alert(defaultSpaceError.message); return; }
    setProfile(data); setDefaultFeed(selectedDefault); setActiveFeed(selectedDefault); alert("Settings saved.");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This will permanently delete your account and all Looptie data.")) return;
    const itemsResult = await deleteAllUserItemsAndStorage(); if (itemsResult?.error) { alert(itemsResult.error); return; }
    const { error: spacesError } = await supabase.from("spaces").delete().eq("user_id", user.id); if (spacesError) { alert(spacesError.message); return; }
    const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", user.id); if (profileError) { alert(profileError.message); return; }
    const { error: functionError } = await supabase.functions.invoke("delete-account", { method: "POST" }); if (functionError) { alert(functionError.message); return; }
    await supabase.auth.signOut(); window.location.reload();
  };

  return <div style={page}>
    <button style={backButton} onClick={() => setTab("profile")}>←</button>
    <h1 style={title}>Settings</h1>
    <label style={label}>Display name</label><input style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
    <label style={label}>Email</label><input style={{ ...input, opacity:.7, cursor:"not-allowed" }} value={profile?.email || ""} disabled />
    <label style={label}>Default Feed</label><select style={input} value={selectedDefault} onChange={(e) => setSelectedDefault(e.target.value)}>{spaces.map((space) => <option key={space.id} value={space.name}>{space.name}</option>)}</select>

    <label style={label}>Appearance</label>
    <div style={themeGroup}>
      {[{value:"system",label:"System"},{value:"light",label:"Light"},{value:"dark",label:"Dark"}].map((option) => <button key={option.value} type="button" onClick={() => changeTheme(option.value)} style={{ ...themeButton, ...(theme === option.value ? activeThemeButton : {}) }}>{option.label}</button>)}
    </div>
    <p style={appearanceHint}>{theme === "system" ? "Matches your device appearance." : `Looptie will stay in ${theme} mode.`}</p>

    <button style={saveButton} onClick={saveSettings}>Save Settings</button>
    <button style={logoutButton} onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}>Log Out</button>
    <button style={deleteButton} onClick={handleDeleteAccount}>Delete Account</button>
  </div>;
}

const page={height:"100%",overflowY:"auto",background:"var(--bg)",color:"var(--text-primary)",padding:"20px",boxSizing:"border-box"};
const backButton={width:"38px",height:"38px",borderRadius:"999px",border:"1px solid var(--border)",background:"var(--surface-elevated)",color:"var(--text-primary)",cursor:"pointer",fontSize:"20px",marginBottom:"18px"};
const title={margin:"0 0 20px",color:"var(--text-primary)"};
const label={display:"block",marginBottom:"8px",color:"var(--text-secondary)",fontSize:"var(--text-sm)"};
const input={width:"100%",boxSizing:"border-box",padding:"16px",borderRadius:"16px",border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text-primary)",fontSize:"var(--text-md)",marginBottom:"16px"};
const themeGroup={display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",padding:"4px",borderRadius:"16px",background:"var(--surface-elevated)",border:"1px solid var(--border)"};
const themeButton={padding:"11px 8px",borderRadius:"12px",border:"1px solid transparent",background:"transparent",color:"var(--text-secondary)",fontWeight:"var(--weight-semibold)",cursor:"pointer"};
const activeThemeButton={background:"var(--surface)",color:"var(--brand)",border:"1px solid var(--border)",boxShadow:"0 1px 3px rgba(0,0,0,.08)"};
const appearanceHint={color:"var(--text-muted)",fontSize:"var(--text-sm)",margin:"8px 0 20px"};
const saveButton={width:"100%",padding:"14px",borderRadius:"16px",border:"none",background:"var(--brand)",color:"white",fontWeight:"var(--weight-bold)",cursor:"pointer",marginTop:"8px"};
const logoutButton={width:"100%",padding:"14px",borderRadius:"16px",border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text-primary)",fontWeight:"var(--weight-bold)",cursor:"pointer",marginTop:"28px"};
const deleteButton={width:"100%",padding:"14px",borderRadius:"16px",border:"1px solid var(--danger)",background:"transparent",color:"var(--danger)",fontWeight:"var(--weight-bold)",cursor:"pointer",marginTop:"14px"};