import React, { useState } from "react";
import { X, ChevronDown, Check, Images, Camera, Link2, ArrowLeft } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import imageCompression from "browser-image-compression";
import { trackEvent } from "../utils/trackEvent";

export default function AddContentScreen({ user, spaces, setSpaces, uploadSpace, setUploadSpace, selectedFiles, setSelectedFiles, feedItems, setFeedItems, setActiveFeed, setTab }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [addMode, setAddMode] = useState("menu");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);
  const libraryInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  const handlePreviewWheel = (e) => { e.currentTarget.scrollLeft += e.deltaY * 2.2; };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    const selectedSpaceName = typeof uploadSpace === "string" ? uploadSpace : uploadSpace?.name;
    if (!selectedSpaceName) { alert("Choose or create a space before saving."); return; }
    const uploadStart = Date.now();
    setIsUploading(true); setUploadProgress("Saving to Looptie...");
    const safeSpace = selectedSpaceName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");

    const uploadSingleFile = async (file) => {
      const fileExt = file.name.split(".").pop();
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${safeSpace}/${fileName}`;
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        try { fileToUpload = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true }); }
        catch (err) { console.error("Compression failed:", err); }
      }
      const { error: uploadError } = await supabase.storage.from("looptie-uploads").upload(filePath, fileToUpload, { cacheControl: "3600", upsert: false, contentType: fileToUpload.type });
      if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
      const { data: publicUrlData } = supabase.storage.from("looptie-uploads").getPublicUrl(filePath);
      return { user_id: user.id, space: selectedSpaceName, media_type: mediaType, image_url: publicUrlData.publicUrl, storage_path: filePath, note: null, favorite: false };
    };

    try {
      const concurrencyLimit = 3; const uploadedItems = [];
      for (let i = 0; i < selectedFiles.length; i += concurrencyLimit) {
        const batch = selectedFiles.slice(i, i + concurrencyLimit);
        setUploadProgress(`Saving to Looptie... (${Math.min(i + concurrencyLimit, selectedFiles.length)} of ${selectedFiles.length})`);
        uploadedItems.push(...await Promise.all(batch.map((file) => uploadSingleFile(file))));
      }
      const { data, error } = await supabase.from("items").insert(uploadedItems).select();
      if (error) { alert("Error saving upload: " + error.message); return; }
      await trackEvent("content_uploaded", { count: data.length, space: selectedSpaceName, media_types: data.map((item) => item.media_type), duration_ms: Date.now() - uploadStart });
      const formattedItems = data.map((item) => ({ id: item.id, space: item.space, image: item.image_url, storagePath: item.storage_path, note: item.note, favorite: item.favorite, media_type: item.media_type, created_at: item.created_at }));
      setFeedItems([...formattedItems, ...feedItems]); setSelectedFiles([]); setActiveFeed(selectedSpaceName); setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setTab("home"); }, 1200);
    } catch (err) { console.error(err); alert(err.message); }
    finally { setIsUploading(false); setUploadProgress(""); }
  };

  const createSpace = async () => {
    if (isCreatingSpace) return;
    const trimmedName = newSpaceName.trim(); if (!trimmedName) return;
    const duplicateSpace = spaces.some((space) => (typeof space === "string" ? space : space.name).toLowerCase() === trimmedName.toLowerCase());
    if (duplicateSpace) { alert("You already have a space with that name."); return; }
    setIsCreatingSpace(true);
    const { data: newSpace, error } = await supabase.from("spaces").insert({ user_id: user.id, name: trimmedName, is_default: false }).select().single();
    if (error) { alert(error.message); setIsCreatingSpace(false); return; }
    setSpaces((prev) => [...prev, newSpace]); setUploadSpace(newSpace.name);
    await trackEvent("space_created", { space: newSpace.name, source: "upload_screen" });
    setNewSpaceName(""); setShowCreateSpaceModal(false); setIsCreatingSpace(false);
  };

  const handleFilesSelected = (files) => {
    if (!files.length) return;
    if (files.length > 10 && !window.confirm(`You've selected ${files.length} items. Uploading large batches may take longer. Continue?`)) return;
    setSelectedFiles(files);
    setAddMode("upload");
  };

  if (addMode === "menu") {
    return <div style={addMenuPage}>
      <div style={addMenuHeader}>
        <h1 style={addMenuTitle}>Add to Looptie</h1>
        <p style={addMenuSubtitle}>Save the things you want to loop back to.</p>
      </div>

      <input ref={libraryInputRef} type="file" accept="image/*,video/*" multiple style={{ display:"none" }} onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))} />
      <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" style={{ display:"none" }} onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))} />

      <button type="button" style={primaryAddCard} onClick={() => libraryInputRef.current?.click()}>
        <Images size={32} strokeWidth={1.8} style={addMenuIcon} />
        <span style={addCardCopy}><strong style={addCardTitle}>Photos & videos</strong><span style={addCardSubtitle}>Choose from your library</span></span>
      </button>

      <div style={secondaryAddGrid}>
        <button type="button" style={secondaryAddCard} onClick={() => cameraInputRef.current?.click()}>
          <Camera size={30} strokeWidth={1.8} style={addMenuIcon} />
          <span style={addCardCopy}><strong style={addCardTitle}>Camera</strong><span style={addCardSubtitle}>Take a photo or video</span></span>
        </button>
        <button type="button" style={secondaryAddCard} onClick={() => setAddMode("link")}>
          <Link2 size={30} strokeWidth={1.8} style={addMenuIcon} />
          <span style={addCardCopy}><strong style={addCardTitle}>Paste a link</strong><span style={addCardSubtitle}>Save from anywhere</span></span>
        </button>
      </div>
    </div>;
  }

  const normalizeUrl = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return new URL(withProtocol);
    } catch {
      return null;
    }
  };

  const getLinkPreview = (value) => {
    const parsed = normalizeUrl(value);
    if (!parsed) return null;
    const host = parsed.hostname.replace(/^www\./, "");
    const isYouTube = host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
    let youtubeId = "";
    if (isYouTube) {
      youtubeId = host === "youtu.be" ? parsed.pathname.slice(1).split("/")[0] : parsed.searchParams.get("v") || (parsed.pathname.startsWith("/shorts/") ? parsed.pathname.split("/")[2] : "");
    }
    return {
      url: parsed.href,
      host,
      source: isYouTube ? "YouTube" : host,
      youtubeId,
      thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : ""
    };
  };

  const saveLink = async () => {
    const preview = getLinkPreview(linkUrl);
    const selectedSpaceName = typeof uploadSpace === "string" ? uploadSpace : uploadSpace?.name;
    if (!preview) { setLinkError("Enter a valid link."); return; }
    if (!selectedSpaceName) { setLinkError("Choose a Feed before saving."); return; }
    setLinkError("");
    setIsSavingLink(true);
    const payload = {
      user_id: user.id,
      space: selectedSpaceName,
      media_type: "link",
      image_url: preview.thumbnail || null,
      note: null,
      favorite: false,
      source_url: preview.url,
      source_platform: preview.source,
      source_title: preview.source === "YouTube" ? "YouTube video" : preview.host,
      source_creator: null
    };
    const { data, error } = await supabase.from("items").insert(payload).select().single();
    if (error) {
      console.error("Error saving link:", error);
      console.error("Supabase link save details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      setLinkError(error.message || "Couldn't save this link.");
      setIsSavingLink(false);
      return;
    }
    const formatted = { id:data.id, space:data.space, image:data.image_url, storage_path:data.storage_path, note:data.note, favorite:data.favorite, tags:data.tags || [], media_type:data.media_type, created_at:data.created_at, source_url:data.source_url, source_platform:data.source_platform, source_title:data.source_title, source_creator:data.source_creator };
    setFeedItems((prev) => [formatted, ...prev]);
    setActiveFeed(selectedSpaceName);
    setIsSavingLink(false);
    setLinkUrl("");
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setTab("home"); }, 1200);
  };

  if (addMode === "link") {
    const linkPreview = getLinkPreview(linkUrl);
    return <div style={linkPage}>
      <button type="button" style={backButton} onClick={() => { setLinkError(""); setAddMode("menu"); }}><ArrowLeft size={20} /> Back</button>
      <div style={linkHeader}><h1 style={addMenuTitle}>Paste a link</h1><p style={addMenuSubtitle}>Add a link from YouTube, TikTok, Instagram, articles, and more.</p></div>
      <div style={linkInputWrap}><Link2 size={19} style={addMenuIcon} /><input autoFocus value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setLinkError(""); }} placeholder="Paste your link here…" style={linkInput} />{linkUrl && <button type="button" onClick={() => setLinkUrl("")} style={clearLinkButton}><X size={17} /></button>}</div>
      {linkPreview && <div style={linkPreviewCard}>
        {linkPreview.thumbnail ? <img src={linkPreview.thumbnail} alt="" style={linkPreviewImage} /> : <div style={linkPreviewFallback}><Link2 size={30} /></div>}
        <div style={linkPreviewCopy}><strong>{linkPreview.source === "YouTube" ? "YouTube video" : linkPreview.host}</strong><span style={addCardSubtitle}>{linkPreview.source}</span></div>
      </div>}
      {linkPreview && <div style={linkSaveBlock}>
        <label style={linkFieldLabel}>Save to Feed</label>
        <div style={{position:"relative"}}><select value={uploadSpace} onChange={(e) => setUploadSpace(e.target.value)} style={{...modalInput,marginTop:"8px",paddingRight:"42px",appearance:"none"}}><option value="">Select a Feed</option>{spaces.map((space) => { const name = typeof space === "string" ? space : space.name; return <option key={name} value={name}>{name}</option>; })}</select><div style={selectChevron}><ChevronDown size={16} /></div></div>
        {linkError && <p style={linkErrorStyle}>{linkError}</p>}
        <button type="button" style={{...modalPrimaryButton,opacity:!uploadSpace || isSavingLink ? .5 : 1}} disabled={!uploadSpace || isSavingLink} onClick={saveLink}>{isSavingLink ? "Saving…" : "Save to Looptie"}</button>
      </div>}
      {!linkPreview && linkError && <p style={linkErrorStyle}>{linkError}</p>}
    </div>;
  }

  return <div style={{ color: "var(--text-primary)" }}>
    <button type="button" style={backButton} onClick={() => { setSelectedFiles([]); setAddMode("menu"); }}><ArrowLeft size={20} /> Back</button>
    <p style={subtitleStyle}>Choose a Space and save your media.</p>
    <div style={addGrid}>
      <label style={addCard}>
        <h2 style={uploadTitle}>Upload from Device</h2>
        <div style={chooseMediaButton}>Choose Photos or Videos{selectedFiles.length > 0 && <p style={selectedCount}>{selectedFiles.length} item{selectedFiles.length > 1 ? "s" : ""} selected</p>}</div>
        <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={(e) => {
          const files = Array.from(e.target.files); if (!files.length) return;
          if (files.length > 10 && !window.confirm(`You've selected ${files.length} items. Uploading large batches may take longer. Continue?`)) return;
          setSelectedFiles(files);
        }} />
      </label>

      <div style={{ position: "relative" }}>
        <select value={uploadSpace} onChange={(e) => { if (e.target.value === "__new__") { setShowCreateSpaceModal(true); return; } setUploadSpace(e.target.value); }} style={{ ...modalInput, paddingRight: "42px", appearance: "none", WebkitAppearance: "none" }}>
          <option value="">Select a Space</option>{spaces.map((space) => { const spaceName = typeof space === "string" ? space : space.name; return <option key={spaceName} value={spaceName}>{spaceName}</option>; })}<option value="__new__">Create New Space</option>
        </select>
        <div style={selectChevron}><ChevronDown size={16} strokeWidth={2.5} /></div>
      </div>

      <button style={{ ...modalPrimaryButton, opacity: !selectedFiles.length || isUploading || !uploadSpace ? 0.5 : 1 }} disabled={!selectedFiles.length || isUploading || !uploadSpace} onClick={handleUpload}>{isUploading ? <><span style={spinner} />{uploadProgress}</> : selectedFiles.length > 0 ? `Save ${selectedFiles.length} item${selectedFiles.length > 1 ? "s" : ""} to Looptie` : "Select files first"}</button>
      <p style={uploadLimitText}>Save what matters. Videos may take a minute. Keep this page open while Looptie saves them.</p>

      {selectedFiles.length > 0 && <div style={uploadPreviewGrid} className="horizontal-pretty-scrollbar" onWheel={handlePreviewWheel}>{selectedFiles.map((file, index) => {
        const previewUrl = URL.createObjectURL(file); const isVideo = file.type.startsWith("video");
        return <div key={index} style={uploadPreviewCard} onClick={() => setPreviewFile(file)}><button type="button" style={removePreviewButton} onClick={(e) => { e.stopPropagation(); setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index)); }}><X size={14} strokeWidth={3} /></button>{isVideo ? <video src={previewUrl} style={uploadPreviewMedia} muted /> : <img src={previewUrl} alt="" style={uploadPreviewMedia} />}</div>;
      })}</div>}

      {previewFile && <div style={previewOverlay} onClick={() => setPreviewFile(null)}>{previewFile.type.startsWith("video") ? <video src={URL.createObjectURL(previewFile)} controls autoPlay style={previewModalMedia} /> : <img src={URL.createObjectURL(previewFile)} alt="" style={previewModalMedia} />}</div>}
    </div>

    {showCreateSpaceModal && <div style={spaceModalOverlay}><div style={spaceModal}><h2 style={spaceModalTitle}>Create a Space</h2><p style={spaceModalText}>What do you want to call this space?</p><input style={modalInput} placeholder="Space name" value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} /><button style={{ ...modalPrimaryButton, opacity: isCreatingSpace ? 0.5 : 1 }} disabled={isCreatingSpace} onClick={createSpace}>{isCreatingSpace ? "Creating..." : "Create Space"}</button><button style={spaceCancelButton} onClick={() => { setNewSpaceName(""); setShowCreateSpaceModal(false); }}>Cancel</button></div></div>}
    {showSuccess && <div style={successOverlay}><div style={successCard}><Check size={22} strokeWidth={3} /><span>Saved to Looptie</span></div></div>}
  </div>;
}


