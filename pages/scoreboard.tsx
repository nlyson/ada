import React, { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const FETCH_SCORES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_scoreboard";
const BUCKET = "amplify-d1gu2movs4qop8-nl-appstoragebucket6cbf3fd8-9ej6aeyhtt6o";

const ScoreboardPage: React.FC = () => {
  const [scores, setScores] = useState<any[]>([]);
  const challengeId = "weekly_01";

  useEffect(() => {
    async function fetchScores() {
      try {
        const raw = await invokeLambdaIam({
          url: FETCH_SCORES_URL,
          method: "POST",
          body: { challengeId },
        });
        console.log("📦 Scores with s3Key:", raw);

        const withUrls = raw.map((entry: any) => ({
            ...entry,
            signedUrl: entry.s3Key
              ? `https://${BUCKET}.s3.amazonaws.com/${entry.s3Key}`
              : "",
          }));
        setScores(withUrls);
      } catch (err) {
        console.error("Failed to fetch scoreboard", err);
      }
    }

    fetchScores();
  }, []);


  return (
    <div style={{ padding: 24 }}>
      <h1>🏆 Weekly Challenge Scoreboard</h1>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {scores.map((s, i) => (
            <div
            key={s.username + s.timestamp}
            style={{
                padding: 16,
                backgroundColor: "#f8f8f8",
                borderRadius: 10,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
            }}
            >
            {s.signedUrl ? (
                <img
                src={s.signedUrl}
                alt="submission"
                style={{ width: 100, height: 100, borderRadius: 6, objectFit: "cover" }}
                />
            ) : (
                <div
                style={{
                    width: 100,
                    height: 100,
                    backgroundColor: "#ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#666",
                }}
                >
                No image
                </div>
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ margin: 4 }}><strong>#{i + 1} – {s.username}</strong></p>
                <p style={{ margin: 4 }}>🧮 <strong>Score:</strong> {s.score}</p>
                <p style={{ margin: 4, fontSize: 12, color: "#666" }}>
                {new Date(s.timestamp).toLocaleString()}
                </p>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export default ScoreboardPage;
