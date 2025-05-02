import React, { useState, useEffect, ChangeEvent } from "react";
import { Amplify } from "aws-amplify";
import amplifyConfig from "../amplify_outputs.json";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

Amplify.configure(amplifyConfig);

const SUBMIT_CHALLENGE_LAMBDA_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_challenge"; // Replace with actual URL

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

const Challenge: React.FC<AppProps> = ({ user }) => {
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const CHALLENGE_ID = "weekly_01"; // Can evolve later

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
        url: SUBMIT_CHALLENGE_LAMBDA_URL, // API Gateway URL
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
    } catch (err) {
      console.error(err);
      setStatus("Submission failed.");
    } finally {
      setLoading(false);
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

      {status && <p style={{ marginTop: 20 }}>{status}</p>}
    </div>
  );
};

export default Challenge;
