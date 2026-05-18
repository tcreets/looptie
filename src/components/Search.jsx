export default function Search({
    searchTerm,
    setSearchTerm,
    searchResults,
    setSelectedItem,
  }) {
    return (
      <div>
        <p style={subtitleStyle}>Search your Cache</p>
  
        <input
          type="text"
          placeholder="Search spaces, quotes, creators..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInput}
        />
  
        {searchTerm === "" ? (
          <div style={{ marginTop: "24px" }}>
            <h3 style={{ marginBottom: "16px" }}>Suggested</h3>
  
            <div style={searchTags}>
              {["books", "gym", "faith", "business", "calm", "discipline"].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    style={tagPill}
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <div style={searchResultsList}>
            {searchResults.map((item) => (
              <div
                key={item.id}
                style={searchResultCard}
                onClick={() => setSelectedItem(item)}
              >
                <img src={item.image} alt="" style={searchResultImage} />
  
                <div>
                  <p style={searchResultSpace}>{item.space}</p>
                  {item.creator && (<p style={creatorStyle}>@{item.creator}</p>)}
                </div>
              </div>
            ))}
  
            {searchResults.length === 0 && (
              <p style={{ color: "#aaa" }}>No results found.</p>
            )}
          </div>
        )}
      </div>
    );
  }
  
  const subtitleStyle = {
    color: "#9ca3af",
    marginBottom: "24px",
  };
  
  const searchInput = {
    width: "100%",
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #27272a",
    background: "#18181b",
    color: "white",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  };
  
  const searchTags = {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  };
  
  const tagPill = {
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "999px",
    padding: "10px 16px",
    color: "white",
    fontSize: "14px",
    cursor: "pointer",
  };
  
  const searchResultsList = {
    display: "grid",
    gap: "16px",
    marginTop: "24px",
    paddingBottom: "90px",
  };
  
  const searchResultCard = {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "20px",
    padding: "12px",
  };
  
  const searchResultImage = {
    width: "72px",
    height: "72px",
    borderRadius: "16px",
    objectFit: "cover",
  };
  
  const searchResultSpace = {
    color: "#7c3aed",
    fontSize: "13px",
    fontWeight: "bold",
    margin: 0,
  };
  
  const searchResultTitle = {
    margin: "4px 0",
  };
  
  const searchResultCreator = {
    color: "#aaa",
    margin: 0,
  };

  const creatorStyle = {
    color: "#b3adbf",
    fontSize: "13px",
    marginTop: "6px",
  };