import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { parseISO, format } from "date-fns";

type Tip = {
  date: string;
  tip: string;
};

type DailyTipProps = {
  signOut: () => void;
  user: { username: string };
};

function getTodayUtcDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // yyyy-mm-dd (UTC date)
}

const TIP_HISTORY_LAMBDA_URL =
  "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/tip_history";

const DailyTip: React.FC<DailyTipProps> = ({ user }) => {
  const [todayTip, setTodayTip] = useState<string>("");
  const [tipHistory, setTipHistory] = useState<Tip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [tips, setTips] = useState<Tip[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const historyResult = await invokeLambdaIam({
          url: TIP_HISTORY_LAMBDA_URL,
          method: "GET",
        });

        if (historyResult.tips) {
          const sorted = [...historyResult.tips].sort((a, b) => b.date.localeCompare(a.date));
          const lastTen = sorted.slice(0, 10);

          console.log("📅 Fetched tip dates:", historyResult.tips.map((t: Tip) => t.date));
          console.log("✅ Sorted tips:", sorted.map((t: Tip) => t.date));

          // Assume first is "today"
          setTips(lastTen);
        } else {
          throw new Error(historyResult.error || "Unknown error loading tip history");
        }
      } catch (err: any) {
        console.error("Error fetching tips:", err);
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
        background: "linear-gradient(to bottom, #f2f2f2, #e0e0e0)",
        minHeight: "100vh",
        color: "#333",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Helvetica Neue', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: "700px", width: "100%", textAlign: "center" }}
      >
        <img
          src="/raccoon-logo.png"
          alt="Raccoon Logo"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 20,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
          }}
        />

        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "#b76e79" }}>
          Daily Photo Tip
        </h1>

        <p style={{ marginBottom: "2rem", fontSize: "1rem", color: "#666" }}>
          A fresh tip each day to level up your photography skills.
        </p>

        {loading && <p>Loading tips...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

{!loading && !error && tips.length > 0 && (
  <>
    { console.log("🧪 Rendering tip:", tips[0].date, tips[0].tip) }

    {/* Today’s Tip */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        background: "#fff",
        color: "#000",
        padding: "1.5rem",
        borderRadius: "1rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        marginBottom: "2rem",
        textAlign: "left",
        fontSize: "1.1rem",
        lineHeight: 1.6,
      }}
    >

      <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: "0.5rem" }}>
        {format(parseISO(tips[0].date), "MMMM d, yyyy")}      
      </div>
    <strong style={{ display: "block", marginBottom: "0.5rem", color: "#b76e79" }}>
      📸 Today&apos;s Photography Tip
    </strong>
      <ReactMarkdown>{tips[0].tip}</ReactMarkdown>
    </motion.div>

    {/* Toggle Button */}
    {tips.length > 1 && (
      <button
        onClick={() => setShowHistory((prev) => !prev)}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          background: "#b76e79",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {showHistory ? "Hide Previous Tips" : "Show Previous Tips"}
      </button>
    )}

    {/* Collapsible Past Tips */}
    {showHistory && (
      <div style={{ width: "100%", maxWidth: "700px" }}>
        {tips.slice(1).map((tip) => (
          <motion.div
            key={tip.date}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "#fff",
              color: "#000",
              padding: "1rem",
              borderRadius: "0.75rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
                color: "#888",
              }}
            >
            {format(parseISO(tip.date), "MMMM d, yyyy")}
            </div>
            <ReactMarkdown>{tip.tip}</ReactMarkdown>
          </motion.div>
        ))}
      </div>
    )}
  </>
)}


      </motion.div>
    </div>
  );
};

export default DailyTip;
