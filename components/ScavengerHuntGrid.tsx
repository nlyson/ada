import React from "react";

type Prompt = {
  promptId: string;
  text: string;
};

type Props = {
  username: string;
  isOwner: boolean;
  unlockedCount: number;
  submissions: { [promptId: string]: string }; // promptId -> URL
  prompts: Prompt[];
  onUpload: (promptId: string, file: File) => void;
};

export const ScavengerHuntGrid: React.FC<Props> = ({
  username,
  isOwner,
  unlockedCount,
  submissions,
  prompts,
  onUpload,
}) => {
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
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

              {url ? (
                <img
                  src={url}
                  alt={prompt.promptId}
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 6,
                    display: "block",
                  }}
                />
              ) : isOwner && isUnlocked ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(prompt.promptId, file);
                  }}
                />
              ) : (
                <p>🔒 Locked</p>
              )}

              <p
                style={{
                  fontSize: "0.85rem",
                  marginTop: 6,
                  wordWrap: "break-word",
                }}
              >
                {prompt.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
