import { useEffect, useState } from "react";
import { Check, Copy, Share2, Trash2, Users, X } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

export default function FeedShareModal({ feed, onClose }) {
  const [people, setPeople] = useState([]);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPeople = async () => {
    const { data, error } = await supabase.rpc("get_feed_people", { target_feed_id: feed.id });
    if (error) console.error("Could not load Feed contributors:", error);
    else setPeople(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPeople();
    const refreshPeople = () => loadPeople();
    const interval = window.setInterval(refreshPeople, 5000);
    window.addEventListener("focus", refreshPeople);
    document.addEventListener("visibilitychange", refreshPeople);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshPeople);
      document.removeEventListener("visibilitychange", refreshPeople);
    };
  }, [feed.id]);

  const createLink = async () => {
    setCreating(true);
    const { data: token, error } = await supabase.rpc("create_feed_share_link", { target_feed_id: feed.id });
    setCreating(false);
    if (error) { alert(error.message); return; }
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("join", token);
    setShareUrl(url.toString());
  };

  const shareLink = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join my ${feed.name} Feed on Looptie`, text: `Add to my ${feed.name} Feed on Looptie.`, url: shareUrl });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const removePerson = async (person) => {
    if (!window.confirm(`Remove ${person.display_name} from this Feed?`)) return;
    const { error } = await supabase.rpc("remove_feed_member", { target_feed_id: feed.id, target_user_id: person.user_id });
    if (error) { alert(error.message); return; }
    setPeople((prev) => prev.filter((entry) => entry.user_id !== person.user_id));
  };

  return <div style={overlay} onClick={onClose}>
    <div style={card} onClick={(event) => event.stopPropagation()}>
      <div style={header}>
        <div><div style={eyebrow}>COLLABORATIVE FEED</div><h2 style={title}>Share {feed.name}</h2></div>
        <button type="button" style={iconButton} onClick={onClose} aria-label="Close"><X size={20} /></button>
      </div>
      <p style={copy}>Anyone with your link can join this Feed and add things worth revisiting.</p>

      {!shareUrl ? (
        <button type="button" style={primaryButton} onClick={createLink} disabled={creating}>
          <Share2 size={18} />{creating ? "Creating link…" : "Create share link"}
        </button>
      ) : (
        <div style={linkBlock}>
          <div style={linkPreview}>{shareUrl}</div>
          <button type="button" style={primaryButton} onClick={shareLink}>
            {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copied" : (navigator.share ? "Share link" : "Copy link")}
          </button>
        </div>
      )}

      <div style={peopleHeader}><Users size={18} /><span>People with access</span></div>
      <div style={peopleList}>
        {loading && <div style={muted}>Loading…</div>}
        {!loading && people.map((person) => <div key={person.user_id} style={personRow}>
          <div style={avatar}>{person.display_name?.charAt(0)?.toUpperCase() || "L"}</div>
          <div style={personCopy}><strong style={personName}>{person.display_name}</strong><span style={role}>{person.role === "owner" ? "Owner" : "Can add and edit"}</span></div>
          {person.role !== "owner" && <button type="button" style={removeButton} onClick={() => removePerson(person)} aria-label={`Remove ${person.display_name}`}><Trash2 size={17} /></button>}
        </div>)}
      </div>
    </div>
  </div>;
}

const overlay = { position:"fixed", inset:0, zIndex:2000, background:"var(--overlay)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" };
const card = { width:"100%", maxWidth:"430px", maxHeight:"min(680px, 88vh)", overflowY:"auto", background:"var(--surface)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:"28px", padding:"24px", boxSizing:"border-box", boxShadow:"var(--shadow)" };
const header = { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"14px" };
const eyebrow = { color:"var(--brand)", fontSize:"var(--text-xs)", fontWeight:"var(--weight-bold)", letterSpacing:"1.2px", marginBottom:"7px" };
const title = { margin:0, fontSize:"var(--text-xl)", lineHeight:"var(--leading-tight)" };
const iconButton = { width:"38px", height:"38px", flexShrink:0, borderRadius:"999px", border:"1px solid var(--border)", background:"var(--surface-elevated)", color:"var(--text-primary)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };
const copy = { color:"var(--text-secondary)", lineHeight:"var(--leading-normal)", margin:"14px 0 20px" };
const primaryButton = { width:"100%", minHeight:"48px", border:0, borderRadius:"999px", background:"var(--brand)", color:"white", fontWeight:"var(--weight-bold)", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", cursor:"pointer" };
const linkBlock = { display:"grid", gap:"10px" };
const linkPreview = { padding:"12px 14px", borderRadius:"14px", border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text-secondary)", fontSize:"var(--text-xs)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };
const peopleHeader = { display:"flex", alignItems:"center", gap:"8px", fontWeight:"var(--weight-semibold)", margin:"26px 0 10px" };
const peopleList = { display:"grid", gap:"8px" };
const personRow = { display:"flex", alignItems:"center", gap:"11px", padding:"10px", borderRadius:"16px", background:"var(--surface-elevated)" };
const avatar = { width:"38px", height:"38px", borderRadius:"999px", background:"var(--accent-bg)", color:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"var(--weight-bold)" };
const personCopy = { minWidth:0, flex:1, display:"flex", flexDirection:"column", gap:"2px" };
const personName = { overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };
const role = { color:"var(--text-secondary)", fontSize:"var(--text-xs)" };
const removeButton = { width:"36px", height:"36px", border:0, borderRadius:"999px", background:"transparent", color:"var(--danger)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };
const muted = { color:"var(--text-secondary)", fontSize:"var(--text-sm)", padding:"10px" };
