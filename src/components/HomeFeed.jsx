export default function HomeFeed({
    spaces,
    activeFeed,
    setActiveFeed,
    feedRef,
    filteredFeedItems,
    setSelectedItem,
  }) {
    const handlePillWheel = (e) => {
      e.currentTarget.scrollLeft += e.deltaY;
    };
  
    return (
      <div style={homeStyle}>
        <p style={subtitleStyle}>Choose the state you want to enter.</p>
  
        <div
          style={feedSelectorStyle}
          className="horizontal-pretty-scrollbar"
          onWheel={handlePillWheel}
        >
          {spaces.map((feed) => (
            <button
              key={feed}
              onClick={() => {
                feedRef.current?.scrollTo({
                  top: 0,
                  behavior: "auto",
                });
  
                setActiveFeed(feed);
              }}
              style={{
                ...feedButtonStyle,
                background: activeFeed === feed ? "#7c3aed" : "#18181b",
                color: activeFeed === feed ? "black" : "white",
              }}
            >
              {feed}
            </button>
          ))}
        </div>

        <div ref={feedRef} style={feedList} className="pretty-scroll">

          {filteredFeedItems.length === 0 && (
            <div style={emptyState}>
              <h3>No items here yet</h3>
              <p>Add something to this space to start building your feed.</p>
            </div>
          )}

          {filteredFeedItems.map((item) => (
            <div
              key={item.id}
              style={feedCard}
              onClick={() => setSelectedItem(item)}
            >
              {item.media_type === "video" ? (
                <video
                src={item.image}
                style={imageStyle}
                autoPlay
                muted
                loop
                playsInline
              />
              ) : (
                <img
                  src={item.image}
                  loading="lazy"
                  alt=""
                  style={imageStyle}
                />
              )}

              <div style={overlayStyle} />

              {item.favorite && (
                <div style={favoriteIndicator}>
                  ♥
                </div>
              )}

              <div style={cardContent}>
              {item.creator && (<p style={creatorStyle}>@{item.creator}</p>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const subtitleStyle = {
    color: "#9ca3af",
    marginBottom: "24px",
  };

  const feedSelectorStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
    overflowX: "scroll",
    overflowY: "hidden",
    width: "100%",
    maxWidth: "100%",
    paddingBottom: "8px",
    whiteSpace: "nowrap",
    WebkitOverflowScrolling: "touch",
  };
  
  const feedButtonStyle = {
    border: "1px solid #333",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "bold",
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  };
  
  const feedList = {
    display: "grid",
    gap: "18px",
    paddingBottom: "16px",
    height: "calc(100vh - 210px)",
    overflowY: "auto",
    scrollSnapType: "y mandatory",
  };
  
  const feedCard = {
    position: "relative",
    height: "calc(100vh - 210px)",
    borderRadius: "28px",
    overflow: "hidden",
    border: "1px solid #222",
    scrollSnapAlign: "start",
  };
  
  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
  };
  
  const overlayStyle = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.1))",
  };
  
  const cardContent = {
    position: "absolute",
    bottom: "24px",
    left: "24px",
    right: "24px",
  };

  const creatorStyle = {
    color: "#d4d4d8",
  };

  const favoriteIndicator = {
    position: "absolute",
    top: "18px",
    left: "18px",
    color: "#ef4444",
    fontSize: "30px",
    zIndex: 3,
    textShadow: "0 2px 10px rgba(0,0,0,.6)",
    opacity: 0.9,
  };

  const emptyState = {
    marginTop: "80px",
    textAlign: "center",
    color: "#a1a1aa",
  };

  const homeStyle = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  };

  