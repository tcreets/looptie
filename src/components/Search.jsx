import { trackEvent } from "../utils/trackEvent";

export default function Search({ searchTerm, setSearchTerm, searchResults, setSelectedItem, spaces }) {
  return (
    <div style={searchPage} className="pretty-scroll">
      <input type="text" placeholder="Search spaces, notes, tags..." value={searchTerm} onChange={(e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim().length >= 2) trackEvent("search_used", { query_length: value.trim().length, result_count: searchResults.length, source: "search_input" });
      }} style={searchInput} />

      {searchTerm === "" ? <div style={{ marginTop: "22px" }}>
        <h3 style={spacesHeading}>Spaces</h3>
        <div style={searchTags}>{spaces.map((space) => <button key={space.id} onClick={() => { trackEvent("search_used", { query_length: space.name.length, source: "suggested_space" }); setSearchTerm(space.name); }} style={tagPill}>{space.name}</button>)}</div>
      </div> : <div style={searchResultsList}>
        {searchTerm && searchResults.length === 0 && <div style={emptyState}><h3>No results found</h3><p>Try another word, tag, or space.</p></div>}
        {searchResults.map((item) => <div key={item.id} style={searchResultCard} onClick={() => { trackEvent("item_opened", { item_id: item.id, space: item.space, media_type: item.media_type, source: "search" }); setSelectedItem(item); }}>
          {item.media_type === "video" ? <video src={item.image} style={searchResultImage} muted playsInline /> : <img src={item.image} alt="" style={searchResultImage} />}
          <div><p style={searchResultSpace}>{item.space}</p>{item.note && <p style={searchResultNote}>{item.note}</p>}</div>
        </div>)}
      </div>}
    </div>
  );
}

const searchInput = { width: "100%", padding: "18px", borderRadius: "18px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize:"var(--text-md)", outline: "none", boxSizing: "border-box" };
const searchTags = { display: "flex", flexWrap: "wrap", gap: "12px" };
const tagPill = { background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "999px", padding: "10px 16px", color: "var(--text-primary)", fontSize:"var(--text-sm)", cursor: "pointer" };
const searchResultsList = { display: "grid", gap: "16px", marginTop: "24px", paddingBottom: "90px" };
const searchResultCard = { display: "flex", gap: "14px", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "12px", cursor: "pointer" };
const searchResultImage = { width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover" };
const searchResultSpace = { color: "var(--brand)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-bold)", margin: 0 };
const searchResultNote = { color: "var(--text-primary)", fontSize:"var(--text-sm)", margin: "6px 0 0" };
const emptyState = { marginTop: "80px", textAlign: "center", color: "var(--text-secondary)" };
const spacesHeading = { margin:"0 0 14px", color:"var(--text-primary)", fontSize:"var(--text-md)", fontWeight:"var(--weight-semibold)" };
const searchPage = { height:"100%", overflowY:"auto", padding:"14px 14px 120px", boxSizing:"border-box", WebkitOverflowScrolling:"touch", color:"var(--text-primary)" };