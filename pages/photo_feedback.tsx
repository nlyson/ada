import React, { useState, ChangeEvent, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { uploadData, getUrl } from 'aws-amplify/storage';
import { invokeLambdaIam } from "@/utils/invokeLambdaIam"; // ✅ already set up
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json'; // ✅ path to your generated config

Amplify.configure(amplifyConfig);

const REVIEW_PHOTO_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/review_photo"

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const App: React.FC<AppProps> = ({ signOut, user }) => {
  const client = generateClient<Schema>();

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  
    if (!image) {
      alert("Please select an image.");
      return;
    }
  
    setLoading(true);
    setFeedback("");
  
    try {
      const fileName = `${Date.now()}_${image.name}`;
      const path = `picture-submissions/${fileName}`;
  
      // ✅ Upload image to S3
      await uploadData({
        path,
        data: image,
        options: {
          contentType: image.type,
          bucket: "picture-this-storage"
        },
      }).result;
  
      // ✅ Get signed S3 URL
      const { url: imageUrl } = await getUrl({ path });
  
      // ✅ Use IAM-signed request to API Gateway
      const result = await invokeLambdaIam({
        url: REVIEW_PHOTO_LAMBDA_URL, // ← replace with your API Gateway URL
        method: "POST",
        body: { imageUrl },
      });
  
      setFeedback(result.result || "No feedback.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error analyzing image:", err);
      setFeedback(`Error analyzing image ${err}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
// inside your return...

<div
  style={{
    backgroundColor: "#bfbfbf",
    color: "white",
    minHeight: "100vh",
    position: "relative",
  }}
>
  {/* Main content */}
  <div
    style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: "1.5rem",
      textAlign: "center",
      paddingTop: "4rem", // avoid overlap with sign out
    }}
  >
    <img
      src="/photo_mentor_logo.png"
      alt="Photo Mentor Logo"
      style={{
        width: "100%",
        height: "auto", // 👈 preserve proportions
        marginBottom: 12,
        display: "block",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
      }}
    />

    <h2 style={{ fontSize: "1.8rem", margin: "1rem 0" }}>Photo Feedback</h2>

    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        marginTop: 24,
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          backgroundColor: "#fff",
          color: "#000",
          fontSize: "1rem",
          width: "100%",
          cursor: "pointer",
        }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "12px 24px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "bold",
          width: "100%",
          maxWidth: "300px",
        }}
      >
        {loading ? "Analyzing..." : "Analyze Photo"}
      </button>
    </form>

    {image && (
      <img
        src={URL.createObjectURL(image)}
        alt="preview"
        style={{
          width: "100%",
          maxHeight: "50vh",
          objectFit: "contain",
          marginTop: 24,
          borderRadius: 8,
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          filter: loading ? "blur(2px) grayscale(0.6)" : "none",
          transition: "filter 0.3s ease-in-out",
        }}
      />
    )}

    {feedback && (
      <div
        style={{
          marginTop: 32,
          background: "#fff",
          color: "#000",
          padding: 20,
          borderRadius: 12,
          textAlign: "left",
          fontSize: "1rem",
          lineHeight: 1.5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.5rem" }}>Photographer Feedback</h2>
        <ReactMarkdown>{feedback}</ReactMarkdown>
      </div>
    )}
  </div>
</div>

  );
};

export default App;