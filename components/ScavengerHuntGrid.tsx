import React, { useState } from "react";
import PhotoModal from "@/components/PhotoModal";

type Prompt = {
  promptId: string;
  text: string;
};

type Props = {
  username: string;
  isOwner: boolean;
  submissions: { [promptId: string]: string };
  prompts: Prompt[];
  results: { [promptId: string]: { score: number; rubric: any; feedback: string } };
  loadingMap: { [promptId: string]: boolean };
  onUpload: (promptId: string, file: File) => void;
  accountTier?: string;
  scavengerRetries?: number;
  startDate: string;
  // New camera props
  onTakePhoto?: (promptId: string) => Promise<void>;
  onStartWebCamera?: (promptId: string) => Promise<void>;
};

export const ScavengerHuntGrid: React.FC<Props> = ({
  username,
  isOwner,
  submissions,
  prompts,
  results,
  loadingMap,
  onUpload,
  accountTier,
  scavengerRetries,
  startDate,
  onTakePhoto,
  onStartWebCamera
}) => {
  const [openFeedback, setOpenFeedback] = useState<string | null>(null);

  const maxRetries = 10;
  const retriesUsed = scavengerRetries ?? 0;
  const retryLimitReached = accountTier === "premium" && retriesUsed >= maxRetries;
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const start = new Date(startDate);
  const today = new Date();
  const millisPerDay = 1000 * 60 * 60 * 24;

  const unlockedCount = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / millisPerDay) + 1
  );

  // ✅ Score summary
  const totalPossible = 3000

  const totalEarned = prompts.reduce((sum, p) => {
    return results[p.promptId]?.score ? sum + results[p.promptId].score : sum;
  }, 0);

  const handleFileChange = (promptId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = accountTier === "premium" ? 50 : 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
      return;
    }

    onUpload(promptId, file);
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {isOwner && accountTier === "premium" && (
        <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "#444" }}>
          🔁 <strong>Retries used:</strong> {retriesUsed} / {maxRetries}
        </div>
      )}

      {isOwner && totalPossible > 0 && (
        <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "#444" }}>
          🧮 <strong>Total Score:</strong> {totalEarned} / {totalPossible}
        </div>
      )}

      <p style={{ fontSize: "0.85rem", marginBottom: 12 }}>
        📅 {Math.min(unlockedCount, prompts.length)} of {prompts.length} days unlocked
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", // Slightly wider for camera buttons
          gap: 12,
        }}
      >
        {prompts.map((prompt, index) => {
          const day = index + 1;
          const isUnlocked = day <= unlockedCount;
          const url = submissions[prompt.promptId];
          const isLoading = loadingMap[prompt.promptId];
          
          const canUpload =
            isOwner &&
            isUnlocked &&
            (
              (accountTier !== "premium" && !url) ||
              (accountTier === "premium" && !retryLimitReached)
            );

          return (
            <div
              key={prompt.promptId}
              style={{
                border: "2px solid #ccc",
                borderRadius: 8,
                padding: 8,
                backgroundColor: isUnlocked ? "white" : "#f0f0f0",
                opacity: isUnlocked ? 1 : 0.5,
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>Day {day}</p>

              {/* IMAGE if submitted */}
              {isLoading ? (
                <p>⏳ Processing...</p>
              ) : (
                <>
                  {url && (
                    <img
                      src={`${url}?t=${Date.now()}`}
                      alt={prompt.promptId}
                      onClick={() => setSelectedPhotoUrl(`${url}?t=${Date.now()}`)}
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: 6,
                        display: "block",
                        cursor: "zoom-in",
                        marginBottom: 8
                      }}
                    />
                  )}

                  {/* UPLOAD OPTIONS - file input and camera buttons */}
                  {canUpload && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      {/* File input (hidden, styled as button) */}
                      <label
                        htmlFor={`file-input-${prompt.promptId}`}
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          marginBottom: "4px",
                          width: "100%",
                          boxSizing: "border-box"
                        }}
                      >
                        📁 Choose File
                      </label>
                      <input
                        id={`file-input-${prompt.promptId}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(prompt.promptId, e)}
                        style={{ display: "none" }}
                      />

                      {/* Camera buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                        {onTakePhoto && (
                          <button
                            onClick={() => onTakePhoto(prompt.promptId)}
                            disabled={isLoading}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: isLoading ? "not-allowed" : "pointer",
                              opacity: isLoading ? 0.5 : 1,
                              width: "100%"
                            }}
                          >
                            📷 Take Photo
                          </button>
                        )}
                        
                        {onStartWebCamera && (
                          <button
                            onClick={() => onStartWebCamera(prompt.promptId)}
                            disabled={isLoading}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: isLoading ? "not-allowed" : "pointer",
                              opacity: isLoading ? 0.5 : 1,
                              width: "100%"
                            }}
                          >
                            🌐 Web Camera
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* LOCKED State for others */}
                  {!canUpload && !url && (
                    <p>🔒 Locked</p>
                  )}
                </>
              )}

              {/* LIMIT MESSAGES */}
              {isOwner && url && !isLoading && accountTier !== "premium" && (
                <p style={{ color: "red", fontSize: "0.75rem", marginTop: 4 }}>
                  You cannot retry this prompt as a free user.
                </p>
              )}
              {isOwner && url && !isLoading && retryLimitReached && (
                <p style={{ color: "red", fontSize: "0.75rem", marginTop: 4 }}>
                  Retry limit reached (10/10). Premium limit hit.
                </p>
              )}

              {/* Upload guidance */}
              <p style={{ fontSize: "0.75rem", color: "#666", marginTop: 4 }}>
                Max size: {accountTier === "premium" ? "50MB" : "2MB"}
              </p>

              <p
                style={{
                  fontSize: "0.85rem",
                  marginTop: 6,
                  wordWrap: "break-word",
                }}
              >
                {prompt.text}
              </p>

              {/* Feedback */}
              {!isLoading && results[prompt.promptId] && (
                <div style={{ marginTop: 8, fontSize: "0.85rem" }}>
                  <strong>Score:</strong> {results[prompt.promptId].score}/100
                  <br />
                  <button
                    onClick={() =>
                      setOpenFeedback(openFeedback === prompt.promptId ? null : prompt.promptId)
                    }
                    style={{
                      fontSize: "0.75rem",
                      color: "#007bff",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      marginTop: 4,
                    }}
                  >
                    {openFeedback === prompt.promptId ? "Hide Feedback" : "View Feedback"}
                  </button>
                  {openFeedback === prompt.promptId && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "0.75rem",
                        background: "#f9f9f9",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        padding: 6,
                        textAlign: "left",
                      }}
                    >
                      {results[prompt.promptId].feedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedPhotoUrl && (
        <PhotoModal imageUrl={selectedPhotoUrl} onClose={() => setSelectedPhotoUrl(null)} />
      )}
    </div> 
  );
};