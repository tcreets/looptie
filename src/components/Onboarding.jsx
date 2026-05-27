import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Onboarding({ user, setProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const screens = [
    {
      title: "Welcome to Looptie",
      body: "A personal feed for the things you want to keep close.",
      subtext: "Like playlists for your mind.",
      button: "Start",
    },
  
    {
      title: "Your feed evolves with you.",
      body: "Save thoughts, videos, reminders, inspiration, and moments worth revisiting.",
      subtext:
        "Looptie helps you collect what matters and come back to it later.",
      button: "Continue",
    },
  
    {
      title: "Spaces keep your feeds organized.",
      body: "Create separate feeds for different parts of your life.",
  
      list: [
        "Motivation",
        "Writing",
        "Wellness",
        "Ideas",
        "Memories",
        "Books",
      ],
  
      subtext:
        "You can create spaces for anything you want to revisit.",
      button: "Continue",
    },
  
    {
      title: "People use Looptie to...",
      list: [
        "Build motivation feeds",
        "Save creative inspiration",
        "Organize thoughts",
        "Revisit grounding reminders",
      ],
      subtext: "There’s no right way to use Looptie.",
      button: "I get it",
    },
  ];

  const saveName = async () => {
    if (!user) return;

    setSaving(true);

    const cleanName = displayName.trim();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: cleanName,
        has_completed_onboarding: true,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setProfile(data);
    onComplete();
  };

  const isNameStep = step === 4;

  return (
    <div style={page}>
      <div style={card}>
        <div style={dots}>
          {[0, 1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              style={{
                ...dotStyle,
                opacity: dot === step ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        {!isNameStep ? (
          <>
            <h1 style={title}>{screens[step].title}</h1>

            {screens[step].body && <p style={body}>{screens[step].body}</p>}

            {screens[step].list && (
              <div style={list}>
                {screens[step].list.map((item) => (
                  <div key={item} style={listItem}>
                    <span style={bullet}>✦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={subtext}>{screens[step].subtext}</p>

            <button style={button} onClick={() => setStep(step + 1)}>
              {screens[step].button}
            </button>
          </>
        ) : (
          <>
            <h1 style={title}>What should Looptie call you?</h1>

            <p style={body}>This is just your display name inside your space.</p>

            <input
              style={input}
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <button style={button} onClick={saveName} disabled={saving}>
              {saving ? "Saving..." : "Enter Looptie"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#15161d",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  background: "#1d1f29",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const dots = {
  display: "flex",
  gap: "8px",
  marginBottom: "36px",
};

const dotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "white",
};

const title = {
  fontSize: "34px",
  lineHeight: "1.05",
  marginBottom: "18px",
  color: "white",
  fontWeight: "700",
};

const body = {
  fontSize: "17px",
  lineHeight: "1.5",
  color: "rgba(255,255,255,0.82)",
  marginBottom: "18px",
};

const subtext = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "rgba(255,255,255,0.58)",
  marginBottom: "32px",
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  marginBottom: "24px",
};

const listItem = {
  display: "flex",
  gap: "10px",
  fontSize: "16px",
  color: "rgba(255,255,255,0.86)",
};

const bullet = {
  color: "#c7a7ff",
};

const input = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "16px",
  outline: "none",
  marginBottom: "24px",
  boxSizing: "border-box",
};

const button = {
  width: "100%",
  padding: "15px 18px",
  borderRadius: "999px",
  border: "none",
  background: "white",
  color: "#111",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};