import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";

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
  const [uploadProgress, setUploadProgress] = useState("");
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div>
      <p style={subtitleStyle}>Add to Cache</p>

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
                alert("Please upload up to 10 items at a time.");
                return;
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

            <option value="__new__">+ Create New Space</option>
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
            ▼
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

            const uploadedItems = [];

            for (let i = 0; i < selectedFiles.length; i++) {
              const file = selectedFiles[i];

              console.log("FILE CHECK:", {
                name: file.name,
                type: file.type,
                sizeMB: (file.size / 1024 / 1024).toFixed(2),
              });

              const fileSizeMB = file.size / 1024 / 1024;

              if (fileSizeMB > 250) {
                alert(
                  `${file.name} is ${fileSizeMB.toFixed(
                    1
                  )} MB. Please upload files under 250 MB.`
                );
                setIsUploading(false);
                return;
              }

              setUploadProgress(
                `Uploading ${i + 1} of ${selectedFiles.length}...`
              );

              const fileExt = file.name.split(".").pop();

              const mediaType = file.type.startsWith("video/")
                ? "video"
                : "image";

              const cleanOriginalName = file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-_]/g, "");

              const fileName = `${Date.now()}-${cleanOriginalName}.${fileExt}`;

              const safeSpace = selectedSpaceName
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-_]/g, "");

              const filePath = `${user.id}/${safeSpace}/${fileName}`;
              
              console.log(
                "Uploading:",
                file.name,
                "Size:",
                (file.size / 1024 / 1024).toFixed(2),
                "MB"
              );

              const { error: uploadError } = await supabase.storage
                .from("looptie-uploads")
                .upload(filePath, file);

              if (uploadError) {
                console.error("UPLOAD ERROR FULL:", uploadError);
                alert(
                  `Upload failed for ${file.name}\n\nSize: ${(file.size / 1024 / 1024).toFixed(
                    2
                  )} MB\n\nError: ${uploadError.message}`
                );
                setIsUploading(false);
                setUploadProgress("");
                return;
              }

              const { data: publicUrlData } = supabase.storage
                .from("looptie-uploads")
                .getPublicUrl(filePath);

              uploadedItems.push({
                user_id: user.id,
                space: selectedSpaceName,
                media_type: mediaType,
                image_url: publicUrlData.publicUrl,
                storage_path: filePath,
                note: null,
                favorite: false,
              });
            }

            const { data, error } = await supabase
              .from("items")
              .insert(uploadedItems)
              .select();
              console.log("Inserted items:", data);

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

            setIsUploading(false);
            setUploadProgress("");
            setFeedItems([...formattedItems, ...feedItems]);
            setSelectedFiles([]);
            setActiveFeed(uploadSpace);

            setShowSuccess(true);

            setTimeout(() => {
              setShowSuccess(false);
              setTab("home");
            }, 1200);
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
          Up to 10 items per upload
        </p>

        {selectedFiles.length > 0 && (
          <div style={uploadPreviewGrid}>
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              const isVideo = file.type.startsWith("video");

              return (
                <div
                  key={index}
                  style={uploadPreviewCard}
                  onClick={() => setPreviewFile(file)}
                >
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
              style={modalPrimaryButton}
              onClick={async () => {
                const trimmedName = newSpaceName.trim();
                            
                if (!trimmedName) return;
                            
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
                  return;
                }
              
                setSpaces((prev) => [...prev, newSpace]);
                setUploadSpace(newSpace.name);
              
                setNewSpaceName("");
                setShowCreateSpaceModal(false);
              }}
            >
              Create Space
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
            ✓ Saved to Looptie
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
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "8px",
};

const uploadPreviewCard = {
  width: "72px",
  height: "72px",
  flex: "0 0 auto",
  borderRadius: "14px",
  overflow: "hidden",
  border: "1px solid #3a3447",
  background: "#16161d",
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