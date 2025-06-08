import React, { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const CHALLENGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_high_challenge_scores";
const SCAVENGER_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_high_scavenger_scores";
const CHALLENGE_LIST_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_all_challenges";
const LIST_HUNTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/list_scavenger_hunts";

const ScoreboardPage: React.FC = () => {
  const [challengeScores, setChallengeScores] = useState<any[]>([]);
  const [scavengerScores, setScavengerScores] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [hunts, setHunts] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>("");
  const [selectedHuntId, setSelectedHuntId] = useState<string>("");
  const [showChallenge, setShowChallenge] = useState(true);
  const [showScavenger, setShowScavenger] = useState(false);

  // Initial load
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [challengeList, huntList] = await Promise.all([
          invokeLambdaIam({ url: CHALLENGE_LIST_URL, method: "GET" }),
          invokeLambdaIam({ url: LIST_HUNTS_URL, method: "POST", body: {} }), // ✅ POST w/ body
        ]);
        setChallenges(challengeList);
        setHunts(huntList);
      } catch (err) {
        console.error("❌ Failed to fetch challenges or hunts", err);
      }
    };
    fetchInitial();
  }, []);

  // Load challenge scores
  useEffect(() => {
    const fetchChallengeScores = async () => {
      try {
        const body = selectedChallenge ? { challengeId: selectedChallenge } : {};
        const result = await invokeLambdaIam({
          url: CHALLENGE_URL,
          method: "POST",
          body,
        });
        setChallengeScores(result || []);
      } catch (err) {
        console.error("❌ Failed to fetch challenge scores", err);
      }
    };
    if (showChallenge) fetchChallengeScores();
  }, [selectedChallenge, showChallenge]);

  // Load scavenger scores
  useEffect(() => {
    const body = selectedHuntId?.trim() ? { huntId: selectedHuntId.trim() } : {};
    const fetchScavengerScores = async () => {
      try {
        const result = await invokeLambdaIam({
          url: SCAVENGER_URL,
          method: "POST",
          body,
        });
        setScavengerScores(result || []);
      } catch (err) {
        console.error("❌ Failed to fetch scavenger scores", err);
      }
    };
    if (showScavenger && body) fetchScavengerScores();
  }, [selectedHuntId, showScavenger]);

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
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>🏆 Leaderboards</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 24, marginBottom: 24 }}>
        <button
          onClick={() => setShowChallenge(!showChallenge)}
          style={{
            padding: "8px 16px",
            backgroundColor: showChallenge ? "#228b22" : "#eee",
            color: showChallenge ? "white" : "black",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {showChallenge ? "Hide" : "Show"} Challenge Scores
        </button>

        <button
          onClick={() => setShowScavenger(!showScavenger)}
          style={{
            padding: "8px 16px",
            backgroundColor: showScavenger ? "#228b22" : "#eee",
            color: showScavenger ? "white" : "black",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {showScavenger ? "Hide" : "Show"} Scavenger Scores
        </button>
      </div>

      {showChallenge && (
        <>
          <h2>📸 High Challenge Scores</h2>
          <select
            value={selectedChallenge}
            onChange={(e) => setSelectedChallenge(e.target.value)}
            style={{ marginBottom: 16, padding: 8, fontSize: 14 }}
          >
            <option value="">🏆 All-Time High Scores</option>
            {challenges.map((ch) => (
              <option key={ch.challengeId} value={ch.challengeId}>
                {ch.title}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {challengeScores.map((s, i) => (
              <ScoreCard key={s.username + s.challengeId} rank={i + 1} {...s} />
            ))}
          </div>
        </>
      )}

      {showScavenger && (
        <>
          <h2 style={{ marginTop: 48 }}>🗺️ Scavenger Hunt Monthly Scores</h2>
          <select
            value={selectedHuntId}
            onChange={(e) => setSelectedHuntId(e.target.value)}
            style={{ marginBottom: 16, padding: 8, fontSize: 14 }}
          >
            <option value="">🗺️ All-Time Scavenger Scores</option>
            {hunts.map((hunt) => (
              <option key={hunt.huntId} value={hunt.huntId}>
                {hunt.name}
              </option>
            ))}
          </select>

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
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {s.signedUrl ? (
                    <img
                      src={s.signedUrl}
                      alt="submission"
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        backgroundColor: "#ccc",
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
                  <span>#{i + 1} – {s.username}</span>
                </div>
                <span>✅ {s.score} points</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ScoreboardPage;
