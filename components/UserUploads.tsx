import React, { useState } from "react";
import { CommentThread } from "@/components/CommentThread";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import PhotoModal from "@/components/PhotoModal";

const TRACK_PHOTO_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/track_photo_view"

// Random comment to trigger build

const trackPhotoView = async (photoId: string) => {
  try {
    await invokeLambdaIam({
      url: TRACK_PHOTO_URL,
      method: "POST",
      body: { photoId },
    });
  } catch (err) {
    console.error("Failed to track photo view", err);
  }
};

type UploadItem = {
  key: string;
  url: string;
  caption?: string;
  views?: number;
};

type Props = {
  username: string;
  viewerUsername: string;
  isOwner: boolean;
  uploadItems: UploadItem[];
  unreadPhotoIds: string[];
  onUpload?: (file: File, caption: string) => void;
  onDelete?: (key: string) => void;
  accountTier?: string;
  // New camera props
  onTakePhoto?: () => Promise<void>;
  onStartWebCamera?: () => Promise<void>;
  selectedImage?: File | null;
  onImageChange?: (image: File | null) => void;
};

const UserUploads: React.FC<Props> = ({
  isOwner,
  username,
  viewerUsername,
  uploadItems,
  unreadPhotoIds,
  onUpload,
  onDelete,
  accountTier,
  onTakePhoto,
  onStartWebCamera,
  selectedImage,
  onImageChange
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadLimit = accountTier === "premium" ? 100 : 5;
  const maxSizeMB = accountTier === "premium" ? 50 : 2;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const [caption, setCaption] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Use selectedImage from props if available, otherwise use local state
  const currentImage = selectedImage || image;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      if (onImageChange) {
        onImageChange(file);
      } else {
        setImage(file);
      }
    }
  };

  const handleUploadClick = async () => {
    if (!currentImage) return;
    if (currentImage.size > maxSizeBytes) {
      alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
      return;
    }

    setUploading(true);
    if (onUpload) {
      await onUpload(currentImage, caption);
    }
    
    // Clear the image
    if (onImageChange) {
      onImageChange(null);
    } else {
      setImage(null);
    }
    setCaption("");
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 4 }}>
        📷 {isOwner ? "My Photo Gallery" : `${username}'s Gallery`}
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: 16 }}>
        {isOwner
          ? `You've uploaded ${uploadItems.length} of ${uploadLimit} photos.`
          : `A glimpse into ${username}'s visual world.`}
      </p>
      
      {onUpload && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 16 }}>
          
          {/* Photo input options */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <label 
              htmlFor="file-input" 
              style={{ 
                display: "inline-block", 
                padding: "0.5rem 1rem", 
                backgroundColor: "#e5e7eb", 
                borderRadius: "8px", 
                fontWeight: 500, 
                cursor: uploadItems.length >= uploadLimit ? "not-allowed" : "pointer",
                opacity: uploadItems.length >= uploadLimit ? 0.5 : 1
              }}
            >
              📁 Choose Photo
            </label>
            
            {onTakePhoto && (
              <button 
                type="button" 
                onClick={onTakePhoto}
                disabled={uploadItems.length >= uploadLimit}
                style={{ 
                  padding: "0.5rem 1rem", 
                  backgroundColor: "#3b82f6", 
                  color: "white",
                  border: "none", 
                  borderRadius: "8px", 
                  fontWeight: 500, 
                  cursor: uploadItems.length >= uploadLimit ? "not-allowed" : "pointer",
                  opacity: uploadItems.length >= uploadLimit ? 0.5 : 1
                }}
              >
                📷 Take Photo
              </button>
            )}
            
            {onStartWebCamera && (
              <button 
                type="button" 
                onClick={onStartWebCamera}
                disabled={uploadItems.length >= uploadLimit}
                style={{ 
                  padding: "0.5rem 1rem", 
                  backgroundColor: "#10b981", 
                  color: "white",
                  border: "none", 
                  borderRadius: "8px", 
                  fontWeight: 500, 
                  cursor: uploadItems.length >= uploadLimit ? "not-allowed" : "pointer",
                  opacity: uploadItems.length >= uploadLimit ? 0.5 : 1,
                  fontSize: "0.9rem"
                }}
              >
                🌐 Web Camera
              </button>
            )}
          </div>

          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploadItems.length >= uploadLimit}
            style={{ display: "none" }}
          />

          {/* Show image preview */}
          {currentImage && (
            <div style={{ marginBottom: "1rem" }}>
              <img 
                src={URL.createObjectURL(currentImage)} 
                alt="Selected" 
                style={{ 
                  maxWidth: "200px", 
                  maxHeight: "200px", 
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "2px solid #e5e7eb"
                }}
              />
              <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
                Selected: {currentImage.name}
              </p>
            </div>
          )}

          <input
            type="text"
            placeholder="Enter a caption for this photo"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              marginBottom: 8,
              padding: 8,
              width: "100%",
              maxWidth: 400,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />

          <p style={{ fontSize: "0.85rem", color: "#888", marginTop: 0, marginBottom: 8 }}>
            Max file size: {maxSizeMB} MB ({accountTier === "premium" ? "Premium user" : "Free user"})
          </p>

          <button
            disabled={!currentImage || uploading || uploadItems.length >= uploadLimit}
            onClick={handleUploadClick}
            style={{
              padding: "8px 16px",
              backgroundColor: "#b76e79",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: uploading || !currentImage || uploadItems.length >= uploadLimit ? "not-allowed" : "pointer",
              marginBottom: 8,
              opacity: uploading || !currentImage || uploadItems.length >= uploadLimit ? 0.6 : 1
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
        </div>
      )}

      {uploadItems.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {uploadItems.map(({ key, url, caption, views }) => {
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
                    onLoad={() => {
                      if (!isOwner) {
                        trackPhotoView(key);
                      }
                    }}
                    onClick={() => setSelectedPhotoUrl(url)}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 8,
                      display: "block",
                      cursor: "zoom-in",
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

                  <CommentThread photoId={key} currentUser={viewerUsername} accountTier={accountTier} />

                  {caption && (
                    <p style={{
                      fontSize: "0.85rem",
                      fontStyle: "italic",
                      color: "#555",
                      marginTop: 8,
                      textAlign: "center",
                      wordBreak: "break-word"
                    }}>
                      {caption}
                    </p>
                  )}

                  {typeof views === "number" && (
                    <p style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginTop: 4,
                      textAlign: "center"
                    }}>
                      👁️ {views} views
                    </p>
                  )}
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
          
          {selectedPhotoUrl && (
            <PhotoModal imageUrl={selectedPhotoUrl} onClose={() => setSelectedPhotoUrl(null)} />
          )}
        </>
      )}
    </div>
  );
};

export default UserUploads;