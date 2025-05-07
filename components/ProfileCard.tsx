import React from "react";
import { uploadData, getUrl } from "aws-amplify/storage";

const BUCKET_PROFILE_PATH = "public/profile-pics";

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

    await uploadData({
      path: `${BUCKET_PROFILE_PATH}/${username}.jpg`,
      data: file,
      options: { contentType: file.type, bucket: "picture-this-storage" },
    });

    const result = await getUrl({
      path: `${BUCKET_PROFILE_PATH}/${username}.jpg`,
      options: { bucket: "picture-this-storage" },
    });

    setProfileUrl(result.url.toString());
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
