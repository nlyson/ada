import React from "react";
import { invokeLambdaIam } from "@/utils/invokeLambdaIam";

const GET_PROFILE_UPLOAD_URL = "https://x69ndosila.execute-api.us-east-1.amazonaws.com/prod/get_profile_upload_url";

type Props = {
    username: string;
    profileUrl: string;
    displayName?: string;
    isOwner: boolean;
    setProfileUrl: (url: string) => void;
  };

const ProfileCard: React.FC<Props> = ({ username, profileUrl, displayName, isOwner, setProfileUrl }) => {
  
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.length) return;
  const file = e.target.files[0];

  try {
    const response = await invokeLambdaIam({
      url: GET_PROFILE_UPLOAD_URL,
      method: "POST",
      body: {
        username,
        fileType: file.type,
      },
    });

    // 🔥 Check if body needs parsing
    const { uploadUrl, key } = typeof response === "string"
      ? JSON.parse(response)
      : response;

    console.log("📸 Uploading to:", uploadUrl);

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Upload failed");
    }

    const publicUrl = `https://picture-this-storage.s3.amazonaws.com/${key}?t=${Date.now()}`;
    console.log("✅ Uploaded to:", publicUrl);
    setProfileUrl(publicUrl);
  } catch (err) {
    console.error("❌ Profile pic upload error:", err);
  }
};



  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: 16,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: "2rem",
      marginBottom: "2rem",
      textAlign: "center",
    }}>
      <img
        src={profileUrl}
        alt={`${username}'s profile`}
        style={{
          width: 120,
          height: 120,
          objectFit: "cover",
          borderRadius: "50%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          marginBottom: 16,
        }}
      />
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: 4 }}>
        {displayName || username}
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>@{username}</p>

      {isOwner && (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
};

export default ProfileCard;
