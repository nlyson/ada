import React, { useState, ChangeEvent, FormEvent } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";


const client = generateClient<Schema>();

type FeedbackResponse = {
  result: string;
}

const API_URL = "---api url goes here---"

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
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64: base64String }),
        });

        if (!res.ok) {
          throw new Error("Error from API");
        }
        const data: FeedbackResponse = await res.json();
        setFeedback(data.result || "No feedback.");
      } catch (err) {
        setFeedback("Error analyzing image.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(image);
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>Photo Feedback</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleChange} />
        <button type="submit" disabled={loading} style={{ marginLeft: 8 }}>
          {loading ? "Analyzing..." : "Analyze Photo"}
        </button>
      </form>
      {image && (
        <img
          src={URL.createObjectURL(image)}
          alt="preview"
          style={{ width: "100%", marginTop: 16, borderRadius: 8 }}
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
          {feedback}
        </div>
      )}
    </div>
  );
};

