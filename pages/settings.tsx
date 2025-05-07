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
            <p style={{ color: "green", marginTop: 16 }}>✅ You are a Premium user. Thank you!</p>
          )}
        </>
      )}
    </div>
  );
};

export default Settings;
