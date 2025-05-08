import React, { useState, useEffect, ChangeEvent } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const SUBMIT_CHALLENGE_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_challenge";
const FETCH_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results";
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const CHALLENGE_ID = "weekly_01";

const Challenge: React.FC<AppProps> = ({ user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    { score: number; rubric: Record<string, number>; feedback: string; imageUrl: string }[]
  >([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
  };

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
          challengeId: CHALLENGE_ID,
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
            challengeId: CHALLENGE_ID,
          },
        });
      }
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

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto", backgroundColor: "#fffaf0", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        📸 Weekly Challenge: <em>Reflections in Nature</em>
      </h1>

      <section style={{ marginBottom: "2rem" }}>
        <input type="file" accept="image/*" onChange={handleChange} />
        <br />
        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{ marginTop: 12, padding: 8, width: "100%", maxWidth: 400 }}
        />
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
          <button
            onClick={handleFetchResults}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1e90ff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            View Results
          </button>
        </div>
        {status && <p style={{ marginTop: 12, color: "#444" }}>{status}</p>}
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
          {results.map((res, index) => (
            <div
              key={index}
              style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: "#f5fff5",
                borderRadius: 8,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={res.imageUrl}
                alt="Challenge submission"
                style={{ width: "100%", maxWidth: 300, borderRadius: 8, marginBottom: 12 }}
              />
              <p><strong>Score:</strong> {res.score}/100</p>
              <ul style={{ paddingLeft: 20 }}>
                {Object.entries(res.rubric).map(([key, val]) => (
                  <li key={key}>{key}: {val}/25</li>
                ))}
              </ul>
              <p style={{ marginTop: 8 }}><strong>Feedback:</strong> {res.feedback}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default Challenge;
