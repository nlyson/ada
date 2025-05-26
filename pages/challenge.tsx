import React, { useState, useEffect, ChangeEvent } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";

const SUBMIT_CHALLENGE_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_challenge";
const FETCH_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const challengeId = "weekly_01"; // 👈 replace hardcoded `CHALLENGE_ID` use with this

const Challenge: React.FC<AppProps> = ({ user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    { score: number; rubric: Record<string, number>; feedback: string; imageUrl: string }[]
  >([]);
  const [accountTier, setAccountTier] = useState<string>("free");
  const [totalChallengeSubmissions, setTotalChallengeSubmissions] = useState(0);
  const submissionCount = results.length;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const result = await invokeLambdaIam({
          url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile",
          method: "POST",
          body: { username: user.username },
        });
        setAccountTier(result.accountTier || "free");
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    }

    async function init() {
      await fetchProfile();
      await handleFetchResults();
      await fetchSubmissionCount(); // ✅ add this
    }
    init();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
  };

  async function fetchSubmissionCount() {
    try {
      const res = await invokeLambdaIam({
        url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results",
        method: "POST",
        body: { username: user.username }
      });
      const total = Array.isArray(res) ? res.length : 0;
      setTotalChallengeSubmissions(total);
    } catch (err) {
      console.error("Failed to fetch challenge submission count:", err);
    }
  }

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
    });

  const handleSubmit = async () => {
    if (!image) {
      alert("Please select an image.");
      return;
    }
    const maxSizeMB = accountTier === "premium" ? 50 : 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (image.size > maxSizeBytes) {
      alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
      return;
    }
    const maxRetries = accountTier === "premium" ? 100 : 1;

    if (submissionCount >= maxRetries) {
      alert(`You’ve reached the maximum number of submissions for this challenge.`);
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const base64 = await toBase64(image);

      const result = await invokeLambdaIam({
        url: SUBMIT_CHALLENGE_LAMBDA_URL,
        method: "POST",
        body: {
          action: "submit",
          username: user.username,
          challengeId: challengeId,
          fileName: image.name,
          fileContent: base64,
          fileType: image.type,
          caption,
        },
      });


      setStatus(result.message || result.error);
      setImage(null);
      setCaption("");

      if (result.imageUrl && result.s3Key) {
        await invokeLambdaIam({
          url: REVIEW_PHOTO_LAMBDA_URL,
          method: "POST",
          body: {
            imageUrl: result.imageUrl,
            s3Key: result.s3Key,
            rubric: true,
            username: user.username,
            challengeId: challengeId,
          },
        });
      }

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            challengesCompleted: {
              op: "increment",
              value: 1,
            },
          },
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            recomputeChallengeStats: { op: "recomputeChallengeStats" }
          }
        }
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: {
            streakDays: { op: "updateStreak" }
          }
        }
      });

      await handleFetchResults(); // 🔄 refresh results after scoring

    } catch (err) {
      console.error(err);
      setStatus("Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchResults = async () => {
    setStatus("Fetching results...");
    try {
      const res = await invokeLambdaIam({
        url: FETCH_RESULTS_URL,
        method: "POST",
        body: { username: user.username },
      });

      if (Array.isArray(res)) {
        setResults(res);
        setStatus("Results loaded.");
      } else {
        setStatus("No results found.");
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      setStatus("Failed to fetch results.");
    }
  };

  const hasSubmitted = results.length > 0;
  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto", backgroundColor: "#fffaf0", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        📸 Weekly Challenge: <em>Reflections in Nature</em>
      </h1>

      <section style={{ marginBottom: "2rem" }}>
        {submissionCount < (accountTier === "premium" ? 100 : 1) ? (
          <>
            <input type="file" accept="image/*" onChange={handleChange} />
            <br />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ marginTop: 12, padding: 8, width: "100%", maxWidth: 400 }}
            />
            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>
              Max file size: {accountTier === "premium" ? "50MB" : "2MB"}
            </p>
            <div style={{ marginTop: 16, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={handleSubmit}
                disabled={!image || loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#228b22",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Submitting..." : "Submit to Challenge"}
              </button>
            </div>
          </>
        ) : (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontStyle: "italic", color: "#555" }}>
            You&apos;ve already submitted a photo for this challenge.
          </p>
          <div
            style={{
              marginTop: 12,
              backgroundColor: "#fff0f0",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #ffcccc",
            }}
          >
          {accountTier !== "premium" && hasSubmitted && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  backgroundColor: "#fff0f0",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #ffcccc",
                }}
              >
                <p style={{ margin: 0, fontSize: 14 }}>
                  Want to try again with a better photo? 🚀
                  <br />
                  <strong>Upgrade to Premium</strong> for{" "}
                  <span style={{ color: "#228b22" }}>unlimited challenge submissions</span>!
                </p>
              </div>
            </div>
          )}
            <Link href="/settings" legacyBehavior>
              <a
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "8px 16px",
                  backgroundColor: "#228b22",
                  color: "white",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                Upgrade Now
              </a>
            </Link>
          </div>
        </div>
        )}
      </section>

      <section style={{ backgroundColor: "#f0f8ff", borderRadius: 8, padding: 16 }}>
        <h2>📋 Judging Criteria</h2>
        <ul style={{ paddingLeft: 20, fontSize: 14 }}>
          <li><strong>🎨 Composition</strong> – Framing, balance, visual flow (0–25 pts)</li>
          <li><strong>💡 Lighting</strong> – Exposure, highlights, shadows (0–25 pts)</li>
          <li><strong>🎯 Subject & Creativity</strong> – Originality, impact, theme (0–25 pts)</li>
          <li><strong>🔍 Focus & Clarity</strong> – Sharpness, depth of field (0–25 pts)</li>
        </ul>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Your total score is out of 100. Personalized feedback appears below after submission.
        </p>
      </section>

      {results.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>📊 Your Challenge Results</h2>
          <div
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: "#f5fff5",
              borderRadius: 8,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <img
              src={results[0].imageUrl}
              alt="Your submission"
              style={{ width: "100%", maxWidth: 400, borderRadius: 8, marginBottom: 12 }}
            />
            <p><strong>Score:</strong> {results[0].score}/100</p>
            <ul style={{ paddingLeft: 20, textAlign: "left", display: "inline-block" }}>
              {Object.entries(results[0].rubric).map(([key, val]) => (
                <li key={key}>{key}: {val}/25</li>
              ))}
            </ul>
            <p style={{ marginTop: 8 }}><strong>Feedback:</strong> {results[0].feedback}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Challenge;
