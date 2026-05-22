import React from "react";
import { supabase } from "../utils/supabaseClient";

export default function AddContentScreen({
  user,
  spaces,
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
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (!files.length) return;
              setSelectedFiles(files);
            }}
          />
        </label>

        {selectedFiles.length > 0 && (
          <div style={uploadPreviewGrid}>
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              const isVideo = file.type.startsWith("video");

              return (
                <div key={index} style={uploadPreviewCard}>
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

        <div style={{ position: "relative" }}>
          <select
            value={uploadSpace}
            onChange={(e) => setUploadSpace(e.target.value)}
            style={{
              ...modalInput,
              paddingRight: "42px",
              appearance: "none",
              WebkitAppearance: "none",
            }}
          >
            {spaces.map((space) => (
              <option key={space} value={space}>
                {space}
              </option>
            ))}
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
          onClick={async () => {
            if (!selectedFiles.length) return;
          
            const uploadedItems = [];
          
            for (const file of selectedFiles) {
              const fileExt = file.name.split(".").pop();
              const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
              const filePath = `${uploadSpace}/${fileName}`;
          
              const { error: uploadError } = await supabase.storage
                .from("looptie-uploads")
                .upload(filePath, file);
          
                if (uploadError) {
                    console.error("Upload error details:", uploadError.message, uploadError);
                    alert(`Upload failed: ${uploadError.message}`);
                    return;
                  }
          
              const { data: publicUrlData } = supabase.storage
                .from("looptie-uploads")
                .getPublicUrl(filePath);
          
                uploadedItems.push({
                    user_id: user.id,
                    space: uploadSpace,
                    image_url: publicUrlData.publicUrl,
                    creator: null,
                    note: null,
                    favorite: false,
                  });
            }
          
            const { data, error } = await supabase
              .from("items")
              .insert(uploadedItems)
              .select();
          
            if (error) {
              console.error("Error saving uploads:", error);
              return;
            }
          
            const formattedItems = data.map((item) => ({
              id: item.id,
              space: item.space,
              creator: item.creator,
              image: item.image_url,
              note: item.note,
              favorite: item.favorite,
            }));
          
            setFeedItems([...formattedItems, ...feedItems]);
            setSelectedFiles([]);
            setUploadSpace(defaultFeed);
            setActiveFeed(uploadSpace);
            setTab("home");
          }}
        >
          Save to Cache
        </button>
      </div>
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
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
};

const uploadPreviewCard = {
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #3a3447",
  background: "#16161d",
  aspectRatio: "1 / 1",
};

const uploadPreviewMedia = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};