import React from "react";

type UserProfile = {
  username: string;
  displayName: string;
  aboutMe: string;
  favoriteSubjects: string;
};

type Props = {
  editProfile: UserProfile;
  setEditProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSave: () => void;
  saving?: boolean;
};

const EditProfileSection: React.FC<Props> = ({
  editProfile,
  setEditProfile,
  onSave,
  saving = false,
}) => {
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
      <h2 style={{ marginBottom: 16 }}>✏️ Edit Profile</h2>

      <input
        placeholder="Name"
        value={editProfile.displayName}
        onChange={(e) =>
          setEditProfile((prev) => ({ ...prev, displayName: e.target.value }))
        }
        style={{
          width: "100%",
          marginBottom: 8,
          padding: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <textarea
        placeholder="About Me"
        value={editProfile.aboutMe}
        onChange={(e) =>
          setEditProfile((prev) => ({ ...prev, aboutMe: e.target.value }))
        }
        rows={4}
        style={{
          width: "100%",
          marginBottom: 8,
          padding: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
          resize: "vertical",
        }}
      />

      <input
        placeholder="Favorite Subjects"
        value={editProfile.favoriteSubjects}
        onChange={(e) =>
          setEditProfile((prev) => ({
            ...prev,
            favoriteSubjects: e.target.value,
          }))
        }
        style={{
          width: "100%",
          marginBottom: 16,
          padding: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <button
        disabled={saving}
        onClick={onSave}
        style={{
          padding: "10px 20px",
          backgroundColor: "#b76e79",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
};

export default EditProfileSection;
