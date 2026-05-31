import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function CreateSpaceModal({
  user,
  newSpaceName,
  setNewSpaceName,
  setSpaces,
  spaces,
  setSelectedSpace,
  setShowNewSpaceForm,
  setTab,
}) {

  const [isCreating, setIsCreating] = useState(false);

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <h2 style={modalTitle}>Create New Space</h2>

        <p style={modalSubtitle}>
         Create a space for the things you want to revisit.
       </p>
        <input
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          placeholder="Books, Writing, Recipes..."
          style={modalInput}
        />

        <button
          style={{
            ...modalPrimaryButton,
            opacity: isCreating ? 0.5 : 1,
            cursor: isCreating ? "not-allowed" : "pointer",
          }}
          disabled={isCreating}
          onClick={async () => {
            if (isCreating) return;
            if (!user) return;
          
            const cleanedName = newSpaceName.trim();
            if (cleanedName === "") return;
          
            const duplicateSpace = spaces.some((space) => {
              const spaceName = typeof space === "string" ? space : space.name;
              return spaceName.toLowerCase() === cleanedName.toLowerCase();
            });
          
            if (duplicateSpace) {
              alert("You already have a space with that name.");
              return;
            }
          
            setIsCreating(true);
          
            const { data, error } = await supabase
              .from("spaces")
              .insert([
                {
                  name: cleanedName,
                  user_id: user.id,
                  is_default: false,
                },
              ])
              .select()
              .single();
            
            if (error) {
              console.error("Error creating space:", error);
              alert(error.message);
              setIsCreating(false);
              return;
            }
          
            setSpaces((prev) => [...prev, data]);
            setSelectedSpace(data.name);
            setNewSpaceName("");
            setShowNewSpaceForm(false);
            setTab("spaces");
            setIsCreating(false);
          }}
        >
          {isCreating ? "Creating..." : "Create Space"}
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

const modalTitle = {
  color: "white",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "16px",
};

const modalSubtitle = {
  color: "#a1a1aa",
  fontSize: "14px",
  marginBottom: "12px",
};