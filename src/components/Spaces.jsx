import { Plus, Star } from "lucide-react";

export default function Spaces({
  spaces,
  defaultFeed,
  setDefaultFeed,
  selectedSpace,
  setSelectedSpace,
  feedItems,
  setSelectedItem,
  setShowNewSpaceForm,
  setUploadSpace,
  setTab,
  onDeleteSpace,
}) {
  const selectedSpaceItems = feedItems.filter(
    (item) => item.space === selectedSpace
  );

  if (selectedSpace === null) {
    return (
      <div>
        <p style={subtitleStyle}>Your spaces</p>

        <div style={spacesGrid}>
          {spaces.map((space) => (
            <div
              key={space}
              onClick={() => setSelectedSpace(space)}
              style={{
                ...spaceCard,
                cursor: "pointer",
                border:
                  defaultFeed === space
                    ? "2px solid #7c3aed"
                    : "1px solid #27272a",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDefaultFeed(space);
                }}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: defaultFeed === space ? "#7c3aed" : "#71717a",
                }}
              >
                <Star
                  size={20}
                  fill={defaultFeed === space ? "#7c3aed" : "transparent"}
                />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSpace(space);
                }}
                style={deleteSpaceCardButton}
              >
                ×
              </button>

              <div style={spaceContent}>
                <h3 style={{ margin: 0 }}>{space}</h3>
                <p style={spaceItemsText}>
                  {feedItems.filter((item) => item.space === space).length} items
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
      </div>
    );
  }

  return (
    <div style={spaceDetailScreen} className="no-scrollbar">
      <div style={stickySpaceHeader}>
        <button
          onClick={() => setSelectedSpace(null)}
          style={backArrowButton}
        >
          ←
        </button>
        
        <h1>{selectedSpace}</h1>
        
        <p style={subtitleStyle}>
          {selectedSpaceItems.length} items in this space
        </p>
      </div>

      {selectedSpaceItems.length === 0 && (
          <p style={emptyStateText}>
            Build a feed that pulls you back into this world.
          </p>
      )}

      <div style={spaceDetailGrid}>
        {selectedSpaceItems.map((item) => (
          <div
          key={item.id}
          style={spaceDetailCard}
          onClick={() => setSelectedItem(item)}
        >
          <img
            src={item.image}
            loading="lazy"
            alt=""
            style={spaceDetailImage}
          />
        
        {item.favorite && (
        <div style={spaceFavoriteIndicator}>♥</div>
        )}

        {item.creator && (<p style={creatorStyle}>@{item.creator}</p>)}
        </div>
        ))}

        <button
          style={addToSpaceCard}
          onClick={() => {
            setUploadSpace(selectedSpace);
            setTab("add");
          }}
        >
          <>
            <span>Add to {selectedSpace}</span>
            <div style={addItemPlus}>+</div>
          </>
        </button>
      </div>
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
  
  const backArrowButton = {
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    border: "1px solid #27272a",
    background: "#18181b",
    color: "#d4d4d8",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
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

  const creatorStyle = {
    color: "#b3adbf",
    fontSize: "13px",
    margin: "6px 0 0",
  };
  
  const addToSpaceCard = {
    width: "100%",
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    background: "transparent",
    border: "1px dashed #52525b",
    borderRadius: "28px",
    color: "white",
    fontSize: "18px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "24px",
    textAlign: "center",
    breakInside: "avoid",
    marginBottom: "16px",
    boxSizing: "border-box",
  };

  const addItemPlus = {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "#18181b",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "700",
    lineHeight: 1,
    transform: "translateY(-2px)",
  };

  const emptyStateText = {
    color: "white",
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: 1.5,
  };
  
  const deleteSpaceCardButton = {
    position: "absolute",
    top: "12px",
    left: "12px",
    width: "26px",
    height: "26px",
    borderRadius: "999px",
    border: "none",
    background: "rgba(0,0,0,.35)",
    color: "#71717a",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const spaceDetailScreen = {
    height: "100%",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: "120px",
  };

  const stickySpaceHeader = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#050505",
    paddingBottom: "12px",
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