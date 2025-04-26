import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Tip = {
  id: string;
  tip: string;
  timestamp: string;
};

type DailyTipProps = {
  signOut: () => void;
  user: { username: string };
};

const DailyTip: React.FC<DailyTipProps> = ({ user }) => {
  const [todayTip, setTodayTip] = useState<string>("");
  const [tipHistory, setTipHistory] = useState<Tip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, historyRes] = await Promise.all([
          fetch("https://fixpg2k7q32zd7y2nw7ddmfuha0yzimy.lambda-url.us-east-1.on.aws/fetch_daily_tip"),
          fetch("https://x4pvvkw7np52wvlizo2njelwgq0kndxn.lambda-url.us-east-1.on.aws/fetch_tip_history"),
        ]);

        const todayResult = await todayRes.json();
        const historyResult = await historyRes.json();

        if (todayRes.ok && todayResult.tip) {
          setTodayTip(todayResult.tip);
        } else {
          throw new Error(todayResult.error || "Unknown error loading today's tip");
        }

        if (historyRes.ok && historyResult.tips) {
          setTipHistory(historyResult.tips);
        } else {
          throw new Error(historyResult.error || "Unknown error loading tip history");
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch tips. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#bfbfbf",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "4rem",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <img
          src="/raccoon-logo.png"
          alt="Raccoon Logo"
          style={{
            width: 100,
            height: 100,
            objectFit: "cover",
            borderRadius: "50%",
            marginBottom: 16,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          }}
        />
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Daily Photo Tip</h1>

        {loading && (
          <p style={{ marginBottom: "1rem" }}>Loading tips...</p>
        )}

        {error && (
          <p style={{ color: "red", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        {!loading && !error && todayTip && (
          <div
            style={{
              marginTop: 16,
              background: "#fff",
              color: "#000",
              padding: 20,
              borderRadius: 10,
              textAlign: "left",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              fontSize: "1rem",
              lineHeight: 1.5,
              marginBottom: "2rem",
            }}
          >
            <ReactMarkdown>{todayTip}</ReactMarkdown>
          </div>
        )}

        {/* Tip History Section */}
        {!loading && !error && tipHistory.length > 0 && (
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", textAlign: "center" }}>Recent Tips</h2>

            {tipHistory.map((tip) => (
              <div
                key={tip.id}
                style={{
                  marginBottom: "1.5rem",
                  background: "#fff",
                  color: "#000",
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: "0.5rem" }}>
                  {tip.id}
                </div>
                <div style={{ fontSize: "1rem", lineHeight: 1.5 }}>
                  <ReactMarkdown>{tip.tip}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTip;
