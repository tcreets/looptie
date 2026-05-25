import React from "react";

export default function ItemDetailModal({
    selectedItem,
    itemNoteDraft,
    setItemNoteDraft,
    onClose,
    onSave,
    onToggleFavorite,
    itemFavoriteDraft,
    setItemFavoriteDraft,
    onDelete,
  }) {

  if (!selectedItem) return null;

  return (
    <div style={itemModalOverlay}>
      <div style={itemModalCard} className="pretty-scroll">
        <button onClick={onClose} style={itemModalClose}>
          ×
        </button>
        <button
          type="button"
          onClick={() => setItemFavoriteDraft((prev) => !prev)}
          style={{
            ...favoriteButton,
            color: itemFavoriteDraft ? "#ef4444" : "white",
          }}
        >
          {itemFavoriteDraft ? "♥" : "♡"}
        </button>

        {selectedItem.media_type === "video" ? (
          <video
          src={selectedItem.image}
          controls
          autoPlay
          muted
          playsInline
          style={itemModalMedia}
        />
        ) : (
          <img src={selectedItem.image} alt="" style={itemModalMedia} />
        )}

        <div style={itemModalContent}>
          <p style={itemModalSpace}>{selectedItem.space}</p>

          <textarea
            data-gramm="false"
            placeholder="Add a memo, note, or comment..."
            value={itemNoteDraft}
            onChange={(e) => setItemNoteDraft(e.target.value)}
            style={itemModalNote}
          />

        <div style={tagSection}>
          {(selectedItem.tags || []).map((tag) => (
            <span key={tag} style={tagPill}>
              #{tag}
            </span>
          ))}
        </div>

        <button
          style={{ ...modalPrimaryButton, marginTop: "12px" }}
          onClick={onSave}
        >
          Save Memo
        </button>

        <div style={itemMetadataBox}>
            <p style={itemMetadataLabel}>Metadata</p>
            <p style={itemMetadataText}>
              Source, creator, platform, and caption will live here later.
            </p>
        </div>

        <button
          style={deleteButton}
          onClick={onDelete}
        >
          Delete Item
        </button>

        </div>
      </div>
    </div>
  );
}

const itemModalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.85)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
};

const itemModalCard = {
  width: "100%",
  maxWidth: "430px",
  maxHeight: "90vh",
  overflowY: "scroll",
  background: "#121217",
  border: "1px solid #2d2b38",
  borderRadius: "28px",
  position: "relative",
};

const itemModalClose = {
  position: "absolute",
  top: "14px",
  left: "14px",
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "none",
  background: "rgba(0,0,0,.55)",
  color: "white",
  fontSize: "24px",
  cursor: "pointer",
  zIndex: 2,
};

const itemModalMedia = {
  width: "100%",
  maxHeight: "420px",
  objectFit: "cover",
  borderTopLeftRadius: "28px",
  borderTopRightRadius: "28px",
};

const itemModalContent = {
  padding: "20px",
};

const itemModalSpace = {
  color: "#a78bfa",
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const itemModalNote = {
  width: "100%",
  minHeight: "110px",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #3a3447",
  background: "#1d1b27",
  color: "white",
  fontSize: "15px",
  resize: "none",
  outline: "none",
  fontFamily: "inherit",
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

const itemMetadataBox = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "16px",
  background: "#18151f",
  border: "1px solid #2d2b38",
};

const itemMetadataLabel = {
  margin: 0,
  color: "#b3adbf",
  fontSize: "13px",
  fontWeight: "700",
};

const itemMetadataText = {
  margin: "6px 0 0",
  color: "#8f879e",
  fontSize: "13px",
  lineHeight: 1.4,
};

const tagSection = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  };
  
  const tagPill = {
    background: "#241f30",
    border: "1px solid #3a3447",
    color: "#c4b5fd",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
  };

  const favoriteButton = {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    border: "none",
    background: "transparent",
    fontSize: "30px",
    lineHeight: 1,
    cursor: "pointer",
    zIndex: 5,
  };

  const deleteButton = {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #7f1d1d",
    background: "#1f0f12",
    color: "#fca5a5",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "32px",
  };