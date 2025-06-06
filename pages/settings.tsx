// ... all your existing imports
import React, { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";
import { ComponentPropsToStylePropsMap } from "@aws-amplify/ui-react";

const GET_PROFILE_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/user_profile";

type AppProps = {
  signOut: () => void;
  user: { username: string };
};

type UserProfile = {
  username: string;
  displayName?: string;
  aboutMe?: string;
  favoriteSubjects?: string[];
  accountTier?: string;
};

const Settings: React.FC<AppProps> = ({ user }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.warn("No profile found.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.username]);

  const currentTier = profile?.accountTier?.toLowerCase() === "premium" ? "Premium" : "Free";


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
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <p>Loading your account details...</p>
        <div style={{
          margin: "20px auto",
          border: "4px solid #eee",
          borderTop: "4px solid #0070f3",
          borderRadius: "50%",
          width: 40,
          height: 40,
          animation: "spin 1s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    ) : (
      <>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Current Tier:</strong> {currentTier}</p>

        {currentTier === "Free" ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ marginBottom: 8 }}>
              🚀 <strong>Upgrade to Premium</strong> and unlock enhanced features!
            </p>
            <button
              onClick={() => alert("Premium access coming soon. Email jamapantel@hotmail.com for beta access.")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Upgrade Coming Soon
            </button>
            <p style={{ fontSize: "0.9rem", marginTop: 8 }}>
              📧 Email <strong>jamapantel@hotmail.com</strong> for early access to premium features.
            </p>
          </div>
        ) : (
          <p style={{ color: "green", marginTop: 16 }}>
            ✅ You&apos;re a Premium user. Thank you for supporting Photo Mentor!
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
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Free</th>
                <th style={thStyle}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {[ // unchanged rows
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
