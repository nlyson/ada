import React, { useState, ChangeEvent, FormEvent } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

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

export default function App() {
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
    <div>
      <h1>Photo Feedback</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleChange} />
        <button type="submit" disabled={loading} style={{ marginLeft: 8 }}>
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
            width: "100%",
            marginTop: 16,
            borderRadius: 8,
            filter: loading ? "blur(2px) grayscale(0.6)" : "none",
            transition: "filter 0.3s ease-in-out",
          }}
        />
      )}
      {feedback && (
        <div
          style={{
            marginTop: 24,
            whiteSpace: "pre-wrap",
            background: "#fafafa",
            padding: 16,
            borderRadius: 8,
          }}
        >
          <b>Photographer Feedback:</b>
          <br />
          {JSON.stringify(feedback)}
        </div>
      )}
    </div>
  );
};


