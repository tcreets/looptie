import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function AuthScreen({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  const handleAuth = async () => {
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
          });
  
    console.log("AUTH DATA:", data);
    console.log("AUTH ERROR:", error);
  
    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
        setUser(data.user);
      }
  
    alert(mode === "login" ? "Logged in!" : "Signed up!");
  };

  return (
    <div style={authPage}>
      <h1>Welcome to Looptie</h1>
      <p style={subtitle}>Save what pulls you back into the right state.</p>

      <input
        style={input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        style={input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
      />

      <button style={primaryButton} onClick={handleAuth}>
        {mode === "login" ? "Log In" : "Sign Up"}
      </button>

      <button
        style={switchButton}
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login"
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
}

const authPage = {
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

const primaryButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const switchButton = {
  marginTop: "16px",
  border: "none",
  background: "transparent",
  color: "#a78bfa",
  cursor: "pointer",
};