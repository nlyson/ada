// pages/settings.tsx
import React, { useEffect, useState } from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

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
  tier?: string;
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

  const currentTier = profile?.tier || "Free";

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
    <div style={{ padding: 24 }}>
      <h1>⚙️ Account Settings</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Current Tier:</strong> {currentTier}</p>

          {currentTier === "Free" ? (
            <button
              onClick={() => alert("Upgrade coming soon!")}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              🚀 Upgrade to Premium
            </button>
          ) : (
            <p style={{ color: "green", marginTop: 16 }}>
              ✅ You are a Premium user. Thank you!
            </p>
          )}
          <h2 style={{ marginTop: 32 }}>🧮 Feature Comparison</h2>
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
              {[
                ["Challenge uploads", "1 per challenge", "✅ Unlimited"],
                ["AI feedback", "✅ Basic", "✅ Full rubric + history"],
                ["Scavenger hunt", "✅ Base prompts", "✅ Bonus hunts + boosts"],
                ["Photo uploads", "✅ Up to 10", "✅ Up to 100+"],
                ["User stats", "✅ Basic", "✅ Advanced trends & scoring"],
                ["Profile customization", "✅ Avatar", "✅ Themes + cover photo"],
                ["Comment threads", "✅ Yes", "✅ Yes"],
                ["Feedback analytics", "❌", "✅ View AI feedback breakdown"],
                ["Monthly themed events", "❌", "✅ Access special content"],
              ].map(([feature, free, premium]) => (
                <tr key={feature}>
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
