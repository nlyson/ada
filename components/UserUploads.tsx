import React, { useState } from "react";
import { CommentThread } from "@/components/CommentThread";

type UploadItem = {
  key: string;
  url: string;
};

type Props = {
    uploadItems: UploadItem[];
    unreadPhotoIds: string[];
    onUpload?: (file: File) => void;   // ✅ make optional
    onDelete?: (key: string) => void;  // ✅ make optional
  };

const MAX_UPLOADS = 10;

const UserUploads: React.FC<Props> = ({
  uploadItems,
  unreadPhotoIds,
  onUpload,
  onDelete,
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = async () => {
    if (!image) return;
    setUploading(true);
    if (onUpload) {
        await onUpload(image);
    }    
    setImage(null);
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <h2>🎨 Upload Your Creations</h2>
      <p>
        You’ve uploaded {uploadItems.length} of {MAX_UPLOADS}
      </p>
{onUpload && (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.length) setImage(e.target.files[0]);
        }}
        style={{ marginTop: 8, marginBottom: 8 }}
      />

      <button
        disabled={!image || uploading}
        onClick={handleUploadClick}
        style={{
          padding: "8px 16px",
          backgroundColor: "#b76e79",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      </>
    )}
      {uploadItems.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>🖼️ Uploaded Creations</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {uploadItems.map(({ key, url }) => {
              const hasUnread = unreadPhotoIds.includes(key);
              return (
                <div key={key} style={{ position: "relative", width: 150 }}>
                  <img
                    src={url}
                    alt="User creation"
                    style={{
                      width: "100%",
                      height: "auto",
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

                  <CommentThread photoId={key} currentUser={key.split("/")[1]} />
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