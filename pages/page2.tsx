import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const DAILY_TIP_LAMBDA_URL = "https://mxxgmre43oe44ufw2n7ub7dxnm0tskjq.lambda-url.us-east-1.on.aws/chat_with_gpt";

const DailyTip: React.FC = () => {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const generateTip = async () => {
    setLoading(true);
    setError("");
    setTip("");

    try {
      const response = await fetch(DAILY_TIP_LAMBDA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: "Give me a daily photography tip.",
          systemMessage: "You are a professional photography coach. Provide one practical and actionable tip per day for photographers of all levels.",
        }),
      });

      const result = await response.json();

      if (response.ok && result.result) {
        setTip(result.result);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Error fetching tip:", err);
      setError("Failed to generate tip. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 24,
        textAlign: "center",
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
      <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>Daily Photo Tip</h1>
      <button
        onClick={generateTip}
        disabled={loading}
        style={{
          padding: "10px 16px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        {loading ? "Generating..." : "Generate Daily Tip"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {tip && (
        <div
          style={{
            marginTop: 16,
            background: "#f3f3f3",
            padding: 16,
            borderRadius: 8,
            textAlign: "left",
          }}
        >
          <ReactMarkdown>{tip}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default DailyTip;
