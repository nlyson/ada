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
  startDate
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

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {isOwner && accountTier === "premium" && (
      <div style={{ marginBottom: 16, fontSize: "0.85rem", color: "#444" }}>
        🔁 <strong>Retries used:</strong> {retriesUsed} / {maxRetries}
      </div>
    )}
    <p style={{ fontSize: "0.85rem", marginBottom: 12 }}>
    📅 {Math.min(unlockedCount, prompts.length)} of {prompts.length} days unlocked
    </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {prompts.map((prompt, index) => {
          const day = index + 1;
          const isUnlocked = day <= unlockedCount;
          const url = submissions[prompt.promptId];
          const isLoading = loadingMap[prompt.promptId];

          const isFreeAndSubmitted = accountTier !== "premium" && !!url;
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
                    src={url}
                    alt={prompt.promptId}
                    onClick={() => setSelectedPhotoUrl(url)} // 👈 add this
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 6,
                      display: "block",
                      cursor: "zoom-in", // 👈 UX hint
                    }}
                  />
                )}

                  {/* UPLOAD INPUT below image if retries allowed */}
                  {canUpload && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const maxSizeMB = accountTier === "premium" ? 50 : 2;
                        const maxSizeBytes = maxSizeMB * 1024 * 1024;

                        if (file.size > maxSizeBytes) {
                          alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
                          return;
                        }

                        onUpload(prompt.promptId, file);
                      }}
                      style={{ marginTop: 8 }}
                    />
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
