import "@/lib/configureAmplify"; // ✅ this guarantees Amplify is initialized no matter what
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam"; // ✅ already set up
import Link from "next/link";


const UPLOAD_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/upload_photo"
const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo"

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
    setFeedback("");
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
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  
    if (!image) {
      alert("Please select an image.");
      return;
    }
  
    setLoading(true);
    setFeedback("");
  
    try {
      const base64 = await toBase64(image);
  
      // ✅ Upload image
      const uploadResponse = await invokeLambdaIam({
        url: UPLOAD_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          fileContent: base64,
          fileType: image.type,
          fileName: image.name,
          username: user.username,
        },
      });
  
      const { imageUrl, s3Key } = uploadResponse;
  
      // ✅ Send to review Lambda
      const result = await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL,
        method: "POST",
        body: {
          imageUrl,
          s3Key,
          rubric: false, // or true if you want scoring
          username: user.username,
          challengeId: "manual-feedback",
        },
      });
  
      setFeedback(result.result || "No feedback.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error analyzing image:", err);
      setFeedback(`Error analyzing image: ${err}`);
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div
      style={{
        backgroundColor: "#f9fafb", // lighter neutral background
        color: "#111827",
        minHeight: "100vh",
        padding: "2rem 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <img
          src="/photo_mentor_logo.png"
          alt="Photo Mentor Logo"
          style={{
            width: "100%",
            maxWidth: 200,
            margin: "0 auto 1rem auto",
            display: "block",
          }}
        />

        <h2 style={{ fontSize: "1.8rem", margin: "1.5rem 0 1rem" }}>Photo Feedback</h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <label
            htmlFor="fileInput"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#e5e7eb",
              borderRadius: "9999px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            📷 Choose a Photo
          </label>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#b76e79",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            {loading ? "Analyzing..." : "Analyze Photo"}
          </button>
        </form>

        {/* 🔥 Premium Upgrade Plug */}
        {user && (
          <div
            style={{
              backgroundColor: "#fffbe6",
              border: "1px solid #facc15",
              borderRadius: 12,
              padding: 16,
              marginTop: 32,
              textAlign: "left",
            }}
          >
            <p style={{ margin: 0, fontSize: 14 }}>
              🌟 <strong>Want the full critique?</strong> Premium users unlock:
            </p>
            <ul style={{ fontSize: 14, paddingLeft: 20, marginTop: 8 }}>
              <li>✅ Full rubric scoring on every upload</li>
              <li>📚 Access to your entire feedback history</li>
              <li>🧠 Direct input from <strong>Jama Pantel</strong> — founder & expert photographer</li>
            </ul>
            <Link href="/settings" legacyBehavior>
              <a
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  padding: "8px 16px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                🚀 Upgrade to Premium
              </a>
            </Link>
          </div>
        )}

        {image && (
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: "50vh",
              objectFit: "contain",
              marginTop: 24,
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              filter: loading ? "blur(2px) grayscale(0.6)" : "none",
              transition: "filter 0.3s ease-in-out",
            }}
          />
        )}

        {feedback && (
          <div
            style={{
              marginTop: 32,
              background: "#f3f4f6",
              padding: 24,
              borderRadius: 12,
              textAlign: "left",
              lineHeight: 1.6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1.25rem", fontWeight: 600 }}>
              🧠 Photographer Feedback
            </h3>
            <div style={{ marginTop: 12 }}>
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>

  );
};

export default App;