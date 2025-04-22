import React, { useState, ChangeEvent, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { uploadData, getUrl } from 'aws-amplify/storage';

import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json'; // ✅ path to your generated config

Amplify.configure(amplifyConfig);

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
  
      // ✅ Upload using the new `path` object
      await uploadData({
        path,
        data: image,
        options: {
          contentType: image.type,
        },
      }).result;
  
      // ✅ Get URL using new `path` object
      const { url: imageUrl } = await getUrl({ path });
  
      // ✅ Call your API with the image URL
      const response = await fetch("https://bdh7b25k0j.execute-api.us-east-1.amazonaws.com/dev/imageLLMReview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      console.log('---------API RESPONSE---', response)
  
      const result = await response.json();
      setFeedback(JSON.stringify(result) || "No feedback.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error analyzing image:", err);
      setFeedback(`Error analyzing image ${err}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 24,
        textAlign: "center",
        minHeight: "100vh", // only one!
        position: "relative"
      }}
    >
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
          zIndex: 1
        }}
      >
        Sign Out
      </button>
      <img
        src="/raccoon-logo.png"
        alt="Raccoon Logo"
        style={{
          width: 120,
          height: 120,
          objectFit: "cover",
          borderRadius: "50%",
          marginBottom: 8
        }}
      />
      <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>PEDRO</h1>
      <p style={{ margin: 0, fontStyle: "italic", color: "#555" }}>
        Photographic Evaluation & Detailed Raccoon Observation
      </p>
      <h2>Photo Feedback</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginTop: 24
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
            cursor: "pointer"
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
            cursor: "pointer"
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
            maxWidth: "100%",
            maxHeight: 400,
            marginTop: 16,
            borderRadius: 8,
            filter: loading ? "blur(2px) grayscale(0.6)" : "none",
            transition: "filter 0.3s ease-in-out",
            objectFit: "contain",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
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
            textAlign: "left"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Photographer Feedback</h2>
          <ReactMarkdown>{feedback}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default App;