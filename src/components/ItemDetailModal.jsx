import React from "react";
import { ArrowLeft, Heart } from "lucide-react";

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
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          style={{
            ...favoriteButton,
            color: itemFavoriteDraft ? "#ef4444" : "white",
          }}
        >
          <Heart
            size={28}
            fill={itemFavoriteDraft ? "#ef4444" : "transparent"}
            color={itemFavoriteDraft ? "#ef4444" : "white"}
          />
        </button>

        {selectedItem.media_type === "video" ? (
          <video
            src={selectedItem.image}
            controls
            autoPlay
            playsInline
            muted={false}
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

            <button
              style={{ ...modalPrimaryButton, marginTop: "24px" }}
              onClick={onSave}
            >
              Save Memo
            </button>

        <div style={tagSection}>
          {(selectedItem.tags || []).map((tag) => (
            <span key={tag} style={tagPill}>
              #{tag}
            </span>
          ))}
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
  top: "18px",
  left: "14px",
  width: "32px",
  height: "32px",
  border: "none",
  background: "transparent",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 10,
  padding: 0,
};

const itemModalMedia = {
  width: "100%",
  height: "100vh",
  objectFit: "cover",
  display: "block",
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
  minHeight: "190px",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #3a3447",
  background: "#1d1b27",
  color: "white",
  fontSize: "15px",
  lineHeight: 1.5,
  paddingBottom: "24px",
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
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 5,
    padding: 0,
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
    marginTop: "24px",
  };