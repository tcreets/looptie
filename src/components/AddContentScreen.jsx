import React, { useState } from "react";
import { X, ChevronDown, Plus, Check } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import imageCompression from "browser-image-compression";

export default function AddContentScreen({
  user,
  spaces,
  setSpaces,
  defaultFeed,
  uploadSpace,
  setUploadSpace,
  selectedFiles,
  setSelectedFiles,
  feedItems,
  setFeedItems,
  setActiveFeed,
  setTab,
}) {
  const [previewFile, setPreviewFile] = React.useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const handlePreviewWheel = (e) => {
  e.currentTarget.scrollLeft += e.deltaY * 2.2;
};

  return (
    <div>
      <p style={subtitleStyle}>Add to Looptie</p>

      <div style={addGrid}>
        <label style={addCard}>
          <h2
            style={{
              color: "#b3adbf",
              fontWeight: "500",
              fontSize: "18px",
              marginBottom: "20px",
            }}
          >
            Upload from Device
          </h2>

          <div
            style={{
              marginTop: "18px",
              padding: "12px 16px",
              borderRadius: "14px",
              background: "#312b3d",
              color: "#d8d2e6",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            Choose Photos or Videos

            {selectedFiles.length > 0 && (
              <p
                style={{
                  marginTop: "14px",
                  color: "#b3adbf",
                  fontSize: "14px",
                }}
              >
                {selectedFiles.length} item
                {selectedFiles.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <input
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files);

              if (!files.length) return;

              if (files.length > 10) {
                const continueUpload = window.confirm(
                  `You've selected ${files.length} items. Uploading large batches may take longer. Continue?`
                );
              
                if (!continueUpload) return;
              }

              setSelectedFiles(files);
            }}
          />
        </label>

        <div style={{ position: "relative" }}>
          <select
            value={uploadSpace}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setShowCreateSpaceModal(true);
                return;
              }

              setUploadSpace(e.target.value);
            }}
            style={{
              ...modalInput,
              paddingRight: "42px",
              appearance: "none",
              WebkitAppearance: "none",
            }}
          >
            <option value="">Select a Space</option>

            {spaces.map((space) => {
              const spaceName = typeof space === "string" ? space : space.name;

              return (
                <option key={spaceName} value={spaceName}>
                  {spaceName}
                </option>
              );
            })}

            <option value="__new__">Create New Space</option>
          </select>

          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </div>
        </div>

        <button
          style={modalPrimaryButton}
          disabled={!selectedFiles.length || isUploading || !uploadSpace}
          onClick={async () => {
            if (!selectedFiles.length) return;
                    
            const selectedSpaceName =
              typeof uploadSpace === "string" ? uploadSpace : uploadSpace?.name;
                    
            if (!selectedSpaceName) {
              alert("Choose or create a space before saving.");
              return;
            }
          
            setIsUploading(true);
            setUploadProgress(`Saving to Looptie...`);
          
            const safeSpace = selectedSpaceName
              .replace(/\s+/g, "-")
              .replace(/[^a-zA-Z0-9-_]/g, "");
          
            const uploadSingleFile = async (file, index) => {
              const fileExt = file.name.split(".").pop();
            
              const mediaType = file.type.startsWith("video/")
                ? "video"
                : "image";
            
              const fileName = `${crypto.randomUUID()}.${fileExt}`;
              const filePath = `${user.id}/${safeSpace}/${fileName}`;
            
              let fileToUpload = file;
            
              if (file.type.startsWith("image/")) {
                try {
                  fileToUpload = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1600,
                    useWebWorker: true,
                  });
                } catch (err) {
                  console.error("Compression failed:", err);
                }
              }
            
              const { error: uploadError } = await supabase.storage
                .from("looptie-uploads")
                .upload(filePath, fileToUpload, {
                  cacheControl: "3600",
                  upsert: false,
                  contentType: fileToUpload.type,
                });
              
              if (uploadError) {
                throw new Error(
                  `Upload failed for ${file.name}: ${uploadError.message}`
                );
              }
            
              const { data: publicUrlData } = supabase.storage
                .from("looptie-uploads")
                .getPublicUrl(filePath);
            
              return {
                user_id: user.id,
                space: selectedSpaceName,
                media_type: mediaType,
                image_url: publicUrlData.publicUrl,
                storage_path: filePath,
                note: null,
                favorite: false,
              };
            };
          
            try {
              const concurrencyLimit = 3;
              const uploadedItems = [];
            
              for (let i = 0; i < selectedFiles.length; i += concurrencyLimit) {
                const batch = selectedFiles.slice(i, i + concurrencyLimit);
              
                setUploadProgress(
                  `Saving to Looptie... (${Math.min(
                    i + concurrencyLimit,
                    selectedFiles.length
                  )} of ${selectedFiles.length})`
                );
              
                const batchResults = await Promise.all(
                  batch.map((file, batchIndex) =>
                    uploadSingleFile(file, i + batchIndex)
                  )
                );
              
                uploadedItems.push(...batchResults);
              }
            
              const { data, error } = await supabase
                .from("items")
                .insert(uploadedItems)
                .select();
            
              if (error) {
                console.error("Error saving uploads:", error);
                alert("Error saving upload: " + error.message);
                setIsUploading(false);
                setUploadProgress("");
                return;
              }
            
              const formattedItems = data.map((item) => ({
                id: item.id,
                space: item.space,
                image: item.image_url,
                storagePath: item.storage_path,
                note: item.note,
                favorite: item.favorite,
                media_type: item.media_type,
                created_at: item.created_at,
              }));
            
              setFeedItems([...formattedItems, ...feedItems]);
              setSelectedFiles([]);
              setActiveFeed(selectedSpaceName);
            
              setShowSuccess(true);
            
              setTimeout(() => {
                setShowSuccess(false);
                setTab("home");
              }, 1200);
            } catch (err) {
              console.error(err);
              alert(err.message);
            } finally {
              setIsUploading(false);
              setUploadProgress("");
            }
          }}
        >
          {isUploading ? (
            <>
              <span style={spinner}></span>
              {uploadProgress}
            </>
          ) : (
            selectedFiles.length > 0
              ? `Save ${selectedFiles.length} item${
                  selectedFiles.length > 1 ? "s" : ""
                } to Looptie`
              : "Select files first"
          )}
        </button>
        <p style={uploadLimitText}>
          Save what matters. Videos may take a minute. Keep this page open while Looptie saves them.
        </p>

        {selectedFiles.length > 0 && (
          <div
            style={uploadPreviewGrid}
            className="horizontal-pretty-scrollbar"
            onWheel={handlePreviewWheel}
          >
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              const isVideo = file.type.startsWith("video");

              return (
                <div
                  key={index}
                  style={uploadPreviewCard}
                  onClick={() => setPreviewFile(file)}
                >
                  <button
                    type="button"
                    style={removePreviewButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles((prev) =>
                        prev.filter((_, fileIndex) => fileIndex !== index)
                      );
                    }}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>

                  {isVideo ? (
                    <video src={previewUrl} style={uploadPreviewMedia} muted />
                  ) : (
                    <img src={previewUrl} alt="" style={uploadPreviewMedia} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {previewFile && (
          <div style={previewOverlay} onClick={() => setPreviewFile(null)}>
            {previewFile.type.startsWith("video") ? (
              <video
                src={URL.createObjectURL(previewFile)}
                controls
                autoPlay
                style={previewModalMedia}
              />
            ) : (
              <img
                src={URL.createObjectURL(previewFile)}
                alt=""
                style={previewModalMedia}
              />
            )}
          </div>
        )}
      </div>

      {showCreateSpaceModal && (
        <div style={spaceModalOverlay}>
          <div style={spaceModal}>
            <h2 style={spaceModalTitle}>Create a Space</h2>

            <p style={spaceModalText}>What do you want to call this space?</p>

            <input
              style={modalInput}
              placeholder="Space name"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
            />

            <button
              style={{
                ...modalPrimaryButton,
                opacity: isCreatingSpace ? 0.5 : 1,
                cursor: isCreatingSpace ? "not-allowed" : "pointer",
              }}
              disabled={isCreatingSpace}
              onClick={async () => {
                if (isCreatingSpace) return;
              
                const trimmedName = newSpaceName.trim();
              
                if (!trimmedName) return;
              
                const duplicateSpace = spaces.some((space) => {
                  const spaceName = typeof space === "string" ? space : space.name;
                  return spaceName.toLowerCase() === trimmedName.toLowerCase();
                });
              
                if (duplicateSpace) {
                  alert("You already have a space with that name.");
                  return;
                }
              
                setIsCreatingSpace(true);
              
                const { data: newSpace, error } = await supabase
                  .from("spaces")
                  .insert({
                    user_id: user.id,
                    name: trimmedName,
                    is_default: false,
                  })
                  .select()
                  .single();
                
                if (error) {
                  alert(error.message);
                  setIsCreatingSpace(false);
                  return;
                }
              
                setSpaces((prev) => [...prev, newSpace]);
                setUploadSpace(newSpace.name);
              
                setNewSpaceName("");
                setShowCreateSpaceModal(false);
                setIsCreatingSpace(false);
              }}
            >
              {isCreatingSpace ? "Creating..." : "Create Space"}
            </button>

            <button
              style={spaceCancelButton}
              onClick={() => {
                setNewSpaceName("");
                setShowCreateSpaceModal(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showSuccess && (
        <div style={successOverlay}>
          <div style={successCard}>
            <Check size={22} strokeWidth={3} />
            <span>Saved to Looptie</span>
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

const addGrid = {
  display: "grid",
  gap: "16px",
};

const addCard = {
  background: "#24202d",
  borderRadius: "24px",
  padding: "24px",
  border: "1px dashed #4b4261",
  minHeight: "140px",
  cursor: "pointer",
  transition: "0.2s ease",
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
  marginTop: "16px",
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

const uploadPreviewGrid = {
  display: "flex",
  gap: "14px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "4px 2px 12px",
  scrollSnapType: "x proximity",
  WebkitOverflowScrolling: "touch",
  overscrollBehaviorX: "contain",
};

const uploadPreviewCard = {
  width: "112px",
  height: "112px",
  flex: "0 0 auto",
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid #3a3447",
  background: "#16161d",
  position: "relative",
  scrollSnapAlign: "start",
};

const uploadPreviewMedia = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const previewOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.9)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

const previewModalMedia = {
  maxWidth: "100%",
  maxHeight: "90vh",
  borderRadius: "18px",
};

const spaceModalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  padding: "20px",
};

const spaceModal = {
  width: "100%",
  maxWidth: "420px",
  background: "#18131f",
  border: "1px solid #3f3f46",
  borderRadius: "24px",
  padding: "24px",
};

const spaceModalTitle = {
  margin: "0 0 8px",
  color: "white",
};

const spaceModalText = {
  color: "#a1a1aa",
  marginBottom: "16px",
};

const spaceCancelButton = {
  width: "100%",
  marginTop: "12px",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #3f3f46",
  background: "transparent",
  color: "#d4d4d8",
  fontWeight: "bold",
  cursor: "pointer",
};

const successOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3000,
};

const successCard = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "20px",
  padding: "24px 32px",
  color: "white",
  fontSize: "18px",
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const spinner = {
  width: "14px",
  height: "14px",
  border: "2px solid rgba(255,255,255,.3)",
  borderTop: "2px solid white",
  borderRadius: "50%",
  display: "inline-block",
  marginRight: "8px",
  animation: "spin 1s linear infinite",
};

const uploadLimitText = {
  color: "#71717a",
  fontSize: "13px",
  textAlign: "center",
  marginTop: "8px",
};

const removePreviewButton = {
  position: "absolute",

  top: "0px",
  right: "0px",

  width: "24px",
  height: "24px",
  borderRadius: "999px",
  border: "2px solid #24202d",

  background: "#18181b",
  color: "white",
  cursor: "pointer",
  zIndex: 2,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  padding: 0,
};