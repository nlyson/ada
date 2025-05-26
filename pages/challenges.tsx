import React, { useState, useEffect } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";

const FETCH_ALL_CHALLENGES_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/fetch_all_challenges";
const FETCH_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results";
const USER_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";

type ResultEntry = { challengeId: string };

type Challenge = {
  challengeId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
};

type AppProps = {
  user: { username: string };
};

type Filter = "all" | "submitted" | "unattempted";

const ChallengesPage: React.FC<AppProps> = ({ user }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [accountTier, setAccountTier] = useState("free");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    async function loadData() {
      const [challengeData, resultsData, profileData] = await Promise.all([
        invokeLambdaIam({ url: FETCH_ALL_CHALLENGES_URL, method: "GET" }),
        invokeLambdaIam({ url: FETCH_RESULTS_URL, method: "POST", body: { username: user.username } }),
        invokeLambdaIam({ url: USER_PROFILE_URL, method: "POST", body: { username: user.username } }),
      ]);

      const submittedSet = new Set<string>(
        (resultsData as ResultEntry[]).map((r) => r.challengeId)
      );

      const sorted = (challengeData || []).sort((a: Challenge, b: Challenge) => b.startDate.localeCompare(a.startDate));

      setChallenges(sorted);
      setSubmittedIds(submittedSet);
      setAccountTier(profileData.accountTier || "free");
    }

    loadData();
  }, []);

  const filteredChallenges = challenges.filter((ch) => {
    if (filter === "all") return true;
    const isSubmitted = submittedIds.has(ch.challengeId);
    return filter === "submitted" ? isSubmitted : !isSubmitted;
  });

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>📸 All Challenges</h1>
        {accountTier === "free" && submittedIds.size >= 1 && (
        <div style={{
            backgroundColor: "#fff0f0",
            border: "1px solid #ffcccc",
            padding: "12px 16px",
            borderRadius: 8,
            textAlign: "center",
            marginBottom: 24,
        }}>
            <p style={{ margin: 0 }}>
            🎁 You&apos;ve used your one free challenge submission.
            <br />
            <strong>Upgrade to Premium</strong> for unlimited challenge entries!
            </p>
            <Link href="/settings" legacyBehavior>
            <a style={{
                marginTop: 8,
                display: "inline-block",
                padding: "8px 16px",
                backgroundColor: "#0070f3",
                color: "white",
                borderRadius: 6,
                fontWeight: "bold",
                textDecoration: "none",
            }}>
                Upgrade Now →
            </a>
            </Link>
        </div>
        )}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", justifyContent: "center" }}>
        {(["all", "unattempted", "submitted"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: f === filter ? "2px solid #228b22" : "1px solid #ccc",
              backgroundColor: f === filter ? "#eaffea" : "white",
              color: f === filter ? "#228b22" : "#333",
              cursor: "pointer",
            }}
          >
            {f === "all" ? "All" : f === "submitted" ? "Submitted" : "Unattempted"}
          </button>
        ))}
      </div>

      {filteredChallenges.map((ch) => {
        const hasSubmitted = submittedIds.has(ch.challengeId);
        const canSubmit = accountTier === "premium" || (!hasSubmitted && submittedIds.size < 1);

        const badge = hasSubmitted
          ? "✅ Submitted"
          : canSubmit
          ? "🆕 Available"
          : "🔒 Locked";

        return (
          <div key={ch.challengeId} style={{ background: "#fffaf0", padding: 20, borderRadius: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>{ch.title}</h3>
              <span style={{ fontSize: 14, fontWeight: "bold", color: hasSubmitted ? "green" : canSubmit ? "#228b22" : "gray" }}>{badge}</span>
            </div>
            <p style={{ margin: "4px 0" }}><strong>Start:</strong> {ch.startDate}</p>
            {ch.endDate && <p style={{ margin: "4px 0" }}><strong>End:</strong> {ch.endDate}</p>}
            {ch.description && <p style={{ marginTop: 8 }}>{ch.description}</p>}
            <div style={{ marginTop: 12 }}>
              {hasSubmitted ? (
                <Link href={`/challenge/${ch.challengeId}`} legacyBehavior>
                  <a>View Results →</a>
                </Link>
              ) : canSubmit ? (
                <Link href={`/challenge/${ch.challengeId}`} legacyBehavior>
                  <a style={{ color: "#0000cc", fontWeight: "bold" }}>Submit Now →</a>
                </Link>
              ) : (
                <>
                  <p style={{ fontStyle: "italic", color: "#777", marginBottom: 8 }}>
                    This challenge is currently locked for Free users.
                    <br />
                    Upgrade to unlock all challenges and submit anytime!
                  </p>
                  <Link href="/settings" legacyBehavior>
                    <a
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        backgroundColor: "#0070f3",
                        color: "white",
                        borderRadius: 6,
                        fontSize: 14,
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      🚀 Upgrade Now
                    </a>
                  </Link>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChallengesPage;
