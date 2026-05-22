import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function ProfileSetup({ user, spaces, setSpaces, setProfile }) {
const [displayName, setDisplayName] = useState("");
  const [firstSpace, setFirstSpace] = useState("");

    const saveProfile = async () => {
        if (!displayName.trim()) return;
        if (!firstSpace.trim()) return;
      
        const cleanedSpace = firstSpace.trim();
      
        const { error: spaceError } = await supabase
          .from("spaces")
          .insert([
            {
              name: cleanedSpace,
              user_id: user.id
            },
          ]);
      
        if (spaceError) {
          alert(spaceError.message);
          return;
        }
      
        const { data, error } = await supabase
          .from("profiles")
          .insert([
            {
              user_id: user.id,
              display_name: displayName.trim(),
              default_space: cleanedSpace,
            },
          ])
          .select()
          .single();
      
        if (error) {
          alert(error.message);
          return;
        }
      
        setProfile(data);
        setSpaces([cleanedSpace]);
      };
  return (
    <div style={page}>
      <h1>Set up your Looptie</h1>
      <p style={subtitle}>Let’s make your space feel like yours.</p>

      <input
        style={input}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="What should we call you?"
      />

     <input
       style={input}
       value={firstSpace}
       onChange={(e) => setFirstSpace(e.target.value)}
       placeholder="Create your first space"
     />

      <button style={button} onClick={saveProfile}>
        Continue
      </button>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#050505",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "Inter, sans-serif",
};

const subtitle = {
  color: "#a1a1aa",
  marginBottom: "28px",
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
  marginBottom: "14px",
};

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};