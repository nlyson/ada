import "@/lib/configureAmplify";
import React, { useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { getCurrentUser } from "aws-amplify/auth";

const SUBMIT_FEEDBACK_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/submit_feedback";

const FeedbackPage: React.FC = () => {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setStatus("submitting");
    try {
      const user = await getCurrentUser();
      const username = user?.username || "anonymous";

      await invokeLambdaIam({
        url: SUBMIT_FEEDBACK_URL,
        method: "POST",
        body: { username, description },
      });

      setDescription("");
      setStatus("success");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#f9f9f9",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          background: "#fff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "1rem", textAlign: "center" }}>
          🐞 Send Feedback or Report a Bug
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#555", marginBottom: "2rem", textAlign: "center" }}>
          We&apos;re a small but dedicated team — an expert photographer and a software engineer —
          working hard to make <strong>Photo Mentor</strong> a creative and fun experience.
          Your thoughts help us grow — thank you for being part of our journey!
        </p>

        <textarea
          style={{
            width: "100%",
            height: "300px",
            padding: "1rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            resize: "none",
          }}
          placeholder="Tell us what went wrong or what could be better..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={status === "submitting"}
          style={{
            padding: "0.75rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {status === "submitting" ? "Sending..." : "Submit Feedback"}
        </button>

        {status === "success" && (
          <p style={{ color: "green", marginTop: "1rem", textAlign: "center" }}>
            ✅ Thanks! We appreciate your feedback.
          </p>
        )}
        {status === "error" && (
          <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>
            ❌ Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
