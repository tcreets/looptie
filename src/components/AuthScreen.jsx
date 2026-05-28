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
            options: {
              emailRedirectTo: window.location.origin,
            },
          });
  
    console.log("AUTH DATA:", data);
    console.log("AUTH ERROR:", error);
  
    if (error) {
      alert(error.message);
      return;
    }

    if (mode === "signup") {
        alert(
          "The email you signed up with should receive a confirmation email. Check your inbox or spam folder and confirm your account before logging in."
        );
      
        setMode("login");
        return;
      }

      if (data.user) {
        setUser(data.user);
        alert("Logged in!");
      };
  };

  return (
    <div style={authPage}>
      <h1>Welcome to Looptie</h1>
      <p style={subtitle}>
        Your private space for inspiration, memories, routines, and the things you actually want to revisit.
      </p>
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

      <button
        style={{
          ...primaryButton,
          opacity: !email.trim() || !password.trim() ? 0.45 : 1,
          cursor: !email.trim() || !password.trim() ? "not-allowed" : "pointer",
        }}
        disabled={!email.trim() || !password.trim()}
        onClick={handleAuth}
      >
        {mode === "login" ? "Log In" : "Create Account"}
      </button>

      {mode === "login" && (
        <button
          style={forgotButton}
          onClick={async () => {
            if (!email.trim()) {
              alert("Enter your email first.");
              return;
            }
          
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin,
            });
          
            if (error) {
              if (error.message.toLowerCase().includes("email not confirmed")) {
                alert(
                  "Your account hasn't been confirmed yet. Check the inbox or spam folder for the email you signed up with."
                );
                return;
              }
            
              alert(error.message);
              return;
            }
          
            alert(
              "If an account exists for this email, a password reset link has been sent."
            );
          }}
        >
          Forgot Password?
        </button>
      )}

      <button
        style={switchButton}
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login"
          ? "Need an account? Create one"
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

const forgotButton = {
  marginTop: "12px",
  marginBottom: "4px",
  border: "none",
  background: "transparent",
  color: "#a1a1aa",
  fontSize: "14px",
  cursor: "pointer",
  textAlign: "left",
  padding: 0,
};