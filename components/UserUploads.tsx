import React, { useState } from "react";
import { CommentThread } from "@/components/CommentThread";

type UploadItem = {
  key: string;
  url: string;
};

type Props = {
    username: string;
    viewerUsername: string;
    isOwner: boolean;
    uploadItems: UploadItem[];
    unreadPhotoIds: string[];
    onUpload?: (file: File) => void;   // ✅ make optional
    onDelete?: (key: string) => void;  // ✅ make optional
    accountTier?: string;
  };

const uploadLimit = 10;

const UserUploads: React.FC<Props> = ({
  isOwner,
  username,
  viewerUsername,
  uploadItems,
  unreadPhotoIds,
  onUpload,
  onDelete,
  accountTier
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadLimit = accountTier === "premium" ? 100 : 5;
  const maxSizeMB = accountTier === "premium" ? 50 : 2;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleUploadClick = async () => {
    if (!image) return;
    if (image.size > maxSizeBytes) {
      alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
      return;
    }
    setUploading(true);
    if (onUpload) {
        await onUpload(image);
    }    
    setImage(null);
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 4 }}>
        📷 {isOwner ? "My Photo Gallery" : `${username}'s Gallery`}
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: 16 }}>
        {isOwner
          ? `You’ve uploaded ${uploadItems.length} of ${uploadLimit} photos.`
          : `A glimpse into ${username}'s visual world.`}
      </p>
      {onUpload && (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.length) setImage(e.target.files[0]);
            }}
            disabled={uploadItems.length >= uploadLimit}
            style={{ marginTop: 8, marginBottom: 8 }}
          />
          <p style={{ fontSize: "0.85rem", color: "#888", marginTop: 4 }}>
            Max file size: {maxSizeMB} MB ({accountTier === "premium" ? "Premium user" : "Free user"})
          </p>

          <button
            disabled={!image || uploading || uploadItems.length >= uploadLimit}
            onClick={handleUploadClick}
            style={{
              padding: "8px 16px",
              backgroundColor: "#b76e79",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: uploading ? "not-allowed" : "pointer",
              marginBottom: 8,
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {accountTier !== "premium" && uploadItems.length >= uploadLimit && (
            <div
              style={{
                backgroundColor: "#fffbe6",
                border: "1px solid #ffe58f",
                borderRadius: 8,
                padding: "12px 16px",
                marginTop: 8,
                maxWidth: 400,
              }}
            >
              <p style={{ margin: 0, fontSize: 14 }}>
                You&apos;ve reached your upload limit. 🚫
                <br />
                <strong>Upgrade to Premium</strong> for up to{" "}
                <span style={{ color: "#228b22" }}>100 photo uploads</span> in your gallery!
              </p>
            </div>
          )}
        </>
      )}
      {uploadItems.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {uploadItems.map(({ key, url }) => {
              const hasUnread = unreadPhotoIds.includes(key);
              return (
                <div
                  key={key}
                  style={{
                    position: "relative",
                    width: 160,
                    background: "#fff",
                    padding: 8,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >                  
                <img
                  src={url}
                  alt="User creation"
                  style={{
                    maxWidth: "100%",
                    height: "auto",        // ✅ preserves aspect ratio
                    borderRadius: 8,
                    display: "block",
                  }}
                />

                  {hasUnread && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        background: "gold",
                        color: "black",
                        padding: "2px 6px",
                        borderRadius: 6,
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                      }}
                    >
                      🔔 New!
                    </span>
                  )}

                  <CommentThread photoId={key} currentUser={viewerUsername} />
            {onDelete && (
                  <button
                    onClick={() => {
                            if (onDelete) onDelete(key);
                    }}                    
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "red",
                      color: "white",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    🗑️
                  </button>
            )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default UserUploads;