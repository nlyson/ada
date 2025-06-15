import "@/lib/configureAmplify";
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import Link from "next/link";
import { uploadData } from "@aws-amplify/storage";


const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";
const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const GET_FEEDBACK_USAGE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_feedback_usage";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type FeedbackResult = {
  score?: number;
  rubric?: Record<string, number | string>;
  feedback: string;
  tips?: string[];
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [accountTier, setAccountTier] = useState<string>("free");
  const [usage, setUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);

  useEffect(() => {
    const fetchProfileAndUsage = async () => {
      try {
        const profileResult = await invokeLambdaIam({
          url: GET_PROFILE_URL,
          method: "POST",
          body: { username: user.username },
        });

        const tier = profileResult.accountTier || "free";
        setAccountTier(tier);

        const usageResult = await invokeLambdaIam({
          url: GET_FEEDBACK_USAGE_URL,
          method: "POST",
          body: {
            username: user.username,
            accountTier: tier,
          },
        });

        setUsage(usageResult);
      } catch (err) {
        console.error("Failed to fetch profile or usage info:", err);
      }
    };

    if (user.username) {
      fetchProfileAndUsage();
    }
  }, [user.username]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
    setFeedback(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!image) {
      alert("Please select an image.");
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const path = `public/user-creations/${user.username}/${image.name}`;

      const result1 = await uploadData({
        path,            // ✅ custom S3 path
        data: image,     // ✅ your File or Blob
        options: {
          contentType: image.type
        }
      });

      console.log("✅ Upload result:", result1);


      const useRubric = accountTier === "premium";

      const result = await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          s3Key: path,
          imageUrl: `https://picture-this-storage.s3.amazonaws.com/${path}`,
          username: user.username,
          rubric: useRubric,
          challengeId: "manual-feedback",
          accountTier,
        },
      });

      const feedbackResult: FeedbackResult = {
        feedback: result?.feedback || result?.result || "No feedback.",
        score: result?.score,
        rubric: result?.rubric,
        tips: result?.tips,
      };

      setFeedback(feedbackResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error analyzing image:", err);
      setFeedback({ feedback: `Error analyzing image: ${err}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#f9fafb", color: "#111827", minHeight: "100vh", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "2rem", textAlign: "center" }}>
        <img src="/photo_mentor_logo.png" alt="Photo Mentor Logo" style={{ width: "100%", maxWidth: 200, margin: "0 auto 1rem auto", display: "block" }} />

        <h2 style={{ fontSize: "1.8rem", margin: "1.5rem 0 1rem" }}>Photo Feedback</h2>

        {usage && (
          <div style={{ fontSize: 14, marginBottom: 8, color: "#4b5563" }}>
            📸 Feedbacks used this week: <strong>{usage.used}</strong> of {usage.limit}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <label htmlFor="fileInput" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#e5e7eb", borderRadius: "9999px", fontWeight: 500, cursor: "pointer" }}>
            📷 Choose a Photo
          </label>
          <input id="fileInput" type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />

          <button type="submit" disabled={loading} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#b76e79", color: "white", border: "none", borderRadius: "9999px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", width: "100%", maxWidth: "300px" }}>
            {loading ? "Analyzing..." : "Analyze Photo"}
          </button>
        </form>

        {accountTier !== "premium" && (
          <div style={{ backgroundColor: "#fffbe6", border: "1px solid #facc15", borderRadius: 12, padding: 16, marginTop: 32, textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 14 }}>🌟 <strong>Want the full critique?</strong> Premium users unlock:</p>
            <ul style={{ fontSize: 14, paddingLeft: 20, marginTop: 8 }}>
              <li>✅ 50 photo reviews per week</li>
              <li>🧠 Direct input from <strong>Jama Pantel</strong> — founder & expert photographer</li>
            </ul>
            <Link href="/settings" legacyBehavior>
              <a style={{ display: "inline-block", marginTop: 10, padding: "8px 16px", backgroundColor: "#16a34a", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                🚀 Upgrade to Premium
              </a>
            </Link>
          </div>
        )}

        {image && (
          <img src={URL.createObjectURL(image)} alt="preview" style={{ width: "100%", maxHeight: "50vh", objectFit: "contain", marginTop: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", filter: loading ? "blur(2px) grayscale(0.6)" : "none", transition: "filter 0.3s ease-in-out" }} />
        )}

        {feedback && (
          <div style={{ marginTop: 32, background: "#f3f4f6", padding: 24, borderRadius: 12, textAlign: "left", lineHeight: 1.6, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.25rem", fontWeight: 600 }}>🧠 Photographer Feedback</h3>

            {"score" in feedback && typeof feedback.score === "number" && <p><strong>Total Score:</strong> {feedback.score} / 100</p>}

            {feedback.rubric && (
              <>
                <h4>Rubric Breakdown</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {Object.entries(feedback.rubric).map(([key, val]) => (
                    <li key={key}>{key}: {typeof val === "number" ? `${val}/25` : <em>{val}</em>}</li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ marginTop: 12 }}>
              <strong>Feedback:</strong>
              <div style={{ marginTop: 8 }}>
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => <strong style={{ color: "#b76e79" }}>{children}</strong>,
                    p: ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: 20, marginTop: 8 }}>{children}</ul>,
                  }}
                >
                  {feedback.feedback}
                </ReactMarkdown>
              </div>
            </div>

            {feedback.tips && feedback.tips.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>🔁 Retry Tips</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {feedback.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