const addMenuPage = { color:"var(--text-primary)", height:"100%", overflowY:"auto", padding:"32px 20px 110px", boxSizing:"border-box" };
const addMenuHeader = { textAlign:"center", margin:"8px auto 30px" };
const addMenuTitle = { margin:"0 0 8px", fontSize:"var(--text-xl)", fontWeight:"var(--weight-bold)" };
const addMenuSubtitle = { margin:0, color:"var(--text-secondary)", fontSize:"var(--text-md)" };
const primaryAddCard = { width:"100%", minHeight:"190px", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", gap:"18px", padding:"28px", borderRadius:"26px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", cursor:"pointer", boxShadow:"0 8px 24px rgba(0,0,0,.04)" };
const secondaryAddGrid = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginTop:"14px" };
const secondaryAddCard = { minHeight:"190px", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", gap:"18px", padding:"24px", borderRadius:"24px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text-primary)", cursor:"pointer", boxShadow:"0 8px 24px rgba(0,0,0,.04)" };
const addMenuIcon = { color:"var(--brand)", flexShrink:0 };
const addCardCopy = { display:"flex", flexDirection:"column", alignItems:"center", gap:"7px", width:"100%" };
const addCardTitle = { fontSize:"var(--text-lg)", lineHeight:"var(--leading-tight)" };
const addCardSubtitle = { color:"var(--text-secondary)", fontSize:"var(--text-sm)", lineHeight:"var(--leading-normal)" };
const backButton = { display:"inline-flex", alignItems:"center", gap:"7px", border:"none", background:"transparent", color:"var(--text-primary)", fontSize:"var(--text-sm)", fontWeight:"var(--weight-medium)", padding:"10px 0", cursor:"pointer" };
const linkPage = { color:"var(--text-primary)", height:"100%", overflowY:"auto", padding:"24px 20px 110px", boxSizing:"border-box" };
const linkHeader = { textAlign:"center", maxWidth:"520px", margin:"12px auto 28px" };
const linkInputWrap = { maxWidth:"620px", margin:"0 auto", display:"flex", alignItems:"center", gap:"10px", padding:"0 14px", border:"1px solid var(--border)", borderRadius:"16px", background:"var(--surface)" };
const linkInput = { flex:1, minWidth:0, padding:"15px 0", border:"none", outline:"none", background:"transparent", color:"var(--text-primary)", fontSize:"var(--text-md)", fontFamily:"inherit" };
const clearLinkButton = { width:"30px", height:"30px", display:"flex", alignItems:"center", justifyContent:"center", border:"none", background:"transparent", color:"var(--text-secondary)", cursor:"pointer" };
const linkPreviewCard = { maxWidth:"620px", margin:"18px auto 0", overflow:"hidden", border:"1px solid var(--border)", borderRadius:"20px", background:"var(--surface)" };
const linkPreviewImage = { width:"100%", aspectRatio:"16 / 9", objectFit:"cover", display:"block", background:"var(--surface-elevated)" };
const linkPreviewFallback = { aspectRatio:"16 / 7", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--brand)", background:"var(--surface-elevated)" };
const linkPreviewCopy = { display:"flex", flexDirection:"column", gap:"5px", padding:"16px" };
const linkSaveBlock = { maxWidth:"620px", margin:"22px auto 0" };
const linkFieldLabel = { fontSize:"var(--text-sm)", fontWeight:"var(--weight-semibold)" };
const linkErrorStyle = { color:"var(--danger)", fontSize:"var(--text-sm)", margin:"8px 0 12px" };

