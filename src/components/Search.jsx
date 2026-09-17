import { Heart, Play } from "lucide-react";
import { trackEvent } from "../utils/trackEvent";

export default function Search({ searchTerm, setSearchTerm, searchResults, setSelectedItem }) {
  return (
    <div style={searchPage} className="pretty-scroll">
      <input type="text" placeholder="Search spaces, notes, tags..." value={searchTerm} onChange={(e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim().length >= 2) trackEvent("search_used", { query_length: value.trim().length, result_count: searchResults.length, source: "search_input" });
      }} style={searchInput} />

      {searchTerm === "" ? <div style={searchPrompt}>Find anything you've saved across Looptie.</div> : <>
        <div style={resultsCount}>{searchResults.length} {searchResults.length === 1 ? "result" : "results"}</div>
        {searchResults.length === 0 ? <div style={emptyState}><h3>No results found</h3><p>Try another word, tag, or space.</p></div> : <div style={searchResultsGrid}>
          {searchResults.map((item) => <button key={item.id} style={searchResultTile} onClick={() => { trackEvent("item_opened", { item_id: item.id, space: item.space, media_type: item.media_type, source: "search" }); setSelectedItem(item); }}>
            {item.media_type === "video" ? <video src={item.image} style={searchResultMedia} muted playsInline /> : <img src={item.image} alt="" loading="lazy" style={searchResultMedia} />}
            {item.media_type === "video" && <div style={videoIndicator}><Play size={15} fill="currentColor" /></div>}
            {item.favorite && <div style={favoriteIndicator}><Heart size={17} fill="var(--favorite)" color="var(--favorite)" /></div>}
          </button>)}
        </div>}
      </>}
    </div>
  );
}

const searchInput = { width: "100%", padding: "18px", borderRadius: "18px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize:"var(--text-md)", outline: "none", boxSizing: "border-box" };
const resultsCount = { margin:"16px 2px 10px", color:"var(--text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-medium)" };
const searchResultsGrid = { display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"3px", paddingBottom:"90px" };
const searchResultTile = { position:"relative", width:"100%", aspectRatio:"1 / 1.25", padding:0, border:"none", borderRadius:"10px", overflow:"hidden", background:"var(--surface-elevated)", cursor:"pointer" };
const searchResultMedia = { width:"100%", height:"100%", objectFit:"cover", display:"block" };
const favoriteIndicator = { position:"absolute", top:"7px", right:"7px", zIndex:2, filter:"drop-shadow(0 1px 3px rgba(0,0,0,.45))", pointerEvents:"none" };
const videoIndicator = { position:"absolute", top:"7px", left:"7px", zIndex:2, color:"white", filter:"drop-shadow(0 1px 3px rgba(0,0,0,.65))", pointerEvents:"none", display:"flex" };
const emptyState = { marginTop: "80px", textAlign: "center", color: "var(--text-secondary)" };
const searchPrompt = { marginTop:"24px", color:"var(--text-secondary)", fontSize:"var(--text-sm)" };
const searchPage = { height:"100%", overflowY:"auto", padding:"14px 14px 120px", boxSizing:"border-box", WebkitOverflowScrolling:"touch", color:"var(--text-primary)" };