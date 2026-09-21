import { useState } from "react";
import { ArrowLeft, BookmarkPlus, Layers3, Play } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const introScreens = [
  {
    icon: BookmarkPlus,
    title: "Keep what matters.",
    body: "Save videos, photos, links, and ideas before they disappear into another app.",
  },
  {
    icon: Layers3,
    title: "Build Feeds for your life.",
    body: "Organize what you save into personal Feeds like Motivation, Recipes, Writing, or anything else.",
  },
  {
    icon: Play,
    title: "Loop back when you need it.",
    body: "Scroll through what you chose to keep in one calm, private place.",
  },
];

export default function AuthScreen({ setUser }) {
  const [introStep, setIntroStep] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signup");
  const [submitting, setSubmitting] = useState(false);

  const openAuth = (nextMode) => {
    setMode(nextMode);
    setShowAuth(true);
  };

  const handleAuth = async () => {
    setSubmitting(true);
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setSubmitting(false);

    if (error) {
      alert("Auth failed: " + error.message);
      return;
    }
    if (mode === "signup") {
      alert("Check your inbox or spam folder and confirm your email before logging in.");
      setMode("login");
      return;
    }
    if (data.user) setUser(data.user);
  };

  if (!showAuth) {
    const screen = introScreens[introStep];
    const Icon = screen.icon;
    const isLast = introStep === introScreens.length - 1;

    return <div style={page}>
      <div style={introCard}>
        <div style={brand}>looptie</div>
        <div style={visual}><Icon size={48} strokeWidth={1.7} /></div>
        <div style={dots}>{introScreens.map((_, index) => <span key={index} style={{ ...dot, opacity: index === introStep ? 1 : 0.22, width: index === introStep ? "24px" : "8px" }} />)}</div>
        <h1 style={title}>{screen.title}</h1>
        <p style={body}>{screen.body}</p>
        <button style={primaryButton} onClick={() => isLast ? openAuth("signup") : setIntroStep((step) => step + 1)}>
          {isLast ? "Create your Looptie" : "Continue"}
        </button>
        <button style={textButton} onClick={() => openAuth("login")}>Already have an account? Log in</button>
      </div>
    </div>;
  }

  const disabled = !email.trim() || !password.trim() || submitting;
  return <div style={page}>
    <div style={authCard}>
      <button type="button" style={backButton} onClick={() => setShowAuth(false)} aria-label="Back to introduction"><ArrowLeft size={22} /></button>
      <div style={brand}>looptie</div>
      <h1 style={authTitle}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p style={subtitle}>{mode === "login" ? "Your Feeds are waiting for you." : "You’ll set up your first Feed next."}</p>
      <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" />
      <input style={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
      <button style={{ ...primaryButton, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }} disabled={disabled} onClick={handleAuth}>
        {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
      </button>
      {mode === "login" && <button style={forgotButton} onClick={async () => {
        if (!email.trim()) { alert("Enter your email first."); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) { alert(error.message); return; }
        alert("If an account exists for this email, a password reset link has been sent.");
      }}>Forgot password?</button>}
      <button style={textButton} onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "New to Looptie? Create an account" : "Already have an account? Log in"}
      </button>
    </div>
  </div>;
}

const page = { minHeight:"100vh", background:"var(--bg)", color:"var(--text-primary)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", boxSizing:"border-box", fontFamily:"var(--font-body)" };
const introCard = { width:"100%", maxWidth:"430px", minHeight:"600px", display:"flex", flexDirection:"column", justifyContent:"center" };
const authCard = { width:"100%", maxWidth:"430px", position:"relative" };
const brand = { color:"var(--brand)", fontSize:"22px", fontWeight:"var(--weight-bold)", letterSpacing:"-.5px", marginBottom:"36px" };
const visual = { width:"104px", height:"104px", borderRadius:"30px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--brand)", background:"var(--accent-bg)", marginBottom:"34px" };
const dots = { display:"flex", alignItems:"center", gap:"7px", marginBottom:"22px" };
const dot = { height:"8px", borderRadius:"999px", background:"var(--brand)", transition:"width .2s ease, opacity .2s ease" };
const title = { margin:"0 0 16px", fontSize:"38px", lineHeight:"1.08", letterSpacing:"-1px" };
const authTitle = { margin:"0 0 12px", fontSize:"34px", lineHeight:"1.1" };
const body = { color:"var(--text-secondary)", fontSize:"var(--text-lg)", lineHeight:"1.55", marginBottom:"34px" };
const subtitle = { color:"var(--text-secondary)", marginBottom:"28px" };
const input = { width:"100%", boxSizing:"border-box", padding:"16px", borderRadius:"16px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", fontSize:"var(--text-md)", marginBottom:"14px" };
const primaryButton = { width:"100%", padding:"15px 18px", borderRadius:"999px", border:"none", background:"var(--brand)", color:"white", fontSize:"var(--text-md)", fontWeight:"var(--weight-bold)", cursor:"pointer" };
const textButton = { width:"100%", marginTop:"16px", padding:"8px", border:"none", background:"transparent", color:"var(--brand)", cursor:"pointer" };
const forgotButton = { marginTop:"12px", border:"none", background:"transparent", color:"var(--text-secondary)", fontSize:"var(--text-sm)", cursor:"pointer", textAlign:"left", padding:0 };
const backButton = { position:"absolute", top:"-52px", left:0, width:"40px", height:"40px", borderRadius:"999px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };
