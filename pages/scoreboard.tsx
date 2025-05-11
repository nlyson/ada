import React, { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const CHALLENGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_high_challenge_scores";
const SCAVENGER_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_high_scavenger_scores";
const BUCKET = "picture-this-storage";

const ScoreboardPage: React.FC = () => {
  const [challengeScores, setChallengeScores] = useState<any[]>([]);
  const [scavengerScores, setScavengerScores] = useState<any[]>([]);

  useEffect(() => {
    async function fetchScores() {
      try {
        const [challenge, scavenger] = await Promise.all([
          invokeLambdaIam({ url: CHALLENGE_URL, method: "GET" }),
          invokeLambdaIam({ url: SCAVENGER_URL, method: "GET" }),
        ]);

        const challengeWithUrls = challenge.map((entry: any) => ({
          ...entry,
          signedUrl: entry.s3Key
            ? `https://${BUCKET}.s3.amazonaws.com/${entry.s3Key}`
            : "",
        }));

        setChallengeScores(challengeWithUrls);
        setScavengerScores(scavenger); // no image for scavenger scores
      } catch (err) {
        console.error("❌ Failed to fetch scoreboards", err);
      }
    }

    fetchScores();
  }, []);

  const ScoreCard = ({ rank, username, score, timestamp, signedUrl }: any) => (
    <div
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
      {signedUrl ? (
        <img
          src={signedUrl}
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
        <p style={{ margin: 4 }}><strong>#{rank} – {username}</strong></p>
        <p style={{ margin: 4 }}>🧮 <strong>Score:</strong> {score}</p>
        <p style={{ margin: 4, fontSize: 12, color: "#666" }}>
          {new Date(timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h1>🏆 High Challenge Scores</h1>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {challengeScores.map((s, i) => (
          <ScoreCard key={s.username} rank={i + 1} {...s} />
        ))}
      </div>

      <h1 style={{ marginTop: 48 }}>🗺️ Scavenger Hunt Monthly Scores</h1>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {scavengerScores.map((s, i) => (
          <div
            key={s.username}
            style={{
              padding: 16,
              backgroundColor: "#eef6ff",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            <span>#{i + 1} – {s.username}</span>
            <span>✅ {s.score} points</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreboardPage;
