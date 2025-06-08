import React, { useState, useEffect, ChangeEvent } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";

const SUBMIT_CHALLENGE_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_challenge";
const FETCH_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const UPDATE_USER_STATS_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/update_user_stats";
const GET_CURRENT_CHALLENGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_current_challenge";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type Challenge = {
  challengeId: string;
  title: string;
  description?: string;
  rubric?: Record<string, number>;
};

const Challenge: React.FC<AppProps> = ({ user }) => {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
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
    async function init() {
      const [profileRes, challengeRes] = await Promise.all([
        invokeLambdaIam({
          url: "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile",
          method: "POST",
          body: { username: user.username },
        }),
        invokeLambdaIam({
          url: GET_CURRENT_CHALLENGE_URL,
          method: "POST",
        }),
      ]);

      setAccountTier(profileRes.accountTier || "free");

      try {
        const parsedChallenge: Challenge = {
          challengeId: challengeRes.challengeId.S,
          title: challengeRes.title.S,
          description: challengeRes.description?.S,
          rubric: challengeRes.rubric?.S ? JSON.parse(challengeRes.rubric.S) : undefined,
        };
        setCurrentChallenge(parsedChallenge);
      } catch (err) {
        console.error("Failed to parse challenge:", err);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!currentChallenge) return;
    handleFetchResults();
    fetchSubmissionCount();
  }, [currentChallenge]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
  };

  async function fetchSubmissionCount() {
    try {
      const res = await invokeLambdaIam({
        url: FETCH_RESULTS_URL,
        method: "POST",
        body: { username: user.username },
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

  const maxRetries = accountTier === "premium" ? 10 : 1;


  const handleSubmit = async () => {
    if (!image || !currentChallenge) return;

    const maxSizeMB = accountTier === "premium" ? 50 : 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (image.size > maxSizeBytes) {
      alert(`File too large. Maximum allowed size is ${maxSizeMB} MB.`);
      return;
    }


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
          challengeId: currentChallenge.challengeId,
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
            challengeId: currentChallenge.challengeId,
          },
        });
      }

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: { challengesCompleted: { op: "increment", value: 1 } },
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: { recomputeChallengeStats: { op: "recomputeChallengeStats" } },
        },
      });

      await invokeLambdaIam({
        url: UPDATE_USER_STATS_LAMBDA_URL,
        method: "POST",
        body: {
          username: user.username,
          updates: { streakDays: { op: "updateStreak" } },
        },
      });

      await handleFetchResults();
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
      if (!currentChallenge) return;
      const res = await invokeLambdaIam({
        url: FETCH_RESULTS_URL,
        method: "POST",
        body: {
          username: user.username,
          challengeId: currentChallenge.challengeId, // ✅ required for filtering
        },
      });
      console.log('results', res)
      setResults(Array.isArray(res) ? res : []);
      setStatus("Results loaded.");
    } catch (err) {
      console.error("Error fetching results:", err);
      setStatus("Failed to fetch results.");
    }
  };

  if (!currentChallenge) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading current challenge...</div>;
  }

  const hasSubmitted = results.length > 0;

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto", backgroundColor: "#fffaf0", minHeight: "100vh" }}>
      <p style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>
        {submissionCount}/{maxRetries} submissions used
      </p>
      <h1>📸 Weekly Challenge: <em>{currentChallenge.title}</em></h1>
      {currentChallenge.description && <p>{currentChallenge.description}</p>}

      {/* Upload UI */}
      <section style={{ marginBottom: "2rem" }}>
        {!hasSubmitted || accountTier === "premium" ? (
          <>
            <input type="file" accept="image/*" onChange={handleChange} />
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
            <div style={{ marginTop: 16 }}>
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
            {accountTier !== "premium" && (
              <div style={{ marginTop: 12, backgroundColor: "#fff0f0", padding: 16, borderRadius: 8, border: "1px solid #ffcccc" }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  Upgrade to Premium for <strong>more challenge submissions</strong>! 🚀
                </p>
                <Link href="/settings" legacyBehavior>
                  <a style={{ display: "inline-block", marginTop: 8, padding: "8px 16px", backgroundColor: "#228b22", color: "white", borderRadius: 6, fontWeight: "bold", fontSize: 14 }}>
                    Upgrade Now
                  </a>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Judging Criteria */}
      <section style={{ backgroundColor: "#f0f8ff", borderRadius: 8, padding: 16 }}>
        <h2>📋 Judging Criteria</h2>
        <ul style={{ paddingLeft: 20, fontSize: 14 }}>
          {currentChallenge.rubric
            ? Object.entries(currentChallenge.rubric).map(([key, val]) => (
                <li key={key}><strong>{key}</strong>: {val} pts</li>
              ))
            : (
              <>
                <li><strong>🎨 Composition</strong> – Framing, balance, visual flow (0–25 pts)</li>
                <li><strong>💡 Lighting</strong> – Exposure, highlights, shadows (0–25 pts)</li>
                <li><strong>🎯 Subject & Creativity</strong> – Originality, impact, theme (0–25 pts)</li>
                <li><strong>🔍 Focus & Clarity</strong> – Sharpness, depth of field (0–25 pts)</li>
              </>
            )}
        </ul>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Your total score is out of 100. Personalized feedback appears below after submission.
        </p>
      </section>

      {/* Results */}
      {results.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>📊 Your Challenge Results</h2>
          <div style={{ marginTop: 20, padding: 16, backgroundColor: "#f5fff5", borderRadius: 8, textAlign: "center" }}>
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
