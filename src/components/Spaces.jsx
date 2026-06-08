import { useState } from "react";
import { Plus, Star, MoreVertical } from "lucide-react";
import SpaceDetail from "./SpaceDetail";

export default function Spaces({
  spaces,
  defaultFeed,
  setDefaultFeed,
  selectedSpace,
  setSelectedSpace,
  feedItems,
  setFeedItems,
  setSelectedItem,
  setShowNewSpaceForm,
  setUploadSpace,
  setTab,
  onDeleteSpace,
  renameSpace,
}) {
  const [openMenuSpaceId, setOpenMenuSpaceId] = useState(null);
  const [renamingSpace, setRenamingSpace] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  if (selectedSpace !== null) {
    return (
      <SpaceDetail
        selectedSpace={selectedSpace}
        setSelectedSpace={setSelectedSpace}
        spaces={spaces}
        feedItems={feedItems}
        setFeedItems={setFeedItems}
        setSelectedItem={setSelectedItem}
        setUploadSpace={setUploadSpace}
        setTab={setTab}
      />
    );
  }

  return (
    <div>
      <p style={subtitleStyle}>Your spaces</p>

      <div style={spacesGrid}>
        {spaces.map((space) => (
          <div
            key={space.id}
            onClick={() => setSelectedSpace(space.name)}
            style={{
              ...spaceCard,
              cursor: "pointer",
              border:
                defaultFeed === space.name
                  ? "2px solid #7c3aed"
                  : "1px solid #27272a",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDefaultFeed(space.name);
              }}
              style={starButton}
            >
              <Star
                size={20}
                fill={defaultFeed === space.name ? "#7c3aed" : "transparent"}
                color={defaultFeed === space.name ? "#7c3aed" : "#71717a"}
              />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuSpaceId(
                  openMenuSpaceId === space.id ? null : space.id
                );
              }}
              style={menuButton}
            >
              <MoreVertical size={18} />
            </button>

            {openMenuSpaceId === space.id && (
              <div style={spaceMenu}>
                <button
                  style={spaceMenuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingSpace(space);
                    setRenameDraft(space.name);
                    setOpenMenuSpaceId(null);
                  }}
                >
                  Rename
                </button>

                <button
                  style={{ ...spaceMenuItem, color: "#fca5a5" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuSpaceId(null);
                    onDeleteSpace(space.name);
                  }}
                >
                  Delete
                </button>
              </div>
            )}

            <div style={spaceContent}>
              <h3 style={{ margin: 0 }}>{space.name}</h3>
              <p style={spaceItemsText}>
                {feedItems.filter((item) => item.space === space.name).length}{" "}
                items
              </p>
            </div>
          </div>
        ))}

        <div style={newSpaceCard} onClick={() => setShowNewSpaceForm(true)}>
          <h3 style={{ margin: 0 }}>New Space</h3>
          <div style={newSpacePlus}>
            <Plus size={20} strokeWidth={3} />
          </div>
        </div>
      </div>

      {renamingSpace && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h2 style={modalTitle}>Rename Space</h2>

            <p style={modalSubtitle}>Update the name for this space.</p>

            <input
              style={modalInput}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              autoFocus
            />

            <button
              style={modalPrimaryButton}
              onClick={async () => {
                const success = await renameSpace({
                  spaceId: renamingSpace.id,
                  oldName: renamingSpace.name,
                  newName: renameDraft,
                  feedItems,
                  setFeedItems,
                  setSelectedSpace,
                });

                if (!success) return;

                setRenamingSpace(null);
                setRenameDraft("");
              }}
            >
              Save Name
            </button>

            <button
              style={modalSecondaryButton}
              onClick={() => {
                setRenamingSpace(null);
                setRenameDraft("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const subtitleStyle = {
  color: "#9ca3af",
  marginBottom: "24px",
};

const spacesGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const spaceCard = {
  background: "#18181b",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #27272a",
  minHeight: "140px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  position: "relative",
};

const starButton = {
  position: "absolute",
  top: "14px",
  right: "14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const menuButton = {
  position: "absolute",
  top: "14px",
  left: "14px",
  background: "transparent",
  border: "none",
  color: "#a1a1aa",
  cursor: "pointer",
};

const spaceMenu = {
  position: "absolute",
  top: "42px",
  left: "14px",
  background: "#111116",
  border: "1px solid #27272a",
  borderRadius: "14px",
  padding: "6px",
  zIndex: 20,
};

const spaceMenuItem = {
  display: "block",
  width: "100%",
  padding: "10px 14px",
  border: "none",
  background: "transparent",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
};

const spaceContent = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "18px",
  transform: "translateY(-6px)",
};

const spaceItemsText = {
  color: "#aaa",
  margin: 0,
};

const newSpaceCard = {
  ...spaceCard,
  border: "1px dashed #52525b",
  background: "transparent",
  gap: "18px",
};

const newSpacePlus = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  background: "#18181b",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transform: "translateY(-8px)",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  zIndex: 1000,
};

const modalCard = {
  width: "100%",
  maxWidth: "360px",
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "28px",
  padding: "24px",
};

const modalTitle = {
  color: "white",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "8px",
};

const modalSubtitle = {
  color: "#a1a1aa",
  fontSize: "14px",
  marginBottom: "12px",
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