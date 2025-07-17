import React, { useEffect, useState, useRef } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";
const CHARGE_USER_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/charge_user";
const SQUARE_APP_ID = "sq0idp-hqKwiPOKy2CKoEqGyba3Vw";
const LOCATION_ID = "04570PQF9Q7MW";
//const SQUARE_APP_ID = "sandbox-sq0idb-WQkqJtRLCweiTBkuYcIQXA";    for sandbox
//const LOCATION_ID = "LHJCQ86R6K6QR";  for sandbox

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
    borderBottom: "1px solid #d6d3d1",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px",
    borderBottom: "1px solid #f5f2ed",
    fontSize: "0.95rem",
  };

  const premiumBadgeStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#fbbf24",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    marginLeft: "8px",
  };

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 800, 
      margin: "0 auto", 
      minHeight: "100vh",
      backgroundColor: "#efede4" 
    }}>
      <h1>⚙️ Account Settings</h1>

      {loading ? (
        <p>Loading your account...</p>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <p>
              <strong>Username:</strong> {user.username}
              {isPremium && <span style={premiumBadgeStyle}>✨ PREMIUM</span>}
            </p>
            <p><strong>Current Tier:</strong> {currentTier}</p>
          </div>

          {!isPremium && (
            <div style={{ 
              marginTop: 16, 
              padding: 20,
              backgroundColor: "#ffffff",
              borderRadius: 12,
              border: "2px solid #8b7355",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ color: "#8b7355", marginTop: 0 }}>🚀 Upgrade to Premium – just $7/month</h3>
              <p style={{ marginBottom: 16 }}>Unlock advanced features and join our premium community!</p>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{ backgroundColor: "#f9f7f4", padding: 12, borderRadius: 6, border: "1px solid #d6d3d1" }}>
                  <strong>🔄 10 Challenge Retries</strong>
                  <p style={{ fontSize: "0.9rem", margin: "4px 0 0 0" }}>Perfect your submissions</p>
                </div>
                <div style={{ backgroundColor: "#f9f7f4", padding: 12, borderRadius: 6, border: "1px solid #d6d3d1" }}>
                  <strong>🎨 Custom Profile Themes</strong>
                  <p style={{ fontSize: "0.9rem", margin: "4px 0 0 0" }}>Express your style</p>
                </div>
                <div style={{ backgroundColor: "#f9f7f4", padding: 12, borderRadius: 6, border: "1px solid #d6d3d1" }}>
                  <strong>📊 Advanced Analytics</strong>
                  <p style={{ fontSize: "0.9rem", margin: "4px 0 0 0" }}>Track your progress</p>
                </div>
                <div style={{ backgroundColor: "#f9f7f4", padding: 12, borderRadius: 6, border: "1px solid #d6d3d1" }}>
                  <strong>⚡ Priority Support</strong>
                  <p style={{ fontSize: "0.9rem", margin: "4px 0 0 0" }}>Get help faster</p>
                </div>
              </div>

              <div ref={cardRef} style={{ marginBottom: 12 }}></div>
              <button onClick={handlePayment} style={{
                padding: "12px 24px",
                backgroundColor: "#8b7355",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}>
                Upgrade to Premium - $7/month
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
            <div style={{ 
              color: "#059669", 
              marginTop: 16, 
              padding: 16,
              backgroundColor: "#f0fdf4",
              borderRadius: 8,
              border: "1px solid #22c55e"
            }}>
              <h3 style={{ margin: "0 0 8px 0" }}>✅ You&apos;re a Premium Member!</h3>
              <p style={{ margin: 0 }}>Thank you for supporting our community. Enjoy all premium features!</p>
            </div>
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
              <tr style={{ backgroundColor: "#f9f7f4" }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Free</th>
                <th style={thStyle}>Premium ✨</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Challenge uploads", "1 per challenge", "✅ 10 retries per challenge + Challenge Archive"],
                ["AI feedback", "✅ Basic - 3 per week", "✅ Full rubric + retry tips + unlimited"],
                ["Max Image Upload Size", "✅ 2 MB", "✅ 50 MB"],
                ["Photo uploads", "✅ Up to 5", "✅ Up to 100 + bulk upload"],
                ["Profile status", "Standard profile", "✅ Premium badge + custom themes"],
                ["Photo management", "Basic gallery", "✅ Favorites + download originals + advanced filters"],
                ["Scavenger hunt", "✅ Daily prompt", "✅ Retry + Bonus hunts + exclusive hunts"],
                ["User stats", "❌", "✅ Trends + high scores + detailed analytics"],
                ["Profile customization", "✅ Bio & avatar", "✅ Themes + header + premium borders"],
                ["Comment threads", "❌", "✅ Comment on user photos + priority placement"],
                ["Feedback analytics", "❌", "✅ Breakdown per rubric + improvement tracking"],
                ["Monthly themed events", "❌", "✅ Exclusive access + early registration"],
                ["Community access", "Standard features", "✅ Premium groups + direct messaging"],
                ["Support", "Community help", "✅ Priority email support + live chat"],
                ["Beta features", "❌", "✅ Early access to new features"],
              ].map(([feature, free, premium]) => (
                <tr key={feature as string}>
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>{feature}</td>
                  <td style={tdStyle}>{free}</td>
                  <td style={tdStyle}>{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {isPremium && (
            <div style={{ marginTop: 32 }}>
              <h3>🎯 Your Premium Benefits</h3>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: 16,
                marginTop: 16
              }}>
                <div style={{ 
                  backgroundColor: "#fef7ed", 
                  padding: 16, 
                  borderRadius: 8,
                  border: "1px solid #fb923c"
                }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#c2410c" }}>🔄 Challenge Retries</h4>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>You have 10 retries per challenge to perfect your submissions</p>
                </div>
                <div style={{ 
                  backgroundColor: "#f1f5f9", 
                  padding: 16, 
                  borderRadius: 8,
                  border: "1px solid #64748b"
                }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#475569" }}>📊 Analytics Dashboard</h4>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>Track your progress and see detailed performance metrics</p>
                </div>
                <div style={{ 
                  backgroundColor: "#f7f3ff", 
                  padding: 16, 
                  borderRadius: 8,
                  border: "1px solid #a855f7"
                }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#7c3aed" }}>⚡ Priority Support</h4>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>Get faster responses and dedicated help from our team</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Settings;