import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Onboarding({ user, setProfile, onComplete }) {
  const [displayName, setDisplayName] = useState("");
  const [feedName, setFeedName] = useState("");
  const [saving, setSaving] = useState(false);

  const finishOnboarding = async () => {
    if (!user) return;
    const cleanName = displayName.trim();
    const cleanFeed = feedName.trim();
    if (!cleanName) { alert("Add a display name first."); return; }
    if (!cleanFeed) { alert("Name your first Feed first."); return; }

    setSaving(true);
    const { error: resetDefaultsError } = await supabase.from("spaces").update({ is_default: false }).eq("user_id", user.id);
    if (resetDefaultsError) { setSaving(false); alert(resetDefaultsError.message); return; }

    const { data: newSpace, error: spaceError } = await supabase.from("spaces").insert({ user_id: user.id, name: cleanFeed, is_default: true }).select().single();
    if (spaceError) { setSaving(false); alert(spaceError.message); return; }

    const { data: updatedProfile, error: profileError } = await supabase.from("profiles").update({
      display_name: cleanName,
      default_space: newSpace.name,
      has_completed_onboarding: true,
    }).eq("user_id", user.id).select().single();
    setSaving(false);

    if (profileError) { alert(profileError.message); return; }
    setProfile(updatedProfile);
    onComplete(newSpace);
  };

  const disabled = saving || !displayName.trim() || !feedName.trim();

  return <div style={page}>
    <div style={card}>
      <div style={eyebrow}>ONE LAST STEP</div>
      <h1 style={title}>Create your first Feed</h1>
      <p style={body}>Start with something you already save often. You can create more Feeds anytime.</p>
      <label style={label}>Your name</label>
      <input style={input} placeholder="What should Looptie call you?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
      <label style={label}>First Feed</label>
      <input style={input} placeholder="For example, Motivation" value={feedName} onChange={(e) => setFeedName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !disabled) finishOnboarding(); }} />
      <div style={suggestions}>
        {["Motivation", "Recipes", "Writing", "Wellness"].map((name) => <button key={name} type="button" style={suggestion} onClick={() => setFeedName(name)}>{name}</button>)}
      </div>
      <button style={{ ...button, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }} onClick={finishOnboarding} disabled={disabled}>
        {saving ? "Creating your Feed..." : "Enter Looptie"}
      </button>
    </div>
  </div>;
}

const page = { minHeight:"100vh", background:"var(--bg)", color:"var(--text-primary)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", boxSizing:"border-box" };
const card = { width:"100%", maxWidth:"430px" };
const eyebrow = { color:"var(--brand)", fontSize:"var(--text-xs)", fontWeight:"var(--weight-bold)", letterSpacing:"1.4px", marginBottom:"14px" };
const title = { fontSize:"38px", lineHeight:"1.08", letterSpacing:"-1px", margin:"0 0 16px" };
const body = { fontSize:"var(--text-lg)", lineHeight:"1.5", color:"var(--text-secondary)", marginBottom:"30px" };
const label = { display:"block", fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)", margin:"0 0 8px" };
const input = { width:"100%", padding:"15px 16px", borderRadius:"16px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", fontSize:"var(--text-md)", outline:"none", marginBottom:"18px", boxSizing:"border-box" };
const suggestions = { display:"flex", flexWrap:"wrap", gap:"8px", margin:"-4px 0 28px" };
const suggestion = { padding:"8px 12px", borderRadius:"999px", border:"1px solid var(--border)", background:"var(--surface-elevated)", color:"var(--text-primary)", fontSize:"var(--text-sm)", cursor:"pointer" };
const button = { width:"100%", padding:"15px 18px", borderRadius:"999px", border:"none", background:"var(--brand)", color:"white", fontSize:"var(--text-md)", fontWeight:"var(--weight-bold)" };
