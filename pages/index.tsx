import React, { useState, ChangeEvent, FormEvent } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import ReactMarkdown from "react-markdown"

const Spinner = () => (
  <div
    style={{
      display: "inline-block",
      width: 18,
      height: 18,
      border: "2px solid rgba(0, 0, 0, 0.2)",
      borderTopColor: "#000",
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
      marginRight: 8,
    }}
  />
);

// Inject keyframes for spinner animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

const client = generateClient<Schema>();

type FeedbackResponse = {
  result: string;
}

export default function App({
  signOut,
  user,
}: {
  signOut: () => void;
  user: { username: string };
}) {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!image) {
      alert("Please select an image.");
      return;
    }
    setLoading(true);
    setFeedback("");
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
  
      try {
        const response = await client.queries.imageLLMReview({ name: base64String });
        setFeedback(response.data || "Response came back empty ")
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Error calling imageLLMReview:", err);
        setFeedback("Error analyzing image.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(image);
  };
  
  return (
    <div
      style={{  
        maxWidth: 600,
        margin: "0 auto",
        padding: 24,
        textAlign: "center",
        minHeight: "100vh",
      }}
      >
      <div style={{ position: "relative", padding: 16 }}>
      <button
        onClick={signOut}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          padding: "6px 12px",
          border: "none",
          background: "#333",
          color: "#fff",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
      <div
        style={{  
          maxWidth: 600,
          margin: "0 auto",
          padding: 24,
          textAlign: "center",
          minHeight: "100vh",
        }}
        >
          <img
            src="/raccoon-logo.png"
            alt="Raccoon Logo"
            style={{
              width: 120,
              height: 120,
              objectFit: "cover",
              borderRadius: "50%",
              marginBottom: 8,
            }}
          />
          <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>PEDRO</h1>
          <p style={{ margin: 0, fontStyle: "italic", color: "#555" }}>
            Photographic Evaluation & Detailed Raccoon Observation
          </p>
          <h1>Photo Feedback</h1>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 16px",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {loading ? (
                <>
                  <Spinner /> Analyzing...
                </>
              ) : (
                "Analyze Photo"
              )}
            </button>
          </form>
          {image && (
            <img
              src={URL.createObjectURL(image)}
              alt="preview"
              style={{
                maxWidth: "100%",
                maxHeight: 400,
                marginTop: 16,
                borderRadius: 8,
                filter: loading ? "blur(2px) grayscale(0.6)" : "none",
                transition: "filter 0.3s ease-in-out",
                objectFit: "contain",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
          )}
          {feedback && (
            <div
              style={{
                marginTop: 24,
                background: "#fafafa",
                padding: 16,
                borderRadius: 8,
              }}
            >
              <h2 style={{ marginTop: 0 }}>Photographer Feedback</h2>
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


