import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function SettingsScreen({
  profile,
  spaces,
  defaultFeed,
  setDefaultFeed,
  setActiveFeed,
  setProfile,
  setTab,
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [selectedDefault, setSelectedDefault] = useState(defaultFeed || "");

  const saveSettings = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        default_space: selectedDefault,
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setProfile(data);
    setDefaultFeed(data.default_space);
    setActiveFeed(data.default_space);
    alert("Settings saved.");
  };

  return (
    <div style={page}>
      <button style={backButton} onClick={() => setTab("profile")}>
        ←
      </button>

      <h1 style={title}>Settings</h1>

      <label style={label}>Display name</label>
      <input
        style={input}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <label style={label}>Default space</label>
      <select
        style={input}
        value={selectedDefault}
        onChange={(e) => setSelectedDefault(e.target.value)}
      >
        {spaces.map((space) => (
          <option key={space} value={space}>
            {space}
          </option>
        ))}
      </select>

      <button style={saveButton} onClick={saveSettings}>
        Save Settings
      </button>

      <button
        style={logoutButton}
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }}
      >
        Log Out
      </button>
    </div>
  );
}

const page = {
  height: "100%",
  overflowY: "auto",
  background: "#050505",
  color: "white",
  padding: "20px",
};

const backButton = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  border: "1px solid #27272a",
  background: "#18181b",
  color: "#d4d4d8",
  cursor: "pointer",
  fontSize: "20px",
  marginBottom: "18px",
};

const title = {
  margin: "0 0 20px",
};

const logoutButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #7f1d1d",
  background: "#1f0f12",
  color: "#fca5a5",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "28px",
};

const input = {
    width: "100%",
    boxSizing: "border-box",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #3f3f46",
    background: "#18181b",
    color: "white",
    fontSize: "16px",
    marginBottom: "16px",
  };
  
  const saveButton = {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    border: "none",
    background: "#7c3aed",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  };

  const label = {
    display: "block",
    marginBottom: "8px",
    color: "#a1a1aa",
    fontSize: "14px",
  };