import React from "react";
import { supabase } from "../utils/supabaseClient";

export default function CreateSpaceModal({
  newSpaceName,
  setNewSpaceName,
  setSpaces,
  spaces,
  setSelectedSpace,
  setShowNewSpaceForm,
  setTab,
}) {
  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <h2>Create New Space</h2>

        <input
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          placeholder="Books, Writing, Recipes..."
          style={modalInput}
        />

        <button
          style={modalPrimaryButton}
          onClick={async () => {
            const cleanedName = newSpaceName.trim();
          
            if (cleanedName === "") return;
          
            const { data, error } = await supabase
              .from("spaces")
              .insert([{ name: cleanedName }])
              .select();
          
            if (error) {
              console.error("Error creating space:", error);
              return;
            }
          
            setSpaces([...spaces, cleanedName]);
            setSelectedSpace(cleanedName);
            setNewSpaceName("");
            setShowNewSpaceForm(false);
            setTab("spaces");
          }}
        >
          Create Space
        </button>

        <button
          style={modalSecondaryButton}
          onClick={() => {
            setNewSpaceName("");
            setShowNewSpaceForm(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  zIndex: 100,
};

const modalCard = {
  width: "100%",
  maxWidth: "360px",
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "28px",
  padding: "24px",
};

const modalInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #3f3f46",
  background: "#050505",
  color: "white",
  fontSize: "16px",
  marginTop: "16px",
  marginBottom: "16px",
};

const modalPrimaryButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const modalSecondaryButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  background: "transparent",
  color: "#aaa",
  marginTop: "10px",
  cursor: "pointer",
};