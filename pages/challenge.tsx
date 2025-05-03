import React, { useState, useEffect, ChangeEvent } from "react";
import { Amplify } from "aws-amplify";
import amplifyConfig from "../amplify_outputs.json";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

Amplify.configure(amplifyConfig);

const SUBMIT_CHALLENGE_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_challenge"; // Replace with actual URL
const FETCH_RESULTS_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/challenge_results"
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo"

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const Challenge: React.FC<AppProps> = ({ user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    score: number;
    rubric: { [key: string]: number };
    feedback: string;
  }>(null);
  const CHALLENGE_ID = "weekly_01"; // Can evolve later

  const [results, setResults] = useState<
  { score: number; rubric: Record<string, number>; feedback: string; imageUrl: string }[]
>([]);



  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  async function handleSubmit() {
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
  
      // ✅ Trigger scoring right after submission
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
  }

  async function handleFetchResults() {
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
  }

  return (
    <div style={{ padding: 24, backgroundColor: "#fffaf0", minHeight: "100vh" }}>
      <h1>📸 Weekly Challenge: Reflections in Nature</h1>

      <input type="file" accept="image/*" onChange={handleChange} style={{ marginTop: 16 }} />
      <br />
      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ marginTop: 12, padding: 8, width: 300 }}
      />
      <br />
      <button
        onClick={handleSubmit}
        disabled={!image || loading}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          backgroundColor: "#228b22",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {loading ? "Submitting..." : "Submit to Challenge"}
      </button>
      <button
        onClick={handleFetchResults}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          backgroundColor: "#1e90ff",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        View Results
      </button>
      {status && <p style={{ marginTop: 20 }}>{status}</p>}
      <div style={{ marginTop: 32, padding: 16, backgroundColor: "#f0f8ff", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18 }}>📋 How Your Photo is Judged</h2>
        <ul style={{ paddingLeft: 20, fontSize: 14 }}>
          <li><strong>🎨 Composition</strong> – Framing, balance, visual flow (0–25 pts)</li>
          <li><strong>💡 Lighting</strong> – Exposure, highlights, shadows (0–25 pts)</li>
          <li><strong>🎯 Subject & Creativity</strong> – Originality, impact, theme (0–25 pts)</li>
          <li><strong>🔍 Focus & Clarity</strong> – Sharpness, depth of field (0–25 pts)</li>
        </ul>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Your score breakdown and personalized feedback will appear below after submission.
        </p>
      </div>
      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>📊 Your Challenge Results</h2>
          {results.map((res, index) => (
            <div
              key={index}
              style={{ marginBottom: 24, padding: 16, backgroundColor: "#f5fff5", borderRadius: 8 }}
            >
              <img src={res.imageUrl} alt="Challenge submission" style={{ width: 200, borderRadius: 8 }} />
              <p><strong>Score:</strong> {res.score}/100</p>
              <ul>
                {Object.entries(res.rubric).map(([key, val]) => (
                  <li key={key}>{key}: {val}/25</li>
                ))}
              </ul>
              <p><strong>Feedback:</strong> {res.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenge;
