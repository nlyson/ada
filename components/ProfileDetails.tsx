import React from "react";

type Props = {
  profile: {
    displayName: string;
    aboutMe: string;
    favoriteSubjects: string;
  } | null;
};

const ProfileDetails: React.FC<Props> = ({ profile }) => {
  if (!profile) return <p>No profile info available.</p>;

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "1.5rem",
        marginBottom: "2rem",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>📝 Profile Info</h2>
      <p><strong>Name:</strong> {profile.displayName}</p>
      <p><strong>About Me:</strong> {profile.aboutMe}</p>
      <p><strong>Favorite Subjects:</strong> {profile.favoriteSubjects}</p>
    </div>
  );
};

export default ProfileDetails;