const subtitleStyle = { color: "var(--text-secondary)", marginBottom: "24px" };
const addGrid = { display: "grid", gap: "16px" };
const addCard = { background: "var(--surface)", borderRadius: "24px", padding: "24px", border: "1px dashed var(--border)", minHeight: "140px", cursor: "pointer", transition: "0.2s ease" };
const uploadTitle = { color: "var(--text-primary)", fontWeight:"var(--weight-medium)", fontSize:"var(--text-lg)", marginBottom: "20px" };
const chooseMediaButton = { marginTop: "18px", padding: "12px 16px", borderRadius: "14px", background: "var(--surface-elevated)", color: "var(--text-primary)", textAlign: "center", fontWeight:"var(--weight-semibold)" };
const selectedCount = { marginTop: "14px", color: "var(--text-secondary)", fontSize:"var(--text-sm)" };
const modalInput = { width: "100%", boxSizing: "border-box", padding: "16px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize:"var(--text-md)", marginTop: "16px", marginBottom: "16px" };
const modalPrimaryButton = { width: "100%", padding: "14px", borderRadius: "16px", border: "none", background: "var(--brand)", color: "white", fontWeight:"var(--weight-bold)", cursor: "pointer" };
const selectChevron = { position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-secondary)", fontSize:"var(--text-sm)" };
const uploadPreviewGrid = { display: "flex", gap: "14px", overflowX: "auto", overflowY: "hidden", padding: "4px 2px 12px", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" };
const uploadPreviewCard = { width: "112px", height: "112px", flex: "0 0 auto", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-elevated)", position: "relative", scrollSnapAlign: "start" };
const uploadPreviewMedia = { width: "100%", height: "100%", objectFit: "cover" };
const previewOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" };
const previewModalMedia = { maxWidth: "100%", maxHeight: "90vh", borderRadius: "18px" };
const spaceModalOverlay = { position: "fixed", inset: 0, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" };
const spaceModal = { width: "100%", maxWidth: "420px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "24px", padding: "24px", boxShadow: "var(--shadow)" };
const spaceModalTitle = { margin: "0 0 8px", color: "var(--text-primary)" };
const spaceModalText = { color: "var(--text-secondary)", marginBottom: "16px" };
const spaceCancelButton = { width: "100%", marginTop: "12px", padding: "14px", borderRadius: "16px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontWeight:"var(--weight-bold)", cursor: "pointer" };
const successOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 };
const successCard = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px 32px", color: "var(--text-primary)", fontSize:"var(--text-lg)", fontWeight:"var(--weight-semibold)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "var(--shadow)" };
const spinner = { width: "14px", height: "14px", border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block", marginRight: "8px", animation: "spin 1s linear infinite" };
const uploadLimitText = { color: "var(--text-muted)", fontSize:"var(--text-sm)", textAlign: "center", marginTop: "8px" };
const removePreviewButton = { position: "absolute", top: 0, right: 0, width: "24px", height: "24px", borderRadius: "999px", border: "2px solid var(--surface)", background: "rgba(0,0,0,.7)", color: "white", cursor: "pointer", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };