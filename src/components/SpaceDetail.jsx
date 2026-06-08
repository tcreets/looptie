import { useState } from "react";
import { Check, ArrowLeft,  CheckSquare, X, } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

export default function SpaceDetail({
  selectedSpace,
  setSelectedSpace,
  spaces,
  feedItems,
  setFeedItems,
  setSelectedItem,
  setUploadSpace,
  setTab,
}) {
  const [isSelectingItems, setIsSelectingItems] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const selectedSpaceItems = feedItems.filter(
    (item) => item.space === selectedSpace
  );

  const moveSelectedItems = async (newSpaceName) => {
    if (!selectedItemIds.length) return;

    const { error } = await supabase
      .from("items")
      .update({ space: newSpaceName })
      .in("id", selectedItemIds);

    if (error) {
      alert(error.message);
      return;
    }

    setFeedItems((prev) =>
      prev.map((item) =>
        selectedItemIds.includes(item.id)
          ? { ...item, space: newSpaceName }
          : item
      )
    );

    setSelectedItemIds([]);
    setIsSelectingItems(false);
    setShowMoveMenu(false);
  };

  const deleteSelectedItems = async () => {
    if (!selectedItemIds.length) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedItemIds.length} item${
        selectedItemIds.length > 1 ? "s" : ""
      } from ${selectedSpace}?`
    );

    if (!confirmDelete) return;

    const itemsToDelete = feedItems.filter((item) =>
      selectedItemIds.includes(item.id)
    );

    const storagePaths = itemsToDelete
      .map((item) => item.storagePath || item.storage_path)
      .filter(Boolean);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("looptie-uploads")
        .remove(storagePaths);

      if (storageError) {
        alert(storageError.message);
        return;
      }
    }

    const { error } = await supabase
      .from("items")
      .delete()
      .in("id", selectedItemIds);

    if (error) {
      alert(error.message);
      return;
    }

    setFeedItems((prev) =>
      prev.filter((item) => !selectedItemIds.includes(item.id))
    );

    setSelectedItemIds([]);
    setIsSelectingItems(false);
    setShowMoveMenu(false);
  };

  return (
    <div style={spaceDetailScreen} className="no-scrollbar">
      <button onClick={() => setSelectedSpace(null)} style={backArrowButton}>
        <ArrowLeft size={20} strokeWidth={2.5} />
      </button>
      
      <button
        style={selectItemsButton}
        onClick={() => {
          setIsSelectingItems((prev) => !prev);
          setSelectedItemIds([]);
          setShowMoveMenu(false);
        }}
      >
        {isSelectingItems ? (
          <X size={20} strokeWidth={2.5} />
        ) : (
          <CheckSquare size={20} strokeWidth={2.5} />
        )}
      </button>

      {selectedSpaceItems.length === 0 && (
        <p style={emptyStateText}>
          Build a feed that pulls you back into this world.
        </p>
      )}

      <div style={spaceDetailGrid}>
        {selectedSpaceItems.map((item) => (
          <div
            key={item.id}
            style={{
              ...spaceDetailCard,
              border: selectedItemIds.includes(item.id)
                ? "3px solid #7c3aed"
                : "1px solid #27272a",
            }}
            onClick={() => {
              if (isSelectingItems) {
                setSelectedItemIds((prev) =>
                  prev.includes(item.id)
                    ? prev.filter((id) => id !== item.id)
                    : [...prev, item.id]
                );
              } else {
                setSelectedItem(item);
              }
            }}
          >
            {item.media_type === "video" ? (
              <video
                src={item.image}
                style={spaceDetailImage}
                muted
                playsInline
              />
            ) : (
              <img
                src={item.image}
                loading="lazy"
                alt=""
                style={spaceDetailImage}
              />
            )}

            {isSelectingItems && selectedItemIds.includes(item.id) && (
              <div style={selectedCheck}>
                <Check size={18} strokeWidth={3} />
              </div>
            )}

            {item.favorite && <div style={spaceFavoriteIndicator}>♥</div>}
          </div>
        ))}

        {!isSelectingItems && (
          <button
            style={addToSpaceCard}
            onClick={() => {
              setUploadSpace(selectedSpace);
              setTab("add");
            }}
          >
            <span>Add to {selectedSpace}</span>
            <div style={addItemPlus}>+</div>
          </button>
        )}
      </div>

      {isSelectingItems && selectedItemIds.length > 0 && (
        <div style={bulkActionBar}>
          <div style={bulkActionButtons}>
            <button
              style={bulkMoveButton}
              onClick={() => setShowMoveMenu((prev) => !prev)}
            >
              Move {selectedItemIds.length}
            </button>

            <button style={bulkDeleteButton} onClick={deleteSelectedItems}>
              Delete
            </button>
          </div>

          {showMoveMenu && (
            <div style={moveMenu}>
              {spaces
                .filter((space) => space.name !== selectedSpace)
                .map((space) => (
                  <button
                    key={space.id}
                    style={moveMenuItem}
                    onClick={() => moveSelectedItems(space.name)}
                  >
                    {space.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const backArrowButton = {
  position: "fixed",
  top: "14px",
  left: "14px",
  zIndex: 80,
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  border: "1px solid #27272a",
  background: "rgba(24,24,27,.9)",
  color: "#d4d4d8",
  cursor: "pointer",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(10px)",
};

const spaceDetailGrid = {
  columnCount: 2,
  columnGap: "16px",
  paddingBottom: "160px",
};

const spaceDetailCard = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "22px",
  overflow: "hidden",
  cursor: "pointer",
  breakInside: "avoid",
  marginBottom: "16px",
  position: "relative",
};

const spaceDetailImage = {
  width: "100%",
  height: "auto",
  display: "block",
};

const addToSpaceCard = {
  width: "100%",
  minHeight: "180px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "14px",
  background: "transparent",
  border: "1px dashed #3f3f46",
  borderRadius: "24px",
  color: "white",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  padding: "20px",
  textAlign: "center",
  breakInside: "avoid",
  marginBottom: "16px",
  boxSizing: "border-box",
};

const addItemPlus = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  background: "#18181b",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "26px",
  fontWeight: "700",
  lineHeight: 1,
};

const emptyStateText = {
  color: "white",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: 1.5,
};

const spaceDetailScreen = {
  height: "100%",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  paddingBottom: "120px",
};

const spaceFavoriteIndicator = {
  position: "absolute",
  top: "10px",
  left: "10px",
  color: "#ef4444",
  fontSize: "24px",
  zIndex: 20,
  textShadow: "0 2px 10px rgba(0,0,0,.7)",
  pointerEvents: "none",
};

const selectItemsButton = {
  position: "fixed",
  top: "14px",
  right: "14px",
  zIndex: 80,
  border: "1px solid #27272a",
  background: "rgba(24,24,27,.9)",
  color: "white",
  padding: "10px 16px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: "600",
  backdropFilter: "blur(10px)",
};

const selectedCheck = {
  position: "absolute",
  top: "10px",
  right: "10px",
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  background: "#7c3aed",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 30,
};

const bulkActionBar = {
  position: "fixed",
  left: "50%",
  bottom: "88px",
  transform: "translateX(-50%)",
  width: "calc(100% - 32px)",
  maxWidth: "430px",
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "24px",
  padding: "12px",
  zIndex: 100,
};

const bulkActionButtons = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const bulkMoveButton = {
  width: "100%",
  border: "none",
  background: "#7c3aed",
  color: "white",
  padding: "14px",
  borderRadius: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const bulkDeleteButton = {
  width: "100%",
  border: "none",
  background: "#ef4444",
  color: "white",
  padding: "14px",
  borderRadius: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const moveMenu = {
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  maxHeight: "220px",
  overflowY: "auto",
};

const moveMenuItem = {
  border: "1px solid #27272a",
  background: "#050505",
  color: "white",
  padding: "12px",
  borderRadius: "14px",
  cursor: "pointer",
};