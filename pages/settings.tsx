import React, { useEffect, useState, useRef } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const CHARGE_USER_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/charge_user";
const SQUARE_APP_ID = "sq0idp-hqKwiPOKy2CKoEqGyba3Vw";
const LOCATION_ID = "04570PQF9Q7MW";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type UserProfile = {
  username: string;
  accountTier?: string;
};

const Settings: React.FC<AppProps> = ({ user }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInstance = useRef<any>(null);
  const squareScriptAdded = useRef(false);

  const isPremium = profile?.accountTier?.toLowerCase() === "premium";
  const currentTier = isPremium ? "Premium" : "Free";


  // Fetch user profile
  useEffect(() => { 
    const fetchProfile = async () => {
      try {
        const result = await invokeLambdaIam({
          url: GET_PROFILE_URL,
          method: "POST",
          body: { username: user.username },
        });
        setProfile(result);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.username]);

  // Load Square only for free-tier users
  useEffect(() => {
    const loadSquare = async () => {
      if (!profile || isPremium || !cardRef.current || cardInstance.current || squareScriptAdded.current) return;

      squareScriptAdded.current = true;

      const initSquare = async () => {
        if (!window.Square) {
          console.error("Square is not available.");
          return;
        }

        try {
          const payments = window.Square.payments(SQUARE_APP_ID, LOCATION_ID);
          const card = await payments.card();
          await card.attach(cardRef.current!);
          cardInstance.current = card;
        } catch (err) {
          console.error("Square setup failed:", err);
        }
      };

      if (window.Square) {
        await initSquare();
      } else {
        const script = document.createElement("script");
        script.src = "https://web.squarecdn.com/v1/square.js";
        script.async = true;
        script.onload = initSquare;
        document.body.appendChild(script);
      }
    };

    loadSquare();
  }, [profile, isPremium]);

const handlePayment = async () => {
  if (!cardInstance.current) return;

  setStatus("🔄 Tokenizing...");
  try {
    const result = await cardInstance.current.tokenize();
    if (result.status !== "OK") {
      throw new Error("Tokenization failed.");
    }

    setStatus("📡 Sending to backend...");
    let paymentResponse;
    try {
      paymentResponse = await invokeLambdaIam({
        url: CHARGE_USER_URL,
        method: "POST",
        body: {
          sourceId: result.token,
          username: user.username,
        },
      });

      if (!paymentResponse || paymentResponse.statusCode === 500 || paymentResponse.error) {
        const detail =
          paymentResponse?.error?.detail ||
          paymentResponse?.error?.message ||
          "Payment failed. Please check your card and try again.";
        throw new Error(detail);
      }
    } catch (err) {
      throw new Error("Lambda request failed: 500 – payment service is temporarily unavailable.");
    }

    if (paymentResponse?.success && paymentResponse.payment?.status === "COMPLETED") {
      const payment = paymentResponse.payment;
      const receipt = payment?.receiptUrl;

      setStatus("🎉 Payment complete! You are now Premium.");
      if (receipt) {
        setReceiptUrl(receipt);
      }

      const updatedProfile = await invokeLambdaIam({
        url: GET_PROFILE_URL,
        method: "POST",
        body: { username: user.username },
      });

      setProfile(updatedProfile);
    } else {
      const errMsg =
        paymentResponse?.error?.message ||
        paymentResponse?.error?.detail ||
        "Payment failed. Please try again.";
      throw new Error(errMsg);
    }
  } catch (err: any) {
    console.error("Payment flow failed:", err);
    setStatus(`❌ ${err.message || "Unexpected error occurred."}`);
  }
};



  const thStyle: React.CSSProperties = {
    padding: "12px",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "1rem",
    borderBottom: "1px solid #ddd",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px",
    borderBottom: "1px solid #eee",
    fontSize: "0.95rem",
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>⚙️ Account Settings</h1>

      {loading ? (
        <p>Loading your account...</p>
      ) : (
        <>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Current Tier:</strong> {currentTier}</p>

          {!isPremium && (
            <div style={{ marginTop: 16 }}>
              <p><strong>🚀 Upgrade to Premium</strong> and unlock full features!</p>
              <div ref={cardRef} style={{ marginBottom: 12 }}></div>
              <button onClick={handlePayment} style={{
                padding: "10px 20px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}>
                Pay $7
              </button>
              <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {status.includes("http") ? (
                  <span dangerouslySetInnerHTML={{ __html: status }} />
                ) : (
                  status
                )}
              </p>              
            </div>
          )}

          {receiptUrl && (
            <p style={{ marginTop: 8 }}>
              🧾 <a href={receiptUrl} target="_blank" rel="noopener noreferrer">View Receipt</a>
            </p>
          )}

          {isPremium && (
            <p style={{ color: "green", marginTop: 16 }}>
              ✅ You&apos;re a Premium user. Thank you!
            </p>
          )}

          <h2 style={{ marginTop: 40 }}>💡 Feature Comparison</h2>
          <table style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: 16,
            background: "#fff",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Free</th>
                <th style={thStyle}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Challenge uploads", "1 per challenge", "✅ Unlimited"],
                ["AI feedback", "✅ Basic", "✅ Full rubric + retry tips"],
                ["Scavenger hunt", "✅ Daily prompt", "✅ Retry + Bonus hunts"],
                ["Photo uploads", "✅ Up to 10", "✅ Up to 100"],
                ["User stats", "✅ Basic", "✅ Trends + high scores"],
                ["Profile customization", "✅ Bio & avatar", "✅ Themes + header"],
                ["Comment threads", "✅ Yes", "✅ Priority visibility"],
                ["Feedback analytics", "❌", "✅ Breakdown per rubric"],
                ["Monthly themed events", "❌", "✅ Exclusive access"],
              ].map(([feature, free, premium]) => (
                <tr key={feature as string}>
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>{feature}</td>
                  <td style={tdStyle}>{free}</td>
                  <td style={tdStyle}>{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Settings;
